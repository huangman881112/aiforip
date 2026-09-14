package com.suanfa.dto;

/**
 * 认证成功返回的用户信息（不含密码哈希）。
 *
 * <p>{@code admin} = 是否管理员（页面角色 role=admin 或命中 {@code suanfa.ai.admin-usernames} 白名单，
 * 判定收口在 {@code AdminGuard}），前端据此展示「AI 中转站配置 / 用户管理」等管理员入口。
 *
 * <p>{@code displayName} = 个人中心设置的展示名称（未设置时回退用户名，前端顶栏展示用）。
 * {@code membershipActive} / {@code membershipExpireAt} = 会员状态（到期时间在当前之后为 true），
 * 前端据此在顶栏展示 VIP 标识；{@code membershipExpireAt} 为 UTC 时间字符串，未开通为 null。
 */
public record UserResponse(Long id, String username, String displayName, String email, String createdAt,
                           String role, boolean admin, boolean membershipActive, String membershipExpireAt) {
}
