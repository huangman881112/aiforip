package com.suanfa.controller;

import com.suanfa.config.AiProperties;
import com.suanfa.dto.AiModelInfo;
import com.suanfa.dto.ChatRef;
import com.suanfa.dto.ChatRequest;
import com.suanfa.dto.ChatResponse;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AiChatService;
import com.suanfa.service.AiKnowledgeService;
import com.suanfa.service.AiRateLimiter;
import com.suanfa.service.AiSettingsService;
import jakarta.annotation.PreDestroy;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.SynchronousQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * AI 助教对话接口（需登录，服务端代理上游模型 / API 中转站）。
 *
 * <ul>
 *   <li>POST /api/ai/chat           一次性返回（离线/不支持流式的客户端用）</li>
 *   <li>POST /api/ai/chat/stream    SSE 流式返回：meta → delta* → done | error</li>
 *   <li>GET  /api/ai/status         是否可用 + 模型清单，前端据此决定降级策略，
 *       并在顶栏徽章上展示「当前中转站配置的默认模型」（{@code defaultModel}）。
 *       对话页已无模型下拉：清单只用来确定默认模型及其预算/熔断详情。
 *       清单按身份裁剪：未登录不下发、普通用户只看到管理员开放的、管理员看全量</li>
 *   <li>GET  /api/ai/models         仅模型清单（聊天页已不用，留给排障脚本）</li>
 *   <li>GET  /api/ai/upstream-models 拉取各中转站真实可用模型（仅管理员，配置排障用）</li>
 *   <li>中转站本身的增删改与测试（仅管理员）见 {@link AiSettingsController}：/api/ai/settings*</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private static final Logger log = LoggerFactory.getLogger(AiController.class);
    private static final int MAX_MESSAGES = 30;
    private static final long EMITTER_TIMEOUT_MS = 5 * 60 * 1000L;

    private final AiChatService aiChatService;
    private final AiRateLimiter rateLimiter;
    private final AiProperties aiProperties;
    private final AiSettingsService aiSettingsService;
    /** 流式对话会长时间占用线程，池子小且队列直连（SynchronousQueue），满了就 503 而不是排队。 */
    private final ExecutorService streamPool = new ThreadPoolExecutor(
            2, 8, 60L, TimeUnit.SECONDS, new SynchronousQueue<>(),
            r -> {
                Thread t = new Thread(r, "ai-stream");
                t.setDaemon(true);
                return t;
            });

    public AiController(AiChatService aiChatService, AiRateLimiter rateLimiter, AiProperties aiProperties,
                        AiSettingsService aiSettingsService) {
        this.aiChatService = aiChatService;
        this.rateLimiter = rateLimiter;
        this.aiProperties = aiProperties;
        this.aiSettingsService = aiSettingsService;
    }

    @PreDestroy
    public void shutdown() {
        streamPool.shutdownNow();
    }

    @GetMapping("/status")
    public Map<String, Object> status(@CurrentUserId Long currentUserId) {
        boolean privileged = aiSettingsService.canManage(currentUserId);
        boolean guest = currentUserId == null;
        // 未登录不下发模型清单（连「配了哪些上游、还剩几个」都不给），前端据此显示「登录后可选」
        List<AiModelInfo> models = guest ? List.of() : modelInfos(privileged);
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("configured", aiChatService.isConfigured(privileged));
        body.put("loginRequired", guest);
        if (!guest) {
            // 上游地址属于排障信息，登录后才下发（前端本身不消费这个字段）
            body.put("baseUrl", aiChatService.baseUrl());
        }
        // 兼容旧前端：models 仍是模型名字符串数组
        body.put("models", models.stream().map(AiModelInfo::name).toList());
        body.put("modelDetails", models);
        body.put("defaultModel", models.stream().filter(AiModelInfo::available)
                .findFirst().map(AiModelInfo::token).orElse(null));
        body.put("providers", providerInfos(models));
        body.put("ratePerMinute", rateLimiter.limit());
        // 管理员才看得到「中转站配置」入口（写入接口在 AiSettingsController 里同样会校验）
        body.put("canManage", privileged);
        return body;
    }

    /** 模型清单：未登录为空；普通用户只拿到管理员开放且可用的那些；管理员拿到全量（含不可用项）。 */
    @GetMapping("/models")
    public Map<String, Object> models(@CurrentUserId Long currentUserId) {
        boolean privileged = aiSettingsService.canManage(currentUserId);
        boolean guest = currentUserId == null;
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("configured", aiChatService.isConfigured(privileged));
        body.put("loginRequired", guest);
        body.put("models", guest ? List.of() : modelInfos(privileged));
        return body;
    }

    /**
     * 中转站模型发现（配置排障）：仅管理员。该接口会把上游真实模型清单打给前端，
     * 而「哪些模型可以使用」本身就是管理员的配置权，不该让普通用户看到全量。
     */
    @GetMapping("/upstream-models")
    public ResponseEntity<?> upstreamModels(@CurrentUserId Long currentUserId,
                                            @RequestParam(required = false) String provider) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("登录后才能查看中转站模型列表"));
        }
        if (!aiSettingsService.canManage(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("仅管理员可查看中转站的完整模型列表"));
        }
        if (!aiChatService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                    .body(new ErrorResponse("AI 助教未配置：请设置后端环境变量 AI_API_KEY 或 suanfa.ai.providers"));
        }
        return ResponseEntity.ok(Map.of("providers", aiChatService.listUpstreamModels(provider)));
    }

    // ------------------------------------------------------------ 模型清单

    /**
     * 当前调用者可选的模型。
     *
     * <p>管理员：全量（含不可用项，前端置灰展示，便于发现「忘配 key」「provider 被禁用」）；
     * 普通用户：只有「已开放且可用」的模型，不可用项与内部备注不下发。
     */
    private List<AiModelInfo> modelInfos(boolean privileged) {
        int globalMax = aiProperties.getMaxTokens();
        int globalTimeout = aiProperties.getTimeoutSeconds();
        double globalTemp = aiProperties.getTemperature();
        List<AiModelInfo> list = new ArrayList<>();
        for (AiChatService.ModelSpec m : aiChatService.selectableModels(privileged)) {
            boolean hasBase = m.baseUrl() != null && !m.baseUrl().isBlank();
            boolean hasKey = m.apiKey() != null && !m.apiKey().isBlank();
            boolean available = hasBase && (hasKey || !m.requireKey());
            if (!privileged && !available) {
                continue;
            }
            list.add(new AiModelInfo(
                    aiChatService.tokenFor(m),
                    m.name(),
                    m.label(),
                    m.providerId(),
                    m.providerLabel(),
                    m.primary(),
                    m.maxTokens() > 0 ? m.maxTokens() : globalMax,
                    m.timeoutSeconds() > 0 ? m.timeoutSeconds() : globalTimeout,
                    m.temperature() != null ? m.temperature() : globalTemp,
                    m.reasoningEffort(),
                    available,
                    available ? null : (!hasBase ? "未配置 base-url" : "未配置 API Key"),
                    privileged ? m.note() : null,
                    aiChatService.cooldownSecondsLeft(m),
                    m.userVisible()));
        }
        return list;
    }

    private List<Map<String, Object>> providerInfos(List<AiModelInfo> models) {
        Map<String, Map<String, Object>> byProvider = new LinkedHashMap<>();
        for (AiModelInfo m : models) {
            Map<String, Object> p = byProvider.computeIfAbsent(m.provider(), k -> {
                Map<String, Object> one = new LinkedHashMap<>();
                one.put("id", m.provider());
                one.put("label", m.providerLabel());
                one.put("models", new ArrayList<String>());
                return one;
            });
            @SuppressWarnings("unchecked")
            List<String> names = (List<String>) p.get("models");
            names.add(m.name());
        }
        return new ArrayList<>(byProvider.values());
    }

    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest req, @CurrentUserId Long currentUserId) {
        boolean privileged = aiSettingsService.canManage(currentUserId);
        ResponseEntity<?> guard = guard(req, currentUserId, privileged);
        if (guard != null) {
            return guard;
        }
        try {
            AiChatService.Outcome out = aiChatService.chat(req.messages(), req.model(), privileged);
            return ResponseEntity.ok(toResponse(out));
        } catch (IllegalArgumentException e) {
            rateLimiter.refund(currentUserId);
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        } catch (AiChatService.AiException e) {
            // 上游全挂/未产生任何输出：不该扣用户额度（否则中转站一挂，12 次/分很快被错误请求烧光）
            rateLimiter.refund(currentUserId);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("AI 对话失败", e);
            rateLimiter.refund(currentUserId);
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(new ErrorResponse("AI 服务异常：" + e.getClass().getSimpleName()));
        }
    }

    @PostMapping(value = "/chat/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter chatStream(@RequestBody ChatRequest req, @CurrentUserId Long currentUserId,
                                 HttpServletResponse response) {
        response.setHeader("Cache-Control", "no-cache, no-transform");
        response.setHeader("X-Accel-Buffering", "no"); // nginx 关闭缓冲
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        AtomicBoolean cancelled = new AtomicBoolean(false);
        emitter.onCompletion(() -> cancelled.set(true));
        emitter.onTimeout(() -> cancelled.set(true));
        emitter.onError(e -> cancelled.set(true));

        boolean privileged = aiSettingsService.canManage(currentUserId);
        ResponseEntity<?> guard = guard(req, currentUserId, privileged);
        if (guard != null) {
            // 先把 HTTP 状态码回给客户端（401/503/429），前端据此选择「降级本地答疑」而不是报错误
            response.setStatus(guard.getStatusCode().value());
            sendQuiet(emitter, "error", guard.getBody());
            emitter.complete();
            return emitter;
        }

        try {
            streamPool.execute(
                    () -> runStream(req.messages(), req.model(), privileged, emitter, cancelled, currentUserId));
        } catch (RejectedExecutionException e) {
            rateLimiter.refund(currentUserId);
            sendQuiet(emitter, "error", new ErrorResponse("AI 并发请求过多，请稍后再试"));
            emitter.complete();
        }
        return emitter;
    }

    private void runStream(List<ChatRequest.ChatMessage> messages, String model, boolean privileged,
                           SseEmitter emitter, AtomicBoolean cancelled, Long userId) {
        boolean[] reasoningHintSent = {false};
        boolean[] delivered = {false}; // 已向用户输出过增量：这种情况不退还限流额度
        try {
            aiChatService.chatStream(messages, model, privileged, new AiChatService.StreamHandler() {
                @Override
                public void onMeta(String model, List<AiKnowledgeService.Ref> refs) {
                    sendQuiet(emitter, "meta", Map.of("refs", toRefs(refs)));
                }

                @Override
                public void onDelta(String text) {
                    if (cancelled.get()) {
                        // 客户端断开不是模型故障：单独异常类型，不写熔断表（见 AiChatService）
                        throw new AiChatService.ClientDisconnectedException();
                    }
                    delivered[0] = true;
                    sendQuiet(emitter, "delta", Map.of("t", text));
                }

                @Override
                public void onReasoning(String text) {
                    // 只把「模型在思考」这个信号透给前端；思考链本身（本地模型可达上万字）不下发
                    if (!reasoningHintSent[0]) {
                        reasoningHintSent[0] = true;
                        sendQuiet(emitter, "reasoning", Map.of("t", ""));
                    }
                }

                @Override
                public void onDone(String fullText, String model) {
                    sendQuiet(emitter, "done", Map.of("model", String.valueOf(model)));
                }
            });
            emitter.complete();
        } catch (AiChatService.ClientDisconnectedException e) {
            // 用户点了「停止回答」/ 刷新页面：静默收尾，不报错也不记熔断（额度已消费，不退）
            emitter.complete();
        } catch (IllegalArgumentException e) {
            rateLimiter.refund(userId);
            sendQuiet(emitter, "error", new ErrorResponse(e.getMessage()));
            emitter.complete();
        } catch (AiChatService.AiException e) {
            if (!delivered[0]) {
                rateLimiter.refund(userId);
            }
            sendQuiet(emitter, "error", new ErrorResponse(e.getMessage()));
            emitter.complete();
        } catch (Exception e) {
            log.error("AI 流式对话失败", e);
            if (!delivered[0]) {
                rateLimiter.refund(userId);
            }
            sendQuiet(emitter, "error", new ErrorResponse("AI 服务异常：" + e.getClass().getSimpleName()));
            emitter.complete();
        }
    }

    // ------------------------------------------------------------ 内部工具

    /**
     * 登录 / 配置 / 参数 / 模型权限 / 限流 校验，通过返回 null。
     *
     * @param privileged 当前用户是否管理员（能看到并使用全量模型）；模型权限放在限流前，
     *                   避免“越权请求”白扣用户额度
     */
    private ResponseEntity<?> guard(ChatRequest req, Long currentUserId, boolean privileged) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("登录后才能使用 AI 助教"));
        }
        if (!aiChatService.isConfigured(privileged)) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(new ErrorResponse(privileged
                    ? "AI 助教未配置：请设置后端环境变量 AI_API_KEY（可选 AI_BASE_URL / AI_MODEL / AI_FALLBACK_MODELS），"
                            + "或在 suanfa.ai.providers 中配置多个 API 中转站"
                    : "AI 助教暂未开放：请联系管理员在「中转站配置」里开放至少一个模型"));
        }
        if (req.messages() == null || req.messages().isEmpty() || req.messages().size() > MAX_MESSAGES) {
            return ResponseEntity.badRequest().body(new ErrorResponse("messages 不能为空且不超过 " + MAX_MESSAGES + " 条"));
        }
        String model = req.model();
        if (model != null && !model.isBlank() && aiChatService.findModel(model, privileged) == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse(privileged
                    ? "未知模型：" + model + "（请刷新模型列表或改用自动选择）"
                    : "该模型未对你开放，请刷新模型列表或改用「自动」"));
        }
        if (!rateLimiter.tryAcquire(currentUserId)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(new ErrorResponse(
                    "提问太频繁了，每分钟最多 " + rateLimiter.limit() + " 次，休息一下再看会儿可视化吧 🙂"));
        }
        return null;
    }

    private ChatResponse toResponse(AiChatService.Outcome out) {
        return new ChatResponse(out.reply(), out.model(), toRefs(out.refs()));
    }

    private static List<ChatRef> toRefs(List<AiKnowledgeService.Ref> refs) {
        List<ChatRef> list = new ArrayList<>();
        if (refs != null) {
            for (AiKnowledgeService.Ref r : refs) {
                list.add(new ChatRef(r.id(), r.name(), r.route()));
            }
        }
        return list;
    }

    private void sendQuiet(SseEmitter emitter, String event, Object data) {
        try {
            emitter.send(SseEmitter.event().name(event).data(data, MediaType.APPLICATION_JSON));
        } catch (Exception e) {
            log.debug("SSE 发送失败（客户端可能已断开）: {}", e.toString());
        }
    }

    public record ErrorResponse(String message) {
    }
}
