// ============================================================
// 算法训练题库（阶段四：练习模块）
// 静态题单：题面、示例、分级提示、参考解答与复杂度。
// 用户完成状态由 training API 持久化（后端优先，离线回退 localStorage）。
// relatedAlgorithms 与 data/algorithms.js 的算法 id 对应，可跳转站内详情页。
// ============================================================

export const trainingProblems = [
  {
    id: 'two-sum',
    title: '两数之和',
    source: 'LeetCode 1',
    difficulty: '简单',
    topics: ['数组', '哈希表'],
    relatedAlgorithms: ['hashing-search'],
    description:
      '给定一个整数数组 `nums` 和一个目标值 `target`，请在该数组中找出**和为目标值**的两个整数，并返回它们的数组下标。\n\n假设每种输入只会对应一个答案，且同一个元素不能使用两遍。',
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', note: '因为 nums[0] + nums[1] == 9' },
    ],
    hints: [
      '暴力解法是 O(n²) 双重循环，先想如何降到 O(n)。',
      '遍历时问题变成：“之前有没有出现过 `target - nums[i]`？”——这正是哈希查找的场景。',
      '用 Map 记录 值→下标，一边遍历一边查表，查到了就直接返回。',
    ],
    solution:
      '```python\ndef two_sum(nums, target):\n    seen = {}          # 值 -> 下标\n    for i, x in enumerate(nums):\n        if target - x in seen:\n            return [seen[target - x], i]\n        seen[x] = i\n```',
    complexity: { time: 'O(n)', space: 'O(n)' },
  },
  {
    id: 'valid-anagram',
    title: '有效的字母异位词',
    source: 'LeetCode 242',
    difficulty: '简单',
    topics: ['字符串', '排序', '哈希表'],
    relatedAlgorithms: ['counting-sort', 'hashing-search'],
    description: '给定两个字符串 `s` 和 `t`，判断 `t` 是否是 `s` 的字母异位词（即两字符串包含的字符及个数完全相同）。',
    examples: [
      { input: 's = "anagram", t = "nagaram"', output: 'true' },
      { input: 's = "rat", t = "car"', output: 'false' },
    ],
    hints: ['方案一：把两个字符串分别排序后比较——想一想排序复杂度。', '方案二：统计 26 个字母出现次数（计数思想的直接应用），逐位比较。'],
    solution:
      '```python\ndef is_anagram(s, t):\n    if len(s) != len(t):\n        return False\n    cnt = [0] * 26\n    for a, b in zip(s, t):\n        cnt[ord(a) - 97] += 1\n        cnt[ord(b) - 97] -= 1\n    return all(c == 0 for c in cnt)\n```',
    complexity: { time: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'merge-intervals',
    title: '合并区间',
    source: 'LeetCode 56',
    difficulty: '中等',
    topics: ['数组', '排序', '贪心'],
    relatedAlgorithms: ['quick-sort', 'merge-sort'],
    description: '以一组区间 `intervals[i] = [startᵢ, endᵢ]` 出发，合并所有重叠的区间，并返回一个不重叠的区间数组。',
    examples: [{ input: 'intervals = [[1,3],[2,6],[8,10],[15,18]]', output: '[[1,6],[8,10],[15,18]]', note: '区间 [1,3] 与 [2,6] 重叠，合并为 [1,6]' }],
    hints: ['先按区间左端点排序，重叠的区间在排序后一定相邻。', '依次扫描：若当前区间左端点 ≤ 结果集中最后一个区间的右端点，则合并（更新右端点），否则新开一个区间。'],
    solution:
      '```python\ndef merge_intervals(intervals):\n    intervals.sort(key=lambda x: x[0])\n    res = []\n    for cur in intervals:\n        if res and cur[0] <= res[-1][1]:\n            res[-1][1] = max(res[-1][1], cur[1])\n        else:\n            res.append(cur[:])\n    return res\n```',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
  },
  {
    id: 'kth-largest',
    title: '数组中的第 K 个最大元素',
    source: 'LeetCode 215',
    difficulty: '中等',
    topics: ['数组', '快速选择', '堆'],
    relatedAlgorithms: ['quick-sort', 'heap-sort'],
    description: '给定整数数组 `nums` 和整数 `k`，请返回数组中第 `k` 个最大的元素。要求时间复杂度优于整体排序。',
    examples: [{ input: 'nums = [3,2,1,5,6,4], k = 2', output: '5' }],
    hints: ['整体排序是 O(n log n)，能否像快排一样只处理一半？——快速选择。', '快排每轮 partition 后枢轴位置已定：若枢轴恰是第 k 大的位置就直接返回，否则只递归目标那一半。', '另一个思路：维护大小为 k 的小顶堆，堆顶即第 k 大。'],
    solution:
      '```python\nimport random\n\ndef find_kth(nums, k):\n    target = len(nums) - k          # 升序视角的下标\n    def part(lo, hi):\n        p = random.randint(lo, hi)\n        nums[p], nums[hi] = nums[hi], nums[p]\n        i = lo\n        for j in range(lo, hi):\n            if nums[j] < nums[hi]:\n                nums[i], nums[j] = nums[j], nums[i]\n                i += 1\n        nums[i], nums[hi] = nums[hi], nums[i]\n        return i\n    lo, hi = 0, len(nums) - 1\n    while True:\n        p = part(lo, hi)\n        if p == target: return nums[p]\n        if p < target: lo = p + 1\n        else: hi = p - 1\n```',
    complexity: { time: '平均 O(n)', space: 'O(1)' },
  },
  {
    id: 'search-rotated',
    title: '搜索旋转排序数组',
    source: 'LeetCode 33',
    difficulty: '中等',
    topics: ['二分查找'],
    relatedAlgorithms: ['binary-search'],
    description:
      '整数数组 `nums` 升序排列且互不相同，可能在某一下标处被旋转（如 `[4,5,6,7,0,1,2]`）。给定目标值 `target`，若存在返回下标，否则返回 -1。要求 **O(log n)**。',
    examples: [{ input: 'nums = [4,5,6,7,0,1,2], target = 0', output: '4' }],
    hints: ['仍然是二分：旋转后 mid 把数组分成两半，**至少有一半是有序的**。', '判断 `nums[lo] <= nums[mid]` 确定左半是否有序，再看 target 是否落在有序半的值域内，据此收缩区间。'],
    solution:
      '```python\ndef search_rotated(nums, target):\n    lo, hi = 0, len(nums) - 1\n    while lo <= hi:\n        mid = (lo + hi) // 2\n        if nums[mid] == target:\n            return mid\n        if nums[lo] <= nums[mid]:                 # 左半有序\n            if nums[lo] <= target < nums[mid]:    # 在左半\n                hi = mid - 1\n            else:\n                lo = mid + 1\n        else:                                     # 右半有序\n            if nums[mid] < target <= nums[hi]:    # 在右半\n                lo = mid + 1\n            else:\n                hi = mid - 1\n    return -1\n```',
    complexity: { time: 'O(log n)', space: 'O(1)' },
  },
  {
    id: 'first-last-position',
    title: '在排序数组中查找元素的第一个和最后一个位置',
    source: 'LeetCode 34',
    difficulty: '中等',
    topics: ['二分查找'],
    relatedAlgorithms: ['binary-search'],
    description: '给定升序整数数组 `nums` 与目标值 `target`，找出 target 出现的**起始与结束位置**；不存在返回 `[-1,-1]`。要求 O(log n)。',
    examples: [{ input: 'nums = [5,7,7,8,8,10], target = 8', output: '[3,4]' }],
    hints: ['写两次二分：一次锁定最左出现位置，一次锁定最右。', '找左边界时：`nums[mid] >= target` 就向左收缩，否则向右；右边界反之。'],
    solution:
      '```python\nimport bisect\n\ndef search_range(nums, target):\n    # 两次二分：bisect_left 找左边界，bisect_right 找右边界\n    l = bisect.bisect_left(nums, target)\n    r = bisect.bisect_right(nums, target) - 1\n    return [l, r] if l <= r and l < len(nums) else [-1, -1]\n```',
    complexity: { time: 'O(log n)', space: 'O(1)' },
  },
  {
    id: 'reverse-linked-list',
    title: '反转链表',
    source: 'LeetCode 206',
    difficulty: '简单',
    topics: ['链表', '双指针'],
    relatedAlgorithms: [],
    description: '给定单链表的头节点 `head`，反转链表并返回新的头节点。',
    examples: [{ input: 'head = [1,2,3,4,5]', output: '[5,4,3,2,1]' }],
    hints: ['迭代：维护 prev / cur 两个指针，逐个把 `cur.next` 反向指回 prev。', '注意先用临时变量保存 `cur.next`，否则断链后无法继续。'],
    solution:
      '```python\ndef reverse_list(head):\n    prev, cur = None, head\n    while cur:\n        nxt = cur.next\n        cur.next = prev\n        prev = cur\n        cur = nxt\n    return prev\n```',
    complexity: { time: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'number-of-islands',
    title: '岛屿数量',
    source: 'LeetCode 200',
    difficulty: '中等',
    topics: ['图', 'BFS', 'DFS'],
    relatedAlgorithms: ['dfs', 'bfs'],
    description: '给定由 `"1"`（陆地）和 `"0"`（水）组成的二维网格，计算岛屿数量。岛屿由水平/垂直方向相连的陆地构成。',
    examples: [{ input: 'grid = [["1","1","0"],["0","1","0"],["0","0","1"]]', output: '2' }],
    hints: ['每发现一块未访问陆地，就从它出发做一遍 DFS/BFS 淹没整座岛，计数器 +1。', 'DFS 递归要注意栈深度，超深时用显式栈或 BFS。'],
    solution:
      '```python\ndef num_islands(grid):\n    if not grid: return 0\n    m, n = len(grid), len(grid[0])\n    def sink(i, j):\n        stack = [(i, j)]\n        grid[i][j] = "0"\n        while stack:\n            x, y = stack.pop()\n            for dx, dy in ((1,0),(-1,0),(0,1),(0,-1)):\n                a, b = x + dx, y + dy\n                if 0 <= a < m and 0 <= b < n and grid[a][b] == "1":\n                    grid[a][b] = "0"\n                    stack.append((a, b))\n    cnt = 0\n    for i in range(m):\n        for j in range(n):\n            if grid[i][j] == "1":\n                sink(i, j)\n                cnt += 1\n    return cnt\n```',
    complexity: { time: 'O(m·n)', space: 'O(m·n)' },
  },
  {
    id: 'course-schedule',
    title: '课程表（能否修完全部课程）',
    source: 'LeetCode 207',
    difficulty: '中等',
    topics: ['图', '拓扑排序', 'BFS'],
    relatedAlgorithms: ['topological-sort', 'bfs'],
    description: '共有 `numCourses` 门课（0 到 n-1），`prerequisites[i] = [a,b]` 表示修 `a` 前必须先修 `b`。判断是否可能修完所有课程。',
    examples: [{ input: 'numCourses = 2, prerequisites = [[1,0]]', output: 'true' }, { input: 'numCourses = 2, prerequisites = [[1,0],[0,1]]', output: 'false', note: '存在循环依赖' }],
    hints: ['把课程看作节点、先修关系看作有向边——问题等价于判断图中是否存在环。', 'Kahn 拓扑排序：入度为 0 入队，逐个出队并把邻居入度 -1；最终处理数 == 课程数即可修完。'],
    solution:
      '```python\nfrom collections import deque\n\ndef can_finish(n, prereq):\n    g = [[] for _ in range(n)]\n    indeg = [0] * n\n    for a, b in prereq:\n        g[b].append(a)\n        indeg[a] += 1\n    q = deque(i for i in range(n) if indeg[i] == 0)\n    done = 0\n    while q:\n        u = q.popleft()\n        done += 1\n        for v in g[u]:\n            indeg[v] -= 1\n            if indeg[v] == 0:\n                q.append(v)\n    return done == n\n```',
    complexity: { time: 'O(V + E)', space: 'O(V + E)' },
  },
  {
    id: 'network-delay-time',
    title: '网络延迟时间',
    source: 'LeetCode 743',
    difficulty: '中等',
    topics: ['图', '最短路', 'Dijkstra'],
    relatedAlgorithms: ['dijkstra', 'bellman-ford'],
    description: '有 `n` 个节点，`times[i] = (u, v, w)` 表示信号从 `u` 到 `v` 需要 `w` 时间。从节点 `k` 发出信号，求所有节点收到信号的最短时间；无法到达返回 -1。',
    examples: [{ input: 'times = [[2,1,1],[2,3,1],[3,4,1]], n = 4, k = 2', output: '2' }],
    hints: ['单源正权最短路 → Dijkstra + 小顶堆。', '答案是所有节点最短距离的最大值；有节点距离为无穷则返回 -1。'],
    solution:
      '```python\nimport heapq\n\ndef network_delay(times, n, k):\n    g = [[] for _ in range(n + 1)]\n    for u, v, w in times:\n        g[u].append((v, w))\n    dist = {k: 0}\n    pq = [(0, k)]\n    while pq:\n        d, u = heapq.heappop(pq)\n        if d > dist.get(u, float("inf")):\n            continue\n        for v, w in g[u]:\n            if d + w < dist.get(v, float("inf")):\n                dist[v] = d + w\n                heapq.heappush(pq, (dist[v], v))\n    return max(dist.values()) if len(dist) == n else -1\n```',
    complexity: { time: 'O(E log V)', space: 'O(V + E)' },
  },
  {
    id: 'word-ladder',
    title: '单词接龙',
    source: 'LeetCode 127',
    difficulty: '困难',
    topics: ['图', 'BFS', '最短转换序列'],
    relatedAlgorithms: ['bfs'],
    description: '给定 `beginWord`、`endWord` 与字典 `wordList`，每次转换只能改变一个字母，求从 beginWord 到 endWord 的最短转换序列的长度；不存在返回 0。',
    examples: [{ input: 'beginWord = "hit", endWord = "cog", wordList = ["hot","dot","dog","lot","log","cog"]', output: '5', note: 'hit → hot → dot → dog → cog' }],
    hints: ['把每个单词看作节点，相差一个字母的两个单词连边——最短长度就是无权图最短路 → BFS。', '不必 O(N²L) 建图：对每个单词枚举“挖空模式”（如 h*t），用哈希表把同模式单词聚成一层。', '双向 BFS（从起点与终点同时扩展）可以显著减小搜索空间。'],
    solution:
      '```python\nfrom collections import defaultdict, deque\n\ndef ladder_length(begin, end, words):\n    if end not in words: return 0\n    L = len(begin)\n    pat = defaultdict(list)\n    for w in [begin, *words]:\n        for i in range(L):\n            pat[w[:i] + "*" + w[i+1:]].append(w)\n    q, seen = deque([(begin, 1)]), {begin}\n    while q:\n        w, d = q.popleft()\n        for i in range(L):\n            for nxt in pat[w[:i] + "*" + w[i+1:]]:\n                if nxt == end: return d + 1\n                if nxt not in seen:\n                    seen.add(nxt)\n                    q.append((nxt, d + 1))\n    return 0\n```',
    complexity: { time: 'O(N·L²)', space: 'O(N·L)' },
  },
  {
    id: 'climbing-stairs',
    title: '爬楼梯',
    source: 'LeetCode 70',
    difficulty: '简单',
    topics: ['动态规划'],
    relatedAlgorithms: [],
    description: '假设你正在爬楼梯，需要 `n` 阶你才能到达楼顶。每次你可以爬 1 或 2 个台阶，问有多少种不同的方法爬到楼顶？',
    examples: [{ input: 'n = 3', output: '3', note: '1+1+1、1+2、2+1' }],
    hints: ['最后一步要么跨 1 阶要么跨 2 阶：`f(n) = f(n-1) + f(n-2)`。', '这就是斐波那契数列，滚动变量优化到 O(1) 空间。'],
    solution:
      '```python\ndef climb_stairs(n):\n    a, b = 1, 1             # f(0), f(1)\n    for _ in range(2, n + 1):\n        a, b = b, a + b\n    return b\n```',
    complexity: { time: 'O(n)', space: 'O(1)' },
  },
  {
    id: 'longest-increasing-subsequence',
    title: '最长递增子序列',
    source: 'LeetCode 300',
    difficulty: '中等',
    topics: ['动态规划', '二分查找'],
    relatedAlgorithms: ['binary-search'],
    description: '给你一个整数数组 `nums`，找出其中最长**严格递增子序列**的长度（子序列不要求连续）。',
    examples: [{ input: 'nums = [10,9,2,5,3,7,101,18]', output: '4', note: '最长递增子序列为 [2,3,7,101]' }],
    hints: ['O(n²) DP：`dp[i] = max(dp[j]+1)`，其中 `j < i 且 nums[j] < nums[i]`。', '更优：维护“长度为 k 的递增子序列的最小结尾”数组 tails，对每个数用**二分查找**定位替换位置——O(n log n)。'],
    solution:
      '```python\nimport bisect\n\ndef lis(nums):\n    tails = []\n    for x in nums:\n        i = bisect.bisect_left(tails, x)\n        if i == len(tails):\n            tails.append(x)\n        else:\n            tails[i] = x     # 让长度为 i+1 的序列结尾尽量小\n    return len(tails)\n```',
    complexity: { time: 'O(n log n)', space: 'O(n)' },
  },
  {
    id: 'minimum-path-sum',
    title: '最小路径和',
    source: 'LeetCode 64',
    difficulty: '中等',
    topics: ['动态规划', '网格'],
    relatedAlgorithms: [],
    description: '给定一个填充非负整数的 `m × n` 网格，找出从左上角到右下角、只能向右或向下移动的路径，使路径上的数字总和最小。',
    examples: [{ input: 'grid = [[1,3,1],[1,5,1],[4,2,1]]', output: '7', note: '路径 1→3→1→1→1' }],
    hints: ['到每个格子的最小和只可能来自上方或左方：`dp[i][j] = grid[i][j] + min(up, left)`。', '可以原地把 grid 当 dp 表用，空间降到 O(1)。'],
    solution:
      '```python\ndef min_path_sum(grid):\n    m, n = len(grid), len(grid[0])\n    for i in range(m):\n        for j in range(n):\n            if i == j == 0: continue\n            up   = grid[i-1][j] if i else float("inf")\n            left = grid[i][j-1] if j else float("inf")\n            grid[i][j] += min(up, left)\n    return grid[m-1][n-1]\n```',
    complexity: { time: 'O(m·n)', space: 'O(1)' },
  },
]

export const TRAINING_TOPICS = [...new Set(trainingProblems.flatMap((p) => p.topics))]

export const DIFFICULTY_COLORS = {
  简单: '#2e7d32',
  中等: '#ef6c00',
  困难: '#c62828',
}
