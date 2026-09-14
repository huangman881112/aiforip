package com.suanfa.controller;

import com.suanfa.dto.ProfileDtos.ProfileResponse;
import com.suanfa.dto.ProfileDtos.ProfileUpdateRequest;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.ProfileService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * 个人中心接口（当前登录用户）。
 *
 * <ul>
 *   <li>GET /api/profile  读取当前用户资料（含账号上下文与会员状态）</li>
 *   <li>PUT /api/profile  更新资料（名称 / 性别 / 年龄 / 城市 / 职业 / 学习目的，PUT 全量语义）</li>
 * </ul>
 *
 * <p>未登录 401；用户名 / 邮箱 / 密码 / 角色不在本接口范围（分别走认证与用户管理）。
 * 参数不合法由 {@code GlobalExceptionHandler} 转 400 + 提示文案。
 */
@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping
    public ResponseEntity<?> get(@CurrentUserId Long userId) {
        if (userId == null) {
            return unauthorized();
        }
        return ResponseEntity.ok(profileService.get(userId));
    }

    @PutMapping
    public ResponseEntity<?> update(@RequestBody(required = false) ProfileUpdateRequest req,
                                    @CurrentUserId Long userId) {
        if (userId == null) {
            return unauthorized();
        }
        if (req == null) {
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("请求体不能为空（{displayName?, gender?, age?, city?, occupation?, learningGoal?}）"));
        }
        ProfileResponse res = profileService.update(userId, req);
        return ResponseEntity.ok(res);
    }

    private ResponseEntity<?> unauthorized() {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能使用个人中心"));
    }

    public record ErrorResponse(String message) {
    }
}
