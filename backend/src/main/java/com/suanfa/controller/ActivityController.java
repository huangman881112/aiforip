package com.suanfa.controller;

import com.suanfa.dto.ActivityResponse;
import com.suanfa.repository.ActivityRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

/** 学习日历：用户学习活跃日（由 progress/notes/comments/training 时间戳派生）。 */
@RestController
@RequestMapping("/api/users/{userId}/activity")
public class ActivityController {

    private final ActivityRepository activityRepository;

    public ActivityController(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    /** 拉取某用户全部活跃日（仅本人可读）。 */
    @GetMapping
    public ResponseEntity<?> list(@PathVariable long userId, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ErrorResponse("未登录或无权访问"));
        }
        List<ActivityResponse> result = activityRepository.findActivityByUserId(userId).stream()
                .map(row -> new ActivityResponse(
                        (String) row.get("date"),
                        ((Number) row.get("count")).intValue()))
                .toList();
        return ResponseEntity.ok(result);
    }

    public record ErrorResponse(String message) {
    }
}
