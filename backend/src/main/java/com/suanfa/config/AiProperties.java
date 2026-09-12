package com.suanfa.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * AI 助教上游配置（{@code suanfa.ai.*}）。
 *
 * <p>支持两类写法，可混用：
 * <ol>
 *   <li><b>单中转站（旧写法，继续兼容）</b>：{@code base-url + api-key + model + fallback-models}，
 *       备用模型支持 {@code name@maxTokens@timeoutSeconds@reasoningEffort} 短语法。</li>
 *   <li><b>多中转站（providers）</b>：每个 provider 有自己的 base-url / api-key / 请求头，
 *       其下再列模型，模型可单独设 label、预算、超时、温度、reasoning_effort。</li>
 * </ol>
 *
 * <p>典型场景：主模型走聚合中转站 A，兜底走 B（不同 token），再兜底走本机 llama.cpp
 * （第三个上游、无需 token），三者的模型名可能重名，因此 provider + model 共同定位一个上游。
 */
@Component
@ConfigurationProperties(prefix = "suanfa.ai")
public class AiProperties {

    // ---------- 单上游（旧写法） ----------
    /** OpenAI 兼容入口，如 http://192.168.1.8:8000/v1 。 */
    private String baseUrl = "";
    private String apiKey = "";
    /** 主模型名（中转站侧的路由名，不一定是厂商原名）。 */
    private String model = "";
    /** 备用模型，逗号分隔，支持 name@maxTokens@timeoutSeconds@reasoningEffort 。 */
    private String fallbackModels = "";
    private int timeoutSeconds = 90;
    private int maxTokens = 1200;
    private double temperature = 0.4;

    // ---------- 多上游（中转站列表） ----------
    private List<Provider> providers = new ArrayList<>();
    /**
     * 环境变量友好写法：providers 的 JSON 数组形式（{@code AI_PROVIDERS_JSON}）。
     * 适合写在 backend/.env 里、不改 yml 就能加中转站；与 providers 合并，本字段优先。
     */
    private String providersJson = "";

    // ---------- 其他 ----------
    private boolean knowledgeEnabled = true;
    private int ratePerMinute = 12;
    /**
     * 管理员用户名白名单（逗号分隔）：允许在页面上改中转站配置 / 测试连接，以及进入「用户管理」。
     *
     * <p>这是配置级兜底；常规方式已改为 {@code users.role = 'admin'}（由管理员在「用户管理」里授予），
     * 两重身份任一命中即为管理员，判定收口在 {@code AdminGuard}。置空则只认页面角色。
     */
    private String adminUsernames = "admin";

    public static class Provider {
        /** 唯一 ID，用于前端选择与接口寻址，如 opencode / deepseek / local。 */
        private String id;
        /** 展示名（前端顶栏里跟在模型名后面，中转站配置面板也用）。 */
        private String label;
        private String baseUrl = "";
        private String apiKey = "";
        private boolean enabled = true;
        /** 本地/自建上游常常不需要 token；置为 false 时不要求 api-key 也算「已配置」。 */
        private boolean requireKey = true;
        /** 额外请求头（部分中转站要求 X-Title / X-Provider 之类）。 */
        private Map<String, String> headers = new LinkedHashMap<>();
        /** provider 级默认预算，模型未设置时继承。 */
        private Integer timeoutSeconds;
        private Integer maxTokens;
        private Double temperature;
        private List<Model> models = new ArrayList<>();

        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = baseUrl;
        }

        public String getApiKey() {
            return apiKey;
        }

