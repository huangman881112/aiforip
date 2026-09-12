package com.suanfa.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.suanfa.entity.AlgorithmContent;
import com.suanfa.repository.AlgorithmContentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * AI 助教的站内知识库（轻量 RAG）。
 *
 * <p>数据源优先 MongoDB（algorithm_content 集合），不可用时回退 classpath 种子文件，
 * 加载后常驻内存缓存（数十个算法、约百 KB，无需索引服务）。
 *
 * <p>召回策略：别名关键词打分（中英同义词 + 缩写 + 分类词），取 Top-K 拼进 system prompt，
 * 使模型的回答与站内文案、复杂度表、可视化页面链接保持一致。
 */
@Service
public class AiKnowledgeService {

    private static final Logger log = LoggerFactory.getLogger(AiKnowledgeService.class);

    /** 单次回答最多注入的算法资料条数与每条正文档长度（控制 prompt 体积）。 */
    private static final int TOP_K = 3;
    private static final int MAX_SECTION_CHARS = 1100;

    /** 站内算法的中英别名/缩写（用于召回，未列出的由 id、name 自动派生）。 */
    private static final Map<String, String[]> EXTRA_ALIASES = Map.ofEntries(
            Map.entry("bubble-sort", new String[]{"冒泡", "bubble", "泡泡排序"}),
            Map.entry("selection-sort", new String[]{"选择排序", "selection", "简单选择"}),
            Map.entry("insertion-sort", new String[]{"插入排序", "insertion", "直接插入"}),
            Map.entry("shell-sort", new String[]{"希尔", "shell", "缩小增量"}),
            Map.entry("merge-sort", new String[]{"归并", "merge", "合并排序", "二通路"}),
            Map.entry("quick-sort", new String[]{"快排", "快速排序", "quicksort", "quick", "霍尔"}),
            Map.entry("heap-sort", new String[]{"堆排", "堆", "heap"}),
            Map.entry("counting-sort", new String[]{"计数排序", "counting", "桶计数"}),
            Map.entry("bucket-sort", new String[]{"桶排序", "bucket"}),
            Map.entry("radix-sort", new String[]{"基数排序", "radix", "桶式"}),
            Map.entry("linear-search", new String[]{"线性查找", "线性搜索", "顺序查找", "linear"}),
            Map.entry("binary-search", new String[]{"二分", "折半", "binary search", "binarysearch", "logn"}),
            Map.entry("interpolation-search", new String[]{"插值", "interpolation"}),
            Map.entry("jump-search", new String[]{"跳跃", "jump"}),
            Map.entry("exponential-search", new String[]{"指数搜索", "指数查找", "exponential"}),
            Map.entry("hashing-search", new String[]{"哈希", "hash", "散列", "hashmap", "冲突", "负载因子"}),
            Map.entry("dfs", new String[]{"深度优先", "dfs", "回溯", "递归遍历"}),
            Map.entry("bfs", new String[]{"广度优先", "层次优先", "bfs", "层序", "最短路无权"}),
            Map.entry("dijkstra", new String[]{"迪杰斯特拉", "dijikstra", "单源最短路"}),
            Map.entry("bellman-ford", new String[]{"贝尔曼", "bellman", "ford", "负权边", "负环"}),
            Map.entry("floyd-warshall", new String[]{"弗洛伊德", "floyd", "warshall", "多源最短路", "floyd-warshall"}),
            Map.entry("astar", new String[]{"a*", "astar", "a 星", "a星", "启发式搜索", "曼哈顿", "估价函数"}),
            Map.entry("prim", new String[]{"普里姆", "prim", "最小生成树", "点加边"}),
            Map.entry("kruskal", new String[]{"克鲁斯卡尔", "kruskal", "最小生成树", "边加边", "并查集"}),
            Map.entry("ford-fulkerson", new String[]{"ford-fulkerson", "ford fulkerson", "最大流", "增广路", "网络流"}),
            Map.entry("edmonds-karp", new String[]{"edmonds-karp", "edmonds karp", "bfs 增广", "最大流"}),
            Map.entry("topological-sort", new String[]{"拓扑", "topological", "拓扑排序", "aov", "关键路径", "入度"}),
            Map.entry("climbing-stairs", new String[]{"爬楼梯", "climb stairs", "爬阶", "斐波那契"}),
            Map.entry("max-subarray", new String[]{"最大子数组和", "kadane", "连续子数组", "最大子段和"}),
            Map.entry("lis", new String[]{"最长递增子序列", "递增子序列", "longest increasing", "耐心排序"}),
            Map.entry("knapsack-01", new String[]{"0/1 背包", "01 背包", "背包问题", "knapsack", "滚动数组"}),
            Map.entry("complete-knapsack", new String[]{"完全背包", "无限背包", "零钱兑换", "unbounded knapsack"}),
            Map.entry("lcs", new String[]{"最长公共子序列", "公共子序列", "longest common subsequence", "diff"}),
            Map.entry("edit-distance", new String[]{"编辑距离", "levenshtein", "字符串相似度", "拼写纠错"}),
            Map.entry("matrix-chain", new String[]{"矩阵链乘", "矩阵连乘", "区间 dp", "matrix chain", "最优二叉树"}),
            Map.entry("activity-selection", new String[]{"活动选择", "活动安排", "区间调度", "会议室外", "最早结束"}),
            Map.entry("fractional-knapsack", new String[]{"分数背包", "部分背包", "可分割背包", "性价比排序"}),
            Map.entry("huffman-coding", new String[]{"哈夫曼", "霍夫曼", "huffman", "前缀码", "熵编码", "wpl"}),
            Map.entry("coin-change-greedy", new String[]{"贪心找零", "找零问题", "硬币面额", "规范货币"}));

