package com.suanfa.service;

import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * AI 计算机语言助教的站内知识库（轻量 RAG，语言场景）。
 *
 * <p>与 {@link AiKnowledgeService}（算法，Mongo 种子数据）不同：计算机语言板块的内容
 * 是前端静态数据（suanfa_vue/src/data/languages.js），这里手工维护一份与之同源的
 * 摘要（tagline / 简介 / 特性要点 / 板块路由），用于召回打分与 system prompt 注入，
 * 保证模型回答里的站内链接与前端路由一致（/languages/:lang/:section）。
 *
 * <p>召回策略与算法库一致：别名关键词打分（中英同义词 / 缩写 / 生态关键词），取 Top-K。
 */
@Service
public class AiLanguageKnowledgeService {

    /** 单次回答最多注入的语言条数与每条正文档长度（控制 prompt 体积）。 */
    private static final int TOP_K = 2;
    private static final int MAX_SUMMARY_CHARS = 700;

    /** 语言详情页的板块路由（与前端 languageSectionPages 同源）。 */
    private static final String[][] SECTION_ROUTES = {
            {"语言概览", ""},
            {"实现与编译原理", "compile"},
            {"语法基础", "syntax"},
            {"数据结构", "data-structures"},
            {"常用架构", "architecture"},
            {"经典面试题", "interview"},
    };

    /** 站内五个语言板块（与前端 data/languages.js 保持同源；新增语言时两边一起加）。 */
    private static final List<Entry> ENTRIES = List.of(
            new Entry("java", "Java", "☕",
                    "一次编写，到处运行",
                    "Java 是强类型的面向对象语言，凭借 JVM 的跨平台能力、完善的生态（Spring 全家桶）和二十余年的企业级沉淀，长期占据服务端开发的主导地位。",
                    """
                            - 静态强类型 + 泛型擦除 + 注解驱动框架（Spring IOC/AOP）
                            - 自动内存管理：分代 GC，收集器演进 Parallel → G1 → ZGC/Shenandoah
                            - 执行模型：javac 编译为字节码 → 类加载（双亲委派）→ 解释执行 + JIT 分层编译（C1/C2）
                            - 并发：JMM 内存模型、synchronized/JUC 线程池、JDK 21 虚拟线程
                            - 主战场：Spring Boot 微服务、大数据（Hadoop/Spark/Flink/Kafka）、Android""",
                    new String[]{"java", "jvm", "jdk", "jre", "spring", "springboot", "spring boot",
                            "面向对象", "泛型", "字节码", "垃圾回收", "gc", "虚拟线程", "哈希map底层"}),
            new Entry("python", "Python", "🐍",
                    "人生苦短，我用 Python",
                    "Python 以简洁优雅的语法著称，覆盖 Web 后端、数据科学、人工智能、自动化脚本等场景。动态强类型（可选类型标注），解释执行（CPython 字节码 + 虚拟机）。",
                    """
                            - 动态强类型 + 缩进块语法 + 鸭子类型；typing 类型标注可渐进加固
                            - CPython：源码编译为 .pyc 字节码 → 虚拟机解释执行；性能热点用 C 扩展 / PyPy
                            - GIL 全局解释器锁：同一时刻仅一个线程执行字节码，CPU 密集并发靠多进程
                            - 核心特性：装饰器、生成器、上下文管理器、切片、推导式
                            - 生态：Django/Flask/FastAPI（Web）、NumPy/Pandas（数据）、PyTorch（AI）""",
                    new String[]{"python", "py", "cpython", "pip", "gil", "全局解释器锁", "django",
                            "flask", "fastapi", "numpy", "pandas", "pytorch", "爬虫", "装饰器", "生成器"}),
            new Entry("cpp", "C++", "🚀",
                    "不牺牲性能的抽象",
                    "C++ 在 C 的基础上引入面向对象、模板与 RAII，既能写底层高性能代码，又能做大规模工程抽象。静态强类型（模板泛型），编译为本机机器码。",
                    """
                            - 四大范式共存：过程 / 面向对象 / 泛型（模板） / 函数式
                            - RAII 资源管理：构造获取、析构释放，异常安全的基础
                            - 现代特性：智能指针（unique/shared/weak）、移动语义、lambda、constexpr
                            - STL：容器（vector/map/unordered_map）+ 迭代器 + 算法
                            - 编译模型：预处理 → 编译 → 汇编 → 链接；模板实例化在编译期完成
                            - 主战场：游戏引擎、高频交易、数据库、浏览器、嵌入式高性能""",
                    new String[]{"c++", "cpp", "c加加", "stl", "模板", "raii", "智能指针",
                            "移动语义", "虚函数", "构造函数", "析构", "引用", "vector", "游戏引擎"}),
            new Entry("c", "C 语言", "🔩",
                    "一切系统软件的地基",
                    "C 语言贴近硬件、运行高效，操作系统内核、驱动、嵌入式、数据库等都由它写成。静态弱类型（大量隐式转换），编译为本机机器码，手动内存管理。",
                    """
                            - 过程式结构化编程：函数 + 结构体 + 指针，没有类与继承
                            - 指针是核心：指针运算、指针与数组、函数指针、void* 泛型
                            - 手动内存管理：malloc/free，常见坑是越界、悬垂指针与内存泄漏
                            - 编译模型：预处理（#include/#define）→ 编译 → 汇编 → 链接
                            - 主战场：Linux 内核、驱动、嵌入式单片机、数据库存储引擎""",
                    new String[]{"c语言", "c 语言", "指针", "malloc", "free", "gcc", "内核开发",
                            "嵌入式", "单片机", "驱动", "结构体", "linux内核"}),
            new Entry("js", "JavaScript", "⚡",
                    "世界上使用最广泛的语言",
                    "JavaScript 是浏览器唯一原生脚本语言，借助 Node.js 又打通了服务端。动态弱类型（原型链），学习主线：语法与 ES6+ → 异步与事件循环 → 原型与闭包 → 前端框架 / Node 后端架构。",
                    """
                            - 动态弱类型 + 原型链继承（class 是语法糖）
                            - 单线程 + 事件循环：宏任务/微任务、Promise/async-await 异步模型
                            - 闭包与作用域链是核心概念，也是模块化的基础
                            - 执行方式：源码 → 解析成 AST → 字节码（V8 Ignition）→ 热点 JIT（TurboFan）
                            - 生态：Vue/React（前端）、Node.js（后端）、npm 包管理""",
                    new String[]{"javascript", "js", "es6", "node", "nodejs", "node.js", "前端",
                            "dom", "vue", "react", "闭包", "事件循环", "event loop", "promise",
                            "async", "原型链", "typescript", "ts"}));

