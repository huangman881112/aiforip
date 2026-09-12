package com.suanfa.dto;

/** 评论响应（含用户名便于前端直接渲染） */
public record CommentResponse(
        Long id,
        String algorithmId,
        Long userId,
        String username,
        String content,
        String createdAt) {
}
