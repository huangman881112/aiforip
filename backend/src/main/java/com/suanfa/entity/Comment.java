package com.suanfa.entity;

/** 算法评论（对应 comments 表，一条记录 = 一条评论） */
public record Comment(
        Long id,
        Long userId,
        String algorithmId,
        String content,
        String createdAt) {
}
