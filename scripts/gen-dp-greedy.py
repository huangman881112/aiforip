#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""一次性生成器：把「动态规划 / 贪心算法」条目写入
   - suanfa_vue/src/data/algorithms.js（数组末尾 + 派生导出）
   - backend/src/main/resources/seed/algorithms.json
   - backend/src/main/resources/seed/algorithms-content.json
   按 id 去重：只追加新条目，已有条目不动。
"""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
JS_FILE = ROOT / "suanfa_vue/src/data/algorithms.js"
META_FILE = ROOT / "backend/src/main/resources/seed/algorithms.json"
CONTENT_FILE = ROOT / "backend/src/main/resources/seed/algorithms-content.json"


def md(s):
    """压缩多余空行，保持 markdown 稳定"""
    lines = [l.rstrip() for l in s.strip("\n").split("\n")]
    out = []
    for l in lines:
        if l == "" and out and out[-1] == "":
            continue
        out.append(l)
    return "\n".join(out)


# ============================================================
# 算法内容定义
# ============================================================
A = []


def add(**kw):
    A.append(kw)


# ------------------------------------------------------------ 动态规划

add(
    id="climbing-stairs",
    name="爬楼梯",
    category="dp",
    sub_category="线性DP",
    difficulty="简单",
    complexity="O(n)",
    space="O(1)",
    desc="每次可以上 1 阶或 2 阶，问爬到第 n 阶一共有多少种不同的走法。它是理解「状态 + 转移方程」的最小 DP 模型。",
    time=[("最坏情况", "O(n)"), ("最好情况", "O(1)（读边界）"), ("平均情况", "O(n)")],
    extras=[("等价的数学形式", "斐波那契数列 F(n+1)"), ("能否进一步优化", "矩阵快速幂 O(log n)")],
    state="dp[i]：站上第 i 阶的方案总数",
    trans="dp[i] = dp[i-1] + dp[i-2]（最后一步要么跨 1 阶，要么跨 2 阶，两类方案互不重叠）",
    base="dp[0] = 1（站在平地的空方案），dp[1] = 1",
    order="i 从小到大",
    pseudo="""function climbStairs(n):
  if n <= 1: return 1
  dp[0] = 1
  dp[1] = 1
  for i from 2 to n:
    dp[i] = dp[i-1] + dp[i-2]
  return dp[n]""",
    py="""def climb_stairs(n: int) -> int:
    a, b = 1, 1  # dp[i-2], dp[i-1]
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


print(climb_stairs(6))  # 13""",
    js="""function climbStairs(n) {
  let a = 1, b = 1; // dp[i-2], dp[i-1]
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(climbStairs(6)); // 13""",
    adv="""### 空间优化

只依赖前两项，所以整张表可以压缩成两个滚动变量：空间从 O(n) 降到 O(1)。
这也是 DP 中「滚动数组」优化的起点：**如果第 i 层只依赖有限几层，就只保留那几层**。

### 常见坑

1. **把 dp[0] 写成 0**：dp[0] 是「空方案」，必须是 1，否则后面全错。
2. **误当成组合数**：`1+2` 与 `2+1` 是两种不同的走法，DP 数的是「有序方案数」。
3. 若题目改成「每次可以跨 1~k 阶」，转移变成 `dp[i] = dp[i-1] + ... + dp[i-k]`，可用前缀和维持 O(1) 转移。

### 变体与应用

- **爬楼梯 II（带代价）**：加上 `cost[i]`，转移变为 `dp[i] = min(dp[i-1]+cost[i-1], dp[i-2]+cost[i-2])`，于是计数问题变成最优化问题。
- **带禁区的台阶**、**斐波那契数列**、**拼硬币方案数**都是同一个骨架。
- 若 n 达到 10^18，用矩阵 `[[1,1],[1,0]]` 的快速幂把复杂度降到 O(log n)。""",
    notes="""### 学习笔记

爬楼梯是动态规划的「Hello World」。真正要记住的不是答案 13，而是这三步：

1. 定义状态：dp[i] 表示到第 i 阶的方案数；
2. 写出转移：最后一步只有两种可能，所以 dp[i] = dp[i-1] + dp[i-2]；
3. 确定边界与顺序：dp[0]=1，i 从小到大填表。

想清楚「dp[i] 到底代表什么」，比背代码重要得多。状态定义错了，后面的转移方程都是空中楼阁。""",
)

add(
    id="max-subarray",
    name="最大子数组和",
    category="dp",
    sub_category="线性DP",
    difficulty="简单",
    complexity="O(n)",
    space="O(1)",
    desc="在整数数组中找一个连续子数组，使其元素之和最大。Kadane 算法是一维 DP 的经典范例：状态必须带上「以 i 结尾」这个后缀条件。",
    time=[("最坏情况", "O(n)"), ("最好情况", "O(n)"), ("平均情况", "O(n)")],
    extras=[("分治做法", "O(n log n)"), ("能否记录方案", "可以，维护起点即可")],
    state="f[i]：以 a[i] **结尾**的连续子数组的最大和",
    trans="f[i] = max(f[i-1] + a[i], a[i])：要么把 a[i] 接到前面那段后面，要么从 a[i] 重新开一段",
    base="f[1] = a[1]；答案 = max(f[1..n])",
    order="i 从小到大，一趟扫描",
    pseudo="""function maxSubArray(a):
  f = a[0]
  ans = a[0]
  for i from 1 to length(a)-1:
    f = max(f + a[i], a[i])
    ans = max(ans, f)
  return ans""",
    py="""def max_sub_array(a):
    f = ans = a[0]
    for x in a[1:]:
        f = max(f + x, x)   # 接上前面，或者从这里重开
        ans = max(ans, f)
    return ans


# 需要输出具体区间时：
def max_sub_array_range(a):
    f = ans = a[0]
    start = best_l = best_r = 0
    for i, x in enumerate(a[1:], 1):
        if f + x < x:
            f, start = x, i
        else:
            f += x
        if f > ans:
            ans, best_l, best_r = f, start, i
    return ans, best_l, best_r""",
    js="""function maxSubArray(a) {
  let f = a[0], ans = a[0];
  for (let i = 1; i < a.length; i++) {
    f = Math.max(f + a[i], a[i]);
    ans = Math.max(ans, f);
  }
  return ans;
}""",
    adv="""### 为什么状态必须写「以 i 结尾」

如果定义成「前 i 个元素的最大子数组和」，就无法判断 a[i] 是否要和前面连起来——信息不够。
DP 里这叫**状态设计要包含「转移所需的全部信息」**。加上后缀条件后，转移只剩一个比较。

### 常见坑

1. **全负数组**：初值必须取 `a[0]` 而不是 `0`，否则会返回 0（即「空子数组」），与「至少选一个元素」的题意冲突。
2. `ans` 与 `f` 是两件事：`f` 是当前结尾的最优，`ans` 是全局最优，忘记更新 `ans` 是最常见的 bug。
3. 用 `if (f < 0) f = 0` 的写法等价，但会在全负数组时给出 0，注意题意。

### 变体与应用

- **最大子矩阵和**：枚举上下边界压成一维列和，再套 Kadane，O(n³)。
- **乘积最大子数组**：同时维护最大值和最小值（负负得正）。
- **环形子数组最大和**：答案 = max(普通最大和, 总和 − 最小子数组和)。
- 实际用途：股票收益、信号峰值检测、Grenander–Sharpe 统计检验等。""",
    notes="""### 学习笔记

Kadane 算法妙在一句话：**「前面那一段如果是拖累，就扔掉重开」**。

我把它的状态定义记成 `f[i] = 以 i 结尾的最优`，这是线性 DP 里最好用的一种套路：
一旦要求「必须以某个位置结尾」，转移就一定只跟前一个位置有关，于是一趟扫描就能出答案。

另外 `ans = max(ans, f[i])` 这一行不能省：最终答案是所有后缀里的最大值，而不是最后一个位置的值。""",
)

