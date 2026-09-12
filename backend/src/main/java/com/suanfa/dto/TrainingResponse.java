package com.suanfa.dto;

/** 训练刷题记录响应 */
public record TrainingResponse(
        String problemId,
        String status,
        String updatedAt) {
}
