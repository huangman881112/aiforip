package com.suanfa.dto;

/** 学习进度条目响应（含算法简要信息便于前端直接渲染） */
public record ProgressResponse(
        String algorithmId,
        String algorithmName,
        String category,
        String status,
        String updatedAt) {
}
