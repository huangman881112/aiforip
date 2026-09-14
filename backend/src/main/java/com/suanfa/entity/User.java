package com.suanfa.entity;

/**
 * 用户（对应 users 表，不返回 passwordHash 给外部）。
 *
 * <ul>
 *   <li>email：绑定邮箱，可为空（注册验证码 / 改密验证码确认后绑定）</li>
 *   <li>role：{@code admin} / {@code user}（用户在「用户管理」里被管理员设定；
 *       另有一层 {@code suanfa.ai.admin-usernames} 白名单兑底，判定统一收口在 {@code AdminGuard}）</li>
 *   <li>membershipExpireAt：会员到期时间（UTC 'YYYY-MM-DD HH:MM:SS'；null = 从未开通）</li>
 *   <li>displayName / gender / age / city / occupation / learningGoal：个人中心资料
 *       （「个人中心 → 个人信息」页维护，均可为空；老库由 DataInitializer 补列）</li>
 * </ul>
 */
public record User(Long id, String username, String passwordHash, String email, String createdAt, String role,
                   String membershipExpireAt, String displayName, String gender, Integer age,
                   String city, String occupation, String learningGoal) {

    public static final String ROLE_ADMIN = "admin";
    public static final String ROLE_USER = "user";

    public boolean isAdminRole() {
        return ROLE_ADMIN.equalsIgnoreCase(String.valueOf(role));
    }
}
