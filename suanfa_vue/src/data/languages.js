// ============================================================
// 计算机语言模块单一数据源（Single Source of Truth）
// 每门语言包含：语法 / 数据结构 / 常用架构 / 经典面试题 四大板块。
// 新增语言只需在 languages 数组追加一项，导航菜单与路由自动生效。
// 注意：本文件中的 Markdown 代码块统一使用 ~~~ 围栏（避免与 JS 模板字符串的
// 反引号冲突），marked 按 CommonMark 规范渲染，效果与 ``` 完全一致。
// ============================================================

export const languages = [
  // ==================== Java ====================
  {
    id: 'java',
    icon: '☕',
    name: 'Java',
    accent: 'orange',
    tagline: '一次编写，到处运行',
    intro:
      'Java 是强类型的面向对象语言，凭借 JVM 的跨平台能力、完善的生态（Spring 全家桶）和二十余年的企业级沉淀，长期占据服务端开发的主导地位。学习主线：**语法基础 → 集合框架 → JVM 与并发 → Spring 生态**。',
    // 语言概览：总览页与顶部菜单展示的「特性 / 实现与编译原理 / 使用场景」
    overview: {
      meta: [
        { label: '诞生', value: '1995 · Sun（现 Oracle）' },
        { label: '类型系统', value: '静态强类型（泛型擦除）' },
        { label: '范式', value: '面向对象 + 泛型 + 函数式' },
        { label: '执行方式', value: '字节码 + JVM（解释 / JIT）' },
      ],
      features: [
        {
          title: '跨平台（WORA）',
          desc: '一次编译成与平台无关的字节码，任何装有 JVM 的机器都能运行，屏蔽 OS 与 CPU 差异',
        },
        {
          title: '自动内存管理',
          desc: 'GC 负责回收（Serial / Parallel / G1 / ZGC / Shenandoah），开发者不需要手动 free',
        },
        {
          title: '强类型 + 泛型 + 注解',
          desc: '编译期捕获类型错误、重构安全；注解驱动框架（Spring 的 IOC/AOP 全靠它）',
        },
        {
          title: '生态与工程规范',
          desc: 'Spring Boot/Cloud、MyBatis、Maven/Gradle，标准库覆盖并发、IO、网络、加密',
        },
        {
          title: '成熟并发模型',
          desc: 'JMM 内存模型、synchronized/Lock、JUC 工具、线程池；JDK 21 虚拟线程大幅降低高并发成本',
        },
        {
          title: '稳定演进',
          desc: '每半年发版 + LTS 长期支持（8 / 11 / 17 / 21），向后兼容极好',
        },
      ],
      compile: {
        summary:
          'javac 把 .java 编译成 .class 字节码；JVM 先解释执行，热点方法再由 C1/C2 做 JIT 编译成本机机器码',
        pipeline: [
          { stage: '词法 / 语法分析', desc: 'javac 把源码切成 Token，构建抽象语法树 AST' },
          {
            stage: '语义分析',
            desc: '符号表填充、类型检查、常量折叠、泛型擦除；注解处理器（Lombok / APT）在此阶段改写代码',
          },
          { stage: '字节码生成', desc: 'AST 转成基于操作数栈的 JVM 指令，写入含常量池的 .class 文件' },
          {
            stage: '类加载',
            desc: 'ClassLoader 双亲委派：加载 → 验证 → 准备（静态字段赋零值）→ 解析 → 初始化（执行 clinit）',
          },
          { stage: '解释执行', desc: '解释器逐条翻译字节码，启动快，无需等待编译' },
          {
            stage: 'JIT 分层编译',
            desc: '方法调用 / 回边计数超阈值 → C1 快速优化、C2 激进优化（内联、逃逸分析、锁消除）',
          },
          { stage: '去优化回退', desc: '激进优化的假设失效（如加载了新子类）时退回解释器重新收集信息' },
        ],
        detail: `## 实现与编译原理

Java 的执行模型是「**前端编译 + 后端解释 + JIT**」的组合，这正是它既能跨平台又能高性能的原因。

~~~text
.java 源码
   │ javac（前端编译器）
   ▼
.class 字节码（平台无关，含常量池）
   │ ClassLoader 双亲委派
   ▼
JVM 运行时数据区（堆 / 方法区 / 虚拟机栈 / 本地方法栈 / 程序计数器）
   │ 执行引擎
   ├─ 解释器：逐条翻译字节码 → 启动快
   └─ JIT：热点代码编译成本机机器码 → 运行快
~~~

### 1. 前端编译（javac）

- **词法分析**：把字符流切成 Token（关键字、标识符、字面量、符号）
- **语法分析**：按 JLS 文法构建 **AST（抽象语法树）**
- **语义分析**：填充符号表、类型检查与推断、常量折叠、受检异常检查；注解处理器（APT，Lombok / MapStruct 就靠它）在这一阶段生成或改写代码
- **字节码生成**：AST 转成 JVM 指令写入 .class。JVM 是**基于栈**的指令集（iadd、invokevirtual 等），而不是基于寄存器，因此字节码紧凑、易移植

> 关键设计：**泛型擦除**——编译后 List&lt;String&gt; 与 List&lt;Integer&gt; 是同一个 List，类型参数只在编译期检查。这也是运行时无法区分参数化类型、却仍能通过反射拿到泛型签名的原因。

### 2. 类加载机制

加载过程：**加载 → 验证 → 准备 → 解析 → 初始化**

- **双亲委派**：加载请求先交给父加载器，保证 java.lang.* 等核心类不被篡改，也避免重复加载
- **准备**：为静态字段分配内存并赋零值；**初始化**：执行 clinit（静态块与静态字段赋值），由 JVM 保证线程安全——这就是「静态内部类单例」的原理
- 打破双亲委派的场景：SPI（JDBC Driver）、OSGi、Tomcat 每个 webapp 独立加载器

### 3. 运行时数据区与内存模型

- **堆**：对象实例，GC 主战场（新生代 Eden/S0/S1 + 老年代）
- **方法区 / 元空间（Metaspace）**：类元信息、运行时常量池；JDK 8 后移到本地内存
- **虚拟机栈**：每个方法一个栈帧（局部变量表、操作数栈、动态链接、返回地址）
- **JMM**：定义主内存与工作内存之间的可见性与有序性规则。volatile 保证可见性并禁止重排序，synchronized / final 提供 happens-before 语义

### 4. 执行引擎：解释 + JIT

- **分层编译（Tiered Compilation）**：Level 0 解释 → L1-L3 C1（带 profiling）→ L4 C2
- C2 的激进优化依赖**运行时类型反馈**：方法内联（最重要）、逃逸分析（标量替换、栈上分配、**锁消除**）、循环展开、分支预测
- **去优化（deoptimization）**：假设失效时丢弃机器码回到解释执行，例如单态内联缓存遇到了新的实现类

### 5. 垃圾回收

- 用**可达性分析**（GC Roots：栈引用、静态字段、常量、JNI）判定存活，引用计数在 Java 中不适用（无法处理循环引用）
- 分代假说：新生代用复制算法（Minor GC 频繁但快），老年代用标记-整理 / 标记-清除
- 收集器演进：Parallel → CMS（已移除）→ **G1**（Region 分区 + 可预测停顿，JDK 9 后默认）→ **ZGC / Shenandoah**（着色指针 + 读屏障，停顿 < 1ms，支持 TB 级堆）

### 6. AOT 与云原生

- **GraalVM Native Image**：提前把字节码编译成独立可执行文件，启动毫秒级、内存占用小，非常适合 Serverless 与容器；代价是反射、动态代理需显式配置，峰值吞吐略低于 JIT
- **CDS / AppCDS**：共享类元数据归档，缩短启动时间
- **虚拟线程（JDK 21）**：由 JVM 调度的轻量线程，百万级并发下用同步写法获得接近异步框架的吞吐
`,
      },
      useCases: [
        {
          title: '企业级后端服务',
          desc: 'Spring Boot / Spring Cloud 微服务、REST API、分布式事务，是互联网与金融行业的主力',
        },
        {
          title: '大数据与流处理',
          desc: 'Hadoop、Spark、Flink、Kafka、Elasticsearch 全部构建在 JVM 之上',
        },
        { title: 'Android 应用', desc: '与 Kotlin 共存，Android SDK 的大量 API 仍以 Java 为主' },
        {
          title: '中间件与金融系统',
          desc: '消息队列、RPC 框架（Dubbo）、交易撮合系统，看重稳定性与可维护性',
        },
        {
          title: '大型团队长期协作',
          desc: '强类型 + 成熟工具链（IDEA、Maven）适合百人以上、生命周期十年起的项目',
        },
      ],
    },
    sections: {
      syntax: `## 语法基础

### 第一个程序

~~~java
public class HelloWorld {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}
~~~

Java 是**编译型 + 解释型**混合：源码先编译成 .class 字节码，再由 JVM 执行。

### 变量与基本类型

8 种基本类型：\`byte / short / int / long / float / double / char / boolean\`，其余全是对象引用。

~~~java
int age = 25;              // 整数（4 字节）
long big = 10_000_000L;    // 长整型要加 L
double price = 9.99;       // 浮点默认 double
char c = 'A';              // 单引号字符
boolean ok = true;
var list = new ArrayList<String>();  // Java 10+ 局部变量类型推断
~~~

### 面向对象三大特性

~~~java
// 封装：字段私有 + getter/setter
public class Student {
    private String name;
    public Student(String name) { this.name = name; }
    public String getName() { return name; }
}

// 继承：extends（单继承）；接口：implements（可多实现）
public interface Runnable2 { void run(); }

// 多态：父类引用指向子类对象
Animal a = new Dog();
a.makeSound();   // 调用子类实现
~~~

- **接口（interface）**：Java 8 后可有 default / static 方法，Java 9 后可有私有方法
- **record**（Java 16+）：一行定义不可变数据类 \`record Point(int x, int y) {}\`
- **抽象类 vs 接口**：抽象类是「是什么」（单继承、可有状态），接口是「能做什么」（多实现、无状态）

### 异常处理

~~~java
try {
    int r = 10 / 0;
} catch (ArithmeticException e) {
    System.out.println("捕获异常: " + e.getMessage());
} finally {
    System.out.println("无论如何都执行");
}

// try-with-resources：自动关闭资源（需实现 AutoCloseable）
try (var br = new BufferedReader(new FileReader("a.txt"))) {
    System.out.println(br.readLine());
}
~~~

### Lambda 与 Stream（Java 8+）

~~~java
List<String> names = List.of("Tom", "Jerry", "Spike");

// Lambda 表达式：函数式接口的实例
names.forEach(n -> System.out.println(n));

// Stream 流水线：过滤 → 映射 → 收集
List<String> result = names.stream()
        .filter(n -> n.length() > 3)
        .map(String::toUpperCase)
        .collect(Collectors.toList());
~~~`,
      dataStructures: `## 数据结构：Collections 框架

Java 把常用数据结构统一在 \`java.util\` 包下，核心是两大接口族：**Collection**（List / Set / Queue）与 **Map**。

### 常用容器速查

| 接口 | 实现 | 底层结构 | 典型复杂度 |
| --- | --- | --- | --- |
| List | ArrayList | 动态数组 | 随机访问 O(1)，中间插删 O(n) |
| List | LinkedList | 双向链表 | 头尾插删 O(1)，随机访问 O(n) |
| Set | HashSet | 哈希表（复用 HashMap） | 增删查均摊 O(1) |
| Set | TreeSet | 红黑树 | O(log n)，元素有序 |
| Map | HashMap | 数组 + 链表/红黑树 | 均摊 O(1) |
| Map | TreeMap | 红黑树 | O(log n)，按 key 有序 |
| Map | ConcurrentHashMap | 分桶 + CAS/synchronized | 并发安全，均摊 O(1) |
| Queue | PriorityQueue | 二叉小顶堆 | 入队/出队 O(log n) |
| Deque | ArrayDeque | 循环数组 | 两端操作均摊 O(1) |

### 典型用法

~~~java
// HashMap：统计词频
Map<String, Integer> freq = new HashMap<>();
for (String w : words) {
    freq.merge(w, 1, Integer::sum);   // key 不存在放 1，否则累加
}

// 优先队列：Top-K 问题（维护大小为 k 的小顶堆）
PriorityQueue<Integer> minHeap = new PriorityQueue<>();
for (int x : nums) {
    minHeap.offer(x);
    if (minHeap.size() > k) minHeap.poll();
}

// 不可变集合（Java 9+）
List<Integer> fixed = List.of(1, 2, 3);
~~~

### 选用原则

1. 查多改少用 **ArrayList**；头尾频繁插删用 **ArrayDeque/LinkedList**
2. 需要排序/范围查询用 **TreeMap/TreeSet**；只要去重用 **HashSet**
3. 多线程环境用 **ConcurrentHashMap**，不要用已废弃的 Hashtable
4. 元素做 key 必须正确实现 **hashCode + equals**（自定义类尤其注意）`,
      architecture: `## 常用架构与生态

### Spring 三层架构（最主流）

~~~text
Controller（接口层）  ←  接收 HTTP 请求、参数校验
      ↓
Service（业务层）    ←  核心业务逻辑、事务边界 @Transactional
      ↓
DAO / Repository（持久层）  ←  MyBatis / Spring Data JPA 操作数据库
~~~

**Spring Boot** 用「约定优于配置 + 起步依赖 + 内嵌容器」大幅降低 Spring 的使用门槛，是目前 Java 后端的事实标准。

### Spring 核心概念

- **IoC 控制反转**：对象的创建与依赖装配交给容器，用 \`@Component / @Autowired\` 声明
- **AOP 面向切面**：日志、事务、权限等横切逻辑与业务解耦（动态代理实现）
- **Bean 生命周期**：实例化 → 属性注入 → 初始化回调 → 使用 → 销毁回调

### 微服务架构（Spring Cloud）

当单体应用过大时按业务拆分服务：

| 组件 | 作用 |
| --- | --- |
| Spring Cloud Gateway | API 网关：路由、鉴权、限流 |
| Nacos / Eureka | 服务注册与发现 |
| OpenFeign | 声明式服务间 HTTP 调用 |
| Sentinel / Resilience4j | 熔断、降级、限流 |
| Kafka / RocketMQ | 异步消息、事件驱动、削峰填谷 |
| Redis | 分布式缓存、分布式锁 |

### 其他生态

- **构建工具**：Maven（pom.xml，主流）/ Gradle
- **ORM**：MyBatis（SQL 可控，国内主流）、Spring Data JPA（Hibernate，面向对象）
- **大数据**：Hadoop、Spark、Flink 均以 Java/Scala 为一等公民`,
    },
    interview: [
      {
        q: 'HashMap 的底层实现原理？JDK 8 做了哪些改动？',
        a: `**结构**：数组 + 链表 + 红黑树。

- put 时对 key 的 hashCode 做**扰动**（高 16 位异或低 16 位），再与 (n-1) 按位与定位桶下标，让高位也参与运算、减少碰撞
- 哈希冲突用链表存储；**链表长度 ≥ 8 且数组长度 ≥ 64** 时链表转红黑树，查询从 O(n) 优化到 O(log n)；节点删除到 6 个时退化回链表
- 默认容量 16，负载因子 0.75，元素超过「容量 × 0.75」时**扩容为 2 倍**并 rehash；JDK 8 优化为按「原位置 or 原位置 + 旧容量」拆分，无需重新计算 hash

**线程不安全**：并发 put 可能丢数据（JDK 7 头插法还会成环死循环），多线程用 ConcurrentHashMap。`,
      },
      {
        q: '== 和 equals 的区别？为什么重写 equals 必须重写 hashCode？',
        a: `- **==**：基本类型比值；引用类型比**内存地址**
- **equals**：Object 默认实现就是 ==，String 等类重写为比内容

**为什么必须同时重写 hashCode**：HashMap/HashSet 先比 hashCode 再比 equals。只重写 equals 会导致两个「相等」的对象 hashCode 不同，被放进 HashSet 时无法去重，违反「equals 相等则 hashCode 必须相等」的约定。

规范实现：\`Objects.hash(field1, field2)\` 生成 hashCode；equals 里先比引用、再比类型（instanceof）、最后逐字段比。`,
      },
      {
        q: 'JVM 内存区域划分？哪些区域会 OOM？',
        a: `**线程私有**：

- **程序计数器**：当前线程执行的字节码行号，唯一不会 OOM 的区域
- **虚拟机栈**：方法调用的栈帧（局部变量表、操作数栈），递归过深抛 **StackOverflowError**
- **本地方法栈**：native 方法使用

**线程共享**：

- **堆**：对象实例的主要存放地，GC 的主战场，空间不足抛 **OutOfMemoryError**
- **方法区**（JDK 8 后为元空间 Metaspace，使用本地内存）：类信息、常量、静态变量；动态生成类过多会 OOM

**常见 OOM 场景**：堆溢出（大集合/内存泄漏）、元空间溢出（CGLib 大量动态类）、直接内存溢出（NIO）。`,
      },
      {
        q: 'String、StringBuilder、StringBuffer 的区别？String 为什么设计成不可变？',
        a: `| 类 | 可变性 | 线程安全 | 场景 |
| --- | --- | --- | --- |
| String | 不可变 | 安全 | 常量、少量拼接 |
| StringBuilder | 可变 | 不安全 | 单线程频繁拼接（首选） |
| StringBuffer | 可变 | 安全（synchronized） | 多线程拼接（很少用） |

**String 不可变的原因**：

1. **字符串常量池**：不可变才能安全共享，\`"abc"\` 只存一份，节省内存
2. **hashCode 可缓存**：String 的 hash 惰性计算后缓存，作为 HashMap key 时无需重复计算
3. **线程安全**：天然可安全共享
4. **安全性**：网络地址、文件路径、类名等参数不会被中途篡改`,
      },
      {
        q: '线程池的核心参数有哪些？工作流程是怎样的？',
        a: `**ThreadPoolExecutor 七大参数**：corePoolSize（核心线程数）、maximumPoolSize（最大线程数）、keepAliveTime（空闲存活时间）、workQueue（任务队列）、threadFactory（线程工厂）、handler（拒绝策略）、unit（时间单位）。

**提交流程**：

1. 线程数 < corePoolSize → 新建核心线程执行
2. 达到核心数 → 任务进**队列**排队
3. 队列满 → 新建**非核心**线程执行
4. 达到最大线程数 → 执行**拒绝策略**（AbortPolicy 抛异常 / CallerRunsPolicy 调用者执行 / Discard 丢弃）

**为什么先入队再扩线程**：减少线程创建销毁的开销，核心线程优先复用。

实践：禁止用 Executors 快捷方法创建（无界队列或无界线程数有 OOM 风险），手动 new ThreadPoolExecutor 并按任务类型设参——CPU 密集型取核数+1，IO 密集型取核数 × (1 + 等待/计算时间)。`,
      },
      {
        q: 'synchronized 和 ReentrantLock 的区别？volatile 能解决什么问题？',
        a: `| 对比项 | synchronized | ReentrantLock |
| --- | --- | --- |
| 层面 | JVM 关键字（monitorenter/exit） | JDK API（AQS 实现） |
| 释放锁 | 自动（代码块结束/异常） | 手动 unlock()（必须 finally） |
| 可中断 | 不可 | lockInterruptibly() 可中断 |
| 超时获取 | 不支持 | tryLock(timeout) |
| 公平锁 | 仅非公平 | 可选公平/非公平 |
| 条件队列 | 一个 | 多个 Condition 精准唤醒 |

JDK 6 后 synchronized 引入**锁升级**（偏向锁 → 轻量级锁 → 重量级锁），性能已不输 ReentrantLock，普通场景优先使用。

**volatile**：保证**可见性**（写立即刷主存、读失效缓存）与**禁止指令重排序**（内存屏障），但**不保证原子性**——i++ 仍会丢更新。适用场景：状态标志位、双重检查锁的单例（DCL）中防止对象半初始化逃逸。`,
      },
      {
        q: '接口和抽象类的区别？如何选择？',
        a: `| 维度 | 抽象类 | 接口 |
| --- | --- | --- |
| 继承 | 单继承 | 多实现 |
| 成员变量 | 任意 | 只能 public static final 常量 |
| 方法 | 可含具体实现 | Java 8 前只能抽象方法；之后可有 default/static |
| 构造器 | 有 | 无 |
| 设计语义 | 「是什么」（is-a），模板复用 | 「能做什么」（can-do），能力契约 |

**选择**：

- 抽象类适合**模板方法模式**：父类定骨架（final 的 template 方法 + 抽象的钩子），子类填细节，如 \`AbstractList\`
- 接口适合**能力抽象与解耦**：\`Comparable\`、\`Serializable\`；配合函数式接口（\`@FunctionalInterface\`）支撑 Lambda

实践中常用「接口定义能力 + 抽象类提供骨架实现」组合，如 Spring 的 \`JdkRegexpMethodPointcut\` 体系。`,
      },
    ],
  },

  // ==================== Python ====================
  {
    id: 'python',
    icon: '🐍',
    name: 'Python',
    accent: 'blue',
    tagline: '人生苦短，我用 Python',
    intro:
      'Python 以简洁优雅的语法著称，覆盖 Web 后端、数据科学、人工智能、自动化脚本等场景。学习主线：**语法基础 → 标准库与数据结构 → 装饰器/生成器等高级特性 → Web/数据框架**。',
    // 语言概览：总览页与顶部菜单展示的「特性 / 实现与编译原理 / 使用场景」
    overview: {
      meta: [
        { label: '诞生', value: '1991 · Guido van Rossum' },
        { label: '类型系统', value: '动态强类型（可选类型标注）' },
        { label: '范式', value: '面向对象 / 函数式 / 过程式' },
        { label: '执行方式', value: '字节码 + CPython 解释器' },
      ],
      features: [
        {
          title: '语法极简、可读性强',
          desc: '缩进即作用域，代码接近伪代码，上手最快的主流语言',
        },
        {
          title: '动态类型 + 鸭子类型',
          desc: '变量无类型、对象有类型；配合类型标注与 mypy 可获得静态检查收益',
        },
        {
          title: '一切皆对象',
          desc: '函数、类、模块都是对象，可赋值可传参，天然支持高阶函数、装饰器、闭包',
        },
        {
          title: '生态庞大',
          desc: '标准库「自带电池」+ PyPI 数十万包，数据科学与 AI 领域几乎无可替代（NumPy / Pandas / PyTorch）',
        },
        {
          title: '丰富的语言糖',
          desc: '列表推导式、生成器、上下文管理器、魔术方法、解包赋值，写起来非常「顺手」',
        },
        {
          title: '可嵌入可扩展',
          desc: '热点用 C/C++ 写扩展（CPython API、Cython、pybind11）弥补性能短板',
        },
        {
          title: 'GIL 限制',
          desc: '同进程内多线程无法真正并行执行字节码，CPU 密集需多进程或 C 扩展（3.13 起提供 free-threading 实验版）',
        },
      ],
      compile: {
        summary:
          'CPython 先把源码编译成字节码（缓存为 __pycache__ 下的 .pyc），再由求值循环逐条解释执行；PyPy 则用 tracing JIT 加速',
        pipeline: [
          { stage: '词法分析', desc: 'tokenizer 按缩进生成 INDENT / DEDENT 标记，这是 Python 代码块的基础' },
          {
            stage: '语法分析',
            desc: '构建 AST；3.9 起改用 PEG 解析器，才能表达 match/case 这类复杂文法',
          },
          {
            stage: '字节码编译',
            desc: 'compile() 把 AST 转成 code object，首次导入时序列化到 __pycache__ 的 .pyc',
          },
          {
            stage: '解释执行',
            desc: 'CPython 求值循环逐条执行栈式字节码；3.11+ 自适应特化解释器按实际类型替换为专用指令',
          },
          {
            stage: '内存回收',
            desc: '引用计数为主（即时释放），分代 GC 为辅（处理循环引用）；GIL 保证计数操作原子',
          },
          { stage: '对象分配', desc: 'pymalloc 为 512 字节以下的小对象提供 arena/pool/block 分级分配' },
          {
            stage: '其他实现',
            desc: 'PyPy（JIT，通常快 4-10 倍）、Cython / mypyc（编译为 C）、Nuitka（AOT）、Jython / IronPython',
          },
        ],
        detail: `## 实现与编译原理

Python 是「**编译成字节码 + 解释执行**」的语言：它不是纯解释型（源码会先编译），也不是编译型（字节码由解释器在运行时执行）。

~~~text
.py 源码 → tokenizer（缩进转 INDENT/DEDENT）→ AST → 字节码 code object
                                                      │ 缓存 __pycache__/*.pyc
                                                      ▼
                                       CPython 求值循环（解释执行）
                                                      │
                                    引用计数 + 分代 GC 负责内存回收
~~~

### 1. 从源码到字节码

- **词法分析**：Python 用缩进表达代码块，tokenizer 会插入 INDENT / DEDENT 标记
- **语法分析**：3.9 起换成 **PEG 解析器**，可直接表达左递归文法，match/case 等语法因此成为可能
- **编译**：compile(source, filename, mode) 返回 code object，字节码可以用 dis 模块反汇编查看

~~~python
import dis

def f(a, b):
    return a + b

dis.dis(f)
# LOAD_FAST a / LOAD_FAST b / BINARY_OP + / RETURN_VALUE
~~~

### 2. .pyc 缓存与导入机制

- 首次导入模块时把字节码写入 __pycache__ 下对应版本的 .pyc，头部记录源码的 mtime / size；未变化则跳过编译——**只省编译时间，不省解释时间**
- 导入流程：在 sys.path 中查找 → 找到 loader → 执行模块顶层代码 → 存入 sys.modules。因此模块天然单例，循环导入会拿到「半初始化」的对象

### 3. 解释执行与 GIL

- CPython 的核心是求值循环 _PyEval_EvalFrameDefault：取一条字节码 → switch 分派 → 压 / 弹操作数栈
- **GIL（全局解释器锁）**：保护引用计数不被多线程破坏，导致「同一进程同一时刻只有一个线程在执行 Python 字节码」
- 应对方式：CPU 密集用 multiprocessing（多进程）或把热点写成 C 扩展（NumPy 在计算时会释放 GIL）；IO 密集用 asyncio 或多线程（阻塞时释放 GIL）
- **PEP 703（3.13+）**：free-threaded 构建移除 GIL，改用偏向引用计数 + 细粒度锁，多核可扩展，但单线程略有开销

### 4. 性能演进

- 3.11 的**自适应特化解释器**：为 LOAD_ATTR、BINARY_OP 等指令按观测到的类型生成专用变体（inline cache），整体提速明显
- 3.12 / 3.13 引入 **copy-and-patch JIT**，为持续加速铺路
- **PyPy** 用 tracing JIT 把热点循环编译成机器码，纯 Python 计算通常快 4-10 倍，代价是 C 扩展兼容性与更高内存占用

### 5. 内存管理

- **引用计数**为主：每个对象头维护 ob_refcnt，归零立即释放（析构时机确定，with 语句因此可靠）
- **分代 GC** 为辅：跟踪容器对象，检测并回收循环引用；分三代，存活越久晋升越高、扫描越少
- **pymalloc** 为小对象（≤512B）提供 arena / pool / block 分级分配，减少系统调用
- 降低内存占用的手段：weakref、__slots__、生成器代替列表、array / numpy 代替 list

### 6. 类型标注与工具链

- 标注（def f(x: int) -> str）运行时**不强制**，只供 mypy / pyright / IDE 做静态检查，等于「动态语言 + 可选静态类型」
- 环境与打包：venv / uv / poetry 管理依赖，build + twine 发布
- 性能剖析：cProfile（函数级）、line_profiler（行级）、tracemalloc（内存）、py-spy（无需改代码的采样分析）
`,
      },
      useCases: [
        {
          title: '人工智能与机器学习',
          desc: 'PyTorch / TensorFlow / scikit-learn / HuggingFace 的事实标准接口语言',
        },
        {
          title: '数据分析与可视化',
          desc: 'Pandas、NumPy、Matplotlib、Jupyter Notebook 交互式分析',
        },
        {
          title: '自动化脚本与运维',
          desc: '批处理、定时任务、爬虫、CI/CD、服务器运维（Ansible）',
        },
        {
          title: 'Web 后端与 API',
          desc: 'Django / Flask / FastAPI，中小型服务、内部系统与快速原型',
        },
        {
          title: '教学与科研',
          desc: '语法接近伪代码，算法入门、科学计算、论文复现首选',
        },
        { title: '量化金融', desc: '策略回测、因子挖掘、风控建模' },
      ],
    },
    sections: {
      syntax: `## 语法基础

### 第一个程序

~~~python
print("Hello, Python!")   # 无分号、无大括号，用缩进表示代码块
~~~

Python 是**动态强类型**解释型语言：变量无需声明类型，但类型之间不会隐式强转（"1" + 1 会报错）。

### 变量与常用类型

~~~python
n = 10            # int（无限精度）
pi = 3.14159      # float
s = "你好"        # str（不可变，Unicode）
flag = True       # bool
nothing = None    # 空值

# 类型标注（Python 3.5+，可选但大型项目推荐）
def greet(name: str) -> str:
    return f"Hello, {name}"
~~~

### 列表推导式（Pythonic 的标志）

~~~python
squares = [x**2 for x in range(10) if x % 2 == 0]
pairs = {k: v for k, v in zip(names, scores)}   # 字典推导式
~~~

### 函数

~~~python
def power(base, exp=2, *args, **kwargs):
    """默认参数、可变位置参数、可变关键字参数"""
    return base ** exp

# 匿名函数
sorted(data, key=lambda x: x["age"])

# 类型标注 + 默认避免可变默认参数陷阱
def append_to(item, target=None):
    target = target or []
    target.append(item)
    return target
~~~

### 类与魔法方法

~~~python
class Vector:
    def __init__(self, x, y):        # 构造
        self.x, self.y = x, y
    def __repr__(self):              # 打印表示
        return f"Vector({self.x}, {self.y})"
    def __add__(self, other):        # 运算符重载
        return Vector(self.x + other.x, self.y + other.y)
    def __len__(self):
        return 2
~~~

### 装饰器、生成器与上下文管理器

~~~python
import time, functools

# 装饰器：在不修改原函数的前提下增强功能
def timer(fn):
    @functools.wraps(fn)             # 保留原函数元信息
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = fn(*args, **kwargs)
        print(f"{fn.__name__} 耗时 {time.perf_counter() - start:.3f}s")
        return result
    return wrapper

@timer
def train():
    time.sleep(1)

# 生成器：惰性求值，省内存
def fib():
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

# 上下文管理器：自动资源释放
with open("data.txt", encoding="utf-8") as f:
    text = f.read()
~~~`,
      dataStructures: `## 数据结构：内置容器与 collections

### 内置四大容器

| 类型 | 可变 | 有序 | 重复 | 底层实现 |
| --- | --- | --- | --- | --- |
| list | ✅ | ✅ | ✅ | 动态数组（引用数组） |
| tuple | ❌ | ✅ | ✅ | 定长数组，可哈希 |
| dict | ✅ | 3.7+ 保持插入序 | key 不重复 | 开放寻址哈希表 |
| set | ✅ | ❌ | ❌ | 哈希表（只有 key） |

### 常用操作复杂度

~~~text
list:    索引/尾部追加 O(1)；insert(0)/in 判断 O(n)
dict/set: 增删查均摊 O(1)；最坏（大量哈希碰撞）退化 O(n)
~~~

### collections 标准库（面试与刷题高频）

~~~python
from collections import deque, Counter, defaultdict, namedtuple

# deque：双端队列，两端操作 O(1)，可做滑动窗口 / BFS 队列
dq = deque(maxlen=5)
dq.append(1); dq.appendleft(2)

# Counter：计数器，一行实现词频 + Top-K
Counter("abracadabra").most_common(2)   # [('a', 5), ('b', 2)]

# defaultdict：带默认值的字典，分组神器
groups = defaultdict(list)
groups[key].append(value)               # key 不存在自动建空 list

# namedtuple：轻量只读结构体
Point = namedtuple("Point", ["x", "y"])
p = Point(1, 2)
~~~

### 堆与排序

~~~python
import heapq

heap = []
for x in [5, 1, 8, 3]:
    heapq.heappush(heap, x)          # 小顶堆
heapq.heappop(heap)                  # 弹出最小值 O(log n)

# Top-K：nsmallest / nlargest 内部就是堆
heapq.nlargest(3, data, key=lambda x: x.score)
~~~

### 选用原则

1. 频繁头部插入/删除用 **deque** 而不是 list（list 的 pop(0) 是 O(n)）
2. 成员判断（in）频繁用 **set/dict**（O(1)）而不是 list（O(n)）
3. 需要 key 保持插入顺序用 dict（3.7+ 已保证）；排序 key 用 **sorted(d.items())**
4. 大量数值计算用 **NumPy 数组**，纯 Python 循环会慢上百倍`,
      architecture: `## 常用架构与生态

### Web 后端：三大框架

| 框架 | 模式 | 特点 | 适用 |
| --- | --- | --- | --- |
| Django | MVT（Model-Template-View） | 全家桶：ORM/Admin/Auth 自带 | 内容型网站、快速交付 |
| Flask | 微内核 + 插件 | 轻量灵活，按需组装 | 小型服务、原型 |
| FastAPI | ASGI + 类型标注 | 异步高性能、自动生成 OpenAPI 文档、Pydantic 校验 | 现代化 API、AI 服务网关 |

~~~text
典型分层架构：
Router（路由）→ Service（业务）→ Repository/ORM（SQLAlchemy/Django ORM）→ DB
~~~

### 数据科学与 AI（Python 的统治区）

- **NumPy**：N 维数组与向量化运算，一切的基础
- **Pandas**：DataFrame 表格处理、清洗、分析
- **Matplotlib / Plotly**：可视化
- **scikit-learn**：传统机器学习
- **PyTorch / TensorFlow**：深度学习

### 异步与并发

~~~python
import asyncio

async def fetch(i):
    await asyncio.sleep(1)     # 模拟 IO
    return i

async def main():
    # 并发跑 100 个任务，总耗时约 1s 而不是 100s
    results = await asyncio.gather(*(fetch(i) for i in range(100)))
~~~

- **asyncio**：单线程事件循环 + 协程，高并发 IO 场景
- **多进程 multiprocessing**：绕开 GIL 利用多核 CPU
- **线程池 ThreadPoolExecutor**：IO 密集任务的简单并行

### 工程化

- **包管理**：pip + venv（基础）、Poetry / uv（现代选择）
- **质量工具**：black（格式化）、ruff（lint）、pytest（测试）、mypy（类型检查）
- **爬虫**：requests / httpx、Scrapy 框架、Playwright 动态渲染`,
    },
    interview: [
      {
        q: 'Python 的可变与不可变类型？函数默认参数有什么坑？',
        a: `**不可变**：int、float、str、tuple、frozenset——修改会创建新对象。\n**可变**：list、dict、set——原地修改，id 不变。

**经典陷阱：可变对象做默认参数**，默认值在函数定义时只创建**一次**，所有调用共享：

~~~python
def bad(item, lst=[]):        # 多次调用会累积！
    lst.append(item)
    return lst

bad(1)   # [1]
bad(2)   # [1, 2]  ← 不是 [2]

# 正确写法：哨兵 None
def good(item, lst=None):
    if lst is None:
        lst = []
    lst.append(item)
    return lst
~~~

判断依据用 \`is\`（身份）还是 \`==\`（值）：小整数缓存（-5~256）与字符串驻留会让 \`is\` 出现「意外为 True」，比较值一律用 ==。`,
      },
      {
        q: '什么是 GIL？它对多线程有什么影响？如何绕开？',
        a: `**GIL（全局解释器锁）**：CPython 中同一时刻只允许一个线程执行 Python 字节码。

- **CPU 密集型**：多线程无法并行计算，甚至因锁竞争更慢 → 用 **multiprocessing 多进程**（每个进程独立 GIL）或把热点代码交给 NumPy/C 扩展
- **IO 密集型**：线程在等待 IO 时会**释放 GIL**，多线程/协程依然有效 → 网络爬虫、文件操作可用 threading 或 asyncio

注意：GIL 是 CPython 的实现细节而非语言规范（Jython/Python 3.13 free-threading 实验版无 GIL）；Python 3.2 后 GIL 改为按时间片（switch interval）切换而非按指令数。`,
      },
      {
        q: '装饰器的原理是什么？手写一个带参数的装饰器。',
        a: `装饰器本质是**高阶函数**：接收函数返回新函数，\`@dec\` 等价于 \`f = dec(f)\`。闭包让 wrapper 能记住被装饰的函数。

~~~python
import functools

def repeat(times):                 # 带参数 → 三层嵌套
    def decorator(fn):
        @functools.wraps(fn)       # 保留 __name__、__doc__ 等元信息
        def wrapper(*args, **kwargs):
            for _ in range(times):
                result = fn(*args, **kwargs)
            return result
        return wrapper
    return decorator

@repeat(times=3)
def greet():
    print("hi")
~~~

要点：\*args, **kwargs 保证任意签名兼容；\`functools.wraps\` 不加会导致函数名变成 wrapper、影响调试与文档；类装饰器用 \`__call__\` 实现；多个装饰器**自下而上**执行。`,
      },
      {
        q: '迭代器和生成器的区别？生成器有什么优势？',
        a: `- **迭代器**：实现 \`__iter__\` 和 \`__next__\` 的对象，for 循环的本质就是不断调用 next() 直到 StopIteration
- **生成器**：带 yield 的函数（或生成器表达式），是**自动实现**的迭代器

~~~python
def countdown(n):
    while n > 0:
        yield n
        n -= 1

gen = countdown(3)     # 函数体不执行！调用 next() 才跑到第一个 yield
next(gen)              # 3
~~~

**优势**：

1. **惰性求值**：边生成边消费，处理 10GB 日志也只需常数内存
2. **无限序列**：\`itertools.count()\` 这类只有生成器能表达
3. **管道组合**：\`sum(x*x for x in nums if x > 0)\` 各步骤流式衔接，不产生中间列表

生成器还支持 \`send()\` 双向通信与 \`yield from\` 委托，是 asyncio 协程的前身。`,
      },
      {
        q: 'dict 的底层实现？为什么 key 必须可哈希？',
        a: `dict 是**开放寻址哈希表**（非链表法）：

- 每个槽位存 (hash, key, value)，冲突按探测序列（伪随机探测 + 扰动）找下一个槽
- **扩容**：填充超过 2/3 时扩容（3.6 后按使用量渐进式分裂 resize），均摊插入 O(1)
- **3.7+ 保证插入有序**（3.6 是实现细节）：紧凑布局（稀疏索引数组 + 紧凑条目数组）顺带省 20%~30% 内存
- **key 必须可哈希**（实现 \`__hash__\` 且生命周期内不变）：list/dict/set 不行，tuple/frozenset/数值/str 可以；自定义类默认按 id 哈希

查找平均 O(1)，最坏（构造碰撞攻击）O(n)，所以哈希算法加入了随机化盐（PYTHONHASHSEED）防哈希碰撞 DoS。`,
      },
      {
        q: '深拷贝与浅拷贝的区别？如何正确复制嵌套结构？',
        a: `~~~python
import copy

a = [1, [2, 3]]
b = a                  # 赋值：同一对象（id 相同）
c = a.copy()           # 浅拷贝：只复制第一层，内层仍共享
d = copy.deepcopy(a)   # 深拷贝：递归复制所有层

a[1].append(99)
# c[1] 变成 [2, 3, 99]（共享内层）
# d[1] 还是 [2, 3]（完全独立）
~~~

- **浅拷贝**方式：切片 \`a[:]\`、\`list(a)\`、\`dict.copy()\`、\`copy.copy()\`
- **深拷贝**：\`copy.deepcopy()\`，内部用 memo 字典处理**循环引用**不会死循环
- 自定义类可实现 \`__copy__\` / \`__deepcopy__\` 控制行为

面试延伸：函数传参是「**传对象引用**」（call by sharing）——传可变对象进函数并被修改会影响外部，这就是为什么文档强调「不要用可变对象做默认参数」。`,
      },
      {
        q: '多线程、多进程、协程如何选型？',
        a: `| 方案 | 切换成本 | 利用多核 | 适用场景 |
| --- | --- | --- | --- |
| threading 多线程 | 中 | ❌（GIL） | IO 密集（网络请求、文件读写） |
| multiprocessing 多进程 | 高（IPC 开销） | ✅ | CPU 密集（计算、编解码） |
| asyncio 协程 | 极低（用户态） | ❌ | 超高并发 IO（万级连接、爬虫、网关） |

**决策顺序**：IO 密集且并发量大 → asyncio（需要所有 IO 库支持异步）；IO 密集但依赖同步库（requests、数据库驱动）→ 线程池 \`ThreadPoolExecutor\`；CPU 密集 → 多进程 \`ProcessPoolExecutor\` 或把热点交给 NumPy/Numba。

混合架构很常见：FastAPI（asyncio 处理请求）+ Celery（多进程 worker 跑重任务）。`,
      },
    ],
  },

  // ==================== C++ ====================
  {
    id: 'cpp',
    icon: '🚀',
    name: 'C++',
    accent: 'blue',
    tagline: '不牺牲性能的抽象',
    intro:
      'C++ 在 C 的基础上引入面向对象、模板与 RAII，既能写底层高性能代码，又能做大规模工程抽象。学习主线：**语法与内存模型 → 类与 RAII → STL → 智能指针/移动语义/模板**。',
    // 语言概览：总览页与顶部菜单展示的「特性 / 实现与编译原理 / 使用场景」
    overview: {
      meta: [
        { label: '诞生', value: '1985 · Bjarne Stroustrup' },
        { label: '类型系统', value: '静态强类型（模板泛型）' },
        { label: '范式', value: '过程 / 对象 / 泛型 / 函数式' },
        { label: '执行方式', value: '直接编译为本机机器码' },
      ],
      features: [
        {
          title: '零开销抽象',
          desc: '「不用不付费，用了不比手写 C 慢」——类与模板在编译期消解为等价底层代码',
        },
        {
          title: 'RAII + 手动内存管理',
          desc: '无 GC，用构造/析构管理资源；智能指针（unique / shared / weak）表达所有权',
        },
        {
          title: '模板元编程',
          desc: '模板在编译期图灵完备，可做编译期计算与代码生成，STL 容器与算法全靠它',
        },
        {
          title: '极致性能',
          desc: '贴近硬件、无虚拟机、可控内联与内存布局，性能敏感领域的首选',
        },
        {
          title: '标准持续演进',
          desc: 'C++11（移动语义、lambda、auto）→ 17（结构化绑定、optional）→ 20（concepts、协程、Ranges、Modules）→ 23',
        },
        {
          title: '多范式自由',
          desc: '面向对象、泛型、函数式风格可混用；Core Guidelines 推荐使用现代写法',
        },
        {
          title: '复杂度与陷阱',
          desc: '语法庞大、未定义行为（UB）多、无统一包管理与稳定 ABI，学习曲线降岭',
        },
      ],
      compile: {
        summary:
          '四阶段离线编译：预处理 → 编译成汇编 → 汇编成目标文件 .o → 链接生成可执行文件；模板与内联在编译期展开，运行时无虚拟机',
        pipeline: [
          { stage: '预处理', desc: '展开 #include、宏替换、条件编译，产出纯翻译单元 .i' },
          {
            stage: '编译（cc1 / clang）',
            desc: '词法/语法分析建 AST，模板两阶段查找与实例化，中端优化（LLVM IR / GIMPLE）产出汇编 .s',
          },
          {
            stage: '汇编（as）',
            desc: '把 .s 翻译成机器码，生成 .o（ELF / COFF / Mach-O），含符号表与重定位信息',
          },
          {
            stage: '链接（ld）',
            desc: '符号解析 + 重定位；静态库 .a 代码拷入可执行文件，动态库 .so 只记录依赖',
          },
          {
            stage: '加载运行',
            desc: 'OS 映射 text/rodata/data/bss 段 → crt0 启动代码 → 全局对象构造 → main',
          },
          {
            stage: '编译期计算',
            desc: 'constexpr / consteval 把计算搬到编译期，模板实例化在编译期生成具体代码',
          },
        ],
        detail: `## 实现与编译原理

C++ 是**纯编译型**语言：源码经编译器直接变成本机机器码，运行时没有解释器或虚拟机。性能上限高，代价是编译期做了大量工作，且与平台/编译器强相关。

~~~text
main.cpp
  │ ① 预处理（g++ -E）：#include 展开、宏替换、条件编译 → main.i
  │ ② 编译  （g++ -S）：词法/语法分析 → AST → 中端 IR → 优化 → main.s
  │ ③ 汇编  （g++ -c）：as 生成机器码 → main.o（ELF/COFF/Mach-O + 符号表）
  │ ④ 链接  （g++   ）：ld 解析符号 + 重定位 → a.out
  ▼
操作系统加载：映射 text/rodata/data/bss → crt0 → 全局构造 → main()
~~~

### 1. 翻译单元与预处理

- 预处理器只做**文本替换**：#include 把头文件内容原样拷进来，#define 是宏展开。所以头文件必须有 include guard 或 #pragma once，宏也常被 inline 函数与 constexpr 取代
- 一个 .cpp 及其包含的头文件构成一个**翻译单元**，独立编译——这也是 C++ 编译慢的根源（头文件被反复解析），C++20 Modules 就是为了解决它

### 2. 编译中端：模板与优化

- **两阶段名字查找**：模板定义时检查非依赖名，实例化时检查依赖名。所以模板实现通常必须写在头文件里，否则链接期找不到符号
- **实例化**：vector&lt;int&gt; 与 vector&lt;double&gt; 各生成一份代码（代码膨胀）；C++17 的 if constexpr、C++20 的 concepts 让模板可控得多
- **优化**：内联展开、常量传播、死代码消除、循环不变量外提、向量化（SIMD）、LTO（跨翻译单元全局优化）
- -O2 与 -O3 的区别主要在自动向量化与循环展开；所有优化都建立在「程序无 UB」的假设上，**未定义行为会让优化器做出反直觉的删除**

### 3. 目标文件与链接

- .o 里是机器码 + 符号表（已定义 / 未定义符号）+ 重定位表
- **链接错误**的典型来源：重复定义（ODR 违反）、声明未实现、模板实现放在 .cpp、静态成员未定义
- 静态链接（.a）体积大但部署简单；动态链接（.so / .dll）体积小、可热更新，但有版本与 ABI 兼容问题
- **ODR（单一定义规则）**：同一实体在整个程序中只能有一个定义；inline 函数、模板、类定义是例外（允许多处相同定义）

### 4. 运行时模型

- **没有 GC**：对象生命周期由作用域决定，栈对象离开作用域自动析构（RAII）；堆对象需手动 delete 或交给智能指针
- **内存模型（C++11）**：定义多线程下的可见性与顺序，std::atomic + memory_order 提供跨平台无锁编程基础
- **异常**：抛出时栈展开（stack unwinding）依次调用析构函数，因此**析构函数绝不能抛异常**（需 noexcept）
- **启动开销**：全局 / 静态对象在 main 前构造，跨翻译单元顺序未定义（SIOF），推荐 Meyers Singleton（函数内 static）

### 5. 构建与工具链

- **CMake** 是事实标准；包管理用 vcpkg / Conan
- 诊断工具：AddressSanitizer / UBSan / ThreadSanitizer、Valgrind、perf、gdb / lldb
- 代码规范：clang-format 统一风格，clang-tidy 静态检查，Core Guidelines 避坐陷阱
- 现代演进：C++20 Modules 告别头文件重复解析，Coroutines 提供无栈协程，Ranges 让算法链式书写
`,
      },
      useCases: [
        {
          title: '游戏开发',
          desc: 'Unreal Engine 与各类 3A 引擎、客户端，追求帧率与内存可控',
        },
        {
          title: '高频交易',
          desc: '微秒级延迟要求的撮合引擎、行情系统、策略执行层',
        },
        {
          title: '系统软件与基础设施',
          desc: '数据库（MySQL / MongoDB）、浏览器（Chromium）、搜索引擎、编译器与虚拟机',
        },
        {
          title: '嵌入式与 IoT',
          desc: '资源受限设备，需要精细控制内存与性能，又想比 C 更强的抽象',
        },
        {
          title: '高性能计算与图形',
          desc: '科学计算、音视频编解码（FFmpeg）、CUDA 并行计算、渲染引擎',
        },
        { title: '桌面应用', desc: 'Qt 框架下的跨平台客户端、专业工具与 IDE' },
      ],
    },
    sections: {
      syntax: `## 语法基础

### 第一个程序

~~~cpp
#include <iostream>

int main() {
    std::cout << "Hello, C++!" << std::endl;
    return 0;
}
~~~

C++ 是**编译型**语言：源码经预处理 → 编译 → 汇编 → 链接生成可执行文件，性能接近硬件极限。

### 变量、引用与指针

~~~cpp
int x = 10;
int* p = &x;        // 指针：存地址，可为空、可改指向
int& r = x;         // 引用：别名，必须初始化、不能改绑
const int c = 5;    // 常量
auto y = x;         // 类型推导（C++11）
~~~

### 类与 RAII（C++ 最重要的思想）

~~~cpp
class File {
public:
    explicit File(const char* path) : fp_(fopen(path, "r")) {}   // 构造：获取资源
    ~File() { if (fp_) fclose(fp_); }                            // 析构：自动释放

    File(const File&) = delete;            // 禁止拷贝（或实现深拷贝）
    File& operator=(const File&) = delete;
private:
    FILE* fp_;
};
~~~

**RAII**：资源获取即初始化——把资源生命周期绑定到对象生命周期，栈上对象离开作用域自动调用析构，**异常安全地**杜绝内存泄漏。锁 guard、智能指针全是这个思想的产物。

### 模板（泛型编程）

~~~cpp
template <typename T>
T maxOf(T a, T b) { return a > b ? a : b; }

maxOf(3, 5);        // 编译期实例化出 int 版本，零运行时开销
~~~

### Lambda 与范围 for（C++11+）

~~~cpp
std::vector<int> v{3, 1, 4};
std::sort(v.begin(), v.end(), [](int a, int b) { return a > b; });

for (const auto& x : v) std::cout << x << " ";
~~~`,
      dataStructures: `## 数据结构：STL 容器

STL（标准模板库）把容器、迭代器、算法解耦，通过迭代器组合使用。

### 容器速查

| 容器 | 底层结构 | 核心复杂度 | 备注 |
| --- | --- | --- | --- |
| vector | 动态数组 | 尾插均摊 O(1)，随机访问 O(1) | **默认首选**，缓存友好 |
| deque | 分段连续数组 | 两端 O(1) | stack/queue 的默认底层 |
| list | 双向链表 | 任意位置插删 O(1)（有迭代器时） | 缓存不友好，慎用 |
| set / map | 红黑树 | O(log n)，有序遍历 | 稳定，迭代器不失效 |
| unordered_set/map | 哈希桶 | 均摊 O(1) | 最坏 O(n)，需给 key 提供 hash |
| stack / queue | 容器适配器 | 封装 deque | 只暴露受限接口 |
| priority_queue | 二叉堆 | push/pop O(log n) | 默认大顶堆 |
| string | 动态字符数组 | 同 vector | SSO 小字符串优化 |

### 典型用法

~~~cpp
#include <map>
#include <unordered_map>
#include <queue>

// map：词频统计（key 自动按字典序）
std::map<std::string, int> freq;
++freq["apple"];

// unordered_map：O(1) 查找
std::unordered_map<int, std::string> id2name;

// priority_queue：Top-K（小顶堆要传 greater）
std::priority_queue<int, std::vector<int>, std::greater<int>> minHeap;

// 算法 + 迭代器
#include <algorithm>
auto it = std::find(v.begin(), v.end(), 42);
int cnt = std::count_if(v.begin(), v.end(), [](int x){ return x % 2 == 0; });
~~~

### 迭代器失效规则（高频考点）

- **vector**：扩容导致**全部失效**；中间 insert/erase 使该位置之后失效
- **deque**：中部操作使全部失效；两端操作使指向该端的失效
- **list/map**：只有被删元素的迭代器失效
- 安全写法：\`it = v.erase(it);\` 用返回值更新迭代器`,
      architecture: `## 常用架构与生态

### 工程分层

~~~text
头文件(.h)：接口声明 + 模板实现          源文件(.cpp)：具体实现
构建系统：CMake（事实标准）/ Bazel
包管理：vcpkg / Conan
测试：GoogleTest / Catch2
~~~

### 典型应用领域与架构模式

| 领域 | 代表技术 | 架构特点 |
| --- | --- | --- |
| 游戏引擎 | Unreal Engine、自研引擎 | ECS（实体-组件-系统）、对象池、帧循环驱动 |
| 高频交易/低延迟 | 自研网络库 | 内核旁路、无锁队列、内存池、cache line 对齐 |
| 图形学 | OpenGL/Vulkan + GLM | 渲染管线、资源管理器、场景图 |
| 嵌入式/机器人 | ROS、Qt | 消息驱动的节点架构、信号槽 |
| 数据库/基础软件 | MySQL、Redis、TiKV | 存储引擎 + 执行器 + 网络层的经典分层 |

### C++ 高频架构惯用法

- **PIMPL（指针指向实现）**：头文件只放 \`std::unique_ptr<Impl>\`，隔离实现细节、加速编译、保证 ABI 稳定
- **CRTP（奇异递归模板）**：\`class D : public Base<D>\`，编译期多态替代虚函数，零开销
- **对象池 / 内存池**：预分配复用，避免频繁 malloc 与碎片化
- **观察者/信号槽**：事件解耦（Qt 信号槽、boost::signals2）

### 现代化演进（C++11/14/17/20）

- 智能指针消灭裸 new/delete；移动语义消灭多余拷贝
- \`auto\`、范围 for、结构化绑定让代码更简洁
- C++17 并行算法、C++20 协程（co_await）与 Concepts 约束模板`,
    },
    interview: [
      {
        q: '指针和引用的区别？各适合什么场景？',
        a: `| 维度 | 指针 | 引用 |
| --- | --- | --- |
| 可为空 | ✅ nullptr | ❌ 必须绑定有效对象 |
| 可改指向 | ✅ | ❌ 初始化后不能改绑 |
| 可做多级 | ✅ int** | ❌ 没有引用的引用 |
| sizeof | 指针本身大小（8 字节@64位） | 被引用对象的大小 |
| 算术运算 | ✅ p++ | ❌ |

**场景**：

- 引用：函数参数/返回值传递（避免拷贝且保证非空）、范围 for、运算符重载
- 指针：需要「空」语义（可选项）、需要改变指向、数组遍历、与 C 接口交互

现代 C++ 倾向：能引用不指针；必须指针时用智能指针。引用传参注意：大对象传 \`const T&\` 只读防拷贝，需要修改传出结果用 \`T&\`。`,
      },
      {
        q: '智能指针的原理？shared_ptr 循环引用怎么解决？',
        a: `**RAII 的标准实现**，栈对象析构时自动 delete 堆对象：

- **unique_ptr**：独占所有权，**零开销**（大小≈裸指针），不可拷贝只能 move——默认首选
- **shared_ptr**：共享所有权，**引用计数**（原子操作）归零时释放；控制块存强/弱计数
- **weak_ptr**：只观察不持有，不增加强计数；用 \`lock()\` 安全提升为 shared_ptr

**循环引用问题**：A 持有 shared_ptr<B>，B 持有 shared_ptr<A> → 计数互相支撑永不归零 → 泄漏。

~~~cpp
struct Node {
    std::shared_ptr<Node> next;
    std::weak_ptr<Node> prev;    // 把回边改成 weak_ptr 打破环
};
~~~

**经验法则**：所有权链沿「父 → 子」用 shared_ptr 或 unique_ptr，「子 → 父」回引用一律 weak_ptr；观察者模式中被观察者列表也用 weak_ptr 防止悬挂。`,
      },
      {
        q: '虚函数的实现机制？什么是虚函数表和虚析构函数？',
        a: `**多态的实现**：每个含虚函数的类有一张**虚函数表（vtable）**，存放该类各虚函数的地址；每个对象头部有一个**虚表指针（vptr）**，构造时指向所属类的 vtable。调用 \`p->f()\` 编译为「取 vptr → 查表第 i 项 → 间接调用」，因此动态绑定有一次间接寻址开销（这也是虚函数无法内联的原因）。

**虚析构函数**：基类指针 delete 派生类对象时，若析构不是 virtual，只会调基类析构 → 派生类资源泄漏。**只要类会被继承并通过基类指针管理，析构函数必须 virtual**（或用 protected 非虚析构禁止多态删除）。

延伸考点：

- 构造/析构函数中调用虚函数**不会**多态分发（此时 vptr 指向当前正在构造/析构的层级）
- 纯虚函数 \`virtual void f() = 0;\` 定义抽象类，但可以提供实现供派生类显式调用
- final/override 关键字显式表达意图，防手滑签名不一致导致「没覆盖上」`,
      },
      {
        q: 'C++ 内存分区？堆和栈的区别？',
        a: `~~~text
高地址 ┌──────────┐
       │   栈      │ ← 局部变量、函数参数，向下生长
       │   ↓       │
       │   ↑       │
       │   堆      │ ← new/malloc，向上生长
       ├──────────┤
       │ .bss     │ 未初始化全局/静态变量
       ├──────────┤
       │ .data    │ 已初始化全局/静态变量
       ├──────────┤
       │ .text    │ 代码 + 常量（字符串字面量）
       └──────────┘ 低地址
~~~

| 对比 | 栈 | 堆 |
| --- | --- | --- |
| 分配 | 移动栈指针，纳秒级 | malloc 查空闲链表，慢 |
| 大小 | 默认 1~8 MB | 受物理内存/虚拟内存限制 |
| 释放 | 作用域自动 | 手动 delete / 智能指针 |
| 碎片 | 无 | 有 |

常见错误：返回局部变量的引用/指针（栈帧已销毁 → 悬挂引用）、new[] 配 delete（未定义行为，要配 delete[]）、内存泄漏（配 RAII/智能指针解决）。`,
      },
      {
        q: '什么是移动语义和右值引用？std::move 做了什么？',
        a: `**解决的问题**：临时对象（右值）即将销毁，其内部资源（如堆内存）却要被深拷贝一遍再销毁，纯浪费。

**右值引用 T&&** 绑定右值，允许「掏空」临时对象：

~~~cpp
class Buffer {
public:
    Buffer(Buffer&& other) noexcept          // 移动构造
        : data_(other.data_), size_(other.size_) {
        other.data_ = nullptr;               // 置空源，防双重释放
        other.size_ = 0;
    }
private:
    int* data_; size_t size_;
};

std::vector<int> v1(1000000);
auto v2 = std::move(v1);   // O(1) 接管指针，而非 O(n) 拷贝
~~~

**std::move 本身不移动任何东西**——只是把左值**转型为右值引用**（static_cast<T&&>），表达「我不再用它，你可以偷」的意愿；真正的移动发生在移动构造/移动赋值里。

要点：移动构造/移动赋值标记 **noexcept**，vector 扩容时才敢用 move 而非 copy；被 move 后的对象处于「有效但未指定」状态，只能赋新值或销毁。这组机制支撑了 vector 的均摊 O(1) push_back 与 string 的 SSO 等所有现代 C++ 性能特性。`,
      },
      {
        q: '深拷贝和浅拷贝的区别？Rule of Three/Five 是什么？',
        a: `编译器生成的拷贝构造/赋值默认**逐成员拷贝**（浅拷贝）：指针成员只复制地址，两个对象共享同一块堆内存 → 析构时**双重释放**、一方修改另一方可见。

~~~cpp
class Str {
    char* data_;
public:
    Str(const Str& o) : data_(new char[strlen(o.data_) + 1]) {   // 深拷贝
        strcpy(data_, o.data_);
    }
    Str& operator=(const Str& o) {      // 赋值：先自赋值检查，再复制-交换
        if (this != &o) {
            char* p = new char[strlen(o.data_) + 1];
            strcpy(p, o.data_);
            delete[] data_;
            data_ = p;
        }
        return *this;
    }
    ~Str() { delete[] data_; }
};
~~~

**Rule of Three**：需要自定义「析构 / 拷贝构造 / 拷贝赋值」之一，通常三个都需要。

**Rule of Five**（C++11）：再加「移动构造 / 移动赋值」。

**Rule of Zero**（现代最佳实践）：用 vector/string/智能指针管理资源，五个特殊函数全部使用 \`=\` 默认或干脆不写。`,
      },
      {
        q: 'const 关键字有哪些用法？',
        a: `1. **修饰变量**：\`const int n = 5;\` 编译期常量，C++ 中默认内部链接
2. **指针三态**：\`const int* p\`（指向常量，*p 不可改）、\`int* const p\`（指针常量，p 不可改）、\`const int* const p\`（都不可改）——口诀「左定值右定向」
3. **修饰成员函数**：\`int get() const\` 承诺不修改成员（this 变 const 指针），const 对象只能调 const 成员函数；mutable 成员除外
4. **修饰引用参数**：\`void f(const std::string& s)\` 防拷贝 + 防修改，工程标配
5. **修饰返回值**：内置类型意义不大，防止对自定义类型误用运算符
6. **常量成员函数中的坑**：返回成员引用要返回 \`const T&\`，否则外部可绕过 const 修改

延伸：顶层 const 与底层 const 的区分决定拷贝/绑定是否合法；C++11 后编译期常量推荐 constexpr（可在编译期求值，还能修饰函数）。`,
      },
    ],
  },

  // ==================== C ====================
  {
    id: 'c',
    icon: '🔩',
    name: 'C 语言',
    accent: 'purple',
    tagline: '一切系统软件的地基',
    intro:
      'C 语言贴近硬件、运行高效，操作系统内核、驱动、嵌入式、数据库等都由它写成。学习主线：**语法与指针 → 内存管理 → 手写数据结构 → 模块化工程与系统编程**。',
    // 语言概览：总览页与顶部菜单展示的「特性 / 实现与编译原理 / 使用场景」
    overview: {
      meta: [
        { label: '诞生', value: '1972 · Dennis Ritchie（贝尔实验室）' },
        { label: '类型系统', value: '静态弱类型（大量隐式转换）' },
        { label: '范式', value: '过程式（结构化编程）' },
        { label: '执行方式', value: '直接编译为本机机器码' },
      ],
      features: [
        {
          title: '贴近硬件',
          desc: '指针、位运算、可直接操作地址与寄存器，常被称为「可移植的汇编」',
        },
        {
          title: '极小运行时',
          desc: '无 GC、无虚拟机、无异常、无反射，启动几乎零开销，能在裸机与内核里跑',
        },
        {
          title: '手动内存管理',
          desc: 'malloc / free 完全由程序员掌控，灵活但易内存泄漏、悬垂指针、越界',
        },
        {
          title: '极致可移植',
          desc: 'ANSI C 标准（C89 / C99 / C11 / C17 / C23）+ 各平台编译器，几乎所有系统都有 C 编译器',
        },
        {
          title: '过程式 + 结构体',
          desc: '没有类，用 struct + 函数指针模拟面向对象，用头文件做接口声明与实现分离',
        },
        {
          title: '性能与体积',
          desc: '编译产物紧凑、执行效率高，长期是其他语言的性能参照基准',
        },
        {
          title: '需要自律',
          desc: '未定义行为多（越界、有符号溢出、野指针），依赖 -Wall 与 ASan / Valgrind 兜底',
        },
      ],
      compile: {
        summary:
          '预处理 → 编译 → 汇编 → 链接 四阶段直接生成机器码；libc 提供 printf / malloc 等运行时支持，系统调用通过中断陷入内核',
        pipeline: [
          { stage: '预处理（gcc -E）', desc: '展开 #include、宏替换、条件编译，产出 .i' },
          { stage: '编译（gcc -S）', desc: '词法/语法分析建 AST，类型检查与优化，产出汇编 .s' },
          { stage: '汇编（gcc -c）', desc: 'as 把汇编翻译成机器码，产出目标文件 .o' },
          {
            stage: '链接（ld）',
            desc: '解析外部符号（如 printf → libc），重定位地址，生成可执行文件',
          },
          {
            stage: '启动（crt0）',
            desc: '加载器建立栈、初始化 libc，调用 main；返回后 exit 触发 atexit 与流刷新',
          },
          {
            stage: '运行（系统调用）',
            desc: 'read / write / mmap 通过 syscall 指令或 int 0x80 陷入内核，发生用户态↔内核态切换',
          },
        ],
        detail: `## 实现与编译原理

C 是**编译型**语言，编译产物是直接跑在 CPU 上的机器码。语言本身几乎不提供运行时（无 GC、无异常、无反射），这正是它能用来写操作系统内核的前提。

~~~text
hello.c
  │ gcc -E hello.c > hello.i   预处理：#include 展开、宏替换、条件编译
  │ gcc -S hello.i -o hello.s  编译：词法/语法分析 → AST → 优化 → 汇编
  │ gcc -c hello.s -o hello.o  汇编：as 生成机器码与符号表
  │ gcc hello.o -o hello       链接：ld 解析 printf 等外部符号 + 重定位
  ▼
可执行文件（ELF / PE / Mach-O）→ OS 加载 → crt0 初始化 libc → main()
~~~

### 1. 预处理：只是文本处理

- #include &lt;stdio.h&gt; 就是把头文件**原样拷贝**进来；头文件只放声明，定义放 .c，否则重复定义链接错误
- 宏 #define 是纯文本替换：必须加括号（#define SQ(x) ((x)*(x))），否则运算优先级出错；多行宏用反斜杠续行
- 条件编译 #ifdef 用来做平台适配与调试开关，这是 C 可移植性的关键手段

### 2. 编译：从 AST 到机器码

- 词法/语法分析生成 AST；C 的文法有著名的「typedef-name 问题」（需要符号表辅助解析，x * y 可能是乘法也可能是声明）
- 中端优化：常量折叠、公共子表达式消除、寄存器分配（图着色）、循环优化；-O0 / -O2 / -O3 / -Os 控制策略
- 类型系统只在编译期做**检查与隐式转换**（整型提升、有符号/无符号转换），运行时无任何类型信息——所以类型错误不会报错，只会得到错误结果或 UB

### 3. 链接与符号

- 每个 .o 都有符号表：T（已定义全局）、U（未定义待解析）、t/d/b（局部）；用 nm hello.o 可查看
- 链接器做两件事：**符号解析**（把 U 与某个 T 对上，找不到就是 undefined reference，多个就是 duplicate symbol）和**重定位**（把代码里的占位地址改成最终地址）
- 静态库 .a 是 .o 的归档，按需拷入；动态库 .so 运行时由 ld.so 加载，用 GOT / PLT 做延迟绑定
- static 修饰的全局变量与函数只在当前翻译单元可见（内部链接），是 C 里实现「私有」的手段

### 4. 运行时：libc 与系统调用

- C 标准只定义语言与标准库接口；printf、malloc 由 **libc**（glibc / musl / MSVCRT）实现
- 内存分配：malloc 底层用 brk（小内存，移动堆顶）或 mmap（大块内存）向内核申请；free 归还到分配器的空闲链表，不一定真还给内核
- 输入输出：FILE* 是带缓冲的流（stdout 行缓冲、文件全缓冲），fflush 或程序退出时才真正写盘——这就是「printf 没换行看不到输出」的原因
- 系统调用通过 syscall 指令（x86-64）或 int 0x80（x86）陷入内核，开销远大于普通函数调用

### 5. 程序内存布局

~~~text
高地址  ┌──────────────┐
        │  栈 stack    │  局部变量、函数栈帧（向下生长）
        │      ↓       │
        │  （空洞）     │
        │      ↑       │
        │  堆 heap     │  malloc / calloc / realloc（向上生长）
        ├──────────────┤
        │  .bss        │  未初始化全局 / 静态变量（清零，不占文件体积）
        ├──────────────┤
        │  .data       │  已初始化全局 / 静态变量
        ├──────────────┤
        │  .rodata     │  字符串字面量、const 数据（只读）
        ├──────────────┤
低地址  │  .text       │  机器指令（只读 + 可执行）
        └──────────────┘
~~~

### 6. 未定义行为与调试

- 常见 UB：数组越界、解引用野指针、使用未初始化变量、有符号整数溢出、修改字符串字面量、重复 free、函数无返回值
- UB 的后果不是「崩溃」而是「什么都可能发生」，优化器会基于「无 UB」假设删除看似必要的代码
- 工具链：-Wall -Wextra -Werror 编译期告警、**ASan / UBSan**（-fsanitize=address,undefined）、Valgrind（内存泄漏）、gdb（断点调试）
`,
      },
      useCases: [
        { title: '操作系统与内核', desc: 'Linux / Windows 内核主体、FreeBSD、各类 RTOS' },
        {
          title: '嵌入式与单片机',
          desc: '裸机开发、STM32 / 51 固件、FreeRTOS，很多平台只能用 C',
        },
        { title: '驱动开发', desc: 'Linux 内核模块、Windows 驱动、硬件抽象层（HAL）' },
        {
          title: '基础软件',
          desc: 'Redis、SQLite、Nginx、Git、curl，均以体积小、性能高著称',
        },
        {
          title: '语言运行时与解释器',
          desc: 'CPython、Lua、JVM 底层、PHP 解释器都是用 C 写的',
        },
        {
          title: '跨语言 FFI 与高性能库',
          desc: 'C ABI 是事实上的通用接口，几乎所有语言都能调用 C 库',
        },
      ],
    },
    sections: {
      syntax: `## 语法基础

### 第一个程序

~~~c
#include <stdio.h>

int main(void) {
    printf("Hello, C!\\n");
    return 0;
}
~~~

C 是**编译型**语言：预处理（#include/#define 展开）→ 编译 → 汇编 → 链接。理解这四步是排查 C 问题的基础。

### 基本类型与 sizeof

~~~c
char c = 'A';        // 1 字节
int n = 10;          // 通常 4 字节
long long big;       // 8 字节
float f = 1.5f;
double d = 3.14;
size_t len = sizeof(int);   // 编译期求字节数，可移植性关键
~~~

### 指针（C 的灵魂）

~~~c
int x = 10;
int *p = &x;         // p 存 x 的地址
*p = 20;             // 解引用修改 x → 20

int arr[5] = {1, 2, 3, 4, 5};
int *q = arr;        // 数组名退化为首元素指针
*(q + 2)             // 等价 arr[2]，指针算术按元素大小移动

const char *s = "hi";       // 指向常量的指针
void *mem = malloc(100);    // void* 通用指针，需强转
~~~

### 结构体、联合与枚举

~~~c
struct Point { int x, y; };
union Raw {           // 所有成员共享内存，大小 = 最大成员
    int i;
    char bytes[4];    // 常用于查看字节序/位级表示
};
enum Color { RED, GREEN = 5, BLUE };   // BLUE = 6
typedef struct Point Point_t;          // 起别名
~~~

### 预处理与内存管理

~~~c
#define MAX(a, b) ((a) > (b) ? (a) : (b))   // 宏：参数必须加括号！

int *p = malloc(10 * sizeof(int));   // 堆分配
if (p == NULL) return 1;             // 必须判空
free(p);                             // 用完释放
p = NULL;                            // 防野指针
~~~`,
      dataStructures: `## 数据结构：从零手写

C 标准库几乎没有容器（只有 qsort/bsearch），数据结构都要**自己动手实现**——这也是 C 学习的最大价值。

### 动态数组

~~~c
typedef struct {
    int *data;
    size_t size, capacity;
} Vec;

void vec_push(Vec *v, int x) {
    if (v->size == v->capacity) {
        v->capacity = v->capacity ? v->capacity * 2 : 8;   // 倍增
        v->data = realloc(v->data, v->capacity * sizeof(int));
    }
    v->data[v->size++] = x;
}
~~~

### 链表

~~~c
typedef struct Node {
    int val;
    struct Node *next;       // 自引用必须用 struct 关键字
} Node;

// Linux 内核的巧思： intrusive 链表，把 node 嵌进任意结构体
struct list_head { struct list_head *prev, *next; };
#define container_of(ptr, type, member) \\
    ((type *)((char *)(ptr) - offsetof(type, member)))
~~~

### 哈希表、栈、队列与树

~~~text
哈希表：数组 + 链地址法；核心是 hash 函数（如 FNV-1a）与扩容 rehash
栈：    数组 + top 下标（push/pop O(1)），函数调用栈原理
队列：  循环数组（front/rear 取模）或链表，BFS 基础
二叉树：struct TreeNode { int v; struct TreeNode *l, *r; };
        遍历（递归/迭代/Morris）、BST 增删查
~~~

### 标准库相关工具

| 函数 | 用途 | 注意 |
| --- | --- | --- |
| qsort | 通用排序 | 需手写比较函数，回调无内联 |
| bsearch | 二分查找 | 数组必须有序 |
| memcpy / memmove | 内存复制 | 重叠区间必须用 memmove |
| memset | 内存置值 | 只适合清零（按字节填充） |`,
      architecture: `## 常用架构与工程组织

### 模块化 C 工程

~~~text
project/
├── include/           对外头文件（接口契约）
│   └── stack.h        函数声明 + opaque struct（隐藏实现）
├── src/               实现文件
│   └── stack.c
├── tests/             单元测试（Unity/CUnit）
├── Makefile / CMakeLists.txt
└── main.c
~~~

**接口隐藏（不透明指针）**：头文件只暴露 \`typedef struct stack stack_t;\`，实现细节全部藏在 .c 里——C 语言版的「封装」。

~~~c
// stack.h —— 使用者只看得到这些
stack_t *stack_create(size_t cap);
void     stack_push(stack_t *s, int v);
void     stack_destroy(stack_t *s);
~~~

### 典型应用架构

| 领域 | 架构模式 |
| --- | --- |
| Linux 内核 | 子系统分层（VFS→具体 FS）、intrusive 链表、模块动态加载 |
| 嵌入式 | 裸机轮询/前后台（主循环+中断）、RTOS 任务 + 消息队列、HAL 硬件抽象层 |
| 数据库/缓存 | SQLite、Redis：事件循环 + 状态机 + 自研存储结构 |
| 网络 | Reactor 模式：epoll 事件循环 + 非阻塞 IO + 缓冲区管理 |

### 构建与工具链

- **Makefile**：依赖驱动的增量编译；**CMake**：跨平台生成 Makefile
- **静态库 .a**（链接时拷入）/ **动态库 .so**（运行时加载）
- **调试**：gdb（断点/内存查看）、valgrind（内存泄漏检测）、AddressSanitizer（-fsanitize=address，编译期插桩抓越界/UAF）`,
    },
    interview: [
      {
        q: '指针和数组有什么区别？什么时候数组名会退化？',
        a: `| 维度 | 数组 | 指针 |
| --- | --- | --- |
| 本质 | 一段连续内存的别名 | 存地址的变量 |
| sizeof | 整个数组大小 | 8 字节（64 位平台） |
| &arr | 类型 int(*)[5]（整个数组地址） | 指针的地址 |
| 可修改 | ❌ 数组名不是左值 | ✅ p++ 合法 |

**退化（decay）规则**：数组在**三种情况之外**都会退化为指向首元素的指针——\`sizeof(arr)\`、\`&arr\`、用字符串字面量初始化 char 数组。

~~~c
void func(int arr[]) {          // 形参实际是 int*！
    sizeof(arr);                // → sizeof(int*)，不是数组大小！
}                               // 所以 C 函数必须额外传长度
~~~

字符串：\`char *s = "hi"\` 指向只读常量区（不可修改）；\`char s[] = "hi"\` 是栈上数组的拷贝（可修改）。`,
      },
      {
        q: 'malloc 的原理？内存泄漏和野指针如何避免？',
        a: `**malloc 原理**：向 OS 申请大块内存（brk/mmap 系统调用），自己维护**空闲链表**按需切割；free 时把块还回链表并尝试合并相邻空闲块。块头部记录大小，所以 free 只需传指针。频繁申请释放会产生**内存碎片**，小对象分配器（tcmalloc/jemalloc）用尺寸分级 + 线程缓存优化。

**内存泄漏**：malloc 后丢失引用（指针被覆盖/提前 return）→ 用 valgrind、ASan 检测；规则是**谁申请谁释放**，模块化设计成 create/destroy 对称接口。

**野指针三来源**：未初始化的指针、free 后继续用（UAF）、返回局部变量地址。

~~~c
free(p);
p = NULL;              // 释放后立即置空，free(NULL) 是安全的
~~~

其他要点：malloc(0) 返回合法指针或 NULL（实现定义）；realloc 可能搬移内存，返回值要用临时变量接（失败返回 NULL 时原内存仍有效，直接赋值会泄漏）；new 的 C++ 场景一律交给智能指针。`,
      },
      {
        q: 'static 关键字有哪几种用法？',
        a: `1. **修饰局部变量**：改变存储期——从栈变为**静态存储区**，函数返回后值保留，只初始化一次（C 里无线程安全问题需注意，C11 加 _Atomic 才有）。常用于计数器、单例缓存

~~~c
int counter() {
    static int n = 0;    // 只在第一次调用时初始化
    return ++n;
}
~~~

2. **修饰全局变量**：改变**链接性**——从 external 变为 internal，只在本 .c 文件可见，避免命名污染（模块私有数据）

3. **修饰函数**：同理，函数只在本编译单元可见，相当于「private 函数」，头文件不声明

记忆口诀：static 在不同位置改的都是「**生命周期或可见性**」——局部变量改生命周期，全局变量和函数改可见性。面试延伸：C++ 类成员加 static 是属于类而非对象；C11 的 _Thread_local 每线程一份。`,
      },
      {
        q: '如何判断机器是大端还是小端？union 为什么能做到？',
        a: `**大端**（网络字节序）：高位字节存低地址；**小端**（x86/ARM 常见）：低位字节存低地址。

~~~c
// 方法一：union —— 所有成员共享内存
union { int i; char c; } u;
u.i = 1;
if (u.c == 1) puts("小端");     // 01 00 00 00 的第一个字节是 1
else          puts("大端");

// 方法二：指针强转
int x = 1;
if (*(char *)&x == 1) puts("小端");
~~~

**union 能做到**是因为它所有成员从同一地址开始共享内存——int 写入 4 字节后，用 char 读的正是**最低地址的那一个字节**，直接揭示字节序。

工程应用：网络传输/文件格式规定**网络字节序（大端）**，x86 收发要用 htonl/ntohl 转换；序列化协议要显式声明字节序；跨平台读二进制文件同理。`,
      },
      {
        q: '宏和函数的区别？#define 有哪些经典陷阱？',
        a: `| 维度 | 宏 | 函数 |
| --- | --- | --- |
| 展开 | 预处理文本替换 | 真实调用 |
| 开销 | 无调用开销 | 有栈帧开销（可内联消除） |
| 类型检查 | ❌ 无 | ✅ 有 |
| 副作用 | 参数多次求值 | 参数只求值一次 |
| 调试 | 无法断点 | 可调试 |

**经典陷阱**：

~~~c
#define SQUARE(x) x * x
SQUARE(1 + 2)        // → 1 + 2 * 1 + 2 = 5 ！不是 9

#define MAX(a, b) ((a) > (b) ? (a) : (b))
MAX(i++, j)          // i 被加两次！副作用参数出 bug

#define ADD Ten;     // 结尾多分号
if (x) ADD else ...  // 语法错误
~~~

**规范**：参数与整体都加括号；宏体写成单个表达式或用 \`do { } while(0)\` 包多语句；有副作用（++/--/函数调用）的实参别传给宏。现代 C：简单场景用 inline 函数或泛型宏 _Generic 替代；带参宏只留给「类型无关」或「字符串化 # / 拼接 ##」场景。`,
      },
      {
        q: '结构体对齐规则是什么？如何查看/控制对齐？',
        a: `**对齐规则**：

1. 每个成员的偏移量必须是「\`min(自身对齐数, 编译器默认对齐数)\`」的整数倍（默认对齐数常见为 8，#pragma pack 可改）
2. 结构体总大小必须是「最大成员对齐数」的整数倍

~~~c
struct A {           // 32 位下典型布局：
    char  a;         // 偏移 0
                     // 3 字节填充
    int   b;         // 偏移 4
    short c;         // 偏移 8
                     // 2 字节填充
};                   // sizeof = 12，不是 7！
~~~

调整成员顺序（小成员集中放）可减少填充。

**查看与控制**：

- \`offsetof(struct A, b)\` 查成员偏移；\`sizeof\` 查总大小
- \`#pragma pack(1)\` / \`__attribute__((packed))\` 取消填充——**网络协议头、文件格式**必须紧凑对齐才能按字节解析
- 对齐的**原因**：CPU 按字长访问内存，未对齐访问在 x86 变慢、在部分 ARM/老平台直接总线错误

延伸：缓存行（64 字节）伪共享问题——高频并发场景让不同线程写的变量分属不同缓存行（alignas(64)），这是对齐思想在现代硬件上的延续。`,
      },
      {
        q: 'strcpy 和 memcpy 的区别？手写一个安全的字符串拷贝。',
        a: `| 函数 | 停止条件 | 重叠安全 | 场景 |
| --- | --- | --- | --- |
| strcpy | 遇到 \\0 | ❌ | 字符串复制（无界，危险） |
| strncpy | \\0 或 n 字节 | ❌ | 截断语义，注意可能不补 \\0 |
| memcpy | 固定 n 字节 | ❌（重叠未定义） | 任意内存，最快 |
| memmove | 固定 n 字节 | ✅（按方向分派） | 重叠区间 |

~~~c
// 手写 memcpy —— 面试常考：先判空/判重叠，再按字长加速
void *my_memcpy(void *dst, const void *src, size_t n) {
    char *d = dst;
    const char *s = src;
    if (d == s || n == 0) return dst;
    if (d > s && d < s + n) {          // 重叠且 dst 在后 → 从尾向头拷
        while (n--) d[n] = s[n];
    } else {                           // 正常 → 从头向尾拷
        while (n--) *d++ = *s++;
    }
    return dst;
}
~~~

**安全实践**：strcpy/strcat/sprintf 被视为危险函数，改用 \`snprintf\`、\`strlcpy\`、POSIX 的 \`strncpy_s\`；永远保证目标缓冲区足够大并手动补 \\0；memcpy 前用断言校验长度。`,
      },
    ],
  },

  // ==================== JavaScript ====================
  {
    id: 'js',
    icon: '⚡',
    name: 'JavaScript',
    accent: 'amber',
    tagline: '世界上使用最广泛的语言',
    intro:
      'JavaScript 是浏览器唯一原生脚本语言，借助 Node.js 又打通了服务端。学习主线：**语法与 ES6+ → 异步与事件循环 → 原型与闭包 → 前端框架 / Node 后端架构**。',
    // 语言概览：总览页与顶部菜单展示的「特性 / 实现与编译原理 / 使用场景」
    overview: {
      meta: [
        { label: '诞生', value: '1995 · Brendan Eich（Netscape）' },
        { label: '类型系统', value: '动态弱类型（原型链）' },
        { label: '范式', value: '原型对象 / 函数式 / 事件驱动' },
        { label: '执行方式', value: '引擎 JIT（V8 / JSC / SpiderMonkey）' },
      ],
      features: [
        {
          title: '浏览器唯一原生语言',
          desc: '所有浏览器内置 JS 引擎，DOM / BOM / Fetch 由宿主环境提供',
        },
        {
          title: '单线程 + 事件循环',
          desc: '非阻塞异步模型，Promise / async-await 让异步代码接近同步写法',
        },
        {
          title: '原型继承',
          desc: '对象通过原型链查找属性（class 只是语法糖），动态且灵活',
        },
        {
          title: '闭包与一等函数',
          desc: '函数可捕获外层作用域变量，是模块化、柯里化、事件回调的基础',
        },
        {
          title: '动态弱类型',
          desc: '灵活但易错（字符串拼接与隐式转换陷阱），工程上用 TypeScript / JSDoc 补类型',
        },
        {
          title: '跨端能力',
          desc: 'Node.js / Deno / Bun 服务端，React Native / 小程序移动端，Electron 桌面端',
        },
        {
          title: '标准与生态演进',
          desc: 'ECMAScript 年度发布（ES6+），npm 包量最大；Vite / webpack / esbuild / Babel 构成现代工具链',
        },
      ],
      compile: {
        summary:
          'V8 先把源码解析为 AST，Ignition 生成紧凑字节码解释执行并收集类型反馈，热点函数交给 TurboFan 做 JIT 优化编译',
        pipeline: [
          { stage: '源码获取', desc: '浏览器 / Node 拿到 JS 文本；ESM 还需先解析 import 依赖图' },
          {
            stage: '解析（Parser）',
            desc: '预解析（lazy parsing）跳过函数体，主解析生成 AST',
          },
          { stage: '字节码生成（Ignition）', desc: 'AST → 紧凑字节码，节省内存、加快启动' },
          {
            stage: '解释执行 + 类型反馈',
            desc: '逐条执行字节码，Inline Cache 记录属性访问的实际类型与隐藏类（Shape）',
          },
          {
            stage: 'JIT 优化（TurboFan）',
            desc: '热点函数结合类型反馈生成特化机器码（内联、逃逸分析、去虚化）',
          },
          {
            stage: '去优化（Deopt）',
            desc: '类型假设失效（隐藏类改变）时丢弃机器码回退字节码，因此应保持对象结构稳定',
          },
          {
            stage: '事件循环',
            desc: '调用栈清空后依次处理微任务（Promise）与宏任务（setTimeout / IO 回调），实现单线程非阻塞',
          },
        ],
        detail: `## 实现与编译原理

JavaScript 是「**解释 + JIT**」的动态语言：引擎在运行时才知道变量类型，因此必须一边执行一边收集类型信息，再把热点代码编译成机器码。

~~~text
JS 源码
  │ Parser（预解析 lazy parse + 主解析）
  ▼
AST
  │ Ignition（解释器）
  ▼
字节码 ──执行──► Inline Cache 收集类型反馈 / 隐藏类 Shape
  │ 函数变「热」
  ▼
TurboFan（优化编译器）→ 特化机器码 ──假设失效──► Deopt 回退字节码
~~~

### 1. 解析与 AST

- **预解析（lazy parsing）**：只检查函数体语法、记录变量声明，不建 AST——大幅提升启动速度
- 遇到调用才做完整解析；这也是 script 标签阻塞渲染、defer / module 延迟执行的原因
- 严格模式（use strict）与 ES Module 默认严格：禁用 with、禁止未声明赋值、this 不自动装箱

### 2. 字节码与 Ignition

- V8 早期（Full-codegen）直接把 AST 编译成机器码，内存占用高；2016 年改为 **Ignition 字节码**，体积更小、启动更快
- Safari 的 JavaScriptCore（LLInt → Baseline → DFG → FTL）、Firefox 的 SpiderMonkey（Warp）思路类似

### 3. 隐藏类（Shape）与 Inline Cache

- 对象的属性布局被抽象为**隐藏类**：按同样顺序添加属性的对象共享同一 Shape，属性访问可编译成「固定偏移量读取」
- **IC（内联缓存）**：把「属性名 → 偏移量」的查找结果缓存起来；单态（monomorphic）最快，多态次之，超形态（megamorphic）退化为字典查找
- 实践建议：在构造函数里一次性初始化全部属性、避免 delete、避免同一函数处理结构差异极大的对象

### 4. JIT 优化与去优化

- TurboFan 基于类型反馈做**推测性优化**：内联小函数、逃逸分析（标量替换、避免堆分配）、消除边界检查、常量折叠
- 假设失效即 **deoptimization**：例如一直被当作 SMI（小整数）的变量突然出现字符串，或隐藏类变了
- 数字统一用 64 位 double（IEEE 754）表示，V8 用 **SMI tagging** 把小整数打包进指针以加速运算；0.1 + 0.2 !== 0.3 是浮点精度问题，金额运算请用整数分、BigInt 或 decimal 库

### 5. 事件循环与并发

~~~text
调用栈（单线程）→ 清空后
  1) 微任务队列：Promise.then / queueMicrotask / MutationObserver（全部清空）
  2) 宏任务队列：setTimeout / setInterval / I/O / UI 事件（取一个执行）
  3) 循环往复；Node 还有 nextTick 队列（优先级最高）与 libuv 线程池
~~~

- 单线程意味着**长任务会阻塞渲染**：拆分为 setTimeout / requestIdleCallback、Web Worker，或改成流式处理
- Node.js 的 I/O 由 **libuv**（线程池 + epoll / kqueue / IOCP）承担，回调再回到主线程执行

### 6. 模块与打包

- 历史上三套模块方案：CommonJS（require，同步加载，Node 默认）、AMD（已淘汰）、**ESM**（import / export，静态可分析、支持 Tree Shaking 与顶层 await）
- 浏览器不能直接跑 npm 包与 TS，因此需要构建：**Babel / SWC**（语法降级）→ **打包器**（Vite / webpack / esbuild / Rollup，模块合并、按需加载、Tree Shaking）→ 压缩与 Source Map
- Vite 开发态利用浏览器原生 ESM 免打包，生产态用 Rollup 打包

### 7. 类型补充

- TypeScript 是 JS 的超集：编译期做类型检查后**擦除类型**产出普通 JS，运行时无任何类型信息（和 Java 泛型擦除同理）
- 大型项目建议 TypeScript 或 JSDoc + ts-check，兼顾灵活性与可维护性
`,
      },
      useCases: [
        {
          title: '前端 Web 开发',
          desc: 'React / Vue / Angular 单页应用，所有浏览器原生支持',
        },
        {
          title: '服务端与 BFF',
          desc: 'Node.js / Nest / Express / Koa，SSR 与 API 网关，前后端同构',
        },
        {
          title: '跨端移动应用',
          desc: 'React Native、微信小程序、uni-app，一套代码多端运行',
        },
        {
          title: '桌面应用',
          desc: 'Electron（VS Code、Slack）、Tauri 的前端层',
        },
        {
          title: 'Serverless 与边缘计算',
          desc: 'Vercel / Cloudflare Workers，冷启动快、按量付费',
        },
        {
          title: '工具链与自动化测试',
          desc: '构建工具、CLI、npm 生态、Playwright / Cypress 端到端测试',
        },
        { title: '可视化与互动', desc: 'ECharts / D3 / Three.js 数据大屏与 3D 展示' },
      ],
    },
    sections: {
      syntax: `## 语法基础

### 第一个程序

~~~javascript
console.log("Hello, JavaScript!");
~~~

JS 是**动态弱类型**、**单线程**、**解释执行（JIT 编译）**的语言，标准叫 ECMAScript（ES6/ES2015 是里程碑版本）。

### 变量与现代语法（ES6+）

~~~javascript
let x = 1;              // 可变
const PI = 3.14;        // 常量（首选，禁止重新赋值）

// 模板字符串
const msg = \`Hello, \${name}! 明年 \${age + 1} 岁\`;

// 解构赋值
const { id, name: username = "匿名" } = user;
const [first, ...rest] = [1, 2, 3];

// 展开运算符
const merged = [...arr1, ...arr2];
const copy = { ...obj, extra: true };
~~~

### 函数

~~~javascript
// 箭头函数：没有自己的 this，会捕获外层
const add = (a, b) => a + b;
const double = x => x * 2;

// 默认参数 + 剩余参数
function greet(name = "游客", ...tags) { return \`\${name}: \${tags.join(",")}\`; }

// 函数是一等公民：可传可返回
const nums = [3, 1, 2];
nums.sort((a, b) => a - b).map(x => x * 10).filter(x => x > 10);
~~~

### 异步：Promise 与 async/await

~~~javascript
// Promise 三状态：pending → fulfilled / rejected（不可逆）
fetch("/api/user")
  .then(res => res.json())          // 链式调用，避免回调地狱
  .then(data => console.log(data))
  .catch(err => console.error(err));

// async/await：同步风格写异步（本质是 Promise 语法糖）
async function loadUser() {
  try {
    const res = await fetch("/api/user");
    return await res.json();
  } catch (e) {
    console.error("加载失败", e);
  } finally {
    hideLoading();
  }
}
~~~

### 类与模块

~~~javascript
class Animal {
  #secret = "私有字段";              // # 开头即私有（ES2022）
  static count = 0;                  // 静态属性
  constructor(name) { this.name = name; }
  speak() { return \`\${this.name} 叫了\`; }
}
class Dog extends Animal {
  speak() { return \`\${this.name} 汪汪\`; }   // 继承 + 重写
}

// ES Module（浏览器与 Node 通用标准）
export const util = () => {};
import { util } from "./util.js";
~~~`,
      dataStructures: `## 数据结构：内置与经典实现

### 数组：最常用的结构

~~~javascript
const arr = [1, 2, 3];
arr.push(4); arr.pop();            // 尾部 O(1)
arr.shift(); arr.unshift(0);       // 头部 O(n)！大量头部操作用队列实现

// 高阶函数三件套
const names = users.map(u => u.name);                  // 一一映射
const adults = users.filter(u => u.age >= 18);         // 过滤
const total = orders.reduce((sum, o) => sum + o.price, 0);  // 聚合

// 查找与判断
arr.find(x => x.id === 5);         // 找元素
arr.includes(3);                   // 是否包含（NaN 也能判对）
arr.flatMap(x => [x, x * 2]);      // map + flat
~~~

### Map 与 Set（ES6，修复了「对象当哈希」的缺陷）

~~~javascript
// Map：任意类型做 key、记住插入顺序、size 是属性、可直接遍历
const cache = new Map();
cache.set([1, 2], "数组也能做 key");
cache.get([1, 2]);                 // undefined！引用比较

// Set：去重神器
const unique = [...new Set([1, 2, 2, 3])];      // [1, 2, 3]

// WeakMap/WeakSet：弱引用 key，不阻止垃圾回收，适合私有数据/缓存
const privateData = new WeakMap();
privateData.set(domNode, { clicks: 0 });        // DOM 移除后自动清理
~~~

### 常见坑：对象当哈希表

~~~javascript
const scores = {};
scores["name"] = 5;
Object.keys(scores);               // 原型链上的属性可能干扰
// key 全被转成字符串：scores[1] 和 scores["1"] 冲突
// → 需要"真哈希表"语义时一律用 Map
~~~

### 手写经典结构（面试高频）

~~~javascript
// 用对象/Map 手写 LRU 缓存（146 题）
class LRUCache {
  constructor(capacity) { this.cap = capacity; this.map = new Map(); }
  get(key) {
    if (!this.map.has(key)) return -1;
    const val = this.map.get(key);
    this.map.delete(key); this.map.set(key, val);   // 重新插入到「最新」位
    return val;
  }
  put(key, value) {
    if (this.map.has(key)) this.map.delete(key);
    else if (this.map.size >= this.cap) this.map.delete(this.map.keys().next().value);  // 淘汰最旧
    this.map.set(key, value);
  }
}
~~~

其他常手写：链表（对象 + next 指针）、栈/队列（数组 + 指针下标）、二叉树（节点对象递归）、Trie 前缀树（每层一个 Map）。`,
      architecture: `## 常用架构与生态

### 前端：组件化架构

~~~text
组件（Component）  ←  UI 拆分的基本单位：模板 + 逻辑 + 样式
    ↓ 组合
页面（Page / View）
    ↓ 共享
状态管理（Redux / Pinia / Zustand）  ←  跨组件共享状态单一数据源
    ↓
路由（React Router / Vue Router）   ←  SPA 的页面调度
~~~

| 框架 | 核心机制 |
| --- | --- |
| React | JSX + 虚拟 DOM + Fiber 可中断渲染 + Hooks；单向数据流 |
| Vue | 模板 + 响应式（Proxy）+ 编译期优化；组合式 API |
| 新趋势 | Solid/Svelte 编译时响应、Next.js/Nuxt 全栈框架（SSR/SSG） |

### Node.js 后端：分层 + 中间件

~~~text
请求 → 路由层（Express/Koa Router）
     → 控制器（参数校验）
     → 服务层（业务逻辑）
     → 数据层（Prisma/TypeORM/Mongoose）
     → 响应
横切：认证(JWT) / 日志 / 限流 —— 中间件洋葱模型层层包裹
~~~

- **Express**：经典中间件模型（线性 next）
- **Koa**：async/await 原生支持，洋葱模型（进出各执行一半）
- **NestJS**：Angular 风格的依赖注入 + 装饰器，大型 Node 项目的工程化方案

### 工程化与运行时

- **构建**：Vite（开发秒启，ESM 按需编译）、Webpack（老牌全能）、esbuild/SWC（Go/Rust 加速）
- **语言增强**：TypeScript——大型 JS 项目的标配（静态类型 + 智能提示）
- **运行时**：Node.js（V8 + libuv 事件循环）、Deno/Bun（新运行时）
- **测试**：Vitest / Jest；**质量**：ESLint + Prettier`,
    },
    interview: [
      {
        q: '说说 JavaScript 的事件循环（Event Loop）。宏任务和微任务有什么区别？',
        a: `JS 是**单线程**的，异步靠事件循环调度。每轮循环：

1. 执行完当前**同步代码**（执行栈清空）
2. 清空**整个微任务队列**（MutationObserver、Promise.then、queueMicrotask）
3. 取**一个**宏任务执行（setTimeout、setInterval、I/O、UI 渲染事件）
4. 回到第 2 步，循环往复

~~~javascript
console.log("1");
setTimeout(() => console.log("2"), 0);        // 宏任务
Promise.resolve().then(() => console.log("3"));  // 微任务
queueMicrotask(() => console.log("4"));
console.log("5");
// 输出：1 5 3 4 2
~~~

关键点：微任务在**每个宏任务之后、渲染之前**全部清空，所以 Promise.then 总比 setTimeout 先执行；Node 11+ 与浏览器行为对齐（每轮只取一个宏任务），Node 还有 process.nextTick（优先级最高的微任务）。async/await 中 await 之后的代码等价于放在 then 里，是微任务。`,
      },
      {
        q: '什么是闭包？有哪些应用场景和坑？',
        a: `**闭包** = 函数 + 其定义时所处的词法作用域。内层函数引用了外层函数的变量，即使外层函数已返回，变量依然存活。

~~~javascript
function makeCounter() {
  let count = 0;                 // 被闭包「记住」
  return {
    inc: () => ++count,
    get: () => count,
  };
}
const c = makeCounter();
c.inc(); c.inc();
c.get();                         // 2 —— count 无法被外部直接访问
~~~

**应用场景**：模块化私有变量（上面的计数器）、防抖/节流（记住 timer）、柯里化（记住已传参数）、React Hooks 的状态保持、循环中的 IIFE 捕获。

**经典坑**：

~~~javascript
for (var i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 3 3 3
for (let i = 0; i < 3; i++) setTimeout(() => console.log(i));   // 0 1 2
// var 是函数作用域，三次回调共享同一个 i；let 每轮创建新的块级绑定
~~~

**内存**：闭包会让被引用变量无法回收，长期持有大对象（如 DOM）会导致泄漏——不再需要时置 null 断开引用。`,
      },
      {
        q: '原型链是什么？JS 如何实现继承？',
        a: `每个对象都有一个内部指针 \`__proto__\`（规范名 [[Prototype]]）指向其原型对象；访问属性时沿原型链向上查找直到 Object.prototype（其 __proto__ 为 null）。**构造函数的 prototype** 属性是实例的原型。

~~~javascript
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return \`\${this.name} 叫\`; };

const a = new Animal("猫");
a.speak();                    // 实例没有 → 找到 Animal.prototype
a.__proto__ === Animal.prototype;        // true
Animal.prototype.__proto__ === Object.prototype;  // 原型链终点前一站
~~~

**继承的演进**：

1. 原型链继承：\`Child.prototype = new Parent()\` —— 引用类型属性被所有实例共享
2. 借用构造函数：Child 里 \`Parent.call(this)\` —— 解决共享但无法继承原型方法
3. 组合继承（经典）：两者结合，但父构造函数被调两次
4. **寄生组合式（最优）**：\`Child.prototype = Object.create(Parent.prototype)\`
5. **ES6 class extends**：本质就是寄生组合的语法糖，用 \`Object.getPrototypeOf\` 可验证

面试延伸：\`instanceof\` 的原理就是沿原型链查找构造函数的 prototype；\`Object.create(null)\` 创建无原型的干净对象。`,
      },
      {
        q: 'this 的指向规则？call、apply、bind 有什么区别？',
        a: `**this 由调用方式决定**（箭头函数除外），优先级从高到低：

1. \`new\` 调用 → 绑定到新创建的对象
2. call/apply/bind 显式指定 → 绑定到传入的第一个参数
3. \`obj.fn()\` 方法调用 → 绑定到 obj
4. 普通函数调用 \`fn()\` → 非严格模式 window/globalThis，严格模式 undefined
5. **箭头函数** → 没有自己的 this，沿用**定义时外层**的 this（词法作用域）

~~~javascript
const obj = {
  name: "A",
  normal()  { console.log(this.name); },
  arrow: () => console.log(this?.name),   // 定义在 obj 字面量 → 外层是模块 → undefined
  delayed() { setTimeout(() => console.log(this.name), 0); },  // 箭头捕获 delayed 的 this → "A"
};
~~~

**三兄弟对比**：

- \`fn.call(ctx, a, b)\`：立即调用，参数逐个传
- \`fn.apply(ctx, [a, b])\`：立即调用，参数是数组（适合 Math.max.apply(null, arr)）
- \`fn.bind(ctx, a)\`：**不调用**，返回永久绑定的新函数（可预设参数，常用于事件回调）

三者对箭头函数无效——箭头函数的 this 无法被改变。`,
      },
      {
        q: 'var、let、const 的区别？什么是暂时性死区？',
        a: `| 维度 | var | let | const |
| --- | --- | --- | --- |
| 作用域 | 函数作用域 | 块级作用域 {} | 块级作用域 |
| 变量提升 | ✅ 提升且初始化为 undefined | 提升但不初始化（TDZ） | 同 let |
| 重复声明 | ✅ 允许 | ❌ 报错 | ❌ 报错 |
| 重新赋值 | ✅ | ✅ | ❌（引用内容可变） |

**暂时性死区（TDZ）**：从块作用域开始到 \`let/const\` 声明语句之间的区域，访问变量直接抛 ReferenceError——这就是「提升但不初始化」的表现。

~~~javascript
console.log(a);   // undefined（var 提升并初始化）
var a = 1;

console.log(b);   // ReferenceError（TDZ）
let b = 2;

const arr = [1];
arr.push(2);      // ✅ const 只锁「绑定」，不锁内容
arr = [];         // ❌ TypeError
~~~

**实践规范**：默认用 const；需要重新赋值才用 let；var 只在维护老代码时出现。const 声明的对象/数组内容仍可变——需要深度不可变用 Object.freeze()（浅冻结）。`,
      },
      {
        q: '手写防抖（debounce）和节流（throttle），并说明适用场景。',
        a: `~~~javascript
// 防抖：n 毫秒内多次触发只执行最后一次（等用户停下来）
function debounce(fn, delay) {
  let timer = null;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// 节流：n 毫秒内最多执行一次（控制频率）
function throttle(fn, interval) {
  let last = 0;
  return function (...args) {
    const now = Date.now();
    if (now - last >= interval) {
      last = now;
      fn.apply(this, args);
    }
  };
}
~~~

**场景区分**：

| 场景 | 方案 |
| --- | --- |
| 搜索框输入联想 | 防抖：停止输入 300ms 再请求 |
| 窗口 resize 重算布局 | 防抖：只在结束时算一次 |
| 按钮防重复提交 | 防抖（或一次性锁） |
| scroll 滚动加载/吸顶计算 | 节流：每 200ms 一次 |
| 鼠标移动拖拽 | 节流：按帧率控制 |

进阶：防抖可加 immediate 参数（首次立即执行）；节流可用 requestAnimationFrame 替代定时器；React 中注意闭包陷阱（useRef 保存 timer，useEffect 清理）。`,
      },
      {
        q: '如何实现深拷贝？JSON.parse(JSON.stringify()) 有哪些缺陷？',
        a: `**JSON 法的缺陷**：

~~~javascript
const obj = {
  fn: () => {},        // ❌ 函数丢失（undefined）
  date: new Date(),    // ❌ 变字符串
  reg: /abc/g,         // ❌ 变空对象
  key: undefined,      // ❌ 直接被删掉
  nan: NaN,            // ❌ 变 null
};
// 循环引用直接抛 TypeError：Converting circular structure to JSON
~~~

**手写递归版**（面试标准答案）：

~~~javascript
function deepClone(source, map = new WeakMap()) {   // WeakMap 防循环引用
  if (source === null || typeof source !== "object") return source;
  if (source instanceof Date) return new Date(source);
  if (source instanceof RegExp) return new RegExp(source.source, source.flags);
  if (map.has(source)) return map.get(source);      // 已拷贝过 → 直接返回

  const target = Array.isArray(source) ? [] : {};
  map.set(source, target);
  for (const key of Reflect.ownKeys(source)) {      // 包含 Symbol
    target[key] = deepClone(source[key], map);
  }
  return target;
}
~~~

要点：用 **WeakMap 记录已拷贝对象**解决循环引用；处理 Date/RegExp/Symbol 键；函数按引用共享（函数无状态可接受）。**生产环境**用 structuredClone()（浏览器/Node 17+ 原生，支持循环引用、内置类型，但函数仍不支持）或 lodash 的 \_.cloneDeep。`,
      },
    ],
  },
]

