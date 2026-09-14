package com.suanfa.controller;

import com.suanfa.dto.AuthRequest;
import com.suanfa.dto.ChangeEmailRequest;
import com.suanfa.dto.ChangePasswordRequest;
import com.suanfa.dto.EmailCodeRequest;
import com.suanfa.dto.UserResponse;
import com.suanfa.entity.User;
import com.suanfa.security.JwtAuthFilter;
import com.suanfa.security.CurrentUserId;
import com.suanfa.security.JwtService;
import com.suanfa.service.AuthService;
import com.suanfa.service.EmailCodeService;
import com.suanfa.service.Emails;
import com.suanfa.service.MailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/** 认证接口：注册 / 登录 / 登出 / 当前用户 / 邮箱验证码 + 修改密码 / 修改绑定邮箱。JWT 存 httpOnly cookie。 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final JwtService jwtService;
    private final EmailCodeService emailCodeService;
    private final MailService mailService;

    public AuthController(AuthService authService, JwtService jwtService,
                          EmailCodeService emailCodeService, MailService mailService) {
        this.authService = authService;
        this.jwtService = jwtService;
        this.emailCodeService = emailCodeService;
        this.mailService = mailService;
    }

    /** 注册验证码：按 IP 滑动窗口限流（未登录接口，防刷信）。 */
    private final IpLimiter registerCodeLimiter = new IpLimiter(5, 10 * 60 * 1000L);

    /**
     * 注册（email 选填）：填了邮箱则必须先调 POST /api/auth/register/email-code 获取验证码，
     * 并在请求里带上 code 验证邮箱真实性；用户名已存在 / 邮箱不合法或已被绑定 / 验证码不正确 → 400。
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req, HttpServletResponse response) {
        try {
            User user = authService.register(req.username(), req.password(), req.email(), req.code());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("注册失败，请稍后重试"));
            }
            setTokenCookie(response, jwtService.generate(user.id(), user.username()));
            return ResponseEntity.ok(authService.toResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 即时校验注册验证码（不消费）：前端输完 6 位后自动调用，反馈是否正确。
     * 正式注册时仍会校验并消费，预检通过后换码提交是无效的。
     */
    @PostMapping("/register/verify-code")
    public ResponseEntity<?> verifyRegisterCode(@RequestBody(required = false) EmailCodeRequest req) {
        String email;
        try {
            email = Emails.requireValid(req == null ? null : req.email());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
        if (email == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("请输入邮箱"));
        }
        try {
            emailCodeService.check(null, EmailCodeService.PURPOSE_REGISTER, email, req == null ? null : req.code());
            return ResponseEntity.ok(Map.of("verified", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 发送「注册邮箱验证码」（公开接口，未登录）：验证邮箱真实性。
     *
     * <p>前置校验：邮箱格式合法 + 未被其他账号绑定（不给已注册邮箱发码，也顺便提示用户直接登录）；
     * 再按 IP 限流（10 分钟最多 5 次）防刷信，然后才走验证码服务（服务内另有按邮箱的重发冷却）。
     * 响应里的 {@code devCode} 仅在服务器未配置 SMTP 时出现，方便本地开发跑通流程。
     */
    @PostMapping("/register/email-code")
    public ResponseEntity<?> sendRegisterEmailCode(@RequestBody(required = false) EmailCodeRequest req,
                                                   HttpServletRequest request) {
        String email;
        try {
            email = Emails.requireValid(req == null ? null : req.email());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
        if (email == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("请输入邮箱"));
        }
        if (authService.isEmailBound(email)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("该邮箱已被其他账号绑定，请直接登录"));
        }
        if (!registerCodeLimiter.tryAcquire(clientIp(request))) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new ErrorResponse("验证码发送过于频繁，请 10 分钟后再试"));
        }
        try {
            EmailCodeService.SendResult r =
                    emailCodeService.send(null, EmailCodeService.PURPOSE_REGISTER, email);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("sent", true);
            body.put("mailConfigured", r.mailSent());
            body.put("maskedEmail", r.maskedEmail());
            body.put("expiresInSeconds", r.expiresInSeconds());
            body.put("cooldownSeconds", r.cooldownSeconds());
            if (r.devCode() != null) {
                body.put("devCode", r.devCode());
            }
            return ResponseEntity.ok(body);
        } catch (MailService.MailSendException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody AuthRequest req, HttpServletResponse response) {
        User user = authService.login(req.username(), req.password());
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("用户名或密码错误"));
        }
        setTokenCookie(response, jwtService.generate(user.id(), user.username()));
        return ResponseEntity.ok(authService.toResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletResponse response) {
        clearTokenCookie(response);
        return ResponseEntity.ok().build();
    }

    /** 返回当前登录用户（无有效 token 则 401）。 */
    @GetMapping("/me")
    public ResponseEntity<?> me(@CurrentUserId Long userId) {
        User user = currentUser(userId);
        if (user == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(authService.toResponse(user));
    }

    /**
     * 发送「修改密码」邮箱验证码（需登录）。
     *
     * <p>响应里的 {@code devCode} 仅在服务器未配置 SMTP 时出现，方便本地开发跑通流程；
     * 真实发信时不外泄验证码。
     */
    @PostMapping("/email-code")
    public ResponseEntity<?> sendEmailCode(@CurrentUserId Long userId, @RequestBody EmailCodeRequest req) {
        User user = currentUser(userId);
        if (user == null) {
            return unauthorized();
        }
        try {
            EmailCodeService.SendResult r =
                    emailCodeService.send(user.id(), EmailCodeService.PURPOSE_CHANGE_PASSWORD, req.email());
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("sent", true);
            body.put("mailConfigured", r.mailSent());
            body.put("maskedEmail", r.maskedEmail());
            body.put("expiresInSeconds", r.expiresInSeconds());
            body.put("cooldownSeconds", r.cooldownSeconds());
            if (r.devCode() != null) {
                body.put("devCode", r.devCode());
            }
            return ResponseEntity.ok(body);
        } catch (MailService.MailSendException e) {
            log.warn("验证码发送失败：user={} err={}", user.username(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 修改密码（需登录 + 邮箱验证码）。
     *
     * <p>顺序很关键：先校原密码/新密码规则，再校验证码（避免无效请求白白消费掉一次性验证码），
     * 最后落库并把验证过的邮箱绑定到账号。
     */
    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@CurrentUserId Long userId, @RequestBody ChangePasswordRequest req,
                                            HttpServletResponse response) {
        User user = currentUser(userId);
        if (user == null) {
            return unauthorized();
        }
        try {
            authService.validatePasswordChange(user, req.oldPassword(), req.newPassword());
            emailCodeService.verify(user.id(), EmailCodeService.PURPOSE_CHANGE_PASSWORD,
                    req.email(), req.code());
            User updated = authService.applyPasswordChange(user.id(), req.newPassword(), req.email());
            setTokenCookie(response, jwtService.generate(updated.id(), updated.username()));
            log.info("用户 {} 修改密码成功（邮箱已验证）", user.username());
            return ResponseEntity.ok(authService.toResponse(updated));
        } catch (MailService.MailSendException e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 发送「修改绑定邮箱」验证码（需登录）：验证码发往要绑定的<strong>新</strong>邮箱。
     *
     * <p>前置校验：新邮箱格式合法 + 与当前绑定邮箱不同 + 未被其他账号占用，
     * 才下发验证码（不给别人的邮箱发码，也不允许原地换绑成同一个邮箱）。
     * 响应里的 {@code devCode} 仅在服务器未配置 SMTP 时出现（与注册 / 改密发码一致）。
     */
    @PostMapping("/email-code/change")
    public ResponseEntity<?> sendChangeEmailCode(@CurrentUserId Long userId,
                                                  @RequestBody(required = false) EmailCodeRequest req) {
        User user = currentUser(userId);
        if (user == null) {
            return unauthorized();
        }
        String email;
        try {
            email = Emails.requireValid(req == null ? null : req.email());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
        }
        if (email == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("请输入新邮箱"));
        }
        if (email.equalsIgnoreCase(user.email())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("新邮箱不能与当前绑定的邮箱相同"));
        }
        if (authService.isEmailBound(email)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("该邮箱已被其他账号绑定，请换一个"));
        }
        try {
            EmailCodeService.SendResult r =
                    emailCodeService.send(user.id(), EmailCodeService.PURPOSE_CHANGE_EMAIL, email);
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("sent", true);
            body.put("mailConfigured", r.mailSent());
            body.put("maskedEmail", r.maskedEmail());
            body.put("expiresInSeconds", r.expiresInSeconds());
            body.put("cooldownSeconds", r.cooldownSeconds());
            if (r.devCode() != null) {
                body.put("devCode", r.devCode());
            }
            return ResponseEntity.ok(body);
        } catch (MailService.MailSendException e) {
            log.warn("换绑验证码发送失败：user={} err={}", user.username(), e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(new ErrorResponse(e.getMessage()));
        }
    }

    /**
     * 修改绑定邮箱（需登录 + 当前密码 + 发往新邮箱的验证码）。
     *
     * <p>顺序与改密一致：先校当前密码（廉价校验不烧码），再验一次性验证码，最后落库换绑。
     * 验证码与「用户 + 新邮箱」双维度绑定，拿注册 / 改密场景的码无法复用。
     */
    @PutMapping("/email")
    public ResponseEntity<?> changeEmail(@CurrentUserId Long userId,
                                         @RequestBody(required = false) ChangeEmailRequest req) {
        User user = currentUser(userId);
        if (user == null) {
            return unauthorized();
        }
        authService.validateEmailChange(user, req == null ? null : req.password());
        emailCodeService.verify(user.id(), EmailCodeService.PURPOSE_CHANGE_EMAIL,
                req == null ? null : req.email(), req == null ? null : req.code());
        User updated = authService.applyEmailChange(user.id(), req == null ? null : req.email());
        log.info("用户 {} 修改邮箱成功（新邮箱已验证）", user.username());
        return ResponseEntity.ok(authService.toResponse(updated));
    }

    private User currentUser(Long userId) {
        return userId == null ? null : authService.findById(userId).orElse(null);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录"));
    }

    private void setTokenCookie(HttpServletResponse response, String token) {
        Cookie cookie = new Cookie(JwtAuthFilter.COOKIE_NAME, token);
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(7 * 24 * 60 * 60);
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);
    }

    private void clearTokenCookie(HttpServletResponse response) {
        Cookie cookie = new Cookie(JwtAuthFilter.COOKIE_NAME, "");
        cookie.setHttpOnly(true);
        cookie.setPath("/");
        cookie.setMaxAge(0);
        response.addCookie(cookie);
    }

    /** 统一错误响应体 */
    public record ErrorResponse(String message) {
    }

    /**
     * 极简按 key（IP）滑动窗口限流，用于未登录的发信接口防滥用。
     * 窗口内第 max 次起拒绝；单实例进程内存即可（本站部署形态与验证码存储一致）。
     */
    static final class IpLimiter {

        private final Map<String, Deque<Long>> hits = new ConcurrentHashMap<>();
        private final int max;
        private final long windowMillis;

        IpLimiter(int max, long windowMillis) {
            this.max = Math.max(1, max);
            this.windowMillis = windowMillis;
        }

        boolean tryAcquire(String key) {
            long now = System.currentTimeMillis();
            Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
            synchronized (q) {
                while (!q.isEmpty() && now - q.peekFirst() > windowMillis) {
                    q.pollFirst();
                }
                if (q.size() >= max) {
                    return false;
                }
                q.addLast(now);
            }
            if (hits.size() > 4096) {
                hits.entrySet().removeIf(e -> e.getValue().isEmpty());
            }
            return true;
        }
    }

    /** 取客户端 IP：优先 X-Forwarded-For 首段（反代后），否则远端地址。 */
    private static String clientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return String.valueOf(request.getRemoteAddr());
    }
}
