package com.suanfa.entity;

/** 算法训练刷题记录（对应 training 表，用户 × 题目 唯一） */
public record Training(
        Long id,
        Long userId,
        String problemId,
        String status,
        String updatedAt) {
}