add(
    id="lis",
    name="最长递增子序列",
    category="dp",
    sub_category="线性DP",
    difficulty="中等",
    complexity="O(n²)",
    space="O(n)",
    desc="给定序列 a，求最长的严格递增子序列（不要求连续）的长度。O(n²) 的 DP 版本能看清「以 i 结尾」的状态如何被逐个 j 更新。",
    time=[("最坏情况", "O(n²)"), ("最好情况", "O(n²)"), ("平均情况", "O(n²)"), ("贪心+二分版本", "O(n log n)")],
    extras=[("能否还原方案", "可以，额外记录 prev[i]"), ("非严格递增", "把 < 改成 ≤，二分改成 upper_bound")],
    state="dp[i]：以 a[i] **结尾**的递增子序列的最大长度",
    trans="dp[i] = 1 + max{ dp[j] | j < i 且 a[j] < a[i] }，若不存在这样的 j 则 dp[i] = 1",
    base="所有 dp[i] 初值为 1（每个元素自身就是长度 1 的子序列）",
    order="i 从小到大；每个 i 内部枚举 j < i",
    pseudo="""function LIS(a):
  n = length(a)
  for i from 0 to n-1: dp[i] = 1
  for i from 1 to n-1:
    for j from 0 to i-1:
      if a[j] < a[i]:
        dp[i] = max(dp[i], dp[j] + 1)
  return max(dp)""",
    py="""def lis_length(a):
    n = len(a)
    dp = [1] * n
    for i in range(1, n):
        for j in range(i):
            if a[j] < a[i]:
                dp[i] = max(dp[i], dp[j] + 1)
    return max(dp)


def lis_sequence(a):
    \"\"\"O(n^2) 并还原一条方案\"\"\"
    n = len(a)
    dp, prev = [1] * n, [-1] * n
    for i in range(1, n):
        for j in range(i):
            if a[j] < a[i] and dp[j] + 1 > dp[i]:
                dp[i], prev[i] = dp[j] + 1, j
    end = max(range(n), key=lambda i: dp[i])
    seq = []
    while end != -1:
        seq.append(a[end])
        end = prev[end]
    return seq[::-1]""",
    js="""function lisLength(a) {
  const n = a.length;
  const dp = new Array(n).fill(1);
  let ans = 1;
  for (let i = 1; i < n; i++) {
    for (let j = 0; j < i; j++) {
      if (a[j] < a[i]) dp[i] = Math.max(dp[i], dp[j] + 1);
    }
    ans = Math.max(ans, dp[i]);
  }
  return ans;
}""",
    adv="""### O(n log n)：贪心 + 二分（耐心排序）

维护 `tails[k]` = 长度为 k 的递增子序列的**最小末尾元素**。对每个 a[i] 用二分找到第一个 ≥ a[i] 的位置并覆盖，
找不到就追加到末尾。`tails` 的长度即为答案。

```python
from bisect import bisect_left

def lis_nlogn(a):
    tails = []
    for x in a:
        i = bisect_left(tails, x)   # 非严格递增用 bisect_right
        if i == len(tails):
            tails.append(x)
        else:
            tails[i] = x
    return len(tails)
```

注意：`tails` 本身**不是**一条合法的 LIS，它只是每个长度的最小末尾值，还原方案要额外记录。

### 常见坑

1. 答案是 `max(dp[i])` 而不是 `dp[n-1]`：LIS 未必在最后一名元素处结束。
2. 「子序列」可以跳着选，「子数组」必须连续——两者状态定义完全不同。
3. 有相等元素时，严格递增用 `<`，非严格递增用 `≤`。

### 变体与应用

- **最少上升子序列覆盖**（Dilworth 定理）= 最长不升子序列长度。
- **俄罗斯套娃信封**、**摆动序列**、**最大递增子序列乘积**等都是它的变形。
- 生物信息里的序列比对，本质也是「带约束的最长公共子序列 / 递增子序列」问题。""",
    notes="""### 学习笔记

LIS 教会我一件事：**状态的「后缀条件」是设计出来的，不是题目给的。**

题目只问最长递增子序列，但如果定义成「前 i 个元素的答案」就推不动，
必须加强成「以 a[i] 结尾」，才能把「a[i] 接在谁后面」这件事说清楚。

O(n²) 版本要能吃透，因为它解释了 dp 数组为什么要保留全部位置；
O(n log n) 版本则是另一种思路——不再记录所有状态，只保留「每个长度里最优秀的那个末尾」。""",
)

