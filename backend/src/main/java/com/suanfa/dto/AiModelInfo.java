package com.suanfa.dto;

/**
 * AI 模型明细（前端顶栏展示当前默认模型、⚙️ 配置面板列模型用）。
 *
 * @param token        请求时回传的标识：一般等于 name，多个中转站有重名模型时为 {@code provider/name}
 * @param budgetNote   预算说明（max_tokens / timeout / reasoning_effort），用于排查「本地模型只剩思考没答案」
 * @param cooldownSeconds 当前熔断剩余秒数（>0 = 配置没问题但短时间会被跳过，例如中转站限流 5 分钟）
 */
public record AiModelInfo(
        String token,
        String name,
        String label,
        String provider,
        String providerLabel,
        boolean primary,
        Integer maxTokens,
        Integer timeoutSeconds,
        Double temperature,
        String reasoningEffort,
        boolean available,
        String unavailableReason,
        String note,
        long cooldownSeconds,
        /** false = 仅管理员可选（普通用户拿到的清单里不会出现这一项） */
        boolean userVisible) {
}
