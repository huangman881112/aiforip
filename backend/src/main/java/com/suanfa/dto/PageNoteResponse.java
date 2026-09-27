package com.suanfa.dto;

/** 页面笔记条目响应。 */
public record PageNoteResponse(
        Long id,
        String pagePath,
        String menuPath,
        Long userId,
        String content,
        String creator,
        String createdAt) {
}
