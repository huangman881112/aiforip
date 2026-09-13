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
    name: 'Java',
    accent: 'orange',
    tagline: '一次编写，到处运行',
    intro:
      'Java 是强类型的面向对象语言，凭借 JVM 的跨平台能力、完善的生态（Spring 全家桶）和二十余年的企业级沉淀，长期占据服务端开发的主导地位。学习主线：**语法基础 → 集合框架 → JVM 与并发 → Spring 生态**。',
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
    name: 'Python',
    accent: 'blue',
    tagline: '人生苦短，我用 Python',
    intro:
      'Python 以简洁优雅的语法著称，覆盖 Web 后端、数据科学、人工智能、自动化脚本等场景。学习主线：**语法基础 → 标准库与数据结构 → 装饰器/生成器等高级特性 → Web/数据框架**。',
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
    name: 'C++',
    accent: 'blue',
    tagline: '不牺牲性能的抽象',
    intro:
      'C++ 在 C 的基础上引入面向对象、模板与 RAII，既能写底层高性能代码，又能做大规模工程抽象。学习主线：**语法与内存模型 → 类与 RAII → STL → 智能指针/移动语义/模板**。',
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
    name: 'C 语言',
    accent: 'purple',
    tagline: '一切系统软件的地基',
    intro:
      'C 语言贴近硬件、运行高效，操作系统内核、驱动、嵌入式、数据库等都由它写成。学习主线：**语法与指针 → 内存管理 → 手写数据结构 → 模块化工程与系统编程**。',
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
    name: 'JavaScript',
    accent: 'amber',
    tagline: '世界上使用最广泛的语言',
    intro:
      'JavaScript 是浏览器唯一原生脚本语言，借助 Node.js 又打通了服务端。学习主线：**语法与 ES6+ → 异步与事件循环 → 原型与闭包 → 前端框架 / Node 后端架构**。',
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

/** 语言导航清单（App.vue 顶部「计算机语言」下拉菜单） */
export const languageMenu = languages.map((l) => ({ label: l.name, to: `/languages/${l.id}` }))

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
