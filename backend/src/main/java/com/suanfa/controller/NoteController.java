package com.suanfa.controller;

import com.suanfa.dto.NoteResponse;
import com.suanfa.dto.NoteUpdateRequest;
import com.suanfa.entity.Note;
import com.suanfa.repository.AlgorithmRepository;
import com.suanfa.repository.NoteRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/** 学习笔记接口。所有操作要求认证（@CurrentUserId）。 */
@RestController
@RequestMapping("/api/users/{userId}/notes")
public class NoteController {

    private static final int MAX_CONTENT_LENGTH = 20000;

    private final NoteRepository noteRepository;
    private final AlgorithmRepository algorithmRepository;

    public NoteController(NoteRepository noteRepository, AlgorithmRepository algorithmRepository) {
        this.noteRepository = noteRepository;
        this.algorithmRepository = algorithmRepository;
    }

    /** 拉取单算法学习笔记，未写过则 404（前端回退到预置默认笔记）。 */
    @GetMapping("/{algorithmId}")
    public ResponseEntity<?> get(@PathVariable long userId, @PathVariable String algorithmId,
                                 @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        Note note = noteRepository.findByUserAndAlgorithm(userId, algorithmId).orElse(null);
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(toResponse(note));
    }

    /** 保存/更新学习笔记（仅本人可写）。 */
    @PutMapping("/{algorithmId}")
    public ResponseEntity<?> update(@PathVariable long userId, @PathVariable String algorithmId,
                                    @RequestBody NoteUpdateRequest req, @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        if (req.content() == null || req.content().length() > MAX_CONTENT_LENGTH) {
            return ResponseEntity.badRequest().body(new ErrorResponse("content 不能为空且不能超过 20000 字符"));
        }
        if (!algorithmRepository.findById(algorithmId).isPresent()) {
            return ResponseEntity.notFound().build();
        }
        Note saved = noteRepository.upsert(userId, algorithmId, req.content());
        return ResponseEntity.ok(toResponse(saved));
    }

    /** 删除学习笔记，恢复预置默认（仅本人可删）。 */
    @DeleteMapping("/{algorithmId}")
    public ResponseEntity<?> delete(@PathVariable long userId, @PathVariable String algorithmId,
                                    @CurrentUserId Long currentUserId) {
        if (currentUserId == null || currentUserId != userId) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录或无权访问"));
        }
        noteRepository.deleteByUserAndAlgorithm(userId, algorithmId);
        return ResponseEntity.noContent().build();
    }

    private NoteResponse toResponse(Note n) {
        return new NoteResponse(n.algorithmId(), n.content(), n.updatedAt());
    }

    public record ErrorResponse(String message) {
    }
}
