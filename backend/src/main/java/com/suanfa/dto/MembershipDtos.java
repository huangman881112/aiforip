package com.suanfa.dto;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.List;

/**
 * 会员 / 支付 / 订单相关接口的出入参。
 *
 * <p>金额一律用「分」（long）表示，避免浮点误差；前端负责格式化为元。
 * 时间字符串（createdAt / paidAt / expiresAt / membershipExpireAt）为 UTC 'YYYY-MM-DD HH:MM:SS'。
 */
public final class MembershipDtos {

    private MembershipDtos() {
    }

    /** 解析套餐 features JSON；解析失败 / 空值返回空列表（不抛异常，展示功能容错）。 */
    public static List<String> featuresOf(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return new ObjectMapper().readValue(json, new ObjectMapper().getTypeFactory()
                    .constructCollectionType(List.class, String.class));
        } catch (Exception e) {
            return List.of();
        }
    }

    /** 套餐展示视图（features 已拆成数组；monthlyAvgCents = 按月折算价，用于卡片上的「折合」）。 */
    public record PlanView(
            String id,
            String name,
            long priceCents,
            Long originalPriceCents,
            int durationDays,
            String description,
            List<String> features,
            int sortOrder,
            boolean active,
            Long monthlyAvgCents) {
    }

    /** 套餐列表响应：plans + 后端是否为沙箱模式（前端据此展示「模拟支付」渠道）。 */
    public record PlansResponse(List<PlanView> plans, boolean sandbox) {
    }

    /** 当前用户会员状态（active = 到期时间在当前之后）。 */
    public record StatusView(boolean active, String expireAt, long daysLeft, int rateMultiplier) {
    }

    /** 下单请求：planId 必填；channel 缺省 mock（沙箱）。 */
    public record CreateOrderRequest(String planId, String channel) {
    }

    /**
     * 订单视图。payUrl 仅 pending 订单下发（拼扫码支付链接，前端据此渲染收款码）；
     * username 由后端 JOIN 带出（管理端展示用，用户自己的列表里是自己）。
     */
    public record OrderView(
            String orderNo,
            String username,
            String planId,
            String planName,
            long amountCents,
            String status,
            String payChannel,
            String tradeNo,
            String paidAt,
            String expiresAt,
            String createdAt,
            int membershipDays,
            String payUrl) {
    }

    /** 订单列表响应（用户端与管理端共用；管理端 total 为筛选后的总数）。 */
    public record OrderListResponse(long total, List<OrderView> orders) {
    }

    /** 下单响应：订单 + 后端沙箱标记 + 过期秒数（前端倒计时用）。 */
    public record CreateOrderResponse(OrderView order, boolean sandbox, long expiresInSeconds) {
    }

    /** 管理端营收统计：各状态聚合 + 最近 7 日成交曲线。 */
    public record StatsResponse(
            long revenueCents,
            long paidCount,
            long pendingCount,
            long cancelledCount,
            long expiredCount,
            long refundedCount,
            long totalOrders,
            List<DailyPoint> last7Days) {
    }

    /** 每日成交点（缺数据的天由后端补零，日期连续）。 */
    public record DailyPoint(String date, long count, long amountCents) {
    }

    /** 管理端改套餐（字段 null = 不改；features 传数组，空数组 = 清空）。 */
    public record UpdatePlanRequest(
            String name,
            Long priceCents,
            Long originalPriceCents,
            Integer durationDays,
            String description,
            List<String> features,
            Integer sortOrder,
            Boolean active) {
    }
}
