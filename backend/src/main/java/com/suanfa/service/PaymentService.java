package com.suanfa.service;

import com.suanfa.config.PaymentProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;
import java.util.Map;
import java.util.Set;

/**
 * 支付渠道层：拼扫码支付链接、回调验签（HMAC-SHA256）。
 *
 * <p>当前为「演示 / 沙箱」实现：没有接入真实微信 / 支付宝网关，payUrl 是占位收银台链接
 * （前端据此渲染演示收款码），真实支付在 {@code OrderService} 里由 mock 渠道或管理员手工确认。
 * 接入真实网关时只需替换 {@link #payUrl} 与 {@link #verifyNotify} 两个方法。
 */
@Service
public class PaymentService {

    private static final Logger log = LoggerFactory.getLogger(PaymentService.class);

    public static final String CHANNEL_MOCK = "mock";
    public static final String CHANNEL_ALIPAY = "alipay";
    public static final String CHANNEL_WECHAT = "wechat";

    public static final Set<String> CHANNELS = Set.of(CHANNEL_MOCK, CHANNEL_ALIPAY, CHANNEL_WECHAT);

    private final PaymentProperties props;

    public PaymentService(PaymentProperties props) {
        this.props = props;
    }

    public boolean isSandbox() {
        return props.isSandbox();
    }

    public int orderExpireMinutes() {
        return props.getOrderExpireMinutes();
    }

    /** 渠道是否合法（不合法返回 mock，下单入口已先行校验，这里兜底）。 */
    public static String normalizeChannel(String channel) {
        String c = channel == null || channel.isBlank() ? CHANNEL_MOCK : channel.trim().toLowerCase();
        return CHANNELS.contains(c) ? c : null;
    }

    /**
     * 拼「扫码支付」链接（pending 订单随 OrderView 下发，前端据此渲染收款码）。
     * 演示环境为占位收银台链接；接真实网关后替换为预下单返回的 code_url / qr_code。
     */
    public String payUrl(String orderNo, String channel, long amountCents) {
        return props.getCashierBaseUrl() + "/pay/" + channel + "/" + orderNo
                + "?amount=" + amountCents + "&sign=" + hmacShort(orderNo);
    }

    /**
     * 校验网关回调签名：期望 {@code HMAC_SHA256(secret, orderNo|amountCents|channel|tradeNo)}。
     *
     * <p>密钥未配置时：沙箱放行（记 warn，方便本地联调），生产抛异常拒绝。
     *
     * @throws IllegalArgumentException 订单号缺失 / 验签失败 / 生产未配密钥
     */
    public void verifyNotify(String channel, Map<String, Object> body) {
        String orderNo = str(body.get("orderNo"));
        if (orderNo == null || orderNo.isBlank()) {
            throw new IllegalArgumentException("回调缺少 orderNo");
        }
        String secret = props.getNotifySecret();
        if (secret.isEmpty()) {
            if (props.isSandbox()) {
                log.warn("支付回调未配置验签密钥（suanfa.payment.notify-secret），沙箱模式下放行：orderNo={}", orderNo);
                return;
            }
            throw new IllegalArgumentException("支付回调验签密钥未配置（suanfa.payment.notify-secret），已拒绝回调");
        }
        String expected = hmac(orderNo + "|" + str(body.get("amount")) + "|" + channel + "|" + str(body.get("tradeNo")));
        String got = str(body.get("sign"));
        if (!constantTimeEquals(expected, got)) {
            throw new IllegalArgumentException("支付回调验签失败");
        }
    }

    // ------------------------------------------------------------ 内部工具

    private String hmac(String data) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(props.getNotifySecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return HexFormat.of().formatHex(mac.doFinal(data.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("计算 HMAC 失败", e);
        }
    }

    /** URL 上使用的短签名（演示用；真实网关不存在这个环节）。 */
    private String hmacShort(String data) {
        String full = props.getNotifySecret().isEmpty() ? data : hmac(data);
        return full.length() > 16 ? full.substring(0, 16) : full;
    }

    private static boolean constantTimeEquals(String a, String b) {
        return java.security.MessageDigest.isEqual(
                String.valueOf(a).getBytes(StandardCharsets.UTF_8),
                String.valueOf(b).getBytes(StandardCharsets.UTF_8));
    }

    private static String str(Object o) {
        return o == null ? null : String.valueOf(o);
    }
}
