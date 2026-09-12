package com.suanfa.controller;

import com.suanfa.dto.CommentRequest;
import com.suanfa.dto.CommentResponse;
import com.suanfa.entity.Comment;
import com.suanfa.repository.AlgorithmRepository;
import com.suanfa.repository.CommentRepository;
import com.suanfa.repository.UserRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/** 算法评论接口：列表公开可读；发表/删除要求认证（@CurrentUserId）。 */
@RestController
public class CommentController {

    private static final int MAX_CONTENT_LENGTH = 2000;

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final AlgorithmRepository algorithmRepository;

    public CommentController(CommentRepository commentRepository, UserRepository userRepository,
                             AlgorithmRepository algorithmRepository) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.algorithmRepository = algorithmRepository;
    }

    /** 拉取某算法全部评论（公开，时间正序）。 */
    @GetMapping("/api/algorithms/{algorithmId}/comments")
    public ResponseEntity<?> list(@PathVariable String algorithmId) {
        List<Comment> comments = commentRepository.findByAlgorithm(algorithmId);
        Map<Long, String> names = resolveUserNames(comments);
        return ResponseEntity.ok(comments.stream().map(c -> toResponse(c, names)).toList());
    }

    /** 发表评论（需登录）。 */
    @PostMapping("/api/algorithms/{algorithmId}/comments")
    public ResponseEntity<?> post(@PathVariable String algorithmId, @RequestBody CommentRequest req,
                                  @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能发表评论"));
        }
        if (req.content() == null || req.content().isBlank() || req.content().length() > MAX_CONTENT_LENGTH) {
            return ResponseEntity.badRequest().body(new ErrorResponse("评论内容不能为空且不能超过 2000 字符"));
        }
        if (algorithmRepository.findById(algorithmId).isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Comment saved = commentRepository.insert(currentUserId, algorithmId, req.content().trim());
        String username = userRepository.findById(currentUserId).map(u -> u.username()).orElse("?");
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(toResponse(saved, Map.of(currentUserId, username)));
    }

    /** 删除自己的评论（仅本人可删）。 */
    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录"));
        }
        Comment comment = commentRepository.findById(id).orElse(null);
        if (comment == null) {
            return ResponseEntity.notFound().build();
        }
        if (!comment.userId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("只能删除自己的评论"));
        }
        commentRepository.deleteByIdAndUser(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    private Map<Long, String> resolveUserNames(List<Comment> comments) {
        Map<Long, String> names = new HashMap<>();
        for (Comment c : comments) {
            names.computeIfAbsent(c.userId(),
                    uid -> userRepository.findById(uid).map(u -> u.username()).orElse("已注销用户"));
        }
        return names;
    }

    private CommentResponse toResponse(Comment c, Map<Long, String> names) {
        return new CommentResponse(c.id(), c.algorithmId(), c.userId(), names.get(c.userId()),
                c.content(), c.createdAt());
    }

    public record ErrorResponse(String message) {
    }
}
