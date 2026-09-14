package com.suanfa.dto;

/**
 * 申请 / 校验邮箱验证码。
 *
 * <ul>
 *   <li>POST /api/auth/register/email-code：只用 {@code email}（发码）</li>
 *   <li>POST /api/auth/register/verify-code：{@code email} + {@code code}（不消费预检）</li>
 * </ul>
 */
public record EmailCodeRequest(String email, String code) {
}
