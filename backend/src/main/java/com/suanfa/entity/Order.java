package com.suanfa.entity;

/**
 * 订单（对应 orders 表）。planName / amountCents / membershipDays 是下单时的套餐快照，
 * 之后管理员调整套餐不影响历史订单金额与权益时长。
 *
 * <p>状态机：{@code pending → paid | cancelled | expired}，paid 之后可 → refunded（退款不回收已生效会员）。
 * pending 超过 {@code suanfa.payment.order-expire-minutes} 未支付，由 {@code OrderService.expireStale()} 置为 expired。
 */
public record Order(
        Long id,
        String orderNo,
        Long userId,
        String planId,
        String planName,
        long amountCents,
        String status,
        String payChannel,
        String tradeNo,
        String paidAt,
        String expiresAt,
        int membershipDays,
        String createdAt) {

    public static final String STATUS_PENDING = "pending";
    public static final String STATUS_PAID = "paid";
    public static final String STATUS_CANCELLED = "cancelled";
    public static final String STATUS_EXPIRED = "expired";
    public static final String STATUS_REFUNDED = "refunded";

    public boolean isPending() {
        return STATUS_PENDING.equals(status);
    }
}