    /** 站内语言条目（静态数据，附召回别名）。 */
    public record Entry(String id, String name, String icon, String tagline,
                        String description, String keyPoints, String[] rawAliases) {

        /** 召回用别名（构造时已归一化）。 */
        public List<String> aliases() {
            return Arrays.asList(rawAliases);
        }

        /** 语言主页路由。 */
        public String route() {
            return "/languages/" + id;
        }

        /** 板块路由：slug 为空表示语言概览（默认子页）。 */
        public String sectionRoute(String slug) {
            return slug == null || slug.isBlank() ? route() : route() + "/" + slug;
        }
    }

    /** 召回结果：引用到的语言板块（返回给前端做「参考站内页面」链接，复用算法侧的 Ref 形状）。 */
    public record Ref(String id, String name, String route) {
    }

    private final List<Entry> entries;

    public AiLanguageKnowledgeService() {
        // 别名统一小写；name/id 也并入别名，保证“java/python”这类直接命中
        List<Entry> normalized = new ArrayList<>();
        for (Entry e : ENTRIES) {
            Set<String> aliases = new LinkedHashSet<>();
            for (String a : e.rawAliases()) {
                String s = a.trim().toLowerCase(Locale.ROOT);
                if (s.length() >= 2) {
                    aliases.add(s);
                }
            }
            aliases.add(e.id().toLowerCase(Locale.ROOT));
            aliases.add(e.name().toLowerCase(Locale.ROOT));
            normalized.add(new Entry(e.id(), e.name(), e.icon(), e.tagline(), e.description(),
                    e.keyPoints(), aliases.toArray(new String[0])));
        }
        this.entries = List.copyOf(normalized);
    }

    // ------------------------------------------------------------ 召回

    /** 按问题召回站内语言资料（无命中返回空列表）。 */
    public List<Entry> recall(String question) {
        if (question == null || question.isBlank()) {
            return List.of();
        }
        String q = question.toLowerCase(Locale.ROOT);
        List<Map.Entry<Entry, Integer>> scored = new ArrayList<>();
        for (Entry e : entries) {
            int score = 0;
            for (String alias : e.aliases()) {
                if (q.contains(alias)) {
                    score += Math.min(8, Math.max(2, alias.length()));
                }
            }
            if (score > 0) {
                scored.add(Map.entry(e, score));
            }
        }
        return scored.stream()
                .sorted(Map.Entry.<Entry, Integer>comparingByValue().reversed()
                        .thenComparing(x -> x.getKey().name()))
                .limit(TOP_K)
                .map(Map.Entry::getKey)
                .toList();
    }

    /** 供 system prompt 使用的站内语言板块清单（语言名 + 板块路由）。 */
    public String catalog() {
        StringBuilder sb = new StringBuilder();
        for (Entry e : entries.stream().sorted(Comparator.comparing(Entry::name)).toList()) {
            sb.append(e.name()).append("(").append(e.route()).append(")：");
            List<String> sections = new ArrayList<>();
            for (String[] s : SECTION_ROUTES) {
                if (!s[1].isBlank()) {
                    sections.add(s[0] + "(" + e.sectionRoute(s[1]) + ")");
                }
            }
            sb.append(String.join("、", sections)).append('\n');
        }
        return sb.toString();
    }

    /** 召回资料拼成 prompt 片段。 */
    public String contextBlock(List<Entry> hits) {
        if (hits.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder("【本站语言资料摘录】（回答时优先与之一致，冲突时以资料为准）\n");
        for (Entry e : hits) {
            sb.append("### ").append(e.name()).append("（").append(e.tagline()).append("）\n");
            sb.append("简介：").append(trim(e.description())).append('\n');
            sb.append(trim(e.keyPoints())).append('\n');
            sb.append("站内板块：").append(e.route());
            for (String[] s : SECTION_ROUTES) {
                if (!s[1].isBlank()) {
                    sb.append("、").append(e.sectionRoute(s[1]));
                }
            }
            sb.append("\n\n");
        }
        return sb.toString().trim();
    }

    /** 命中的语言板块链接（语言主页 + 概览），给前端做「参考站内页面」。 */
    public List<Ref> refs(List<Entry> hits) {
        return hits.stream().map(e -> new Ref(e.id(), e.name() + " · 语言板块", e.route())).toList();
    }

    private static String trim(String s) {
        if (s == null) {
            return "";
        }
        String t = s.trim();
        return t.length() <= MAX_SUMMARY_CHARS ? t : t.substring(0, MAX_SUMMARY_CHARS) + "…";
    }
}
