package com.suanfa.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Arrays;

/**
 * 从 httpOnly cookie "token" 解析 JWT，将 userId 注入 request attribute。
 * 只解析不拦截——受保护接口在 Controller 层校验（@CurrentUserId 参数解析为 null 时 401）。
 */
@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    public static final String COOKIE_NAME = "token";
    public static final String ATTR_USER_ID = "suanfa.userId";

    private final JwtService jwtService;

    public JwtAuthFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            Arrays.stream(cookies)
                    .filter(c -> COOKIE_NAME.equals(c.getName()))
                    .findFirst()
                    .ifPresent(c -> {
                        Claims claims = jwtService.parse(c.getValue());
                        if (claims != null) {
                            request.setAttribute(ATTR_USER_ID, jwtService.userId(claims));
                        }
                    });
        }
        chain.doFilter(request, response);
    }
}
