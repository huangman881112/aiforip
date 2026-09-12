package com.suanfa.dto;

/** 学习日历活跃日条目（date = YYYY-MM-DD，count = 当日学习行为数） */
public record ActivityResponse(String date, Integer count) {
}