// ==================== 便捷派生数据 ====================

/** 强调色 → 主题语义色变量（主页面卡片 / 子页面共用） */
const accentVarMap = {
  orange: 'var(--c-orange)',
  blue: 'var(--c-blue)',
  purple: 'var(--c-purple)',
  amber: 'var(--c-amber)',
  green: 'var(--c-green)',
}

export function getAccentVar(accent) {
  return accentVarMap[accent] || 'var(--c-blue)'
}

/**
 * 构造语言卡片数据（主页面 /languages 的 LanguageCard 使用）
 * 卡片上只放标题级摘要（特性/场景的名称 + 编译原理一句话），
 * 完整介绍（特性详解 / 流水线 / 长文）在子页面的「语言概览」里
 */
function buildLanguageCard(l) {
  return {
    label: l.name,
    to: `/languages/${l.id}`,
    icon: l.icon,
    accent: l.accent,
    accentVar: getAccentVar(l.accent),
    tagline: l.tagline,
    features: l.overview.features.map((f) => f.title),
    compile: l.overview.compile.summary,
    useCases: l.overview.useCases.map((u) => u.title),
    interviewCount: l.interview.length,
  }
}

/** 主页面卡片数据（顶部导航已不再做下拉弹框，因此只需这一份） */
export const languageCards = languages.map(buildLanguageCard)

/** 语言主页面地址（顶部一级菜单「计算机语言」的链接目标） */
export const languageOverviewPath = '/languages'

/** 详情页四个板块的元信息（顺序即展示顺序） */
export const languageSections = [
  { key: 'syntax', label: '语法基础', icon: '📖' },
  { key: 'dataStructures', label: '数据结构', icon: '🧱' },
  { key: 'architecture', label: '常用架构', icon: '🏗️' },
]

/** 按语义 id 查找语言 */
export function getLanguageById(id) {
  return languages.find((l) => l.id === id)
}
