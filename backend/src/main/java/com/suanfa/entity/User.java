package com.suanfa.entity;

/** 用户（对应 users 表，不返回 passwordHash 给外部） */
public record User(Long id, String username, String passwordHash, String createdAt) {
}
