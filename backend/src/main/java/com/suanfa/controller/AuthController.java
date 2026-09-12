package com.suanfa.controller;

import com.suanfa.dto.AuthRequest;
import com.suanfa.dto.ChangePasswordRequest;
import com.suanfa.dto.EmailCodeRequest;
import com.suanfa.dto.UserResponse;
import com.suanfa.entity.User;
import com.suanfa.security.JwtAuthFilter;
import com.suanfa.security.CurrentUserId;
import com.suanfa.security.JwtService;
import com.suanfa.service.AuthService;
import com.suanfa.service.EmailCodeService;
import com.suanfa.service.MailService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

/** 认证接口：注册 / 登录 / 登出 / 当前用户 / 邮箱验证码 + 修改密码。JWT 存 httpOnly cookie。 */
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

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody AuthRequest req, HttpServletResponse response) {
        try {
            User user = authService.register(req.username(), req.password());
            if (user == null) {
                return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(new ErrorResponse("用户名已存在"));
            }
            setTokenCookie(response, jwtService.generate(user.id(), user.username()));
            return ResponseEntity.ok(authService.toResponse(user));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(new ErrorResponse(e.getMessage()));
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
}