    private static final Map<String, String> CATEGORY_NAMES = Map.of(
            "sorting", "排序算法", "searching", "搜索/查找算法", "graph", "图算法",
            "dp", "动态规划", "greedy", "贪心算法");

    /** 分类词：命中时给该分类下所有算法一个较小权重。 */
    private static final Map<String, String> CATEGORY_WORDS = Map.of(
            "排序", "sorting", "搜索", "searching", "查找", "searching",
            "图论", "graph", "图算法", "graph", "生成树", "graph",
            "动态规划", "dp", "背包", "dp", "子序列", "dp", "贪心", "greedy");

    private final AlgorithmContentRepository repository;
    private final ObjectMapper objectMapper;

    private volatile List<Entry> cache;

    public AiKnowledgeService(AlgorithmContentRepository repository, ObjectMapper objectMapper) {
        this.repository = repository;
        this.objectMapper = objectMapper;
    }

    /** 站内算法条目（已展平、附带召回别名）。 */
    public record Entry(String id, String name, String category, String subCategory, String difficulty,
                        String description, String complexity, String space, String stability,
                        String route, String basic, List<String> aliases) {
    }

    /** 召回结果：引用到的算法（返回给前端做「参考站内页面」链接）。 */
    public record Ref(String id, String name, String route) {
    }

    // ------------------------------------------------------------ 数据加载

    private List<Entry> entries() {
        List<Entry> local = cache;
        if (local != null) {
            return local;
        }
        synchronized (this) {
            if (cache == null) {
                cache = load();
            }
            return cache;
        }
    }

    private List<Entry> load() {
        List<AlgorithmContent> docs = new ArrayList<>();
        try {
            repository.findAll().forEach(docs::add);
        } catch (Exception e) {
            log.warn("Mongo 知识库不可用，回退种子文件: {}", e.toString());
        }
        if (docs.isEmpty()) {
            docs = loadSeed();
        }
        List<Entry> list = new ArrayList<>(docs.size());
        for (AlgorithmContent doc : docs) {
            list.add(toEntry(doc));
        }
        log.info("AI 知识库已加载 {} 个算法", list.size());
        return list;
    }

    private List<AlgorithmContent> loadSeed() {
        try (InputStream in = new ClassPathResource("seed/algorithms-content.json").getInputStream()) {
            return objectMapper.readValue(in, new TypeReference<List<AlgorithmContent>>() {
            });
        } catch (Exception e) {
            log.warn("种子文件读取失败，知识库为空: {}", e.toString());
            return List.of();
        }
    }

    @SuppressWarnings("unchecked")
    private Entry toEntry(AlgorithmContent doc) {
        Map<String, Object> cd = doc.complexityDetails() == null ? Map.of() : doc.complexityDetails();
        String space = cd.get("space") instanceof String s ? s : null;
        if (space == null && cd.get("space") instanceof List<?> l && !l.isEmpty()
                && l.get(0) instanceof Map<?, ?> m) {
            space = String.valueOf(((Map<String, Object>) m).get("value"));
        }
        String basic = doc.sections() == null ? null : doc.sections().basic();

        Set<String> aliases = new LinkedHashSet<>();
        add(aliases, doc.name());
        String id = doc.id() == null ? "" : doc.id();
        add(aliases, id);
        add(aliases, id.replace("-", ""));
        add(aliases, id.replace("-", " "));
        String[] extra = EXTRA_ALIASES.get(id);
        if (extra != null) {
            for (String a : extra) {
                add(aliases, a);
            }
        }
        return new Entry(id, doc.name(), doc.category(), doc.subCategory(), doc.difficulty(),
                doc.description(), doc.complexity(), space, doc.stability(), doc.route(),
                trim(basic, MAX_SECTION_CHARS), new ArrayList<>(aliases));
    }