add(
    id="knapsack-01",
    name="0/1 背包问题",
    category="dp",
    sub_category="背包问题",
    difficulty="中等",
    complexity="O(nW)",
    space="O(W)",
    desc="n 件物品各有重量与价值，背包容量为 W，每件物品只能选一次，求能装出的最大价值。所有背包问题的原型。",
    time=[("最坏情况", "O(nW)"), ("平均情况", "O(nW)"), ("伪多项式说明", "复杂度取决于 W 的数值而非位数")],
    extras=[("二维版本空间", "O(nW)"), ("滚动数组优化后", "O(W)"), ("分支限界/搜索", "n 很小时可行")],
    state="dp[i][j]：只考虑前 i 件物品、容量为 j 时的最大价值",
    trans="dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])——不选它，或选它（选它必须由 i-1 层转移来，保证只用一次）",
    base="dp[0][j] = 0（没有物品），dp[i][0] = 0（容量为 0）",
    order="i 从小到大、j 从小到大；一维优化时 **j 必须逆序**",
    pseudo="""function knapsack01(w[], v[], W):
  for j from 0 to W: dp[0][j] = 0
  for i from 1 to n:
    for j from 0 to W:
      dp[i][j] = dp[i-1][j]                 // 不选第 i 件
      if w[i] <= j:
        dp[i][j] = max(dp[i][j], dp[i-1][j-w[i]] + v[i])  // 选第 i 件
  return dp[n][W]""",
    py="""def knapsack_01(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        # 逆序枚举容量，保证每件物品最多被选一次
        for j in range(W, w - 1, -1):
            dp[j] = max(dp[j], dp[j - w] + v)
    return dp[W]


# 还原方案
def knapsack_01_items(weights, values, W):
    n = len(weights)
    dp = [[0] * (W + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        w, v = weights[i - 1], values[i - 1]
        for j in range(W + 1):
            dp[i][j] = dp[i - 1][j]
            if w <= j:
                dp[i][j] = max(dp[i][j], dp[i - 1][j - w] + v)
    picked, j = [], W
    for i in range(n, 0, -1):
        if dp[i][j] != dp[i - 1][j]:
            picked.append(i)
            j -= weights[i - 1]
    return dp[n][W], picked[::-1]""",
    js="""function knapsack01(weights, values, W) {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i], v = values[i];
    for (let j = W; j >= w; j--) {   // 逆序！否则会重复选同一件
      dp[j] = Math.max(dp[j], dp[j - w] + v);
    }
  }
  return dp[W];
}""",
    adv="""### 一维滚动数组：为什么必须逆序

`dp[j] = max(dp[j], dp[j-w] + v)` 中的 `dp[j-w]` 必须是「还没考虑第 i 件物品」时的值。
**逆序**枚举 j 时，`dp[j-w]` 还没被本轮更新，正好来自上一行；正序则会读到本轮刚写的值，等价于允许重复选——那就变成完全背包了。

### 常见坑

1. **初始化**：求「最多能装多少价值」时 dp 全 0；若问「恰好装满」，则要 `dp[0]=0, 其余 = -∞`，否则会把「没装东西」当成合法方案。
2. 把逆序写成正序（→ 变成完全背包），这是最高频 bug。
3. 需要还原具体方案时，必须保留二维表（或用额外数组记录每次转移来源）。

### 背包家族一览

| 题型 | 转移来源 | 容量枚举方向 |
| --- | --- | --- |
| 0/1 背包 | `dp[i-1][j-w]` | 逆序 |
| 完全背包 | `dp[i][j-w]`（本行） | 正序 |
| 多重背包 | 二进制拆分后套 0/1 | 逆序 |
| 分组背包 | 组内枚举物品、组间转移 | 逆序 |

### 应用

预算分配、项目选型、负载调度、密钥组合枚举、以及密码学里的低密度子集和问题（Lattice 攻击的模型来源）。""",
    notes="""### 学习笔记

背包是所有二维 DP 的模板：外层「物品」，内层「容量」，每一格都在两个来源里取 max。

我判断自己是否真懂了 0/1 背包，用的是这个标准：能不能解释清楚一维优化时**为什么容量必须倒着枚举**。
倒序 = 只能从上一行取 = 每件物品只选一次；正序 = 可以从本行取 = 可重复选 = 完全背包。
这一条理解了，整个背包家族就通了。""",
)

add(
    id="complete-knapsack",
    name="完全背包问题",
    category="dp",
    sub_category="背包问题",
    difficulty="中等",
    complexity="O(nW)",
    space="O(W)",
    desc="与 0/1 背包唯一的区别是每种物品可以选无限次。转移方程只改了一个下标，但含义完全不同。",
    time=[("最坏情况", "O(nW)"), ("平均情况", "O(nW)")],
    extras=[("滚动数组", "O(W)，容量正序枚举"), ("方案数版本", "把 max 换成 +")],
    state="dp[i][j]：前 i 种物品、容量 j 时的最大价值（每种可选任意次）",
    trans="dp[i][j] = max(dp[i-1][j], dp[i][j-w[i]] + v[i])——「再拿一个第 i 种」仍停留在第 i 行",
    base="dp[0][j] = 0，dp[i][0] = 0",
    order="i 从小到大；一维优化时 **j 正序**",
    pseudo="""function completeKnapsack(w[], v[], W):
  for j from 0 to W: dp[0][j] = 0
  for i from 1 to n:
    for j from 0 to W:
      dp[i][j] = dp[i-1][j]
      if w[i] <= j:
        dp[i][j] = max(dp[i][j], dp[i][j-w[i]] + v[i])   // 注意是 dp[i][...]
  return dp[n][W]""",
    py="""def complete_knapsack(weights, values, W):
    dp = [0] * (W + 1)
    for w, v in zip(weights, values):
        for j in range(w, W + 1):     # 正序：允许同一种物品被反复选
            dp[j] = max(dp[j], dp[j - w] + v)
    return dp[W]


# 零钱兑换（完全背包求最少硬币数）
def coin_change(coins, amount):
    INF = float('inf')
    dp = [0] + [INF] * amount
    for c in coins:
        for j in range(c, amount + 1):
            dp[j] = min(dp[j], dp[j - c] + 1)
    return -1 if dp[amount] == INF else dp[amount]""",
    js="""function completeKnapsack(weights, values, W) {
  const dp = new Array(W + 1).fill(0);
  for (let i = 0; i < weights.length; i++) {
    const w = weights[i], v = values[i];
    for (let j = w; j <= W; j++) {   // 正序 = 可重复选取
      dp[j] = Math.max(dp[j], dp[j - w] + v);
    }
  }
  return dp[W];
}""",
    adv="""### 一行下标的差别，两种题型

- 0/1 背包：`dp[i][j] = max(dp[i-1][j], dp[i-1][j-w] + v)`，一维时**逆序**。
- 完全背包：`dp[i][j] = max(dp[i-1][j], dp[i][j-w] + v)`，一维时**正序**。

正序枚举时 `dp[j-w]` 已经是「考虑过第 i 种物品」的结果，因此可以在它基础上再加一个第 i 种，等于允许无限次选取。

### 常见坑

1. 求「恰好装满」的方案数时，初值 `dp[0] = 1`（或最优化时 `dp[0]=0`、其余 `-∞`）。
2. 「组合数」与「排列数」的外层循环顺序不同：
   - 求**组合**数：外层物品、内层容量（本文件中零钱兑换 II 的写法）；
   - 求**排列**数：外层容量、内层物品（否则会漏掉不同顺序的方案）。
3. 单件物品价值/重量比例极端时，先用 `gcd` 或支配关系剪掉必然不选的物品，可大幅降低实际开销。

### 应用

货币兑换、无限库存的装载优化、把长材料切割成需求规格的**切割钢材问题**（就是完全背包）、以及依赖安装时的无限复用选包。""",
    notes="""### 学习笔记

以前我总记不住 0/1 背包和完全背包的代码差别，后来改成记「**转移来自哪一行**」：

- 来自上一行 → 这一件只被用过一次 → 0/1；
- 来自本行 → 这一件可以叠加 → 完全。

而一维数组里正序 / 逆序，只是「本行 vs 上一行」在滚动数组上的投影。这样记，四种背包（0/1、完全、多重、分组）都不用背模板了。""",
)

