package com.suanfa.controller;

import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AdminGuard;
import com.suanfa.service.OrderService;
import com.suanfa.service.PaymentService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * 支付接口。
 *
 * <ul>
 *   <li>POST /api/payment/mock/{orderNo}   沙箱模拟支付（suanfa.payment.sandbox=true 时开放；
 *       仅订单本人或管理员可调，等价于「支付成功回调」）</li>
 *   <li>POST /api/payment/notify/{channel} 支付网关异步回调（公网开放；生产必须配置
 *       suanfa.payment.notify-secret 做 HMAC-SHA256 验签，沙箱未配密钥时放行并告警）</li>
 * </ul>
 *
 * <p>回调请求体：{@code {orderNo, amount(分), tradeNo, sign}}，
 * sign = HMAC_SHA256(secret, "orderNo|amount|channel|tradeNo")（十六进制）。
 * markPaid 幂等：重复回调返回 success，不会重复延长会员。
 */
@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    private static final Logger log = LoggerFactory.getLogger(PaymentController.class);

    private final PaymentService paymentService;
    private final OrderService orderService;
    private final AdminGuard adminGuard;

    public PaymentController(PaymentService paymentService, OrderService orderService, AdminGuard adminGuard) {
        this.paymentService = paymentService;
        this.orderService = orderService;
        this.adminGuard = adminGuard;
    }

    /** 沙箱模拟支付：跳过真实渠道，立即确认订单（本地联调 / 演示环境用）。 */
    @PostMapping("/mock/{orderNo}")
    public ResponseEntity<?> mockPay(@PathVariable String orderNo, @CurrentUserId Long userId) {
        if (!paymentService.isSandbox()) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("模拟支付仅在沙箱环境开放"));
        }
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能支付"));
        }
        // 本人或管理员才能确认支付
        boolean admin = adminGuard.isAdmin(userId);
        orderService.orderOf(orderNo, userId, admin); // 无权查看时抛 IllegalArgumentException → 400
        return ResponseEntity.ok(orderService.markPaid(orderNo, PaymentService.CHANNEL_MOCK, null, admin, userId));
    }

    /** 支付网关异步回调（验签后幂等确认订单）。 */
    @PostMapping("/notify/{channel}")
    public ResponseEntity<?> notify(@PathVariable String channel,
                                    @RequestBody(required = false) Map<String, Object> body) {
        if (body == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("回调请求体不能为空"));
        }
        String ch = PaymentService.normalizeChannel(channel);
        if (ch == null || PaymentService.CHANNEL_MOCK.equals(ch)) {
            return ResponseEntity.badRequest().body(new ErrorResponse("不支持的回调渠道"));
        }
        try {
            paymentService.verifyNotify(ch, body);
        } catch (IllegalArgumentException e) {
            log.warn("支付回调被拒绝（{}）：{}", ch, e.getMessage());
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse(e.getMessage()));
        }
        orderService.markPaid(String.valueOf(body.get("orderNo")), ch,
                body.get("tradeNo") == null ? null : String.valueOf(body.get("tradeNo")),
                false, null);
        // 网关一般只认 "success" 字样；再带上 JSON 细节方便排障
        return ResponseEntity.ok(Map.of("code", "success", "message", "已确认"));
    }

    public record ErrorResponse(String message) {
    }
}
