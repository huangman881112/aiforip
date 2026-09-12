package com.suanfa.controller;

import com.suanfa.dto.TrainingResponse;
import com.suanfa.dto.TrainingUpdateRequest;
import com.suanfa.entity.Training;
import com.suanfa.repository.TrainingRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 算法训练刷题记录接口。所有操作要求认证（@CurrentUserId）。 */
@RestController
@RequestMapping("/api/users/{userId}/training")
public class TrainingController {

    private static final List<String> VALID_STATUSES = List.of("solving", "solved");

    private final TrainingRepository trainingRepository;

    public TrainingController(TrainingRepository trainingRepository) {
        this.trainingRepository = trainingRepository;
    }

    /** 拉取某用户全部刷题记录（仅本人可读）。 */
    @GetMapping
    public ResponseEntity<?> list(@PathVariable long userId, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        List<TrainingResponse> result = trainingRepository.findByUserId(userId).stream()
                .map(t -> new TrainingResponse(t.problemId(), t.status(), t.updatedAt()))
                .toList();
        return ResponseEntity.ok(result);
    }

    /** 更新单题刷题状态（仅本人可写）。 */
    @PutMapping("/{problemId}")
    public ResponseEntity<?> update(@PathVariable long userId, @PathVariable String problemId,
                                    @RequestBody TrainingUpdateRequest req, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        if (!VALID_STATUSES.contains(req.status())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("status 必须是 solving/solved 之一"));
        }
        Training saved = trainingRepository.upsert(userId, problemId, req.status());
        return ResponseEntity.ok(new TrainingResponse(saved.problemId(), saved.status(), saved.updatedAt()));
    }

    /** 清除单题刷题记录（仅本人可删）。 */
    @DeleteMapping("/{problemId}")
    public ResponseEntity<?> delete(@PathVariable long userId, @PathVariable String problemId,
                                    @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        trainingRepository.deleteByUserAndProblem(userId, problemId);
        return ResponseEntity.noContent().build();
    }

    public record ErrorResponse(String message) {
    }
}