add(
    id="lcs",
    name="最长公共子序列",
    category="dp",
    sub_category="字符串DP",
    difficulty="中等",
    complexity="O(mn)",
    space="O(mn)",
    desc="给两个字符串 A、B，求它们最长的公共子序列（可以不连续、但顺序一致）。二维表 DP 与左上角回溯的标准教材。",
    time=[("最坏情况", "O(mn)"), ("最好情况", "O(mn)"), ("平均情况", "O(mn)")],
    extras=[("只求长度时的空间", "O(min(m,n)) 滚动数组"), ("还原方案", "从 (m,n) 回溯")],
    state="dp[i][j]：A 的前 i 个字符与 B 的前 j 个字符的 LCS 长度",
    trans="若 A[i]==B[j]：dp[i][j] = dp[i-1][j-1] + 1；否则 dp[i][j] = max(dp[i-1][j], dp[i][j-1])",
    base="dp[0][j] = dp[i][0] = 0（空串与任何串的公共子序列长度为 0）",
    order="按行 i 递增、行内 j 递增（每格只依赖上、左、左上三格）",
    pseudo="""function LCS(A, B):
  for i from 0 to m: dp[i][0] = 0
  for j from 0 to n: dp[0][j] = 0
  for i from 1 to m:
    for j from 1 to n:
      if A[i] == B[j]:
        dp[i][j] = dp[i-1][j-1] + 1
      else:
        dp[i][j] = max(dp[i-1][j], dp[i][j-1])
  // 回溯：相等则收字符并走左上，否则走向值更大的方向
  return dp[m][n]""",
    py="""def lcs_length(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    return dp[m][n]


def lcs_string(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if a[i - 1] == b[j - 1]:
                dp[i][j] = dp[i - 1][j - 1] + 1
            else:
                dp[i][j] = max(dp[i - 1][j], dp[i][j - 1])
    seq, i, j = [], m, n
    while i > 0 and j > 0:
        if a[i - 1] == b[j - 1]:
            seq.append(a[i - 1])
            i -= 1
            j -= 1
        elif dp[i - 1][j] >= dp[i][j - 1]:
            i -= 1
        else:
            j -= 1
    return ''.join(reversed(seq))""",
    js="""function lcsLength(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1] + 1
        : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[m][n];
}""",
    adv="""### 空间优化

求长度时只需上一行 → 滚动数组 O(n)；但**要还原子序列就必须保留整张表**（或用 Hirschberg 分治算法在 O(n) 空间下还原）。

### 常见坑

1. 下标偏移：字符串 `A[i-1]` 才对应 `dp[i]`，写成 `A[i]` 会整体错一格。
2. 相等时**只能**走左上角 +1，不能取 max：因为此时走「上/左」一定不比左上更优，取 max 会让回溯路径不对。
3. 回溯时优先向上还是向左，决定还原出的是哪一条 LCS（长度都正确，内容可能不同）。

### LCS 与编辑距离的关系

LCS 是「只允许插入/删除」且要求两段都变一样的问题：`只删不改` 的最少操作数 = `m + n - 2 * LCS`。
所以 diff 工具（Git、`diff` 命令）本质上跑的就是 LCS/最小编辑脚本算法。

### 应用

- 版本比对与 `diff`、合并冲突展示；
- 生物信息：DNA / 蛋白质序列比对（Needleman–Wunsch 是带打分矩阵的 LCS 推广）；
- 抄袭检测、文本相似度、输入法候选匹配。""",
    notes="""### 学习笔记

LCS 是双字符串 DP 的模板：**行 = 第一个串的前缀长度，列 = 第二个串的前缀长度，格子值 = 这两段的答案**。

字符相等时只能从左上角来（这个字符必然进答案），不相等时才是「丢弃 A 的末尾」或「丢弃 B 的末尾」二选一。
这两条分支讲清楚，二维 DP 的「依赖方向」就不是问题了。

回溯方向（左上 / 上 / 左）要记牢，因为「求长度」和「输出方案」的代码量差在这里。""",
)

add(
    id="edit-distance",
    name="编辑距离",
    category="dp",
    sub_category="字符串DP",
    difficulty="困难",
    complexity="O(mn)",
    space="O(mn)",
    desc="把字符串 A 变成字符串 B，允许插入、删除、替换三种操作，求最少操作数（Levenshtein 距离）。",
    time=[("最坏情况", "O(mn)"), ("平均情况", "O(mn)")],
    extras=[("滚动数组空间", "O(min(m,n))"), ("带权重操作", "换代价矩阵即可，算法不变")],
    state="dp[i][j]：A 的前 i 个字符变成 B 的前 j 个字符所需的最少操作数",
    trans="dp[i][j] = min(dp[i-1][j] + 1（删）, dp[i][j-1] + 1（插）, dp[i-1][j-1] + cost（改 / 不动）)，其中 A[i]==B[j] 时 cost = 0",
    base="dp[i][0] = i（全删），dp[0][j] = j（全插）",
    order="按行填充；每格依赖上、左、左上三格",
    pseudo="""function editDistance(A, B):
  for i from 0 to m: dp[i][0] = i
  for j from 0 to n: dp[0][j] = j
  for i from 1 to m:
    for j from 1 to n:
      cost = (A[i] == B[j]) ? 0 : 1
      dp[i][j] = min(dp[i-1][j] + 1,        // 删除
                     dp[i][j-1] + 1,        // 插入
                     dp[i-1][j-1] + cost)   // 替换 / 相等则不动
  return dp[m][n]""",
    py="""def edit_distance(a, b):
    m, n = len(a), len(b)
    dp = [[0] * (n + 1) for _ in range(m + 1)]
    for i in range(m + 1):
        dp[i][0] = i
    for j in range(n + 1):
        dp[0][j] = j
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            cost = 0 if a[i - 1] == b[j - 1] else 1
            dp[i][j] = min(
                dp[i - 1][j] + 1,       # 删除 a[i-1]
                dp[i][j - 1] + 1,       # 插入 b[j-1]
                dp[i - 1][j - 1] + cost  # 替换（或不变）
            )
    return dp[m][n]""",
    js="""function editDistance(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[m][n];
}""",
    adv="""### 三种操作对应三个方向

记住这张方向表，方程就不会写错：

| 操作 | 含义 | 来源格子 |
| --- | --- | --- |
| 删除 | A 去掉最后一个字符 | 上 `dp[i-1][j] + 1` |
| 插入 | B 的最后一个字符是插进来的 | 左 `dp[i][j-1] + 1` |
| 替换/相等 | 两端字符对齐 | 左上 `dp[i-1][j-1] + cost` |

### 空间优化与还原方案

求距离只要 O(n) 滚动数组；要输出操作序列就保留整表，从 `(m,n)` 逆推向 `(0,0)`，每步选择「来源格子 + 代价 = 当前值」的那一个。

### 常见坑

1. 初值：第一行/第一列是 `j` 和 `i`，不是 0。
2. 若只允许插入和删除（不许替换），问题就变成了 `m + n - 2 * LCS`。
3. 大文本上 O(mn) 太慢：可用 Ukkonen 带宽优化（只算 |i-j| ≤ k 的对角带）、或 MinHash/编辑距离自动机做近似匹配。

### 应用

拼写纠错与输入法联想、DNA 序列比对、OCR 结果校正、模糊搜索（如 `git` 的拼写建议、Elasticsearch fuzzy query）、以及程序查重。""",
    notes="""### 学习笔记

编辑距离是最能体现「DP 四要素」的题：
1. 状态：A 前 i 个变成 B 前 j 个的最少操作；
2. 转移：三种操作对应三个来源方向；
3. 边界：空串到空串 0，空串到长度 j 需 j 次插入；
4. 顺序：左上、上、左都已经算过。

以前我总把「删除」和「插入」的来源搞反，后来用一句话固定下来：**删是在 A 上消耗一个字符（往左上一格是 i-1，所以来源是上方）；插是为了满足 B 的一个字符（来源是左方）**。""",
)