    private static void add(Set<String> set, String v) {
        if (v == null) {
            return;
        }
        String s = v.trim().toLowerCase(Locale.ROOT);
        if (s.length() >= 2) {
            set.add(s);
        }
    }

    private static String trim(String s, int max) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max) + "\n…（资料较长已截断，完整版见站内详情页）";
    }

    // ------------------------------------------------------------ 召回

    /** 按问题召回站内算法资料（无命中返回空列表）。 */
    public List<Entry> recall(String question) {
        if (question == null || question.isBlank()) {
            return List.of();
        }
        String q = question.toLowerCase(Locale.ROOT);
        Map<Entry, Integer> scored = new HashMap<>();
        String wantedCategory = CATEGORY_WORDS.get(firstWord(q));
        for (Entry e : entries()) {
            int aliasScore = 0;
            for (String alias : e.aliases()) {
                if (q.contains(alias)) {
                    aliasScore += Math.min(6, Math.max(2, alias.length()));
                }
            }
            // 只给「真的提到了算法」的条目加分类权重，避免“堆排序为什么不稳定”把整个排序分类拉进来。
            if (aliasScore > 0) {
                scored.put(e, aliasScore + (wantedCategory != null && wantedCategory.equals(e.category()) ? 1 : 0));
            }
        }
        return scored.entrySet().stream()
                .sorted(Map.Entry.<Entry, Integer>comparingByValue().reversed()
                        .thenComparing(x -> x.getKey().name()))
                .limit(TOP_K)
                .map(Map.Entry::getKey)
                .toList();
    }

    private static String firstWord(String q) {
        for (String w : CATEGORY_WORDS.keySet()) {
            if (q.contains(w)) {
                return w;
            }
        }
        return "";
    }

    /** 供 system prompt 使用的站内算法清单（名称 + 路由）。 */
    public String catalog() {
        Map<String, List<Entry>> byCat = new LinkedHashMap<>();
        for (Entry e : entries()) {
            byCat.computeIfAbsent(String.valueOf(e.category()), k -> new ArrayList<>()).add(e);
        }
        StringBuilder sb = new StringBuilder();
        for (Map.Entry<String, List<Entry>> en : byCat.entrySet()) {
            sb.append(CATEGORY_NAMES.getOrDefault(en.getKey(), en.getKey())).append("：");
            List<Entry> list = new ArrayList<>(en.getValue());
            list.sort(Comparator.comparing(Entry::name));
            sb.append(list.stream()
                    .map(e -> e.name() + "(" + e.route() + ")")
                    .reduce((a, b) -> a + "、" + b).orElse("")).append("\n");
        }
        return sb.toString();
    }

    /** 召回资料拼成 prompt 片段。 */
    public String contextBlock(List<Entry> hits) {
        if (hits.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("【本站资料摘录】（回答时优先与之一致，冲突时以资料为准）\n");
        for (Entry e : hits) {
            sb.append("### ").append(e.name()).append(" 页面：").append(e.route()).append('\n');
            if (notBlank(e.description())) {
                sb.append("简介：").append(e.description()).append('\n');
            }
            sb.append("复杂度：时间 ").append(orDash(e.complexity()))
                    .append("，空间 ").append(orDash(e.space()));
            if (notBlank(e.stability())) {
                sb.append("，稳定性 ").append(e.stability());
            }
            if (notBlank(e.difficulty())) {
                sb.append("，难度 ").append(e.difficulty());
            }
            sb.append('\n');
            if (notBlank(e.basic())) {
                sb.append(e.basic()).append('\n');
            }
            sb.append('\n');
        }
        return sb.toString().trim();
    }

    public List<Ref> refs(List<Entry> hits) {
        return hits.stream().map(e -> new Ref(e.id(), e.name(), e.route())).toList();
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }

    private static String orDash(String s) {
        return notBlank(s) ? s : "—";
    }
}
