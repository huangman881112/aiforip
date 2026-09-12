package com.suanfa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suanfa.config.AiProperties;
import com.suanfa.dto.ChatRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * AI 助教服务：以 SSE 流式方式代理 OpenAI 兼容的 chat/completions 接口。
 *
 * <p>针对「API 中转站」场景的几点强化：
 * <ol>
 *   <li><b>多中转站</b>：每个上游有独立的 base-url / api-key / 额外请求头，模型按
 *       {@code provider + name} 定位（不同站可能重名），见 {@link AiProperties}；</li>
 *   <li><b>模型故障转移</b>：主模型限流/欠费/超时（中转站常见的 429、额度用尽）时自动按序切换备用模型，
 *       用户在前端指定模型时优先用它，失败仍回落到其余模型；</li>
 *   <li><b>错误可诊断</b>：解析中转站返回的各家错误体（OpenAI 风格 / 上游原始 JSON / SSE 中内嵌 error），
 *       把真实原因回传给前端，而不是笼统的「服务不可用」；</li>
 *   <li><b>模型清单发现</b>：{@link #listUpstreamModels(String)} 直接问中转站的 {@code GET /models}，
 *       便于配置时确认真实可用的模型名；</li>
 *   <li><b>知识增强</b>：注入站内算法清单与召回摘录（见 {@link AiKnowledgeService}）；</li>
 *   <li><b>可页面配置</b>：中转站地址 / token / 模型清单存在 {@code app_settings}，
 *       由 {@link AiSettingsService} 保存后调用 {@link #reload} 热生效（见 {@code /api/ai/settings}）。</li>
 * </ol>
 */
@Service
public class AiChatService {

    private static final Logger log = LoggerFactory.getLogger(AiChatService.class);

    /** SSE 流结束标记。 */
    private static final String DONE = "[DONE]";

    /** 送给上游的最大历史条数与单条长度（防滥用；超出部分保留尾部）。 */
    private static final int MAX_MESSAGES = 16;
    private static final int MAX_CONTENT_CHARS = 3000;

    /** 旧写法的隐式 provider ID（也是设置页里「环境变量 · 默认中转站」那一条的 id）。 */
    public static final String LEGACY_PROVIDER = "default";

    private static final String PERSONA = """
            你是「小白学算法」网站（面向初学者的算法学习平台，提供排序/搜索/图/动态规划/贪心算法的交互式可视化）的 AI 助教。

            回答规则：
            1. 简体中文，面向初学者：先给结论，再讲原因，最后给可执行的练习建议。
            2. 使用 Markdown：小标题分点、列表、`行内代码`、带语言标注的代码块；关键结论加粗。
            3. 讲算法时按「核心思想 → 关键步骤/伪代码 → 代码片段 → 时间空间复杂度 → 适用场景」组织；
               复杂度用站内资料中的记号，不要自行编造数据。
            4. 问代码为什么错时，先复述你理解的意图，再指出问题行，给出修正片段；不要整段重写。
            5. 引导刷题时先给思路提示，不给完整答案；用户明确要答案再给，并附易错点。
            6. 提到站内算法时给出链接，格式：[快速排序](/algorithms/sorting/quick-sort)，鼓励去看可视化。
            7. 与算法/编程学习无关的问题，一句话礼貌拒绝并拉回主题。
            8. 篇幅克制：单次回答控制在 500 字以内（含代码），需要展开时主动问「要不要继续讲下一部分」。

            【本站算法清单】（名称(路由)）
            """;

    private final HttpClient client;
    private final ObjectMapper objectMapper;
    private final AiKnowledgeService knowledge;
    private final AiProperties props;
    /** 生效的模型清单（yml/环境变量 + 页面热配置合并结果）；页面保存配置后整体重建。 */
    private volatile List<ModelSpec> models;
    /** 只读的 yml/环境变量 providers，供 /api/ai/settings 展示「出厂配置」。 */
    private final List<AiProperties.Provider> envProviders;
    private final boolean knowledgeEnabled;

    /** 模型熔断表：{@code provider/name} -> 恢复时间（nanoTime）。中转站的额度限制是持续的，避免每次请求都撞一遍坏模型。 */
    private final ConcurrentHashMap<String, Long> cooldown = new ConcurrentHashMap<>();

    public AiChatService(AiProperties props, ObjectMapper objectMapper, AiKnowledgeService knowledge) {
        this.props = props;
        this.objectMapper = objectMapper;
        this.knowledge = knowledge;
        this.knowledgeEnabled = props.isKnowledgeEnabled();
        this.envProviders = List.copyOf(props.getProviders());
        this.models = resolveModels(props, objectMapper, List.of());
        this.client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(10))
                .version(HttpClient.Version.HTTP_1_1) // 中转站（uvicorn 等）对 h2c 升级不一定支持
                .build();
        logLoaded();
    }

    private void logLoaded() {
        List<ModelSpec> current = this.models;
        if (current.isEmpty()) {
            log.warn("AI 助教未配置任何上游模型（suanfa.ai.model / suanfa.ai.providers / 页面配置均为空），前端将降级为本地答疑");
        } else {
            log.info("AI 助教已加载 {} 个模型: {}", current.size(),
                    current.stream().map(ModelSpec::key).collect(Collectors.joining(", ")));
        }
    }

    /**
     * 运行时热加载上游配置（管理页保存中转站后调用），返回新的生效模型清单。
     *
     * <p>合并顺序：页面（app_settings）→ AI_PROVIDERS_JSON → suanfa.ai.providers → 旧写法（AI_MODEL/AI_FALLBACK_MODELS）。
     * 页面配置里 {@code enabled=false} 的模型作为「墓碑」，会同时屏蔽同名的 env 模型（不改 .env 就能停掉坏兜底）。
     */
    public synchronized List<ModelSpec> reload(List<AiProperties.Provider> runtimeProviders) {
        this.models = resolveModels(props, objectMapper,
                runtimeProviders == null ? List.of() : List.copyOf(runtimeProviders));
        this.cooldown.clear(); // 配置刚改过，旧的熔断状态无意义
        logLoaded();
        return this.models;
    }

    /** yml / 环境变量里的 providers 配置（只读，供设置页展示来源）。 */
    public List<AiProperties.Provider> envProviderConfigs() {
        List<AiProperties.Provider> out = new ArrayList<>();
        String json = props.getProvidersJson();
        if (!blank(json) && json.trim().startsWith("[")) {
            try {
                out.addAll(parseProvidersJson(objectMapper, json));
            } catch (Exception e) {
                log.error("suanfa.ai.providers-json 解析失败，已忽略该配置：{}", e.getMessage());
            }
        }
        out.addAll(envProviders);
        return out;
    }

    /**
     * 一个可调用的上游模型：名字 + 它在哪个中转站 + 它自己的预算。
     *
     * <p>兜底模型常是本地 llama.cpp/Ollama 的「思考型」模型：一句中文回答可能先消耗两千多 token
     * 写 reasoning_content，因此允许为它单独设置更大预算与推理档位，而不影响主模型。
     * maxTokens/timeoutSeconds 为 0、temperature 为 null 表示继承全局。
     *
     * <p>{@code userVisible=false} 表示「仅管理员可用」：不出现在普通用户可见的清单里，
     * 也不参与普通用户选「自动」时的降级链（避免用户一句话就打到内测/按量付费的贵模型上）。
     */
    public record ModelSpec(String name, String label, String providerId, String providerLabel,
                            String baseUrl, String apiKey, Map<String, String> headers,
                            int maxTokens, int timeoutSeconds, Double temperature,
                            String reasoningEffort, boolean primary, String note, boolean requireKey,
                            boolean fromRuntime, boolean userVisible) {

        /** 熔断/去重键：不同中转站可能有同名模型。 */
        public String key() {
            return providerId + "/" + name;
        }

        /** 给用户看的标识，如 deepseek-chat@中转站A。 */
        public String display() {
            return name + "@" + providerLabel;
        }

        @Override
        public String toString() {
            return key();
        }
    }

    // ============================================================ 配置解析

    /** providers 合并：页面（DB）覆盖 → providers-json → providers → 旧写法（AI_MODEL / AI_FALLBACK_MODELS）。 */
    private static List<ModelSpec> resolveModels(AiProperties props, ObjectMapper mapper,
                                                 List<AiProperties.Provider> runtimeProviders) {
        List<ProviderSource> sources = allProviders(props, mapper, runtimeProviders);
        // 页面里 enabled=false 的模型记为墓碑：不入清单，并屏蔽同名的 env/yml 模型
        Set<String> disabled = new HashSet<>();
        for (ProviderSource s : sources) {
            if (!s.runtime() || s.provider() == null) {
                continue;
            }
            String tombPid = firstNonBlank(s.provider().getId(), LEGACY_PROVIDER);
            for (AiProperties.Model m : s.provider().getModels()) {
                if (m != null && !m.isEnabled() && !blank(m.getName())) {
                    disabled.add(tombPid + "/" + m.getName().trim());
                }
            }
        }

        List<ModelSpec> list = new ArrayList<>();
        for (ProviderSource s : sources) {
            AiProperties.Provider p = s.provider();
            if (p == null || !p.isEnabled()) {
                continue;
            }
            String baseUrl = firstNonBlank(p.getBaseUrl(), props.getBaseUrl());
            if (baseUrl.isBlank()) {
                log.warn("AI provider {} 未配置 base-url，已忽略", p.getId());
                continue;
            }
            // requireKey=false 的本地/自建上游不继承全局 token（真的是免鉴权）；
            // 同一家中转站拆多个 provider 时，未单独写 key 则继承全局 AI_API_KEY。
            String apiKey = p.isRequireKey() ? firstNonBlank(p.getApiKey(), props.getApiKey()) : firstNonBlank(p.getApiKey());
            String pid = firstNonBlank(p.getId(), LEGACY_PROVIDER);
            for (AiProperties.Model m : p.getModels()) {
                if (m == null || !m.isEnabled() || blank(m.getName())) {
                    continue;
                }
                add(list, new ModelSpec(m.getName().trim(),
                        firstNonBlank(m.getLabel(), m.getName().trim()),
                        pid,
                        firstNonBlank(p.getLabel(), pid),
                        trimTrailingSlash(baseUrl),
                        apiKey,
                        Map.copyOf(safeHeaders(p.getHeaders())),
                        m.getMaxTokens() > 0 ? m.getMaxTokens() : nz(p.getMaxTokens()),
                        m.getTimeoutSeconds() > 0 ? m.getTimeoutSeconds() : nz(p.getTimeoutSeconds()),
                        m.getTemperature() != null ? m.getTemperature() : p.getTemperature(),
                        normalizeEffort(m.getReasoningEffort()),
                        m.isPrimary(),
                        m.getNote(),
                        p.isRequireKey(),
                        s.runtime(),
                        m.isUserVisible()), disabled);
            }
        }

        // 旧写法：单中转站 + 主模型 / 备用模型串（name@maxTokens@timeout@effort）
        String legacyBase = trimTrailingSlash(props.getBaseUrl());
        if (!legacyBase.isBlank()) {
            List<ModelSpec> legacy = new ArrayList<>();
            add(legacy, specFromShortForm(props.getModel(), legacyBase, props, LEGACY_PROVIDER), disabled);
            for (String item : String.valueOf(props.getFallbackModels()).split(",")) {
                add(legacy, specFromShortForm(item, legacyBase, props, LEGACY_PROVIDER), disabled);
            }
            for (ModelSpec spec : legacy) {
                add(list, spec, disabled);
            }
        }

        // primary 置顶（保持声明顺序稳定）
        List<ModelSpec> sorted = new ArrayList<>();
        for (ModelSpec m : list) {
            if (m.primary()) {
                sorted.add(m);
            }
        }
        for (ModelSpec m : list) {
            if (!m.primary()) {
                sorted.add(m);
            }
        }
        return List.copyOf(sorted);
    }

    /** provider 配置来源：runtime = 页面写入 app_settings 的配置（优先级最高）。 */
    private record ProviderSource(AiProperties.Provider provider, boolean runtime) {
    }

    /** 合并三方来源：页面（DB）→ providers-json → providers。 */
    private static List<ProviderSource> allProviders(AiProperties props, ObjectMapper mapper,
                                                     List<AiProperties.Provider> runtimeProviders) {
        List<ProviderSource> out = new ArrayList<>();
        if (runtimeProviders != null) {
            for (AiProperties.Provider p : runtimeProviders) {
                out.add(new ProviderSource(p, true));
            }
        }
        String json = props.getProvidersJson();
        if (!blank(json) && json.trim().startsWith("[")) {
            try {
                for (AiProperties.Provider p : parseProvidersJson(mapper, json)) {
                    out.add(new ProviderSource(p, false));
                }
            } catch (Exception e) {
                log.error("suanfa.ai.providers-json 解析失败，已忽略该配置：{}", e.getMessage());
            }
        }
        for (AiProperties.Provider p : props.getProviders()) {
            out.add(new ProviderSource(p, false));
        }
        return out;
    }

    /** 宽容解析 providers JSON（未知字段忽略）；供 AI_PROVIDERS_JSON 与 app_settings 共用。 */
    public static List<AiProperties.Provider> parseProvidersJson(ObjectMapper mapper, String json) throws Exception {
        return mapper.copy()
                .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false)
                .readValue(json, new TypeReference<List<AiProperties.Provider>>() {
                });
    }

    private static ModelSpec specFromShortForm(String raw, String baseUrl, AiProperties props, String providerId) {
        String item = raw == null ? "" : raw.trim();
        if (item.isEmpty()) {
            return null;
        }
        String[] parts = item.split("@");
        String name = parts[0].trim();
        if (name.isEmpty()) {
            return null;
        }
        int maxTokens = parts.length > 1 ? intOr(parts[1], 0) : 0;
        int timeout = parts.length > 2 ? intOr(parts[2], 0) : 0;
        String effort = parts.length > 3 ? normalizeEffort(parts[3]) : null;
        return new ModelSpec(name, name, providerId, "默认中转站", baseUrl, props.getApiKey(), Map.of(),
                maxTokens, timeout, null, effort, false, null, true, false, true);
    }

    /** 加入列表；同名同站去重；被页面显式禁用的模型（墓碑）跳过。 */
    private static void add(List<ModelSpec> list, ModelSpec spec, Set<String> disabled) {
        if (spec == null || blank(spec.name())) {
            return;
        }
        if (disabled.contains(spec.key())) {
            return;
        }
        for (int i = 0; i < list.size(); i++) {
            if (list.get(i).key().equals(spec.key())) {
                return;
            }
        }
        list.add(spec);
    }

    private static String normalizeEffort(String raw) {
        String e = raw == null ? "" : raw.trim().toLowerCase(Locale.ROOT);
        return List.of("minimal", "low", "medium", "high").contains(e) ? e : null;
    }

    private static Map<String, String> safeHeaders(Map<String, String> headers) {
        Map<String, String> out = new LinkedHashMap<>();
        if (headers != null) {
            headers.forEach((k, v) -> {
                if (!blank(k) && v != null) {
                    out.put(k.trim(), v.trim());
                }
            });
        }
        return out;
    }

    private static int nz(Integer v) {
        return v == null ? 0 : v;
    }

    private static int intOr(String s, int def) {
        try {
            return Integer.parseInt(s.trim());
        } catch (Exception e) {
            return def;
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null) {
            return "";
        }
        String u = url.trim();
        while (u.endsWith("/")) {
            u = u.substring(0, u.length() - 1);
        }
        return u;
    }

    // ============================================================ 对外查询

    /** 是否可用：至少有一个「有地址且（不需要 key 或已配 key）」的模型。 */
    public boolean isConfigured() {
        return isConfigured(true);
    }

    /**
     * 对某一类调用者是否可用。
     *
     * @param privileged 管理员/内部视图为 true；普通用户为 false，只看得到开放给自己的模型
     */
    public boolean isConfigured(boolean privileged) {
        return usableModels(privileged).stream().anyMatch(this::hasCredential);
    }

    public List<ModelSpec> models() {
        return models;
    }

    /** 启用且地址可用的模型（含仅管理员可选的，供设置页/日志用）。 */
    public List<ModelSpec> usableModels() {
        return usableModels(true);
    }

    /** 某一类调用者能真正用到的模型：privileged=false 时剩掉「仅管理员可选」。 */
    public List<ModelSpec> usableModels(boolean privileged) {
        return models.stream()
                .filter(m -> privileged || m.userVisible())
                .filter(m -> !m.baseUrl().isBlank())
                .toList();
    }

    /** 下发给前端的清单：对话页只取 defaultModel 展示；普通用户只能看到管理员开放的模型。 */
    public List<ModelSpec> selectableModels(boolean privileged) {
        return models.stream().filter(m -> privileged || m.userVisible()).toList();
    }

    /** 该模型是否允许普通用户选用（管理员总是 true）。 */
    public boolean isSelectableBy(ModelSpec m, boolean privileged) {
        return m != null && (privileged || m.userVisible());
    }

    private boolean hasCredential(ModelSpec m) {
        return !blank(m.apiKey()) || !m.requireKey();
    }

    public String primaryModel() {
        return models.isEmpty() ? null : models.get(0).name();
    }

    public ModelSpec primarySpec() {
        return models.isEmpty() ? null : models.get(0);
    }

    /** 模型标识：能唯一定位就返回 provider/name，否则返回 name（请求体 model 字段用）。 */
    public String tokenFor(ModelSpec spec) {
        boolean dupName = models.stream().filter(m -> m.name().equals(spec.name())).count() > 1;
        return dupName ? spec.key() : spec.name();
    }

    /**
     * 按用户传入的标识（name 或 provider/name，忽略大小写）定位模型；找不到返回 null。
     *
     * @param privileged false 时「仅管理员可选」的模型一律当不存在（防止用户手改 token 越权）
     */
    public ModelSpec findModel(String token, boolean privileged) {
        if (blank(token)) {
            return null;
        }
        String t = token.trim().toLowerCase(Locale.ROOT);
        for (ModelSpec m : models) {
            if (!isSelectableBy(m, privileged)) {
                continue;
            }
            if (m.name().toLowerCase(Locale.ROOT).equals(t) || m.key().toLowerCase(Locale.ROOT).equals(t)) {
                return m;
            }
        }
        return null;
    }

    /** 管理员/内部视图的查找（不区分是否开放给普通用户）。 */
    public ModelSpec findModel(String token) {
        return findModel(token, true);
    }

    /** 默认中转站地址，仅用于状态展示。 */
    public String baseUrl() {
        ModelSpec primary = primarySpec();
        if (primary != null && !primary.baseUrl().isBlank()) {
            return primary.baseUrl();
        }
        return trimTrailingSlash(props.getBaseUrl());
    }

    public int maxTokens() {
        return props.getMaxTokens();
    }

    public int timeoutSeconds() {
        return props.getTimeoutSeconds();
    }

    public double temperature() {
        return props.getTemperature();
    }

    /**
     * 该模型剩余的熔断秒数：&gt;0 表示最近调用失败（限流/额度/连不上），短时间会被自动跳过；0 = 正常。
     * 给 /api/ai/status 用，避免前端把「配置正确但刚挂掉」的模型显示成完全可用。
     */
    public long cooldownSecondsLeft(ModelSpec m) {
        Long until = cooldown.get(m.key());
        if (until == null) {
            return 0;
        }
        long left = (until - System.nanoTime()) / 1_000_000_000L;
        return Math.max(left, 0);
    }

    // ============================================================ 对外 API

    /** 流式回调（onDelta 可被多次调用；onError 与 onDone 互斥）。 */
    public interface StreamHandler {
        default void onMeta(String model, List<AiKnowledgeService.Ref> refs) {
        }

        void onDelta(String text);

        default void onReasoning(String text) {
        }

        default void onDone(String fullText, String model) {
        }

        default void onError(String message) {
        }
    }

    /** 回答结果：正文 + 实际使用的模型 + 引用到的站内算法。 */
    public record Outcome(String reply, String model, List<AiKnowledgeService.Ref> refs) {
    }

    /** 上游/网络异常（消息可直接展示给用户），cooldownSeconds 为该模型的熔断时长。 */
    public static class AiException extends RuntimeException {
        private final long cooldownSeconds;

        public AiException(String message) {
            this(message, 30);
        }

        public AiException(String message, long cooldownSeconds) {
            super(message);
            this.cooldownSeconds = cooldownSeconds;
        }

        public long cooldownSeconds() {
            return cooldownSeconds;
        }
    }

    /**
     * 客户端已断开（用户点「停止回答」/ 刷新页面）。
     *
     * <p>这跟上游好坏无关，必须呷呷地当成「本次调用作废」：不写熔断表、不切备用模型、不再写 SSE。
     * 否则用户多点几次停止就能把唯一健康的主模型打入熔断。
     */
    public static class ClientDisconnectedException extends AiException {
        public ClientDisconnectedException() {
            super("客户端已断开", 0);
        }
    }

    /**
     * 非流式对话（内部仍走 SSE，聚合后返回）。
     *
     * @param privileged false = 普通用户，只能使用/降级到管理员开放给自己的模型
     */
    public Outcome chat(List<ChatRequest.ChatMessage> history, String requestedModel, boolean privileged) {
        return chatStream(history, requestedModel, privileged, new StreamHandler() {
            @Override
            public void onDelta(String text) {
                // 非流式调用方只需要聚合结果
            }

            @Override
            public void onError(String message) {
                throw new AiException(message);
            }
        });
    }

    /**
     * 流式对话：把增量文本回调给 handler，并返回完整结果。
     * 任何失败（含所有备用模型都不可用）以 {@link AiException} 抛出。
     *
     * @param requestedModel 前端选择的模型（name 或 provider/name）；为空表示按配置顺序自动选择
     * @param privileged     false = 普通用户视角（候选模型限管理员开放的模型）
     */
    public Outcome chatStream(List<ChatRequest.ChatMessage> history, String requestedModel,
                              boolean privileged, StreamHandler handler) {
        if (!isConfigured(privileged)) {
            throw new AiException(privileged
                    ? "AI 助教未配置：请设置 AI_API_KEY 或 suanfa.ai.providers"
                    : "AI 助教暂未对普通用户开放，请联系管理员在「中转站配置」里开放至少一个模型");
        }
        List<AiKnowledgeService.Entry> hits = knowledgeEnabled
                ? knowledge.recall(lastQuestion(history)) : List.of();
        List<AiKnowledgeService.Ref> refs = knowledge.refs(hits);
        List<Map<String, String>> messages = buildMessages(history, hits);
        handler.onMeta(null, refs);

        ModelSpec requested = findModel(requestedModel, privileged);
        if (!blank(requestedModel) && requested == null) {
            // 参数错误而不是上游错误：上层返回 400，不记熔断也不降级
            throw new IllegalArgumentException(privileged
                    ? "未知模型：" + requestedModel + "（请刷新模型列表或改用自动选择）"
                    : "该模型未对你开放，请刷新模型列表或改用自动选择");
        }

        AiException lastError = null;
        for (ModelSpec spec : candidates(requested, privileged)) {
            String model = spec.display();
            StringBuilder full = new StringBuilder();
            boolean[] emitted = {false};
            try {
                streamOnce(spec, messages, handler, full, emitted);
                String text = full.toString().trim();
                if (text.isEmpty()) {
                    throw new AiException("模型 " + model + " 只输出了思考过程没有答案，请调大该模型 max-tokens"
                            + "（本地思考型模型需要 2000+）", 120);
                }
                cooldown.remove(spec.key());
                handler.onDone(text, spec.name());
                return new Outcome(text, spec.name(), refs);
            } catch (ClientDisconnectedException e) {
                log.debug("AI 流式对话被客户端中断（模型 {}），不计入熔断", model);
                throw e;
            } catch (AiException e) {
                lastError = e;
                cooldown.put(spec.key(),
                        System.nanoTime() + Duration.ofSeconds(e.cooldownSeconds).toNanos());
                log.warn("AI 模型 {} 调用失败（熔断 {}s）: {}", model, e.cooldownSeconds, e.getMessage());
                if (emitted[0]) {
                    // 已经吐字给用户，不再切换模型（避免内容混排）
                    handler.onError(e.getMessage());
                    throw e;
                }
            } catch (Exception e) {
                lastError = new AiException("AI 服务调用异常：" + shortMsg(e));
                log.warn("AI 模型 {} 调用异常（熔断 30s）", model, e);
                // 网络层异常（连接拒绝/DNS/超时）同样要熔断，否则每条请求都先撞一遍死上游才降级
                cooldown.put(spec.key(), System.nanoTime() + Duration.ofSeconds(30).toNanos());
                if (emitted[0]) {
                    handler.onError(lastError.getMessage());
                    throw lastError;
                }
            }
        }
        handler.onError(lastError == null ? "AI 服务不可用" : lastError.getMessage() + "（所有备用模型均不可用）");
        throw lastError == null ? new AiException("AI 服务不可用") : lastError;
    }

    /** 候选模型顺序：用户指定的排最前，其余跳过熔断中的；全部熔断时退化到最快恢复的那个。 */
    private List<ModelSpec> candidates(ModelSpec requested, boolean privileged) {
        long now = System.nanoTime();
        List<ModelSpec> ready = new ArrayList<>();
        ModelSpec soonest = null;
        long soonestAt = Long.MAX_VALUE;
        for (ModelSpec m : usableModels(privileged)) {
            if (!hasCredential(m)) {
                continue; // 该中转站没配 token，跳过（避免每条请求都撞 401）
            }
            Long until = cooldown.get(m.key());
            if (until == null || until <= now) {
                ready.add(m);
            } else if (until < soonestAt) {
                soonestAt = until;
                soonest = m;
            }
        }
        List<ModelSpec> ordered = new ArrayList<>();
        if (requested != null) {
            ordered.add(requested);
            ready.remove(requested);
        }
        ordered.addAll(ready);
        if (ordered.isEmpty() && soonest != null) {
            long waitSec = Math.max(1, (soonestAt - now) / 1_000_000_000L);
            log.info("AI 所有模型处于熔断，退化使用 {}（约 {}s 后恢复）", soonest.display(), waitSec);
            ordered.add(soonest);
        }
        return ordered;
    }

    // ============================================================ 上游调用

    private void streamOnce(ModelSpec spec, List<Map<String, String>> messages, StreamHandler handler,
                            StringBuilder full, boolean[] emitted) throws Exception {
        String model = spec.display();
        int maxTok = spec.maxTokens() > 0 ? spec.maxTokens() : props.getMaxTokens();
        int timeout = spec.timeoutSeconds() > 0 ? spec.timeoutSeconds() : props.getTimeoutSeconds();
        double temp = spec.temperature() != null ? spec.temperature() : props.getTemperature();
        Map<String, Object> reqPayload = new LinkedHashMap<>();
        reqPayload.put("model", spec.name());
        reqPayload.put("messages", messages);
        reqPayload.put("stream", true);
        reqPayload.put("temperature", temp);
        reqPayload.put("max_tokens", maxTok);
        if (spec.reasoningEffort() != null) {
            // llama.cpp / Ollama 上的思考型模型：不压推理预算时常把 max_tokens 全花在 reasoning_content 上
            reqPayload.put("reasoning_effort", spec.reasoningEffort());
        }
        String body = objectMapper.writeValueAsString(reqPayload);

        HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(spec.baseUrl() + "/chat/completions"))
                .timeout(Duration.ofSeconds(timeout))
                .header("Content-Type", "application/json")
                .header("Accept", "text/event-stream")
                .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8));
        applyAuth(builder, spec.apiKey(), spec.headers());

        HttpResponse<Stream<String>> resp = client.send(builder.build(), HttpResponse.BodyHandlers.ofLines());

        if (resp.statusCode() != 200) {
            String raw = readAll(resp);
            throw new AiException(describeError(resp.statusCode(), raw, model), cooldownFor(resp.statusCode(), raw));
        }

        long deadline = System.nanoTime() + Duration.ofSeconds(timeout).toNanos();
        try (Stream<String> lines = resp.body()) {
            var it = lines.iterator();
            while (it.hasNext()) {
                if (System.nanoTime() > deadline) {
                    throw new AiException("模型 " + model + " 响应超时（" + timeout + "s），已中断", 30);
                }
                String line = it.next();
                if (line.isBlank()) {
                    continue;
                }
                if (!line.startsWith("data:")) {
                    // 中转站偶尔直接吐 JSON（非 SSE）
                    handleRaw(line, handler, full, emitted, model);
                    continue;
                }
                String payload = line.substring(5).trim();
                if (payload.isEmpty()) {
                    continue;
                }
                if (DONE.equals(payload)) {
                    break;
                }
                handleRaw(payload, handler, full, emitted, model);
            }
        }
    }

    private void applyAuth(HttpRequest.Builder builder, String apiKey, Map<String, String> headers) {
        if (!blank(apiKey)) {
            builder.header("Authorization", "Bearer " + apiKey);
        }
        if (headers != null) {
            headers.forEach((k, v) -> {
                // 保留头由本方法统一设置，避免配置里误写覆盖
                if (!List.of("authorization", "content-type", "accept").contains(k.toLowerCase(Locale.ROOT))) {
                    builder.header(k, v);
                }
            });
        }
    }

    /**
     * 查询某个中转站真实可用的模型清单（OpenAI 兼容的 {@code GET /models}）。
     * 用于配置模型时确认名字（中转站的路由名常常和厂商名不同）。
     *
     * @param providerId 为空则查所有已启用的中转站
     */
    public List<Map<String, Object>> listUpstreamModels(String providerId) {
        List<ModelSpec> targets = usableModels().stream()
                .filter(m -> blank(providerId) || m.providerId().equalsIgnoreCase(providerId.trim()))
                .filter(this::hasCredential)
                .toList();
        List<Map<String, Object>> out = new ArrayList<>();
        List<String> done = new ArrayList<>();
        for (ModelSpec spec : targets) {
            if (done.contains(spec.providerId())) {
                continue;
            }
            done.add(spec.providerId());
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("provider", spec.providerId());
            item.put("label", spec.providerLabel());
            item.put("baseUrl", spec.baseUrl());
            try {
                HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(spec.baseUrl() + "/models"))
                        .timeout(Duration.ofSeconds(15))
                        .header("Accept", "application/json")
                        .GET();
                applyAuth(builder, spec.apiKey(), spec.headers());
                HttpResponse<String> resp = client.send(builder.build(),
                        HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
                if (resp.statusCode() != 200) {
                    item.put("ok", false);
                    item.put("error", "HTTP " + resp.statusCode() + " " + abbrevate(resp.body()));
                    out.add(item);
                    continue;
                }
                List<String> ids = new ArrayList<>();
                JsonNode data = objectMapper.readTree(resp.body()).path("data");
                if (data.isArray()) {
                    for (JsonNode n : data) {
                        String id = n.path("id").asText("");
                        if (!id.isEmpty()) {
                            ids.add(id);
                        }
                    }
                }
                item.put("ok", true);
                item.put("count", ids.size());
                item.put("models", ids);
            } catch (Exception e) {
                item.put("ok", false);
                item.put("error", shortMsg(e));
            }
            out.add(item);
        }
        return out;
    }

    /**
     * 连接测试（管理页「测试连接」）：不依赖已保存配置，因此「页面上刚填了地址/token」就能先试再存。
     *
     * <p>两步：
     * <ol>
     *   <li>{@code GET /models} —— 部发中转站没实现该路由（404），只作为警告，不影响最终结论；</li>
     *   <li>{@code POST /chat/completions}（非流式、小预算）—— 真正的可用性判据，回pong 即通。</li>
     * </ol>
     *
     * @param baseUrl 为空则用已生效配置中该 provider 的地址
     * @param apiKey  为空则用已生效配置中该 provider 的 token（便于只改了地址时复用旧 token）
     * @param model   为空则取 /models 返回的第一个
     */
    public Map<String, Object> testConnection(String baseUrl, String apiKey, String model,
                                             Map<String, String> headers, String providerId) {
        ModelSpec known = blank(providerId) ? null : usableModels().stream()
                .filter(m -> m.providerId().equalsIgnoreCase(providerId.trim()))
                .findFirst().orElse(null);
        String base = trimTrailingSlash(firstNonBlank(baseUrl, known == null ? props.getBaseUrl() : known.baseUrl()));
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("baseUrl", base);
        if (base.isBlank()) {
            result.put("ok", false);
            result.put("error", "未填写中转站地址（base-url）");
            result.put("steps", List.of());
            return result;
        }
        if (!base.startsWith("http://") && !base.startsWith("https://")) {
            result.put("ok", false);
            result.put("error", "地址必须以 http:// 或 https:// 开头");
            result.put("steps", List.of());
            return result;
        }
        String key = firstNonBlank(apiKey, known == null ? "" : known.apiKey());
        Map<String, String> extra = headers != null && !headers.isEmpty()
                ? safeHeaders(headers) : (known == null ? Map.of() : known.headers());

        List<Map<String, Object>> steps = new ArrayList<>();
        result.put("steps", steps);

        // ---- step 1: 模型清单
        List<String> discovered = new ArrayList<>();
        Map<String, Object> modelsStep = new LinkedHashMap<>();
        modelsStep.put("name", "models");
        modelsStep.put("title", "拉取模型清单（GET /models）");
        long t0 = System.nanoTime();
        try {
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + "/models"))
                    .timeout(Duration.ofSeconds(15)).header("Accept", "application/json").GET();
            applyAuth(b, key, extra);
            HttpResponse<String> resp = client.send(b.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            modelsStep.put("latencyMs", millis(t0));
            modelsStep.put("status", resp.statusCode());
            if (resp.statusCode() == 200) {
                JsonNode data = objectMapper.readTree(resp.body()).path("data");
                if (data.isArray()) {
                    for (JsonNode n : data) {
                        String id = n.path("id").asText("");
                        if (!id.isEmpty()) {
                            discovered.add(id);
                        }
                    }
                }
                modelsStep.put("ok", true);
                modelsStep.put("count", discovered.size());
                modelsStep.put("models", discovered.size() > 80 ? discovered.subList(0, 80) : discovered);
            } else {
                modelsStep.put("ok", false);
                modelsStep.put("error", "HTTP " + resp.statusCode() + " " + abbrevate(resp.body()));
                modelsStep.put("note", "部分中转站不实现 /models，属常见现象，不影响对话测试");
            }
        } catch (Exception e) {
            modelsStep.put("latencyMs", millis(t0));
            modelsStep.put("ok", false);
            modelsStep.put("error", shortMsg(e));
        }
        steps.add(modelsStep);

        // ---- step 2: 最小对话
        String probeModel = firstNonBlank(model, discovered.isEmpty() ? "" : discovered.get(0));
        result.put("model", probeModel);
        Map<String, Object> chatStep = new LinkedHashMap<>();
        chatStep.put("name", "chat");
        chatStep.put("title", "试一次小预算对话（POST /chat/completions）");
        chatStep.put("model", probeModel);
        if (probeModel.isBlank()) {
            chatStep.put("ok", false);
            chatStep.put("error", "未能确定模型名（该中转站不提供 /models），请在下方模型名输入框里指定");
            steps.add(chatStep);
            result.put("ok", false);
            result.put("discoveredModels", discovered);
            return result;
        }
        long t1 = System.nanoTime();
        try {
            Map<String, Object> payload = new LinkedHashMap<>();
            payload.put("model", probeModel);
            payload.put("messages", List.of(Map.of("role", "user", "content", "回复 pong，不要其他内容")));
            payload.put("stream", false);
            payload.put("max_tokens", 32);
            payload.put("temperature", 0);
            HttpRequest.Builder b = HttpRequest.newBuilder(URI.create(base + "/chat/completions"))
                    .timeout(Duration.ofSeconds(45))
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(payload), StandardCharsets.UTF_8));
            applyAuth(b, key, extra);
            HttpResponse<String> resp = client.send(b.build(), HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            chatStep.put("latencyMs", millis(t1));
            chatStep.put("status", resp.statusCode());
            if (resp.statusCode() == 200) {
                JsonNode node = objectMapper.readTree(resp.body());
                JsonNode msg = node.path("choices").path(0).path("message");
                String content = firstNonBlank(msg.path("content").asText(""), msg.path("reasoning_content").asText(""));
                String upstreamModel = node.path("model").asText("");
                if (content.isBlank()) {
                    chatStep.put("ok", false);
                    chatStep.put("error", "上游返回 200 但内容为空：" + abbrevate(resp.body()));
                } else {
                    chatStep.put("ok", true);
                    chatStep.put("reply", abbrevate(content));
                    chatStep.put("upstreamModel", upstreamModel);
                    chatStep.put("usage", node.path("usage"));
                }
            } else {
                chatStep.put("ok", false);
                chatStep.put("error", describeError(resp.statusCode(), resp.body(), probeModel));
            }
        } catch (Exception e) {
            chatStep.put("latencyMs", millis(t1));
            chatStep.put("ok", false);
            chatStep.put("error", shortMsg(e));
        }
        steps.add(chatStep);

        result.put("ok", Boolean.TRUE.equals(chatStep.get("ok")));
        result.put("discoveredModels", discovered);
        return result;
    }

    private static long millis(long startNano) {
        return (System.nanoTime() - startNano) / 1_000_000L;
    }

    private void handleRaw(String payload, StreamHandler handler, StringBuilder full,
                           boolean[] emitted, String model) {
        JsonNode node;
        try {
            node = objectMapper.readTree(payload);
        } catch (Exception e) {
            log.debug("AI 响应非 JSON 片段，忽略: {}", abbrevate(payload));
            return;
        }
        if (node.has("error")) {
            throw new AiException(describeError(200, payload, model), cooldownFor(200, payload));
        }
        JsonNode choice = node.path("choices").path(0);
        String delta = choice.path("delta").path("content").asText("");
        if (delta.isEmpty()) {
            delta = choice.path("message").path("content").asText("");
        }
        if (delta.isEmpty()) {
            delta = node.path("content").asText("");
        }
        String reasoning = choice.path("delta").path("reasoning_content").asText("");
        if (!reasoning.isEmpty()) {
            handler.onReasoning(reasoning);
        }
        if (!delta.isEmpty()) {
            emitted[0] = true;
            full.append(delta);
            handler.onDelta(delta);
        }
    }

    private static String readAll(HttpResponse<Stream<String>> resp) {
        try (Stream<String> lines = resp.body()) {
            return lines.collect(Collectors.joining("\n"));
        } catch (Exception e) {
            return "";
        }
    }

    /** 把上游各种错误体翻译成一句可读的中文提示。 */
    private String describeError(int status, String raw, String model) {
        String detail = raw == null ? "" : raw.trim();
        if (!detail.isEmpty()) {
            try {
                JsonNode node = objectMapper.readTree(detail);
                JsonNode err = node.path("error");
                JsonNode target = err.isObject() ? err : node;
                String msg = firstNonBlank(
                        target.path("message").asText(""),
                        target.path("error").asText(""),
                        target.path("detail").asText(""));
                String type = target.path("type").asText("");
                if (msg.startsWith("{")) { // error 字段本身是被字符串化的 JSON
                    try {
                        JsonNode inner = objectMapper.readTree(msg);
                        msg = firstNonBlank(inner.path("error").path("message").asText(""), msg);
                        if (type.isEmpty()) {
                            type = inner.path("error").path("type").asText("");
                        }
                    } catch (Exception ignore) {
                        // 保留原样
                    }
                }
                if (!msg.isBlank()) {
                    detail = type.isBlank() ? msg : msg + " [" + type + "]";
                }
            } catch (Exception ignore) {
                // 非 JSON：保留原始文本
            }
        }
        detail = abbrevate(detail);
        String hint;
        if (status == 200) {
            // 部分中转站会把上游错误包成 HTTP 200 + error 体，不能直接说「上游返回 200」
            String lower = detail.toLowerCase(Locale.ROOT);
            if (detail.contains("GoUsageLimit")) {
                hint = "上游额度用尽（月度限额）";
            } else if (lower.contains("connection") || lower.contains("dial ") || lower.contains("refused")
                    || lower.contains("no such host") || lower.contains("timeout") || lower.contains("upstream")) {
                hint = "中转站无法连接上游模型服务（上游未启动/地址错）";
            } else if (lower.contains("rate") || lower.contains("limit") || lower.contains("quota")) {
                hint = "上游限流/额度用尽";
            } else {
                hint = "上游返回错误";
            }
        } else {
            hint = switch (status) {
                case 401, 403 -> "鉴权失败（API Key 无效或无该模型权限）";
                case 404 -> "模型不存在或中转站未配置该路由";
                case 429 -> "上游限流/额度用尽";
                default -> status >= 500 ? "上游服务异常" : "上游返回 " + status;
            };
        }
        return "模型 " + model + " " + hint + "：" + (detail.isEmpty() ? "无响应内容" : detail);
    }

    /** 按错误类型给模型设定熔断时长。 */
    private static long cooldownFor(int status, String raw) {
        String s = raw == null ? "" : raw;
        if (status == 429 || s.contains("GoUsageLimit") || s.contains("rate") || s.contains("limit")) {
            return 300;
        }
        if (status == 401 || status == 403 || status == 404 || s.contains("Invalid token")
                || s.contains("not supported") || s.contains("not found")) {
            return 900; // 配置/权限问题，短时间内重试无意义
        }
        String lower = s.toLowerCase(Locale.ROOT);
        if (lower.contains("connection") || lower.contains("refused") || lower.contains("no such host")
                || lower.contains("upstream")) {
            return 60; // 上游挂/重启中，给一分钟恢复窗口
        }
        if (status >= 500) {
            return 60;
        }
        return 30;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }

    private static String firstNonBlank(String... vs) {
        for (String v : vs) {
            if (!blank(v)) {
                return v.trim();
            }
        }
        return "";
    }

    private static String abbrevate(String s) {
        if (s == null) {
            return "";
        }
        String t = s.replaceAll("\\s+", " ").trim();
        return t.length() <= 260 ? t : t.substring(0, 260) + "…";
    }

    private static String shortMsg(Exception e) {
        String m = e.getMessage();
        // 网络层异常原句对普通用户没有信息量，翻译成能直接行动的话
        if (e instanceof java.net.ConnectException) {
            return "连接被拒绝（服务未启动或端口不对）" + (m == null || m.isBlank() ? "" : "：" + m);
        }
        if (e instanceof java.net.UnknownHostException) {
            return "地址无法解析（域名/IP 写错？）" + (m == null || m.isBlank() ? "" : "：" + m);
        }
        if (e instanceof java.net.http.HttpTimeoutException) {
            return "请求超时（上游响应太慢，可适当调大超时）";
        }
        if (m == null || m.isBlank()) {
            return e.getClass().getSimpleName();
        }
        return abbrevate(m);
    }

    // ============================================================ Prompt 组装

    private List<Map<String, String>> buildMessages(List<ChatRequest.ChatMessage> history,
                                                    List<AiKnowledgeService.Entry> hits) {
        StringBuilder system = new StringBuilder(PERSONA);
        if (knowledgeEnabled) {
            system.append(knowledge.catalog()).append('\n');
            String ctx = knowledge.contextBlock(hits);
            if (!ctx.isBlank()) {
                system.append("\n").append(ctx).append('\n');
            }
        }
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", system.toString()));

        List<ChatRequest.ChatMessage> valid = new ArrayList<>();
        for (ChatRequest.ChatMessage m : history) {
            if (m == null) {
                continue;
            }
            String role = m.role() == null ? "" : m.role().toLowerCase(Locale.ROOT);
            if (("user".equals(role) || "assistant".equals(role))
                    && m.content() != null && !m.content().isBlank()) {
                valid.add(m);
            }
        }
        int from = Math.max(0, valid.size() - MAX_MESSAGES);
        for (int i = from; i < valid.size(); i++) {
            ChatRequest.ChatMessage m = valid.get(i);
            // 历史里的图片/长日志只留头尾，避免 prompt 膨胀
            messages.add(Map.of("role", m.role(), "content", clip(m.content())));
        }
        return messages;
    }

    private static String clip(String s) {
        String t = s.trim();
        if (t.length() <= MAX_CONTENT_CHARS) {
            return t;
        }
        int head = MAX_CONTENT_CHARS * 2 / 3;
        int tail = MAX_CONTENT_CHARS - head;
        return t.substring(0, head) + "\n…（中间内容已省略）…\n" + t.substring(t.length() - tail);
    }

    private static String lastQuestion(List<ChatRequest.ChatMessage> history) {
        for (int i = history.size() - 1; i >= 0; i--) {
            ChatRequest.ChatMessage m = history.get(i);
            if (m != null && "user".equalsIgnoreCase(String.valueOf(m.role()))) {
                return m.content();
            }
        }
        return null;
    }

    /** 供启动自检/健康接口使用：向模型要一句 pong。 */
    public String ping() {
        // 服务端自检按管理员视角走（不受「仅管理员可选」限制）
        Outcome out = chat(List.of(new ChatRequest.ChatMessage("user", "回复 pong 两个字母，不要其他内容")), null, true);
        return out.reply() + " @" + out.model();
    }
}
