package com.suanfa.entity;

/**
 * 用户（对应 users 表，不返回 passwordHash 给外部）。
 *
 * <ul>
 *   <li>email：绑定邮箱，可为空（改密码时用验证码确认后再绑定）</li>
 *   <li>role：{@code admin} / {@code user}（用户在「用户管理」里被管理员设定；
 *       另有一层 {@code suanfa.ai.admin-usernames} 白名单兜底，判定统一收口在 {@code AdminGuard}）</li>
 * </ul>
 */
public record User(Long id, String username, String passwordHash, String email, String createdAt, String role) {

    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_USER = "user";

    public boolean isAdminRole() {
        return ROLE_ADMIN.equalsIgnoreCase(String.valueOf(role));
    }
}
