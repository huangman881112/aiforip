package com.suanfa.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 极简滑动窗口限流（按用户 ID）。
 * AI 助教单次请求会消耗上游额度，需要挡住脚本刷接口 / 多标签页连点。
 */
@Component
public class AiRateLimiter {

    private static final long WINDOW_NANOS = 60L * 1_000_000_000L;

    private final Map<Long, Deque<Long>> hits = new ConcurrentHashMap<>();
    private final int limitPerMinute;

    public AiRateLimiter(@Value("${suanfa.ai.rate-per-minute:12}") int limitPerMinute) {
        this.limitPerMinute = limitPerMinute;
    }

    /** 允许返回 true；否则 false 并给出建议等待秒数。 */
    public boolean tryAcquire(Long userId) {
        if (limitPerMinute <= 0) {
            return true; // 关闭限流
        }
        long key = userId == null ? -1L : userId;
        long now = System.nanoTime();
        Deque<Long> q = hits.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (q) {
            while (!q.isEmpty() && now - q.peekFirst() > WINDOW_NANOS) {
                q.pollFirst();
            }
            if (q.size() >= limitPerMinute) {
                return false;
            }
            q.addLast(now);
        }
        // 顺手回收长期不活跃的窗口，避免 map 无界增长
        if (hits.size() > 4096) {
            hits.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    return e.getValue().isEmpty() || now - e.getValue().peekLast() > 10 * WINDOW_NANOS;
                }
            });
        }
        return true;
    }

    /**
     * 退一次额度：本次请求完全没拿到结果（上游全挂 / 参数错误 / 并发满）时，不应让用户买单。
     * 已吐字后被中断（客户端断开）不退——服务已经消费了一段上游额度。
     */
    public void refund(Long userId) {
        if (limitPerMinute <= 0 || userId == null) {
            return;
        }
        Deque<Long> q = hits.get(userId);
        if (q == null) {
            return;
        }
        synchronized (q) {
            if (!q.isEmpty()) {
                q.pollLast(); // 弹出最近一次计数（即本次请求）
            }
        }
    }

    public int limit() {
        return limitPerMinute;
    }
}
