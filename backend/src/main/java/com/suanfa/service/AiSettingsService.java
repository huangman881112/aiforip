package com.suanfa.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.suanfa.config.AiProperties;
import com.suanfa.dto.AiSettingsDto;
import com.suanfa.repository.AppSettingsRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * AI 中转站配置服务：让「第三方 API 中转站（地址 / token / 模型）」可以在页面上配置并立即生效。
 *
 * <p>存储：{@code app_settings} 表，key = {@value #SETTINGS_KEY}，value = providers 的 JSON 数组
 * （与 {@code AI_PROVIDERS_JSON} 同构）。保存后调用 {@link AiChatService#reload(List)} 热重建模型清单，
 * 不重启、不影响正在进行的对话。
 *
 * <p>与 yml / 环境变量的关系是「叠加而非替换」：页面配置排在调用链最前面，.env 里的兜底上游仍然有效；
 * 要停掉某个 env 模型，在页面上加一条同名模型并把 enabled 关掉（墓碑），或在页面配置里同名禁用。
 *
 * <p>门禁：本站没有角色体系，用 {@code suanfa.ai.admin-usernames} 白名单用户名（默认 admin）控制谁能改配置。
 */
@Service
public class AiSettingsService {

    private static final Logger log = LoggerFactory.getLogger(AiSettingsService.class);

    /** app_settings 中存放 AI providers 配置的 key。 */
    public static final String SETTINGS_KEY = "ai.providers";

    /** 保存时 api-key 传这个字面量表示「清除已存 token」（前端「清除」按钮用）。 */
    public static final String CLEAR_KEY = "__CLEAR__";

    private static final int MAX_PROVIDERS = 8;
    private static final int MAX_MODELS_PER_PROVIDER = 30;
    private static final int MAX_HEADERS = 8;

    private final AppSettingsRepository settings;
    private final AiChatService aiChatService;
    private final AiProperties props;
    private final AdminGuard adminGuard;
    private final ObjectMapper mapper;

    /** 页面已保存的配置（含真实 token），仅在 load/save/reset 时整体替换。 */
    private volatile List<AiProperties.Provider> runtimeProviders = List.of();
    private volatile String updatedAt;

    public AiSettingsService(AppSettingsRepository settings, AiChatService aiChatService, AiProperties props,
                            AdminGuard adminGuard, ObjectMapper mapper) {
        this.settings = settings;
        this.aiChatService = aiChatService;
        this.props = props;
        this.adminGuard = adminGuard;
        this.mapper = mapper;
    }

    /** 表由 schema.sql 建好，故在应用就绪后再加载（比 @PostConstruct 更安全）。 */
    @EventListener(ApplicationReadyEvent.class)
    public void applySavedOnStartup() {
        try {
            applySaved();
        } catch (Exception e) {
            log.error("加载页面保存的 AI 中转站配置失败，继续使用 yml/环境变量配置：{}", e.getMessage());
        }
    }

    // ============================================================ 查询

    /** 是否管理员（可改 AI 配置）。白名单逻辑统一收口在 {@link AdminGuard}。 */
    public boolean canManage(Long userId) {
        return adminGuard.isAdmin(userId);
    }

    /** GET /api/ai/settings：页面配置（脱敏）+ 出厂配置 + 当前生效模型。 */
    public AiSettingsDto.View view() {
        List<AiSettingsDto.ProviderView> providers = new ArrayList<>();
        Set<String> runtimeIds = new LinkedHashSet<>();
        for (AiProperties.Provider p : runtimeProviders) {
            providers.add(toView(p, "runtime", true));
            runtimeIds.add(idOf(p));
        }
        for (AiProperties.Provider p : aiChatService.envProviderConfigs()) {
            // 同名 provider 已被页面配置覆盖，只标注一次，避免前端出现两条 relay-a
            if (runtimeIds.contains(idOf(p))) {
                continue;
            }
            providers.add(toView(p, "env", false));
        }
        // 旧写法（AI_BASE_URL / AI_MODEL / AI_FALLBACK_MODELS）没有 provider 结构，单独一条只读项展示
        AiSettingsDto.ProviderView legacy = legacyView();
        if (legacy != null && !runtimeIds.contains(legacy.id())) {
            providers.add(legacy);
        }

        return new AiSettingsDto.View(
                !runtimeProviders.isEmpty(),
                updatedAt,
                providers,
                new AiSettingsDto.Env(
                        props.getBaseUrl(),
                        !blank(props.getApiKey()),
                        mask(props.getApiKey()),
                        props.getModel(),
                        props.getFallbackModels(),
                        !blank(props.getProvidersJson()),
                        props.getTimeoutSeconds(),
                        props.getMaxTokens(),
                        props.getTemperature(),
                        props.isKnowledgeEnabled(),
                        props.getRatePerMinute()),
                effective(),
                props.getRatePerMinute(),
                props.isKnowledgeEnabled());
    }

    /** 当前生效模型（含降级顺序），给设置页的「当前生效」表格用。 */
    public List<AiSettingsDto.EffectiveModel> effective() {
        List<AiSettingsDto.EffectiveModel> out = new ArrayList<>();
        for (AiChatService.ModelSpec m : aiChatService.models()) {
            out.add(new AiSettingsDto.EffectiveModel(
                    aiChatService.tokenFor(m), m.name(), m.providerId(), m.providerLabel(), m.baseUrl(),
                    m.primary(), m.fromRuntime(),
                    m.maxTokens() > 0 ? m.maxTokens() : props.getMaxTokens(),
                    m.timeoutSeconds() > 0 ? m.timeoutSeconds() : props.getTimeoutSeconds(),
                    m.reasoningEffort(),
                    !blank(m.baseUrl()) && (!m.requireKey() || !blank(m.apiKey())),
                    aiChatService.cooldownSecondsLeft(m),
                    m.userVisible()));
        }
        return out;
    }

    // ============================================================ 写入

    /**
     * 保存页面配置并热生效。
     *
     * @return 保存后的视图
     */
    public synchronized AiSettingsDto.View save(List<AiSettingsDto.Provider> providers) {
        List<AiProperties.Provider> normalized = validate(providers);
        keepExistingKeys(normalized);
        try {
            settings.put(SETTINGS_KEY, mapper.writeValueAsString(normalized));
        } catch (Exception e) {
            throw new IllegalArgumentException("配置序列化失败：" + e.getMessage());
        }
        applySaved();
        log.info("AI 中转站页面配置已更新（{} 个 provider），已热加载", normalized.size());
        return view();
    }

    /** 清空页面配置，回到 yml / 环境变量。 */
    public synchronized AiSettingsDto.View reset() {
        settings.delete(SETTINGS_KEY);
        applySaved();
        log.info("AI 中转站页面配置已清空，回退到 yml/环境变量配置");
        return view();
    }

    /** 重新从 app_settings 读一次并热加载（保存/重置/启动都走这里，保证内存与表一致）。 */
    private void applySaved() {
        Optional<String> raw = settings.get(SETTINGS_KEY);
        if (raw.isEmpty()) {
            runtimeProviders = List.of();
            updatedAt = null;
            aiChatService.reload(List.of());
            return;
        }
        runtimeProviders = parseStored(raw.get());
        updatedAt = settings.updatedAt(SETTINGS_KEY).orElse(null);
        aiChatService.reload(runtimeProviders);
    }

    private List<AiProperties.Provider> parseStored(String json) {
        try {
            return AiChatService.parseProvidersJson(mapper, json);
        } catch (Exception e) {
            log.error("app_settings[{}] 解析失败，已忽略页面配置：{}", SETTINGS_KEY, e.getMessage());
            return List.of();
        }
    }

    // ============================================================ 校验 / 归一化

    /** 校验并补默认值；不合法直接抛 IllegalArgumentException（全局异常处理器会转成 400）。 */
    private List<AiProperties.Provider> validate(List<AiSettingsDto.Provider> in) {
        List<AiProperties.Provider> out = new ArrayList<>();
        if (in == null || in.isEmpty()) {
            return out; // 空列表 = 删除页面配置（reset 语义），保留 env 配置
        }
        if (in.size() > MAX_PROVIDERS) {
            throw new IllegalArgumentException("最多配置 " + MAX_PROVIDERS + " 个中转站");
        }
        Set<String> ids = new HashSet<>();
        int autoIdx = 1;
        for (AiSettingsDto.Provider p : in) {
            if (p == null) {
                continue;
            }
            String id = slug(p.id(), "relay-" + autoIdx);
            if (id == null) {
                throw new IllegalArgumentException("provider id 只能包含字母/数字/-/_，长度 ≤ 32");
            }
            if (!ids.add(id)) {
                throw new IllegalArgumentException("中转站 ID 重复：" + id);
            }
            autoIdx++;
            String baseUrl = trimUrl(p.baseUrl());
            if (baseUrl.isEmpty()) {
                throw new IllegalArgumentException("中转站 " + id + " 必须填写 API 地址（如 https://xx.com/v1）");
            }
            if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
                throw new IllegalArgumentException("中转站 " + id + " 的地址必须以 http:// 或 https:// 开头");
            }

            AiProperties.Provider np = new AiProperties.Provider();
            np.setId(id);
            np.setLabel(blank(p.label()) ? id : p.label().trim());
            np.setBaseUrl(baseUrl);
            np.setApiKey(p.apiKey() == null ? "" : p.apiKey().trim());
            np.setEnabled(p.enabled() == null || p.enabled());
            np.setRequireKey(p.requireKey() == null || p.requireKey());
            np.setHeaders(limitedHeaders(p.headers(), id));
            np.setMaxTokens(p.maxTokens() == null ? 0 : checkRange(p.maxTokens(), 0, 200_000, id, "max-tokens"));
            np.setTimeoutSeconds(p.timeoutSeconds() == null ? 0
                    : checkRange(p.timeoutSeconds(), 0, 600, id, "timeout-seconds"));
            np.setTemperature(p.temperature());

            List<AiProperties.Model> models = new ArrayList<>();
            List<AiSettingsDto.Model> ms = p.models();
            if (ms != null) {
                if (ms.size() > MAX_MODELS_PER_PROVIDER) {
                    throw new IllegalArgumentException("中转站 " + id + " 最多配置 " + MAX_MODELS_PER_PROVIDER + " 个模型");
                }
                Set<String> names = new HashSet<>();
                for (AiSettingsDto.Model m : ms) {
                    if (m == null || blank(m.name())) {
                        continue;
                    }
                    String name = m.name().trim();
                    if (!names.add(name)) {
                        throw new IllegalArgumentException("中转站 " + id + " 模型名重复：" + name);
                    }
                    AiProperties.Model nm = new AiProperties.Model();
                    nm.setName(name);
                    nm.setLabel(blank(m.label()) ? name : m.label().trim());
                    nm.setEnabled(m.enabled() == null || m.enabled());
                    nm.setPrimary(Boolean.TRUE.equals(m.primary()));
                    nm.setMaxTokens(m.maxTokens() == null ? 0 : checkRange(m.maxTokens(), 0, 200_000, id, "模型 max-tokens"));
                    nm.setTimeoutSeconds(m.timeoutSeconds() == null ? 0
                            : checkRange(m.timeoutSeconds(), 0, 600, id, "模型 timeout-seconds"));
                    nm.setTemperature(m.temperature());
                    nm.setReasoningEffort(blank(m.reasoningEffort()) ? null : m.reasoningEffort().trim().toLowerCase(Locale.ROOT));
                    nm.setNote(blank(m.note()) ? null : m.note().trim());
                    // 默认开放给普通用户（openToUsers=false 才是管理员自用/内测模型）
                    nm.setUserVisible(m.userVisible() == null || m.userVisible());
                    models.add(nm);
                }
            }
            np.setModels(models);
            out.add(np);
        }
        // 全站最多一个 primary（多个时保留第一个，避免配置里出现两个「★默认」）
        boolean primarySeen = false;
        for (AiProperties.Provider p : out) {
            for (AiProperties.Model m : p.getModels()) {
                if (m.isPrimary()) {
                    if (primarySeen) {
                        m.setPrimary(false);
                    }
                    primarySeen = true;
                }
            }
        }
        return out;
    }

    private Map<String, String> limitedHeaders(Map<String, String> headers, String id) {
        Map<String, String> out = new LinkedHashMap<>();
        if (headers == null) {
            return out;
        }
        if (headers.size() > MAX_HEADERS) {
            throw new IllegalArgumentException("中转站 " + id + " 的自定义请求头最多 " + MAX_HEADERS + " 条");
        }
        headers.forEach((k, v) -> {
            if (!blank(k) && v != null) {
                out.put(k.trim(), v.trim());
            }
        });
        return out;
    }

    private static int checkRange(int v, int min, int max, String id, String field) {
        if (v < min || v > max) {
            throw new IllegalArgumentException("中转站 " + id + " 的 " + field + " 需在 " + min + "~" + max + " 之间");
        }
        return v;
    }

    /** api-key 留空 / 仍是脱敏串 → 沿用已存 token；{@value #CLEAR_KEY} → 清空。 */
    private void keepExistingKeys(List<AiProperties.Provider> incoming) {
        Map<String, String> stored = new LinkedHashMap<>();
        for (AiProperties.Provider p : runtimeProviders) {
            stored.put(idOf(p), p.getApiKey());
        }
        for (AiProperties.Provider p : incoming) {
            String key = p.getApiKey() == null ? "" : p.getApiKey().trim();
            String old = stored.getOrDefault(p.getId(), "");
            if (key.isEmpty() || key.contains("…") || key.contains("***") || CLEAR_KEY.equalsIgnoreCase(key)) {
                p.setApiKey(CLEAR_KEY.equalsIgnoreCase(key) ? "" : old);
            }
        }
    }

    // ============================================================ 展示工具

    private AiSettingsDto.ProviderView toView(AiProperties.Provider p, String origin, boolean editable) {
        List<AiSettingsDto.Model> models = new ArrayList<>();
        for (AiProperties.Model m : p.getModels()) {
            models.add(new AiSettingsDto.Model(m.getName(), m.getLabel(), m.isEnabled(), m.isPrimary(),
                    m.getMaxTokens(), m.getTimeoutSeconds(), m.getTemperature(), m.getReasoningEffort(), m.getNote(),
                    m.isUserVisible()));
        }
        boolean hasKey = !blank(p.getApiKey());
        return new AiSettingsDto.ProviderView(p.getId(), blank(p.getLabel()) ? p.getId() : p.getLabel(),
                p.getBaseUrl(), hasKey ? mask(p.getApiKey()) : "", hasKey, p.isEnabled(), p.isRequireKey(),
                p.getHeaders() == null ? Map.of() : new LinkedHashMap<>(p.getHeaders()),
                nullIfZero(p.getMaxTokens()), nullIfZero(p.getTimeoutSeconds()), p.getTemperature(),
                models, origin, editable);
    }

    /** 旧写法（单中转站 + AI_MODEL/AI_FALLBACK_MODELS）合成一条只读 provider 供页面查看。 */
    private AiSettingsDto.ProviderView legacyView() {
        String base = blank(props.getBaseUrl()) ? "" : props.getBaseUrl().trim();
        if (base.isEmpty() || "default".equals(base)) {
            return null;
        }
        List<AiSettingsDto.Model> models = new ArrayList<>();
        if (!blank(props.getModel())) {
            models.add(new AiSettingsDto.Model(props.getModel().trim(), props.getModel().trim(), true, true,
                    null, null, null, null, "AI_MODEL（环境变量）", true));
        }
        for (String item : String.valueOf(props.getFallbackModels()).split(",")) {
            String shortForm = item.trim();
            if (shortForm.isEmpty()) {
                continue;
            }
            String name = shortForm.split("@")[0].trim();
            if (!name.isEmpty() && models.stream().noneMatch(m -> m.name().equals(name))) {
                models.add(new AiSettingsDto.Model(name, name, true, false, null, null, null, null,
                        "AI_FALLBACK_MODELS（环境变量）", true));
            }
        }
        boolean hasKey = !blank(props.getApiKey());
        return new AiSettingsDto.ProviderView(AiChatService.LEGACY_PROVIDER, "环境变量 · 默认中转站", base,
                hasKey ? mask(props.getApiKey()) : "", hasKey, true, true, Map.of(),
                props.getMaxTokens(), props.getTimeoutSeconds(), props.getTemperature(), models, "env", false);
    }

    private static Integer nullIfZero(Integer v) {
        return v == null || v == 0 ? null : v;
    }

    /** 脱敏：保留头 4 尾 4，中间打点，附带长度，便于确认「贴进去的是哪个 token」。 */
    static String mask(String key) {
        String k = key == null ? "" : key.trim();
        if (k.length() <= 8) {
            return k.isEmpty() ? "" : "****（len=" + k.length() + "）";
        }
        return k.substring(0, 4) + "…" + k.substring(k.length() - 4) + "（len=" + k.length() + "）";
    }

    private static String idOf(AiProperties.Provider p) {
        return p == null ? "" : String.valueOf(p.getId());
    }

    /** 小写化 + 去空格，非法字符返回 null；空输入给默认 relay-N。 */
    private static String slug(String raw, String fallback) {
        String s = raw == null ? "" : raw.trim();
        if (s.isEmpty()) {
            return fallback;
        }
        s = s.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9_-]", "-");
        if (s.length() > 32) {
            s = s.substring(0, 32);
        }
        return s.replaceAll("^-+|-+$", "").isEmpty() ? null : s.replaceAll("^-+|-+$", "");
    }

    private static String trimUrl(String url) {
        String u = url == null ? "" : url.trim();
        while (u.endsWith("/")) {
            u = u.substring(0, u.length() - 1);
        }
        return u;
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
