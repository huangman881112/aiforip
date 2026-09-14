package com.suanfa.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * 支付配置（suanfa.payment.*）。
 *
 * <ul>
 *   <li>sandbox：沙箱模式 = 开放「模拟支付」渠道与 {@code /api/payment/mock} 调试端点，
 *       回调未配验签密钥时放行（本地开发 / 演示环境用，生产必须关）；</li>
 *   <li>orderExpireMinutes：待支付订单保留时长，超时由 {@code OrderService.expireStale()} 置为 expired；</li>
 *   <li>notifySecret：网关回调验签密钥（HMAC-SHA256）。留空时：沙箱放行并告警，生产直接拒绝回调；</li>
 *   <li>cashierBaseUrl：拼「扫码支付链接」的外部地址（演示环境为占位，前端渲染演示收款码）。</li>
 * </ul>
 */
@Component
public class PaymentProperties {

    private final boolean sandbox;
    private final int orderExpireMinutes;
    private final String notifySecret;
    private final String cashierBaseUrl;

    public PaymentProperties(
            @Value("${suanfa.payment.sandbox:true}") boolean sandbox,
            @Value("${suanfa.payment.order-expire-minutes:30}") int orderExpireMinutes,
            @Value("${suanfa.payment.notify-secret:}") String notifySecret,
            @Value("${suanfa.payment.cashier-base-url:http://localhost:5173}") String cashierBaseUrl) {
        this.sandbox = sandbox;
        this.orderExpireMinutes = Math.max(1, orderExpireMinutes);
        this.notifySecret = notifySecret == null ? "" : notifySecret.trim();
        this.cashierBaseUrl = cashierBaseUrl == null || cashierBaseUrl.isBlank()
                ? "http://localhost:5173" : cashierBaseUrl.trim();
    }

    public boolean isSandbox() {
        return sandbox;
    }

    public int getOrderExpireMinutes() {
        return orderExpireMinutes;
    }

    public String getNotifySecret() {
        return notifySecret;
    }

    public String getCashierBaseUrl() {
        return cashierBaseUrl;
    }
}