add(
    id="matrix-chain",
    name="矩阵链乘",
    category="dp",
    sub_category="区间DP",
    difficulty="困难",
    complexity="O(n³)",
    space="O(n²)",
    desc="给定 n 个待连乘矩阵的维度序列，求标量乘法次数最少的加括号顺序。区间 DP 的入门题，也是「枚举断点」思想的原型。",
    time=[("最坏情况", "O(n³)"), ("最好情况", "O(n³)"), ("Knuth 优化后", "O(n²)")],
    extras=[("加括号方案数", "Catalan 数，暴力枚举为指数级"), ("辅助表 s", "记录最优断点，用于还原方案")],
    state="dp[i][j]：计算矩阵 Ai…Aj 连乘所需的最少标量乘法次数",
    trans="dp[i][j] = min{ dp[i][k] + dp[k+1][j] + p[i-1]·p[k]·p[j] }，k 从 i 到 j-1（枚举最后一次合并的位置）",
    base="dp[i][i] = 0（单个矩阵不需要乘法）",
    order="按区间长度 len = 2,3,…,n 递增枚举，长度短的算完才能算长的",
    pseudo="""function MatrixChainOrder(p[1..n+1]):
  for i from 1 to n: dp[i][i] = 0
  for len from 2 to n:
    for i from 1 to n-len+1:
      j = i + len - 1
      dp[i][j] = +∞
      for k from i to j-1:
        q = dp[i][k] + dp[k+1][j] + p[i-1]*p[k]*p[j]
        if q < dp[i][j]:
          dp[i][j] = q
          s[i][j] = k
  return dp[1][n]  // s 表用于还原括号方案""",
    py="""def matrix_chain_order(dims):
    \"\"\"dims = [p0, p1, ..., pn]，第 i 个矩阵为 dims[i-1] x dims[i]\"\"\"
    n = len(dims) - 1
    dp = [[0] * (n + 1) for _ in range(n + 1)]
    s = [[0] * (n + 1) for _ in range(n + 1)]
    for length in range(2, n + 1):
        for i in range(1, n - length + 2):
            j = i + length - 1
            dp[i][j] = float('inf')
            for k in range(i, j):
                q = dp[i][k] + dp[k + 1][j] + dims[i - 1] * dims[k] * dims[j]
                if q < dp[i][j]:
                    dp[i][j], s[i][j] = q, k

    def parenthesize(i, j):
        if i == j:
            return f'A{i}'
        return f'({parenthesize(i, s[i][j])} x {parenthesize(s[i][j] + 1, j)})'

    return dp[1][n], parenthesize(1, n)""",
    js="""function matrixChainOrder(p) {
  const n = p.length - 1;
  const dp = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  const s = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0));
  for (let len = 2; len <= n; len++) {
    for (let i = 1; i + len - 1 <= n; i++) {
      const j = i + len - 1;
      dp[i][j] = Infinity;
      for (let k = i; k < j; k++) {
        const q = dp[i][k] + dp[k + 1][j] + p[i - 1] * p[k] * p[j];
        if (q < dp[i][j]) {
          dp[i][j] = q;
          s[i][j] = k;
        }
      }
    }
  }
  return dp[1][n];
}""",
    adv="""### 区间 DP 的通用套路

1. 状态定义成 `dp[i][j]`（一段区间的答案）；
2. **枚举「最后一步」**（通常是某个断点 k），把区间切成两个已经算好的子区间；
3. 填表顺序按区间长度从小到大，保证子区间先算完；
4. 需要还原方案时，额外维护一张决策表 `s[i][j]`。

同族题目：戳气球、最优二叉搜索树、能量项链、括号匹配得分、回文分割。

### Knuth 优化

若最优断点满足单调性 `s[i][j-1] ≤ s[i][j] ≤ s[i+1][j]`，可把内层枚举 k 的范围缩小，总复杂度从 O(n³) 降到 O(n²)。矩阵链乘、最优 BST 都满足该条件。

### 常见坑

1. 维度序列长度是 n+1，n 是矩阵个数，下标极易错位。
2. 填表顺序写成「i 从小到大、j 从小到大」会依赖未算出的格子，必须**按长度**。
3. `dp[i][j] = min(dp[i][j], ...)` 前要把当前格初始化成 `+∞`（`dp[i][i]` 除外）。

### 应用

深度学习框架里的算子融合与自动求导图优化、表达式求值的乘法顺序、数据库多表连接顺序选择（连接代价模型同构于矩阵链乘）。""",
    notes="""### 学习笔记

矩阵链乘是我用来学「区间 DP」的例子。关键突破点是：不要想着「第一步在哪里切」，
而要想「**最后一步在哪里合并**」——因为最后一次合并把整个区间分成两个独立子问题，
而第一个切点两侧规模未知、无法直接递推。

填表顺序也要专门记：区间 DP 按长度枚举，斜着填表。
另外一张 `s` 表存断点，才使得「输出加括号方案」只需要一次递归。""",
)

# ------------------------------------------------------------ 贪心算法

add(
    id="activity-selection",
    name="活动选择问题",
    category="greedy",
    sub_category="区间贪心",
    difficulty="简单",
    complexity="O(n log n)",
    space="O(n)（排序）",
    desc="一堆各有起止时间的活动共用一间会场，求最多能安排多少个互不冲突的活动。按结束时间升序贪心是最优策略。",
    time=[("最坏情况", "O(n log n)"), ("已排序时", "O(n)"), ("平均情况", "O(n log n)")],
    extras=[("为什么不是「最早开始」", "会挡住后面的长活动"), ("为什么不是「最短时长」", "位置信息不重要，反例易构造")],
    state="无需表格 DP：只有一个量 `lastEnd`——已选活动中最晚的结束时间",
    trans="按结束时间升序扫描：若 `start[i] ≥ lastEnd` 就选它，并令 `lastEnd = end[i]`",
    base="lastEnd = -∞（或 0），已选集合为空",
    order="先按结束时间升序排序（结束时间相同可任取），再线性扫描",
    pseudo="""function activitySelection(s[], f[]):   // f 为结束时间
  sort activities by f ascending
  A = [activity 1]        // 选第一个（结束最早的）
  lastEnd = f[1]
  for i from 2 to n:
    if s[i] >= lastEnd:
      A.add(activity i)
      lastEnd = f[i]
  return A""",
    py="""def activity_selection(intervals):
    # intervals: [(start, end), ...]，半开区间 [start, end)
    picked, last_end = [], float('-inf')
    for s, e in sorted(intervals, key=lambda x: x[1]):
        if s >= last_end:
            picked.append((s, e))
            last_end = e
    return picked


print(activity_selection([(1, 4), (3, 5), (0, 6), (5, 7), (3, 9), (5, 9), (6, 10), (8, 11), (8, 12), (2, 14), (12, 16)]))
# [(1, 4), (5, 7), (8, 11), (12, 16)]""",
    js="""function activitySelection(intervals) {
  const sorted = [...intervals].sort((a, b) => a.end - b.end);
  const picked = [];
  let lastEnd = -Infinity;
  for (const it of sorted) {
    if (it.start >= lastEnd) {
      picked.push(it);
      lastEnd = it.end;
    }
  }
  return picked;
}""",
    adv="""### 为什么「结束最早」是对的

**交换论证（exchange argument）**：设最优解为 O，贪心解第一个选的是 g1（结束最早的活动）。
O 的第一个活动 o1 一定满足 `f(g1) ≤ f(o1)`，把 O 中的 o1 换成 g1，剩下的活动仍然与之相容，
于是得到另一个同样最优、且以 g1 开头的解。对剩余子问题递归，即证贪心解全局最优。

贪心正确性的三种常用证明：**交换论证**、**拟阵（matroid）结构**、**问题本身具有贪心选择性质 + 最优子结构**。

### 为什么其他策略不行

- 挑**开始最早**：会被一个从 0 到 100 的活动吃掉整天。
- 挑**时长最短**：反例 `A=[0,5), B=[4,9), C=[8,13), D=[0,13)` 之类的交错区间，会少选一个。
- 挑**冲突最少**：需要全局信息，代价高且仍非最优。

### 变体与应用

- **会议室数量（最少资源）**：同一批区间求「需要几间会议室」→ 扫描线 / 最小堆，O(n log n)。
- **带权活动选择**：每个活动有收益，贪心失效，要用 DP + 二分（O(n log n)）。
- **任务调度、CPU 时间片、作业车间、节目单编排、区间染色**都用这套思路。""",
    notes="""### 学习笔记

活动选择是「贪心为什么能成立」的最好例子。以前我以为贪心全靠感觉，
而这题用**交换论证**可以严格证明：把最优解的第一个活动换成结束最早的那个，答案不会变差。

我也借此分清了两类题：
- 求「最多能选几个」→ 结束时间升序贪心；
- 求「至少要几个资源」→ 排序 + 扫描线/最小堆。
这两个题目描述很像，解法与答案含义完全不同。""",
)

