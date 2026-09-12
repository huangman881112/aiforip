package com.suanfa.config;

import com.suanfa.security.CurrentUserIdResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.util.Arrays;
import java.util.List;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final CurrentUserIdResolver currentUserIdResolver;
    private final List<String> allowedOrigins;

    public WebConfig(CurrentUserIdResolver currentUserIdResolver,
                     @Value("${suanfa.cors.allowed-origins}") String allowedOrigins) {
        this.currentUserIdResolver = currentUserIdResolver;
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .toList();
    }

    @Override
    public void addArgumentResolvers(List<HandlerMethodArgumentResolver> resolvers) {
        resolvers.add(currentUserIdResolver);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // 用 allowedOriginPatterns 而非 allowedOrigins：允许 "*" 与 allowCredentials(true) 共存。
        // 开发环境默认全开（前端可能以 localhost / 127.0.0.1 / 局域网 IP 访问）；
        // 生产环境通过环境变量 suanfa.cors.allowed-origins 收紧为显式域名列表。
        registry.addMapping("/api/**")
                .allowedOriginPatterns(allowedOrigins.toArray(String[]::new))
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .allowCredentials(true)
                .maxAge(3600);
    }
}
