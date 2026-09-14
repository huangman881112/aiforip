package com.suanfa.dto;

/**
 * 修改绑定邮箱请求。
 *
 * <p>email + code 为发往<strong>新邮箱</strong>的验证码二次校验（验证码须先通过
 * {@code POST /api/auth/email-code/change} 获取），password 为当前登录密码
 * —— 防「已登录会话被利用后静默换绑邮箱」。两项都通过后新邮箱才会绑定到账号。
 */
public record ChangeEmailRequest(String email, String code, String password) {
}
