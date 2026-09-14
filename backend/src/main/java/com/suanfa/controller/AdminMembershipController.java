package com.suanfa.controller;

import com.suanfa.dto.MembershipDtos.PlanView;
import com.suanfa.dto.MembershipDtos.UpdatePlanRequest;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AdminGuard;
import com.suanfa.service.OrderService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 会员套餐管理接口（仅管理员）。
 *
 * <ul>
 *   <li>GET /api/admin/membership/plans        全部套餐（含下架）</li>
 *   <li>PUT /api/admin/membership/plans/{id}   改套餐（名称/价格/时长/文案/排序/上下架，null = 不改）</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/admin/membership/plans")
public class AdminMembershipController {

    private static final Logger log = LoggerFactory.getLogger(AdminMembershipController.class);

    private final OrderService orderService;
    private final AdminGuard adminGuard;

    public AdminMembershipController(OrderService orderService, AdminGuard adminGuard) {
        this.orderService = orderService;
        this.adminGuard = adminGuard;
    }

    @GetMapping
    public ResponseEntity<?> list(@CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(orderService.allPlans());
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable String id,
                                    @RequestBody(required = false) UpdatePlanRequest req,
                                    @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null) {
            return ResponseEntity.badRequest().body(new ErrorResponse("请求体不能为空"));
        }
        PlanView updated = orderService.updatePlan(id, req);
        return ResponseEntity.ok(updated);
    }

    private ResponseEntity<?> requireAdmin(Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能管理套餐"));
        }
        if (!adminGuard.isAdmin(userId)) {
            log.warn("非管理员（id={}）尝试访问套餐管理接口", userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("仅管理员可管理套餐"));
        }
        return null;
    }

    public record ErrorResponse(String message) {
    }
}