add(
    id="fractional-knapsack",
    name="分数背包问题",
    category="greedy",
    sub_category="背包贪心",
    difficulty="中等",
    complexity="O(n log n)",
    space="O(n)",
    desc="物品可以切分（按任意比例取），背包容量固定，求装出的最大价值。按单位价值 v/w 降序贪心即最优。",
    time=[("最坏情况", "O(n log n)"), ("已排序时", "O(n)"), ("选择排序求第 k 大", "O(n)")],
    extras=[("对比 0/1 背包", "不可分割时贪心失效，需 O(nW) DP"), ("总重量", "可全部取完或部分取完")],
    state="一个标量：剩余容量 `rest`（以及累计价值 `value`）",
    trans="按性价比 v/w 降序排序 → 能整件装就整件装，装不下就切一部分填满，然后结束",
    base="rest = W，value = 0",
    order="排序后一次线性扫描",
    pseudo="""function fractionalKnapsack(w[], v[], W):
  sort items by (v[i] / w[i]) descending
  rest = W, value = 0
  for each item i:
    if rest == 0: break
    if w[i] <= rest:
      value += v[i]; rest -= w[i]
    else:
      frac = rest / w[i]
      value += v[i] * frac; rest = 0
  return value""",
    py="""def fractional_knapsack(weights, values, W):
    items = sorted(zip(values, weights), key=lambda x: x[0] / x[1], reverse=True)
    rest, total = W, 0.0
    parts = []
    for v, w in items:
        if rest <= 0:
            break
        take = min(w, rest)
        total += v * take / w
        rest -= take
        parts.append((v, w, take))
    return total, parts""",
    js="""function fractionalKnapsack(weights, values, W) {
  const items = weights
    .map((w, i) => ({ w, v: values[i], ratio: values[i] / w }))
    .sort((a, b) => b.ratio - a.ratio);
  let rest = W, total = 0;
  for (const it of items) {
    if (rest <= 0) break;
    const take = Math.min(it.w, rest);
    total += it.v * (take / it.w);
    rest -= take;
  }
  return total;
}""",
    adv="""### 为什么分数背包能用贪心

物品**可分割** ⇒ 装进去的每一份都互相独立 ⇒ 每一步取当前性价比最高的那份，
不可能让后续变差。形式化证明同样用交换论证：任何最优解中若存在「低性价比的一份」排在「高性价比的一份」之前，
交换二者体积不变、价值不减。

### 关键对比：0/1 背包为什么贪心会失败

背包容量 10，物品 `(w=6,v=60, ratio=10)`、`(w=5,v=50, ratio=10)`、`(w=5,v=50, ratio=10)`：
贪心先拿 6/60 后只能再拿一个 5/50 → 110；而最优是两个 5/50 装满 → 100 加上剩 4 空着？
更直观的反例：`W=10`，物品 A(10, 60)、B(6, 40)、C(6, 40)。贪心选 A 得 60，最优选 B+C 得 80。
**不可分割时，「这一步最优」会破坏「剩下的容量能被充分利用」**，于是必须 DP。

### 实现细节

1. 浮点比较：用 `v1 * w2 > v2 * w1` 做交叉相乘，避免除法带来的精度问题。
2. 若要输出方案，记得记录最后一件被切分的比例。
3. 若只关心最大值且物品已按性价比排好，可在剩余容量为 0 时提前 break。

### 应用

按份数可分割的资源投放（燃料、液体原料、可分割预算）、广告位按时长按比例售卖、
以及**霍夫曼编码 / 分数规划**等问题的松弛版本；它是「连续松弛使贪心成立」的典型例子。""",
    notes="""### 学习笔记

分数背包最重要的价值在于它是**「能不能用贪心」的分水岭样本**：
只是把「不可分割」这个条件放开，DP 就变成了排序 + 一遍扫描。

我记住的结论是：贪心成立需要「每一步的选择不剥夺后面的好选择」，
而 0/1 背包里「先把重的拿走」恰恰会浪费容量，所以只能 DP 枚举取舍。
下次面对一个疑似贪心的题，先试着构造一个「装不满/剩余浪费」的反例。""",
)