        public void setApiKey(String apiKey) {
            this.apiKey = apiKey;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isRequireKey() {
            return requireKey;
        }

        public void setRequireKey(boolean requireKey) {
            this.requireKey = requireKey;
        }

        public Map<String, String> getHeaders() {
            return headers;
        }

        public void setHeaders(Map<String, String> headers) {
            this.headers = headers;
        }

        public Integer getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(Integer timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }

        public Integer getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(Integer maxTokens) {
            this.maxTokens = maxTokens;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public List<Model> getModels() {
            return models;
        }

        public void setModels(List<Model> models) {
            this.models = models;
        }
    }

    public static class Model {
        /** 上游模型名（必填）。 */
        private String name;
        /** 前端展示名，默认取 name。 */
        private String label;
        private boolean enabled = true;
        /**
         * 是否开放给普通用户：true = 所有人的清单与降级链里都有；false = 仅管理员可用
         * （内测模型、按 token 计费的贵模型、纯排障用的上游等）。默认 true，老配置行为不变。
         */
        private boolean userVisible = true;
        /** 显式指定为默认模型（多个时取第一个）。 */
        private boolean primary;
        /** <=0 表示继承 provider / 全局。 */
        private int maxTokens;
        private int timeoutSeconds;
        /** null 表示继承。 */
        private Double temperature;
        /** minimal / low / medium / high，思考型模型用它压推理预算。 */
        private String reasoningEffort;
        /** 备注，仅用于 /api/ai/status 展示与排查。 */
        private String note;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getLabel() {
            return label;
        }

        public void setLabel(String label) {
            this.label = label;
        }

        public boolean isEnabled() {
            return enabled;
        }

        public void setEnabled(boolean enabled) {
            this.enabled = enabled;
        }

        public boolean isUserVisible() {
            return userVisible;
        }

        public void setUserVisible(boolean userVisible) {
            this.userVisible = userVisible;
        }

        public boolean isPrimary() {
            return primary;
        }

        public void setPrimary(boolean primary) {
            this.primary = primary;
        }

        public int getMaxTokens() {
            return maxTokens;
        }

        public void setMaxTokens(int maxTokens) {
            this.maxTokens = maxTokens;
        }

        public int getTimeoutSeconds() {
            return timeoutSeconds;
        }

        public void setTimeoutSeconds(int timeoutSeconds) {
            this.timeoutSeconds = timeoutSeconds;
        }

        public Double getTemperature() {
            return temperature;
        }

        public void setTemperature(Double temperature) {
            this.temperature = temperature;
        }

        public String getReasoningEffort() {
            return reasoningEffort;
        }

        public void setReasoningEffort(String reasoningEffort) {
            this.reasoningEffort = reasoningEffort;
        }

        public String getNote() {
            return note;
        }

        public void setNote(String note) {
            this.note = note;
        }
    }

    public String getBaseUrl() {
        return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public String getApiKey() {
        return apiKey;
    }

    public void setApiKey(String apiKey) {
        this.apiKey = apiKey;
    }

    public String getModel() {
        return model;
    }

    public void setModel(String model) {
        this.model = model;
    }

    public String getFallbackModels() {
        return fallbackModels;
    }

    public void setFallbackModels(String fallbackModels) {
        this.fallbackModels = fallbackModels;
    }

    public int getTimeoutSeconds() {
        return timeoutSeconds;
    }

    public void setTimeoutSeconds(int timeoutSeconds) {
        this.timeoutSeconds = timeoutSeconds;
    }

    public int getMaxTokens() {
        return maxTokens;
    }

    public void setMaxTokens(int maxTokens) {
        this.maxTokens = maxTokens;
    }

    public double getTemperature() {
        return temperature;
    }

    public void setTemperature(double temperature) {
        this.temperature = temperature;
    }

    public List<Provider> getProviders() {
        return providers;
    }

    public void setProviders(List<Provider> providers) {
        this.providers = providers;
    }

    public String getProvidersJson() {
        return providersJson;
    }

    public void setProvidersJson(String providersJson) {
        this.providersJson = providersJson;
    }

    public boolean isKnowledgeEnabled() {
        return knowledgeEnabled;
    }

    public void setKnowledgeEnabled(boolean knowledgeEnabled) {
        this.knowledgeEnabled = knowledgeEnabled;
    }

    public int getRatePerMinute() {
        return ratePerMinute;
    }

    public void setRatePerMinute(int ratePerMinute) {
        this.ratePerMinute = ratePerMinute;
    }

    public String getAdminUsernames() {
        return adminUsernames;
    }

    public void setAdminUsernames(String adminUsernames) {
        this.adminUsernames = adminUsernames;
    }
}
