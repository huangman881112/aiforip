package com.suanfa.controller;

import com.suanfa.dto.AuthRequest;
import com.suanfa.dto.UserResponse;
import com.suanfa.entity.User;
import com.suanfa.security.JwtAuthFilter;
import com.suanfa.security.JwtService;
import com.suanfa.service.AuthService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** 认证接口：注册 / 登录 / 登出 / 当前用户。JWT 存 httpOnly cookie。 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;

    public AuthController(AuthService authService, JwtService jwtService) {
        this.authService = authService;
        this.jwtService = jwtService;
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
    public ResponseEntity<?> me(@RequestAttribute(name = JwtAuthFilter.ATTR_USER_ID, required = false) Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录"));
        }
        User user = authService.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("用户不存在"));
        }
        return ResponseEntity.ok(authService.toResponse(user));
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
