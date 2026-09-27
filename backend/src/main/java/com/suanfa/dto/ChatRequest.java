package com.suanfa.dto;

import java.util.List;

/**
 * AI 助教对话请求。
 *
 * @param messages 多轮消息历史
 * @param model    可选：指定模型（模型名，或存在重名时用 {@code provider/模型名}）；留空则按服务端配置顺序自动选择
 * @param scene    可选：助手场景——{@code algorithm}（默认，算法助教）/ {@code language}（计算机语言助教）。
 *                 不同场景使用不同的人设与站内知识库；未知值一律回落 algorithm
 */
public record ChatRequest(List<ChatMessage> messages, String model, String scene) {

    public record ChatMessage(String role, String content) {
    }
}
