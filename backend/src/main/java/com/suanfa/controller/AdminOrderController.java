package com.suanfa.controller;

import com.suanfa.dto.MembershipDtos.OrderListResponse;
import com.suanfa.dto.MembershipDtos.OrderView;
import com.suanfa.dto.MembershipDtos.StatsResponse;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AdminGuard;
import com.suanfa.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 订单管理接口（仅管理员）。
 *
 * <ul>
 *   <li>GET  /api/admin/orders                  列表（?keyword= 订单号/用户名，?status=，?page=&size=）</li>
 *   <li>GET  /api/admin/orders/stats            营收统计（各状态聚合 + 最近 7 日成交曲线）</li>
 *   <li>POST /api/admin/orders/{orderNo}/mark-paid 手工确认支付（线下转账对账；幂等）</li>
 *   <li>POST /api/admin/orders/{orderNo}/refund    标记退款（不回收已生效会员）</li>
 * </ul>
 *
 * <p>未登录 401、非管理员 403（判定见 {@link AdminGuard}，与「用户管理」同一套拦截方式）。
 */
@RestController
@RequestMapping("/api/admin/orders")
public class AdminOrderController {

    private static final Logger log = LoggerFactory.getLogger(AdminOrderController.class);

    private final OrderService orderService;
    private final AdminGuard adminGuard;

    public AdminOrderController(OrderService orderService, AdminGuard adminGuard) {
        this.orderService = orderService;
        this.adminGuard = adminGuard;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String keyword,
                                  @RequestParam(required = false) String status,
                                  @RequestParam(defaultValue = "1") int page,
                                  @RequestParam(defaultValue = "20") int size,
                                  @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(orderService.adminList(keyword, status, page, size));
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(orderService.stats());
    }

    @PostMapping("/{orderNo}/mark-paid")
    public ResponseEntity<?> markPaid(@PathVariable String orderNo, @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        OrderView view = orderService.markPaid(orderNo, null, null, true, userId);
        return ResponseEntity.ok(view);
    }

    @PostMapping("/{orderNo}/refund")
    public ResponseEntity<?> refund(@PathVariable String orderNo, @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        return ResponseEntity.ok(orderService.refund(orderNo, userId));
    }

    // ------------------------------------------------------------ 内部工具

    private ResponseEntity<?> requireAdmin(Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("登录后才能管理订单"));
        }
        if (!adminGuard.isAdmin(userId)) {
            log.warn("非管理员（id={}）尝试访问订单管理接口", userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("仅管理员可管理订单"));
        }
        return null;
    }

    public record ErrorResponse(String message) {
    }
}
