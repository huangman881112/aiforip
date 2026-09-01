package com.suanfa.controller;

import com.suanfa.dto.ProgressResponse;
import com.suanfa.dto.ProgressUpdateRequest;
import com.suanfa.entity.Algorithm;
import com.suanfa.entity.Progress;
import com.suanfa.repository.AlgorithmRepository;
import com.suanfa.repository.ProgressRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** 学习进度接口。所有操作要求认证（@CurrentUserId）。 */
@RestController
@RequestMapping("/api/users/{userId}/progress")
public class ProgressController {

    private static final List<String> VALID_STATUSES = List.of("learning", "learned", "favorited");

    private final ProgressRepository progressRepository;
    private final AlgorithmRepository algorithmRepository;

    public ProgressController(ProgressRepository progressRepository, AlgorithmRepository algorithmRepository) {
        this.progressRepository = progressRepository;
        this.algorithmRepository = algorithmRepository;
    }

    /** 拉取某用户全部学习进度（仅本人可读）。 */
    @GetMapping
    public ResponseEntity<?> list(@PathVariable long userId, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        List<ProgressResponse> result = progressRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .toList();
        return ResponseEntity.ok(result);
    }

    /** 更新单算法学习状态（仅本人可写）。 */
    @PutMapping("/{algorithmId}")
    public ResponseEntity<?> update(@PathVariable long userId, @PathVariable String algorithmId,
                                    @RequestBody ProgressUpdateRequest req, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        if (!VALID_STATUSES.contains(req.status())) {
            return ResponseEntity.badRequest().body(new ErrorResponse("status 必须是 learning/learned/favorited 之一"));
        }
        Algorithm algorithm = algorithmRepository.findById(algorithmId).orElse(null);
        if (algorithm == null) {
            return ResponseEntity.notFound().build();
        }
        Progress saved = progressRepository.upsert(userId, algorithmId, req.status());
        return ResponseEntity.ok(toResponse(saved));
    }

    private ProgressResponse toResponse(Progress p) {
        Algorithm a = algorithmRepository.findById(p.algorithmId()).orElse(null);
        return new ProgressResponse(
                p.algorithmId(),
                a != null ? a.name() : p.algorithmId(),
                a != null ? a.category() : null,
                p.status(),
                p.updatedAt());
    }

    public record ErrorResponse(String message) {
    }
}
