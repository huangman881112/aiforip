package com.suanfa.entity;

/**
 * 会员套餐（对应 membership_plans 表）。价格一律以「分」存整数，避免浮点误差；
 * features 为 JSON 数组字符串（解析收口在 {@code MembershipDtos.featuresOf}）。
 */
public record MembershipPlan(
        String id,
        String name,
        long priceCents,
        Long originalPriceCents,
        int durationDays,
        String description,
        String featuresJson,
        int sortOrder,
        boolean active) {
}
