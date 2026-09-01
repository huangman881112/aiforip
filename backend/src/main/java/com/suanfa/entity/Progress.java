package com.suanfa.entity;

/** 学习进度（对应 progress 表，用户 × 算法 唯一） */
public record Progress(
        Long id,
        Long userId,
        String algorithmId,
        String status,
        String updatedAt) {
}
