package com.suanfa.dto;

/** 认证成功返回的用户信息（不含密码哈希） */
public record UserResponse(Long id, String username, String createdAt) {
}
