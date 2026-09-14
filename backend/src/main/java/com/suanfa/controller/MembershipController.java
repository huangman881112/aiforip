package com.suanfa.controller;

import com.suanfa.dto.MembershipDtos.CreateOrderRequest;
import com.suanfa.dto.MembershipDtos.CreateOrderResponse;
import com.suanfa.dto.MembershipDtos.OrderListResponse;
import com.suanfa.dto.MembershipDtos.OrderView;
import com.suanfa.dto.MembershipDtos.PlansResponse;
import com.suanfa.dto.MembershipDtos.StatusView;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AdminGuard;
import com.suanfa.service.OrderService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 会员中心接口（用户端）。
 *
 * <ul>
 *   <li>GET  /api/membership/plans                套餐价格表（公开，未登录可看；含沙箱标记）</li>
 *   <li>GET  /api/membership/status               我的会员状态（激活 / 到期 / 剩余天数 / AI 提问倍数）</li>
 *   <li>POST /api/membership/orders               下单 {planId, channel?}（channel: mock/alipay/wechat）</li>
 *   <li>GET  /api/membership/orders               我的订单（最新 50 条）</li>
 *   <li>GET  /api/membership/orders/{orderNo}     订单详情（收银台轮询支付状态用）</li>
 *   <li>POST /api/membership/orders/{orderNo}/cancel 取消待支付订单</li>
 * </ul>
 *
 * <p>除 plans 外一律要求登录；订单只能看 / 操作自己的（管理员例外，判定见 {@link AdminGuard}）。
 * 参数不合法由 {@code GlobalExceptionHandler} 转 400 + {@code {message}}。
 */
@RestController
@RequestMapping("/api/membership")
public class MembershipController {

    private final OrderService orderService;
    private final AdminGuard adminGuard;

    public MembershipController(OrderService orderService, AdminGuard adminGuard) {
        this.orderService = orderService;
        this.adminGuard = adminGuard;
    }

    @GetMapping("/plans")
    public PlansResponse plans() {
        return orderService.activePlans();
    }

    @GetMapping("/status")
    public ResponseEntity<?> status(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireLogin(userId);
        return denied != null ? denied : ResponseEntity.ok(orderService.status(userId));
    }

    @PostMapping("/orders")
    public ResponseEntity<?> createOrder(@RequestBody(required = false) CreateOrderRequest req,
                                         @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireLogin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null || req.planId() == null || req.planId().isBlank()) {
            return ResponseEntity.badRequest().body(new ErrorResponse("缺少 planId（{planId, channel?}）"));
        }
        CreateOrderResponse res = orderService.createOrder(userId, req);
        return ResponseEntity.status(HttpStatus.CREATED).body(res);
    }

    @GetMapping("/orders")
    public ResponseEntity<?> myOrders(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireLogin(userId);
        return denied != null ? denied : ResponseEntity.ok(orderService.myOrders(userId));
    }

    @GetMapping("/orders/{orderNo}")
    public ResponseEntity<?> order(@PathVariable String orderNo, @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireLogin(userId);
        if (denied != null) {
            return denied;
        }
        return ResponseEntity.ok(orderService.orderOf(orderNo, userId, adminGuard.isAdmin(userId)));
    }

    @PostMapping("/orders/{orderNo}/cancel")
    public ResponseEntity<?> cancel(@PathVariable String orderNo, @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireLogin(userId);
        if (denied != null) {
            return denied;
        }
        OrderView view = orderService.cancel(orderNo, userId);
        return ResponseEntity.ok(new Message("订单已取消"));
    }

    // ------------------------------------------------------------ 内部工具

    private ResponseEntity<?> requireLogin(Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能使用会员功能"));
        }
        return null;
    }

    public record ErrorResponse(String message) {
    }

    public record Message(String message) {
    }
}
