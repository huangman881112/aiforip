package com.suanfa.dto;

/**
 * 注册 / 登录请求体。
 *
 * <p>{@code email} / {@code code} 仅注册时使用（登录不需要）：邮箱选填，但填了就必须配合
 * 「注册邮箱验证码」以验证邮箱真实性 —— code 由 POST /api/auth/register/email-code 下发，
 * 校验通过后一次性消费。不传邮箱则两个字段都忽略。
 */
public record AuthRequest(String username, String password, String email, String code) {
}
