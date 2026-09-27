package com.suanfa.controller;

import com.suanfa.dto.PageNoteRequest;
import com.suanfa.dto.PageNoteResponse;
import com.suanfa.entity.PageNote;
import com.suanfa.repository.PageNoteRepository;
import com.suanfa.repository.UserRepository;
import com.suanfa.security.CurrentUserId;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 页面笔记接口：全站任意页面（按路由路径标识）都可以添加速记便签。
 * 笔记按用户归属、仅本人可见；所有操作要求认证（@CurrentUserId）。
 */
@RestController
@RequestMapping("/api/page-notes")
public class PageNoteController {

    private static final int MAX_CONTENT_LENGTH = 20000;
    private static final int MAX_PATH_LENGTH = 200;

    private final PageNoteRepository pageNoteRepository;
    private final UserRepository userRepository;

    public PageNoteController(PageNoteRepository pageNoteRepository, UserRepository userRepository) {
        this.pageNoteRepository = pageNoteRepository;
        this.userRepository = userRepository;
    }

    /** 我在当前页面的笔记列表（时间正序）。 */
    @GetMapping
    public ResponseEntity<?> list(@RequestParam String path, @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能查看页面笔记"));
        }
        String pagePath = requirePath(path);
        List<PageNote> notes = pageNoteRepository.findByUserAndPath(currentUserId, pagePath);
        return ResponseEntity.ok(notes.stream().map(this::toResponse).toList());
    }

    /** 在当前页面新增一条笔记（创建人 = 当前用户名快照）。 */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody PageNoteRequest req, @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("登录后才能添加页面笔记"));
        }
        if (req.content() == null || req.content().isBlank() || req.content().length() > MAX_CONTENT_LENGTH) {
            return ResponseEntity.badRequest().body(new ErrorResponse("笔记内容不能为空且不能超过 20000 字符"));
        }
        String pagePath = requirePath(req.path());
        String menuPath = trimTo(req.menuPath(), MAX_PATH_LENGTH);
        String creator = userRepository.findById(currentUserId)
                .map(u -> u.displayName() != null && !u.displayName().isBlank() ? u.displayName() : u.username())
                .orElseThrow(() -> new IllegalStateException("用户不存在: " + currentUserId));
        PageNote saved = pageNoteRepository.insert(currentUserId, pagePath, menuPath,
                req.content().trim(), creator);
        return ResponseEntity.status(HttpStatus.CREATED).body(toResponse(saved));
    }

    /** 删除自己的一条页面笔记。 */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable long id, @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(new ErrorResponse("未登录"));
        }
        PageNote note = pageNoteRepository.findById(id).orElse(null);
        if (note == null) {
            return ResponseEntity.notFound().build();
        }
        if (!note.userId().equals(currentUserId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ErrorResponse("只能删除自己的笔记"));
        }
        pageNoteRepository.deleteByIdAndUser(id, currentUserId);
        return ResponseEntity.noContent().build();
    }

    private String requirePath(String path) {
        if (path == null || path.isBlank() || path.length() > MAX_PATH_LENGTH) {
            // IllegalArgumentException 由 GlobalExceptionHandler 统一包成 400 + 中文提示
            throw new IllegalArgumentException("页面路径不能为空且不能超过 " + MAX_PATH_LENGTH + " 字符");
        }
        return path.trim();
    }

    private String trimTo(String s, int max) {
        if (s == null) return null;
        String t = s.trim();
        return t.length() > max ? t.substring(0, max) : t;
    }

    private PageNoteResponse toResponse(PageNote n) {
        return new PageNoteResponse(n.id(), n.pagePath(), n.menuPath(), n.userId(),
                n.content(), n.creator(), n.createdAt());
    }

    public record ErrorResponse(String message) {
    }
}
