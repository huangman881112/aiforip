package com.suanfa.dto;

import java.util.List;
import java.util.Map;

/**
 * AI 中转站「页面配置」相关的请求/响应结构（{@code /api/ai/settings*}）。
 *
 * <p>字段与 {@link com.suanfa.config.AiProperties.Provider} / {@code AI_PROVIDERS_JSON} 保持一致（camelCase），
 * 因此 .env 里的 JSON 与页面上的表单是同一套语义，便于两边互拷排查。
 *
 * <p>安全约定：任何响应都不回显完整 api-key，只给 {@link ProviderView#apiKeyMasked()}；
 * 保存时 api-key 留空表示「沿用已存的那个」，传 {@value com.suanfa.service.AiSettingsService#CLEAR_KEY} 表示清除。
 */
public final class AiSettingsDto {

    private AiSettingsDto() {
    }

    /** 一个中转站（第三方 API 兼容端点）。 */
    public record Provider(
            String id,
            String label,
            String baseUrl,
            String apiKey,
            Boolean enabled,
            Boolean requireKey,
            Map<String, String> headers,
            Integer maxTokens,
            Integer timeoutSeconds,
            Double temperature,
            List<Model> models) {
    }

    /** 中转站下的一个模型。enabled=false 是「墓碑」：连同名 env/yml 模型一起屏蔽。 */
    /**
     * 中转站下的一个模型。enabled=false 是「墓碑」：连同名 env/yml 模型一起屏蔽；
     * userVisible=false 仅表示「不开放给普通用户」，模型仍可用、仍参与管理员请求的降级链。
     */
    public record Model(
            String name,
            String label,
            Boolean enabled,
            Boolean primary,
            Integer maxTokens,
            Integer timeoutSeconds,
            Double temperature,
            String reasoningEffort,
            String note,
            Boolean userVisible) {
    }

    /** PUT /api/ai/settings：{@code reset=true} 时清空页面配置，回到 yml / 环境变量。 */
    public record SaveRequest(List<Provider> providers, Boolean reset) {
    }

    /** POST /api/ai/settings/test：地址/token/模型都可传「未保存的草稿」，用于保存前先试。 */
    public record TestRequest(
            String providerId,
            String baseUrl,
            String apiKey,
            String model,
            Map<String, String> headers) {
    }

    /** GET /api/ai/settings 响应。 */
    public record View(
            boolean hasRuntimeOverride,
            String updatedAt,
            List<ProviderView> providers,
            Env env,
            List<EffectiveModel> effective,
            int ratePerMinute,
            boolean knowledgeEnabled) {
    }

    /** 一个中转站的展示形态（token 已脱敏）+ 来源。 */
    public record ProviderView(
            String id,
            String label,
            String baseUrl,
            String apiKeyMasked,
            boolean apiKeySet,
            boolean enabled,
            boolean requireKey,
            Map<String, String> headers,
            Integer maxTokens,
            Integer timeoutSeconds,
            Double temperature,
            List<Model> models,
            /** {@code runtime} = 页面写入 app_settings；{@code env} = yml / providers-json / 旧写法（只读）。 */
            String origin,
            boolean editable) {
    }

    /** 出厂（yml/环境变量）配置概览，只读展示。 */
    public record Env(
            String baseUrl,
            boolean hasApiKey,
            String apiKeyMasked,
            String model,
            String fallbackModels,
            boolean providersJsonConfigured,
            int timeoutSeconds,
            int maxTokens,
            double temperature,
            boolean knowledgeEnabled,
            int ratePerMinute) {
    }

    /** 当前真正生效的模型（合并后的调用顺序即降级顺序）。 */
    public record EffectiveModel(
            String token,
            String name,
            String provider,
            String providerLabel,
            String baseUrl,
            boolean primary,
            boolean fromRuntime,
            int maxTokens,
            int timeoutSeconds,
            String reasoningEffort,
            boolean usable,
            /** &gt;0 = 配置正常但短时间会被自动跳过（刚调用失败，如中转站限流 5 分钟） */
            long cooldownSeconds,
            /** false = 仅管理员可用：普通用户可见清单与降级链里都不会出现 */
            boolean userVisible) {
    }
}
