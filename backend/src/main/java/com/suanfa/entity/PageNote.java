package com.suanfa.entity;

/** 页面笔记（对应 page_notes 表，一条记录 = 某用户在某个页面上的一条速记便签）。 */
public record PageNote(
        Long id,
        String pagePath,
        String menuPath,
        Long userId,
        String content,
        String creator,
        String createdAt) {
}
