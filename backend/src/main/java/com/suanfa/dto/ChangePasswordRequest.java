package com.suanfa.dto;

/**
 * 修改密码请求。
 *
 * <p>email + code 为邮箱验证码二次校验（验证码须先通过 {@code POST /api/auth/email-code} 获取），
 * oldPassword 防「已登录会话被利用后静默改密」，改密成功后 email 会被绑定到该账号。
 */
public record ChangePasswordRequest(String email, String code, String oldPassword, String newPassword) {
}
