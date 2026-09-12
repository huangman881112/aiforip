package com.suanfa.dto;

/** AI 助教对话响应：正文 + 实际使用的模型 + 引用到的站内算法。 */
public record ChatResponse(String reply, String model, java.util.List<ChatRef> refs) {

    public ChatResponse(String reply) {
        this(reply, null, java.util.List.of());
    }
}
