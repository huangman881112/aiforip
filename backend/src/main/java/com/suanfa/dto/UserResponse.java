package com.suanfa.dto;

/**
 * 认证成功返回的用户信息（不含密码哈希）。
 *
 * <p>{@code admin} = 是否管理员（页面角色 role=admin 或命中 {@code suanfa.ai.admin-usernames} 白名单，
 * 判定收口在 {@code AdminGuard}），前端据此展示「AI 中转站配置 / 用户管理」等管理员入口。
 */
public record UserResponse(Long id, String username, String email, String createdAt, String role, boolean admin) {
}
