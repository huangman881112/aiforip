package com.suanfa.controller;

import com.suanfa.dto.AiSettingsDto;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AiChatService;
import com.suanfa.service.AiSettingsService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * AI 中转站配置接口（仅管理员；身份判定收口在 {@link com.suanfa.service.AdminGuard}：
 * {@code users.role='admin'} 或 {@code suanfa.ai.admin-usernames} 白名单，前者由「用户管理」页面授予）。
 *
 * <ul>
 *   <li>GET  /api/ai/settings        当前配置（页面配置 + 出厂配置 + 生效模型，token 脱敏）</li>
 *   <li>PUT  /api/ai/settings        保存页面配置并热生效（{@code {"reset":true}} 等价于清空）</li>
 *   <li>POST /api/ai/settings/reset  清空页面配置，回退 yml / 环境变量</li>
 *   <li>POST /api/ai/settings/test   测试连接：拉模型清单 + 试一次小对话（可传未保存的草稿）</li>
 * </ul>
 *
 * <p>这些接口能改上游地址与密钥，属于「能把内网请求打到第三方」的能力，因此一律要求登录且在管理员白名单内；
 * 任何响应都不会回显完整 token。
 */
@RestController
@RequestMapping("/api/ai")
public class AiSettingsController {

    private static final Logger log = LoggerFactory.getLogger(AiSettingsController.class);

    private final AiSettingsService settingsService;
    private final AiChatService aiChatService;

    public AiSettingsController(AiSettingsService settingsService, AiChatService aiChatService) {
        this.settingsService = settingsService;
        this.aiChatService = aiChatService;
    }

    @GetMapping("/settings")
    public ResponseEntity<?> settings(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(settingsService.view());
    }

    @PutMapping("/settings")
    public ResponseEntity<?> save(@RequestBody(required = false) AiSettingsDto.SaveRequest req,
                                  @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null) {
            return badRequest("请求体不能为空（{providers:[...]} 或 {reset:true}）");
        }
        if (Boolean.TRUE.equals(req.reset())) {
            return ResponseEntity.ok(settingsService.reset());
        }
        try {
            return ResponseEntity.ok(settingsService.save(req.providers()));
        } catch (IllegalArgumentException e) {
            return badRequest(e.getMessage());
        } catch (Exception e) {
            log.error("保存 AI 中转站配置失败", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new AiController.ErrorResponse("保存失败：" + e.getClass().getSimpleName()));
        }
    }

    @PostMapping("/settings/reset")
    public ResponseEntity<?> reset(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(settingsService.reset());
    }

    /**
     * 测试连接。body 各字段都可省略：
     * 省略 baseUrl → 用已生效配置里该 provider（或默认中转站）的地址；
     * 省略 apiKey → 用已存 token；省略 model → 用 /models 返回的第一个。
     */
    @PostMapping("/settings/test")
    public ResponseEntity<?> test(@RequestBody(required = false) AiSettingsDto.TestRequest req,
                                  @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        AiSettingsDto.TestRequest body = req == null ? new AiSettingsDto.TestRequest(null, null, null, null, null) : req;
        try {
            Map<String, Object> result = new LinkedHashMap<>(aiChatService.testConnection(
                    body.baseUrl(), body.apiKey(), body.model(), body.headers(), body.providerId()));
            result.put("canManage", true);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            log.error("AI 连接测试异常", e);
            return ResponseEntity.ok(Map.of(
                    "ok", false,
                    "error", "测试异常：" + e.getClass().getSimpleName() + " " + String.valueOf(e.getMessage()),
                    "steps", java.util.List.of()));
        }
    }

    // ------------------------------------------------------------ 内部工具

    /** 未登录 401；登录但非管理员 403（前端据此隐藏配置入口，路由守卫同样拦一层）。 */
    private ResponseEntity<?> requireAdmin(Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new AiController.ErrorResponse("登录后才能配置 AI 中转站"));
        }
        if (!settingsService.canManage(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new AiController.ErrorResponse("仅管理员可配置 AI 中转站"));
        }
        return null;
    }

    private static ResponseEntity<AiController.ErrorResponse> badRequest(String message) {
        return ResponseEntity.badRequest().body(new AiController.ErrorResponse(message));
    }
}
