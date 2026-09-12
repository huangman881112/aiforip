package com.suanfa.dto;

/** 学习笔记条目响应 */
public record NoteResponse(
        String algorithmId,
        String content,
        String updatedAt) {
}
