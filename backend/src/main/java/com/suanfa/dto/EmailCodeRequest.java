package com.suanfa.dto;

/** 申请邮箱验证码（当前用于修改密码），收件人固定为当前登录用户。 */
public record EmailCodeRequest(String email) {
}