add(
    id="huffman-coding",
    name="哈夫曼编码",
    category="greedy",
    sub_category="编码贪心",
    difficulty="困难",
    complexity="O(n log n)",
    space="O(n)",
    desc="由字符出现频次构造一组前缀码，使编码后的总比特数最少。每次合并权值最小的两棵树，是贪心选择性质的经典证明对象。",
    time=[("最坏情况", "O(n log n)"), ("频次已排序", "O(n)"), ("平均情况", "O(n log n)")],
    extras=[("带权路径长度 WPL", "∑ freq[i] · depth[i]"), ("树节点数", "2n − 1（n 个叶子）")],
    state="最小堆中若干棵子树，每棵子树的权值 = 其叶子频次之和",
    trans="取出堆顶两棵（权值最小）合并成一棵新树（权值相加）放回堆中，直到只剩一棵",
    base="n 个只含单一字符的叶子节点",
    order="重复 n-1 次合并；每次都必须取当前最小的两个",
    pseudo="""function Huffman(freq):
  Q = min-heap of leaf nodes keyed by freq
  while size(Q) > 1:
    x = extractMin(Q)
    y = extractMin(Q)
    z = new node(weight = x.weight + y.weight, left = x, right = y)
    insert(Q, z)
  root = extractMin(Q)
  assignCodes(root, "")     // 左 0 右 1，叶子处记录路径
  return root""",
    py="""import heapq
from collections import Counter


class Node:
    def __init__(self, ch, freq, left=None, right=None):
        self.ch, self.freq, self.left, self.right = ch, freq, left, right

    def __lt__(self, other):          # 给 heapq 用的比较
        return self.freq < other.freq


def huffman_codes(text):
    heap = [Node(ch, f) for ch, f in Counter(text).items()]
    heapq.heapify(heap)
    while len(heap) > 1:
        a, b = heapq.heappop(heap), heapq.heappop(heap)
        heapq.heappush(heap, Node(None, a.freq + b.freq, a, b))
    codes = {}

    def walk(nd, prefix):
        if nd.ch is not None:
            codes[nd.ch] = prefix or '0'
            return
        walk(nd.left, prefix + '0')
        walk(nd.right, prefix + '1')

    walk(heap[0], '')
    return codes


print(huffman_codes('abracadabra'))""",
    js="""function huffmanCodes(freqMap) {
  class Node {
    constructor(ch, freq, left = null, right = null) {
      Object.assign(this, { ch, freq, left, right });
    }
  }
  // 简易最小堆：这里用数组 + 排序，工程上应换成二叉堆
  let pool = Object.entries(freqMap).map(([ch, freq]) => new Node(ch, freq));
  while (pool.length > 1) {
    pool.sort((a, b) => a.freq - b.freq);
    const [x, y] = [pool.shift(), pool.shift()];
    pool.push(new Node(null, x.freq + y.freq, x, y));
  }
  const codes = {};
  (function walk(nd, prefix) {
    if (!nd) return;
    if (nd.ch !== null) return void (codes[nd.ch] = prefix || '0');
    walk(nd.left, prefix + '0');
    walk(nd.right, prefix + '1');
  })(pool[0], '');
  return codes;
}

console.log(huffmanCodes({ a: 45, b: 13, c: 12, d: 16, e: 9, f: 5 }));""",
    adv="""### 正确性证明分两步

1. **贪心选择性质**：权值最小的两个字符在最优编码树里必然是**兄弟**，且位于最深层。
   若不然，把它们换到更深的位置会减少 WPL，与最优矛盾。
2. **最优子结构**：把这两棵子树合并成一个权值为两者之和的超级叶子后，
   新问题的最优解与原子问题的最优解一一对应（WPL 只差一个常数 `x.freq + y.freq`）。

### 实现要点

1. 用**最小堆**（priority queue）维护，每次取两个最小值：O(n log n)；
   若频次已排序，可用**两个队列**做到 O(n)（一个放原始叶子，一个放合并出的内部节点）。
2. 编码时左右分支分别记 0/1（约定一致即可），解码方必须知道树结构或频次表——
   所以实际文件头要额外存一棵「树描述」。
3. 只有一个字符时码长要特判为 1（`prefix || '0'`）。

### 前缀码与解码唯一性

没有任何一个码字是另一个码字的前缀 ⇒ 码流可以边读边解、无需分隔符，也不可能被误解。
这与「定长码」相比省下的空间，就是频次分布的不均匀程度（信息论上界是香农熵）。

### 应用

DEFLATE（gzip / zip / PNG）、MP3/JPEG 中的熵编码、通信协议中的变长字段编码；
思想还被推广成 **哈夫曼树 → 最优前缀码、Giles/Cook 自适应压缩**等。""",
    notes="""### 学习笔记

哈夫曼是我第一个见到「有完整证明」的贪心算法。老师当时说：合并最小的两棵，
听起来很自然，但要写清楚为什么需要两步——**贪心选择性质**（最小的两个必是最深兄弟）
和**最优子结构**（合并后问题规模变小、结构一致）。

另一个实用点：WPL = ∑ 频次 × 码长，压缩后的总位数正好等于 WPL。
把「树的带权路径长」和「文件总比特数」画上等号之后，这题的目标函数就不再抽象了。""",
)

add(
    id="coin-change-greedy",
    name="贪心找零",
    category="greedy",
    sub_category="构造贪心",
    difficulty="简单",
    complexity="O(n log n + k)",
    space="O(n)",
    desc="用给定面额的硬币凑出目标金额，每次取不超过剩余金额的最大面额。它是理解「贪心什么时候会失败」的最佳反例。",
    time=[("最坏情况", "O(n log n + k)"), ("最好情况", "O(n log n)"), ("平均情况", "O(n log n + k)")],
    extras=[("n = 面额种类数", "k = 最终使用的硬币枚数"), ("最少硬币数（一般面额）", "需 DP，O(n·amount)")],
    state="一个标量：剩余金额 `rest`",
    trans="面额降序遍历：`count[i] = rest / coins[i]`（整除），`rest -= count[i] * coins[i]`",
    base="rest = amount，已用枚数 = 0",
    order="先按面额从大到小排序，再线性处理",
    pseudo="""function greedyChange(coins[], amount):
  sort coins descending
  rest = amount, used = 0
  for c in coins:
    k = rest / c        // 整除
    used += k
    rest -= k * c
  if rest == 0: return used
  else: return FAIL     // 贪心无法完成（面额不含 1 时可能发生）""",
    py="""def greedy_change(coins, amount):
    rest, plan = amount, []
    for c in sorted(coins, reverse=True):
        k = rest // c
        if k:
            plan.append((c, k))
            rest -= k * c
    return plan, rest          # rest != 0 表示贪心失败


def min_coins_dp(coins, amount):
    \"\"\"通用解法：完全背包求最少枚数\"\"\"
    INF = float('inf')
    dp = [0] + [INF] * amount
    for c in coins:
        for j in range(c, amount + 1):
            dp[j] = min(dp[j], dp[j - c] + 1)
    return -1 if dp[amount] == INF else dp[amount]


print(greedy_change([25, 10, 5, 1], 63))      # 规范系统：正确
print(greedy_change([4, 3, 1], 6))            # 贪心 4+1+1（3 枚）
print(min_coins_dp([1, 3, 4], 6))             # 最优 3+3（2 枚）""",
    js="""function greedyChange(coins, amount) {
  let rest = amount;
  const plan = [];
  for (const c of [...coins].sort((a, b) => b - a)) {
    const k = Math.floor(rest / c);
    if (k) {
      plan.push({ coin: c, count: k });
      rest -= k * c;
    }
  }
  return { plan, rest };   // rest !== 0 说明贪心走不通
}

function minCoinsDP(coins, amount) {
  const dp = [0, ...new Array(amount).fill(Infinity)];
  for (const c of coins) {
    for (let j = c; j <= amount; j++) {
      dp[j] = Math.min(dp[j], dp[j - c] + 1);
    }
  }
  return dp[amount] === Infinity ? -1 : dp[amount];
}""",
    adv="""### 贪心什么时候是对的

货币系统被称为「**规范（canonical）**」，当且仅当对任意金额贪心都给最少枚数。判定要点：

- 常见体系（如 1, 2, 5, 10, 20, 50 / 1, 5, 10, 25）是规范的；
- 逐位倍增（每一档都是前一档的整数倍，如 1, 2, 4, 8）一定规范；
- 反之，`[1, 3, 4]` 凑 6 → 贪心 3 枚、最优 2 枚（3+3）；`[1, 5, 10, 25]` 的变形 `[1, 10, 25, 30]` 凑 60 → 贪心 30+25+5? 无 5 时更糟。
- 存在多项式时间算法判定规范性，只需检查 `O(c_max²)` 量级的反例区间（Pearson 算法）。

### 正确的通用解法

「凑出金额的最少硬币数」= **完全背包**：`dp[j] = min(dp[j], dp[j - c] + 1)`，复杂度 `O(n·amount)`。
「凑出金额的方案数」= 完全背包计数版：`dp[j] += dp[j - c]`（外层硬币 ⇒ 组合数；外层金额 ⇒ 排列数）。

### 常见坑

1. 忘排序或排序方向反了。
2. 面额里没有 1 时，贪心可能剩下一段凑不出来，此时**必须**说明失败而不是给出错误答案。
3. 把「每次最大面额」当成「最少枚数」的定义——两者只在规范系统里等价。

### 应用

自动售货机找零、票据/面额拆分、库存按规格出货（整箱优先）、
以及作为「为什么不能用贪心」的教学反例——面试里的零钱兑换正是它的 DP 版本。""",
    notes="""### 学习笔记

这题我把它记成「贪心的边界样本」：题面跟活动选择一样简单，
但答案可能是错的——关键在于**局部最优是否损害了整体的可组合性**。

凑 6 分，有 [1,3,4] 三种面额时，先拿 4 再拿 1、1 用了 3 枚，而 3+3 只用 2 枚。
一次「最大的」拿走，让剩下的金额无法被高效拼出来，这就是贪心选择性质不成立。

所以我的检查清单变成：① 这个「最优一步」会不会让剩余子问题变难？② 能不能找到一个反例金额？""",
)


