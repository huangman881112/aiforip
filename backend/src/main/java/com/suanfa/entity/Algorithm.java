package com.suanfa.entity;

/** 算法元数据（对应 algorithms 表） */
public record Algorithm(
        String id,
        String name,
        String category,
        String subCategory,
        String difficulty,
        String stability,
        String description,
        String complexity,
        String route,
        String complexityDetails) {
}
