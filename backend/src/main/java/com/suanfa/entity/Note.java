package com.suanfa.entity;

/** 学习笔记（对应 notes 表，用户 × 算法 唯一） */
public record Note(
        Long id,
        Long userId,
        String algorithmId,
        String content,
        String updatedAt) {
}
