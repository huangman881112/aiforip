package com.suanfa.dto;

import java.util.List;

/**
 * AI 助教对话请求。
 *
 * @param messages 多轮消息历史
 * @param model    可选：指定模型（模型名，或存在重名时用 {@code provider/模型名}）；留空则按服务端配置顺序自动选择
 */
public record ChatRequest(List<ChatMessage> messages, String model) {

    public record ChatMessage(String role, String content) {
    }
}
