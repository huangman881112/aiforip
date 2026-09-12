package com.suanfa.controller;

import com.suanfa.dto.AdminUserDto;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.AdminGuard;
import com.suanfa.service.UserAdminService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 用户管理接口（仅管理员）。
 *
 * <ul>
 *   <li>GET    /api/admin/users              列表（{@code ?keyword=} 按用户名/邮箱过滤，带各账号学习数据统计）</li>
 *   <li>POST   /api/admin/users              新建用户（用户名、密码、可选邮箱、可选角色）</li>
 *   <li>PUT    /api/admin/users/{id}         编辑用户名 / 邮箱 / 角色</li>
 *   <li>PUT    /api/admin/users/{id}/password 重置密码（无需原密码与邮箱验证码）</li>
 *   <li>DELETE /api/admin/users/{id}         删除用户（连带清理进度 / 笔记 / 评论 / 刷题记录）</li>
 * </ul>
 *
 * <p>整组接口一律要求登录且为管理员（判定见 {@link AdminGuard}：users.role='admin' 或
 * {@code suanfa.ai.admin-usernames} 白名单）；未登录 401、非管理员 403。
 * 参数不合法由 {@code GlobalExceptionHandler} 统一转成 400 + {@code {message}}。
 */
@RestController
@RequestMapping("/api/admin/users")
public class UserAdminController {

    private static final Logger log = LoggerFactory.getLogger(UserAdminController.class);

    private final UserAdminService userAdminService;
    private final AdminGuard adminGuard;

    public UserAdminController(UserAdminService userAdminService, AdminGuard adminGuard) {
        this.userAdminService = userAdminService;
        this.adminGuard = adminGuard;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestParam(required = false) String keyword,
                                 @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        return denied != null ? denied : ResponseEntity.ok(userAdminService.list(keyword));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestBody(required = false) AdminUserDto.CreateRequest req,
                                    @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null) {
            return badRequest("请求体不能为空（{username, password, email?, role?}）");
        }
        return ResponseEntity.ok(userAdminService.create(req, userId));
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> update(@PathVariable long id,
                                    @RequestBody(required = false) AdminUserDto.UpdateRequest req,
                                    @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null) {
            return badRequest("请求体不能为空（{username?, email?, role?}）");
        }
        return ResponseEntity.ok(userAdminService.update(id, req, userId));
    }

    @PutMapping("/{id}/password")
    public ResponseEntity<?> resetPassword(@PathVariable long id,
                                           @RequestBody(required = false) AdminUserDto.PasswordRequest req,
                                           @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        if (req == null) {
            return badRequest("请求体不能为空（{password}）");
        }
        userAdminService.resetPassword(id, req, userId);
        return ResponseEntity.ok(new Message("密码已重置，该用户需要用新密码重新登录"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, @CurrentUserId Long userId) {
        ResponseEntity<?> denied = requireAdmin(userId);
        if (denied != null) {
            return denied;
        }
        userAdminService.delete(id, userId);
        return ResponseEntity.ok(new Message("用户已删除"));
    }

    // ------------------------------------------------------------ 内部工具

    /** 未登录 401；登录但非管理员 403（前端据此隐藏入口并拦路由）。 */
    private ResponseEntity<?> requireAdmin(Long userId) {
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("登录后才能管理用户"));
        }
        if (!adminGuard.isAdmin(userId)) {
            log.warn("非管理员（id={}）尝试访问用户管理接口", userId);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(new ErrorResponse("仅管理员可管理用户"));
        }
        return null;
    }

    private static ResponseEntity<ErrorResponse> badRequest(String message) {
        return ResponseEntity.badRequest().body(new ErrorResponse(message));
    }

    /** 统一错误响应体 */
    public record ErrorResponse(String message) {
    }

    /** 无返回体的操作类接口给前端一句可直接展示的提示。 */
    public record Message(String message) {
    }
}
