package com.suanfa.controller;

import com.suanfa.dto.CodeExecuteRequest;
import com.suanfa.dto.CodeExecuteResponse;
import com.suanfa.security.CurrentUserId;
import com.suanfa.service.CodeExecuteService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 算法训练·代码工作台（手动测试执行代码）。
 *
 * <ul>
 *   <li>GET  /api/code/languages  服务器当前可用的语言工具链（前端下拉框据此置灰）</li>
 *   <li>POST /api/code/execute    编译并运行一段代码（需登录 + 限流）</li>
 * </ul>
 */
@RestController
@RequestMapping("/api/code")
public class CodeExecuteController {

    private static final long WINDOW_NANOS = 60L * 1_000_000_000L;

    private final CodeExecuteService codeExecuteService;
    private final int limitPerMinute;
    private final Map<Long, Deque<Long>> hits = new ConcurrentHashMap<>();

    public CodeExecuteController(CodeExecuteService codeExecuteService,
                                 @Value("${suanfa.code.rate-per-minute:15}") int limitPerMinute) {
        this.codeExecuteService = codeExecuteService;
        this.limitPerMinute = limitPerMinute;
    }

    @GetMapping("/languages")
    public Map<String, List<String>> languages() {
        return Map.of("languages", codeExecuteService.supportedLanguages());
    }

    @PostMapping("/execute")
    public ResponseEntity<?> execute(@RequestBody CodeExecuteRequest req, @CurrentUserId Long currentUserId) {
        if (currentUserId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new TrainingController.ErrorResponse("请先登录后再使用代码测试"));
        }
        if (!tryAcquire(currentUserId)) {
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .body(new TrainingController.ErrorResponse("运行太频繁，请稍后再试（每分钟最多 " + limitPerMinute + " 次）"));
        }
        return ResponseEntity.ok(codeExecuteService.execute(req));
    }

    /** 与 AiRateLimiter 相同的滑动窗口限流，独立配额（跑代码比聊天更耗 CPU）。 */
    private boolean tryAcquire(long userId) {
        if (limitPerMinute <= 0) return true;
        long now = System.nanoTime();
        Deque<Long> q = hits.computeIfAbsent(userId, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_NANOS) {
                q.pollFirst();
            }
            if (q.size() >= limitPerMinute) return false;
            q.addLast(now);
        }
        if (hits.size() > 4096) {
            hits.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    return e.getValue().isEmpty() || now - e.getValue().peekLast() > 10 * WINDOW_NANOS;
                }
            });
        }
        return true;
    }
}