# ============================================================
# 生成
# ============================================================

def basic_md(e):
    return md(f"""## {e['name']}

{e['desc']}

### 状态定义

{e['state']}

### 转移方程 / 贪心策略

{e['trans']}

### 边界与填表顺序

- 边界：{e['base']}
- 顺序：{e['order']}

### 伪代码

```
{e['pseudo']}
```

### Python 实现

```python
{e['py']}
```

### JavaScript 实现

```javascript
{e['js']}
```
""")


def complexity_details(e):
    return {
        "time": [{"label": k, "value": v} for k, v in e["time"]],
        "space": e["space"],
        "stability": None,
        "difficulty": e["difficulty"],
        "extras": [{"label": k, "value": v} for k, v in e["extras"]],
    }


def js_str(s):
    return json.dumps(s, ensure_ascii=False)


def js_num_obj(o):
    """把 dict 序列化成 JS 对象字面量文本（数组/对象/元组均支持）"""
    if isinstance(o, str):
        return js_str(o)
    if isinstance(o, bool) or o is None:
        return "null" if o is None else ("true" if o else "false")
    if isinstance(o, (int, float)):
        return str(o)
    if isinstance(o, list):
        return "[" + ", ".join(js_num_obj(x) for x in o) + "]"
    if isinstance(o, dict):
        return (
            "{ "
            + ", ".join(f"{k}: {js_num_obj(v)}" for k, v in o.items())
            + " }"
        )
    raise TypeError(type(o))


# ------------------------------------------------------------ 写入 algorithms.js

blocks = []
for e in A:
    route = f"/algorithms/{e['category']}/{e['id']}"
    detail_sections = {"basic": basic_md(e), "advanced": e["adv"]}
    block = f"""  {{
    id: {js_str(e['id'])},
    name: {js_str(e['name'])},
    category: {js_str(e['category'])},
    subCategory: {js_str(e['sub_category'])},
    difficulty: {js_str(e['difficulty'])},
    stability: null,
    description: {js_str(e['desc'])},
    complexity: {js_str(e['complexity'])},
    route: {js_str(route)},
    defaultNotes: {js_str(e['notes'])},
    complexityDetails: {js_num_obj(complexity_details(e))},
    detailSections: {js_num_obj(detail_sections)},
  }},"""
    blocks.append(block)

js_src = JS_FILE.read_text(encoding="utf-8")
marker = "// ==================== 便捷派生数据 ===================="
pos = js_src.index(marker)
close = js_src.rindex("]", 0, pos)          # algorithms 数组的收尾 "]"
assert close > 0, "未找到 algorithms 数组结尾"
if '"climbing-stairs"' not in js_src:
    insert = "\n  // ==================== 动态规划 ====================\n"
    for b in blocks:
        if '"category": "greedy"' in b or 'category: "greedy"' in b:
            if "贪心算法 ====" not in insert:
                insert += "\n  // ==================== 贪心算法 ====================\n"
        insert += b + "\n"
    js_src = js_src[:close] + insert + js_src[close:]

old_derived = """export const graphAlgorithms = algorithms.filter((a) => a.category === 'graph')"""
new_derived = """export const graphAlgorithms = algorithms.filter((a) => a.category === 'graph')
export const dpAlgorithms = algorithms.filter((a) => a.category === 'dp')
export const greedyAlgorithms = algorithms.filter((a) => a.category === 'greedy')

/** 分类元信息：导航、进度页、关于页共用一份 */
export const algorithmCategories = [
  { key: 'sorting', label: '排序算法', to: '/algorithms/sorting' },
  { key: 'searching', label: '搜索算法', to: '/algorithms/searching' },
  { key: 'graph', label: '图算法', to: '/algorithms/graph' },
  { key: 'dp', label: '动态规划', to: '/algorithms/dp' },
  { key: 'greedy', label: '贪心算法', to: '/algorithms/greedy' },
]

/** 分类 -> 子分类（保持与卡片列表一致的展示顺序） */
export const categorySubCategories = {
  dp: ['线性DP', '背包问题', '字符串DP', '区间DP'],
  greedy: ['区间贪心', '背包贪心', '编码贪心', '构造贪心'],
}

export function algorithmsOfCategory(key) {
  return algorithms.filter((a) => a.category === key)
}"""
if "export const dpAlgorithms" not in js_src:
    js_src = js_src.replace(old_derived, new_derived, 1)
JS_FILE.write_text(js_src, encoding="utf-8")

# ------------------------------------------------------------ 后端种子

meta = json.loads(META_FILE.read_text(encoding="utf-8"))
meta_ids = {m["id"] for m in meta}
content = json.loads(CONTENT_FILE.read_text(encoding="utf-8"))
content_ids = {c["id"] for c in content}

for e in A:
    cd = complexity_details(e)
    route = f"/algorithms/{e['category']}/{e['id']}"
    if e["id"] not in meta_ids:
        meta.append(
            {
                "id": e["id"],
                "name": e["name"],
                "category": e["category"],
                "subCategory": e["sub_category"],
                "difficulty": e["difficulty"],
                "stability": None,
                "description": e["desc"],
                "complexity": e["complexity"],
                "route": route,
                # SQLite 侧按 JSON 字符串存储（与既有种子保持一致）
                "complexityDetails": json.dumps(cd, ensure_ascii=False, separators=(",", ":")),
            }
        )
    if e["id"] not in content_ids:
        content.append(
            {
                "id": e["id"],
                "name": e["name"],
                "category": e["category"],
                "subCategory": e["sub_category"],
                "difficulty": e["difficulty"],
                "stability": None,
                "description": e["desc"],
                "complexity": e["complexity"],
                "route": route,
                "complexityDetails": cd,
                "sections": {
                    "basic": basic_md(e),
                    "advanced": e["adv"],
                    "defaultNotes": e["notes"],
                },
                "videos": [],
                "tabs": ["basic", "viz", "advanced", "notes"],
            }
        )

META_FILE.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
CONTENT_FILE.write_text(json.dumps(content, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

print(f"新增算法 {len(A)} 个；algorithms.json={len(meta)} 条；content={len(content)} 条")
print("ids:", ", ".join(e["id"] for e in A))
