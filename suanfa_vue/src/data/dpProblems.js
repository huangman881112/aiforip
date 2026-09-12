// ============================================================
// 动态规划可视化：题目「求解器 + 逐步 frame 生成」
// 每道题的 solve(inputs) 返回统一 model，供 DpTableViz.vue 通用渲染：
//   {
//     rowLabels: string[],           // 行头（一般为 i 维度）
//     colLabels: string[],           // 列头（一般为 j 维度）
//     corner: string,                // 左上角说明，如 "i \\ j"
//     frames: [{ r, c, value, depends:[[r,c]], text, kind }],
//     path: [[r,c]],                 // 播完后高亮的回溯路径
//     answer: string,                // 最终答案文案
//   }
// kind: 'init' 边界 | 'compute' 转移 | 'skip' 装不下/继承 | 'match' 命中 | 'answer'
// ============================================================

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

/** 生成一个不含 0 的整数序列（0 会让「延长子数组」的取舍变得不直观） */
function randomIntArray(n, absMax = 9) {
  return Array.from({ length: n }, () => {
    const v = randInt(1, absMax)
    return Math.random() < 0.45 ? -v : v
  })
}

function randomItems(n, maxW = 6, maxV = 12) {
  return Array.from({ length: n }, () => ({ w: randInt(1, maxW), v: randInt(2, maxV) }))
}

const randomString = (n, alphabet = 'ABCD') =>
  Array.from({ length: n }, () => alphabet[randInt(0, alphabet.length - 1)]).join('')

/** 物品件数被改动时，同步裁剪/补齐物品表 */
function normalizeItems(inputs) {
  const items = [...(inputs.items || [])]
  while (items.length < inputs.count) items.push({ w: randInt(1, 6), v: randInt(2, 12) })
  items.length = inputs.count
  return { ...inputs, items }
}

/** 背包类题目共用的物品清单文案（idx 从 1 开始） */
const itemsText = (items, picked) =>
  picked.map((k) => `物品${k}(w=${items[k - 1].w},v=${items[k - 1].v})`).join('、')

// ------------------------------------------------------------ 1. 爬楼梯（线性 DP 入门）

function solveClimbingStairs({ n }) {
  const dp = new Array(n + 1).fill(0)
  const frames = []
  dp[0] = 1
  frames.push({
    r: 0, c: 0, value: 1, kind: 'init', depends: [],
    text: 'dp[0] = 1：站在平地就是「一种空走法」，作为递推基准',
  })
  if (n >= 1) {
    dp[1] = 1
    frames.push({
      r: 0, c: 1, value: 1, kind: 'init', depends: [[0, 0]],
      text: 'dp[1] = dp[0] = 1：第 1 阶只能跨 1 步',
    })
  }
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2]
    frames.push({
      r: 0, c: i, value: dp[i], kind: 'compute', depends: [[0, i - 1], [0, i - 2]],
      text: `dp[${i}] = dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
    })
  }
  return {
    rowLabels: ['dp'],
    colLabels: Array.from({ length: n + 1 }, (_, i) => String(i)),
    corner: 'i 阶',
    frames,
    path: [[0, n]],
    answer: `爬到第 ${n} 阶共有 ${dp[n]} 种走法`,
  }
}

// ------------------------------------------------------------ 2. 最大子数组和（Kadane / 线性 DP）

function solveMaxSubarray({ arr }) {
  const n = arr.length
  const f = new Array(n + 1).fill(0)
  const best = new Array(n + 1).fill(0)
  const frames = []

  for (let i = 1; i <= n; i++) {
    const extend = i === 1 ? null : f[i - 1] + arr[i - 1]
    f[i] = extend === null ? arr[i - 1] : Math.max(extend, arr[i - 1])
    const depends = i > 1 ? [[0, i - 1]] : []
    const how =
      extend === null
        ? `f[1] = a[1] = ${arr[0]}（起点只能是它自己）`
        : extend >= arr[i - 1]
          ? `f[${i}] = f[${i - 1}] + a[${i}] = ${f[i - 1]} + ${arr[i - 1]} = ${f[i]}（接着前面更划算）`
          : `f[${i}] = a[${i}] = ${arr[i - 1]}（前面是拖累，从本元素重新起头）`
    frames.push({ r: 0, c: i, value: f[i], kind: 'compute', depends, text: how })

    best[i] = i === 1 ? f[i] : Math.max(best[i - 1], f[i])
    frames.push({
      r: 1, c: i, value: best[i], kind: 'compute', depends: [[0, i], ...(i > 1 ? [[1, i - 1]] : [])],
      text: `ans[${i}] = max(ans[${i - 1}]${i > 1 ? ` = ${best[i - 1]}` : ''}, f[${i}] = ${f[i]}) = ${best[i]}`,
    })
  }

  let bestEnd = 1
  for (let i = 2; i <= n; i++) if (f[i] > f[bestEnd]) bestEnd = i
  let start = bestEnd
  while (start > 1 && f[start - 1] > 0) start--
  const path = []
  for (let i = start; i <= bestEnd; i++) path.push([0, i])
  for (let i = start; i <= bestEnd; i++) path.push([1, i])

  return {
    rowLabels: ['f（结尾为 i）', 'ans（前缀最优）'],
    colLabels: Array.from({ length: n + 1 }, (_, i) => (i === 0 ? '0' : `${i}:${arr[i - 1]}`)),
    corner: 'i:a[i]',
    frames,
    path,
    answer: `最大子数组和 = ${f[bestEnd]}，对应 a[${start}..${bestEnd}] = [${arr.slice(start - 1, bestEnd).join(', ')}]`,
  }
}

// ------------------------------------------------------------ 3. 最长递增子序列（LIS）

function solveLis({ arr }) {
  const n = arr.length
  const dp = new Array(n).fill(1)
  const prev = new Array(n).fill(-1)
  const frames = []

  for (let i = 0; i < n; i++) {
    let bestJ = -1
    const scanned = []
    for (let j = 0; j < i; j++) {
      if (arr[j] < arr[i]) {
        scanned.push(`dp[${j + 1}]=${dp[j]}`)
        if (bestJ === -1 || dp[j] > dp[bestJ]) bestJ = j
      }
    }
    if (bestJ !== -1) {
      dp[i] = dp[bestJ] + 1
      prev[i] = bestJ
    }
    frames.push({
      r: 0,
      c: i + 1,
      value: dp[i],
      kind: bestJ === -1 ? 'init' : 'compute',
      depends: bestJ === -1 ? [] : [[0, bestJ + 1]],
      text: bestJ === -1
        ? `dp[${i + 1}] = 1：${scanned.length ? '' : `没有比 a[${i + 1}]=${arr[i]} 更小的元素，只能自成一段`}`
        : `dp[${i + 1}] = 1 + max(${scanned.join(', ')}) = ${dp[i]}（接在 a[${bestJ + 1}]=${arr[bestJ]} 后面）`,
    })
  }

  let end = 0
  for (let i = 1; i < n; i++) if (dp[i] > dp[end]) end = i
  const chain = []
  for (let cur = end; cur !== -1; cur = prev[cur]) chain.unshift(cur)
  const path = chain.map((i) => [0, i + 1])

  return {
    rowLabels: ['dp'],
    colLabels: Array.from({ length: n }, (_, i) => `${i + 1}:${arr[i]}`),
    corner: 'i:a[i]',
    frames,
    path,
    answer: `LIS 长度 = ${dp[end]}，其中一条方案：[${chain.map((i) => arr[i]).join(', ')}]`,
  }
}

// ------------------------------------------------------------ 4/5. 背包（0/1 与完全）

function solveKnapsack({ items, capacity, complete }) {
  const n = items.length
  const W = capacity
  const dp = Array.from({ length: n + 1 }, () => new Array(W + 1).fill(0))
  const frames = []

  for (let j = 0; j <= W; j++) {
    frames.push({
      r: 0, c: j, value: 0, kind: 'init', depends: [],
      text: `dp[0][${j}] = 0：一件物品都没有，价值恒为 0`,
    })
  }
  for (let i = 1; i <= n; i++) {
    frames.push({
      r: i, c: 0, value: 0, kind: 'init', depends: [],
      text: `dp[${i}][0] = 0：容量为 0，什么都装不下`,
    })
  }

  for (let i = 1; i <= n; i++) {
    const { w, v } = items[i - 1]
    for (let j = 1; j <= W; j++) {
      const notake = dp[i - 1][j]
      let value, kind, depends, text
      if (w > j) {
        value = notake
        kind = 'skip'
        depends = [[i - 1, j]]
        text = `dp[${i}][${j}]：物品${i} 重 ${w} > 容量 ${j}，装不下 → 继承 dp[${i - 1}][${j}] = ${notake}`
      } else {
        const srcRow = complete ? i : i - 1
        const take = dp[srcRow][j - w] + v
        value = Math.max(notake, take)
        kind = 'compute'
        depends = [[i - 1, j], [srcRow, j - w]]
        text = value === take && take >= notake
          ? `dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${notake}, dp[${srcRow}][${j} - ${w}]+v=${dp[srcRow][j - w]}+${v}=${take}) = ${value}（选物品${i}）`
          : `dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${notake}, dp[${srcRow}][${j} - ${w}]+v=${dp[srcRow][j - w]}+${v}=${take}) = ${value}（不选物品${i}）`
      }
      dp[i][j] = value
      frames.push({ r: i, c: j, value, kind, depends, text })
    }
  }

  // 回溯出被选中的物品
  let i = n
  let j = W
  const chosen = []
  const path = []
  while (i > 0 && j >= 0) {
    path.push([i, j])
    if (dp[i][j] !== dp[i - 1][j]) {
      chosen.unshift(i)
      let w = items[i - 1].w
      if (!complete) i -= 1
      j -= w
      if (j < 0) break
    } else {
      i -= 1
    }
  }

  return {
    rowLabels: ['0 无物品', ...items.map((it, k) => `${k + 1} w${it.w}/v${it.v}`)],
    colLabels: Array.from({ length: W + 1 }, (_, k) => String(k)),
    corner: '物品 \\ 容量',
    frames,
    path,
    answer: `最优价值 = ${dp[n][W]}${chosen.length ? `，选取物品 [${chosen.join(', ')}]（${itemsText(items, chosen)}）` : '（无物品可装）'}`,
  }
}

// ------------------------------------------------------------ 6. 最长公共子序列（LCS）

function solveLcs({ a, b }) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  const frames = []

  for (let j = 0; j <= n; j++) {
    frames.push({
      r: 0, c: j, value: 0, kind: 'init', depends: [],
      text: `dp[0][${j}] = 0：A 为空串，与任何前缀的公共子序列长度都是 0`,
    })
  }
  for (let i = 1; i <= m; i++) {
    frames.push({
      r: i, c: 0, value: 0, kind: 'init', depends: [],
      text: `dp[${i}][0] = 0：B 为空串，同理为 0`,
    })
    for (let j = 1; j <= n; j++) {
      let value, kind, depends, text
      if (a[i - 1] === b[j - 1]) {
        value = dp[i - 1][j - 1] + 1
        kind = 'match'
        depends = [[i - 1, j - 1]]
        text = `A[${i}]='${a[i - 1]}' == B[${j}]='${b[j - 1]}' → dp[${i}][${j}] = dp[${i - 1}][${j - 1}] + 1 = ${value}（字符必须进答案）`
      } else {
        const up = dp[i - 1][j]
        const left = dp[i][j - 1]
        value = Math.max(up, left)
        kind = 'compute'
        depends = [[i - 1, j], [i, j - 1]]
        text = `A[${i}]='${a[i - 1]}' != B[${j}]='${b[j - 1]}' → dp[${i}][${j}] = max(dp[${i - 1}][${j}]=${up}, dp[${i}][${j - 1}]=${left}) = ${value}`
      }
      dp[i][j] = value
      frames.push({ r: i, c: j, value, kind, depends, text })
    }
  }

  // 回溯出一条 LCS
  const path = []
  let i = m
  let j = n
  const seq = []
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      seq.unshift(a[i - 1])
      path.push([i, j])
      i--
      j--
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i--
    } else {
      j--
    }
  }

  return {
    rowLabels: ['∅', ...a.split('').map((ch, k) => `${k + 1}:${ch}`)],
    colLabels: ['∅', ...b.split('').map((ch) => ch)],
    corner: 'A \\ B',
    frames,
    path,
    answer: `LCS 长度 = ${dp[m][n]}，其中一条：${seq.join('') || '（空）'}`,
  }
}

// ------------------------------------------------------------ 7. 编辑距离

function solveEditDistance({ a, b }) {
  const m = a.length
  const n = b.length
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0))
  const frames = []

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i
    frames.push({
      r: i, c: 0, value: i, kind: 'init', depends: i > 0 ? [[i - 1, 0]] : [],
      text: `dp[${i}][0] = ${i}：把 A 的前 ${i} 个字符删空需要 ${i} 次删除`,
    })
  }
  for (let j = 1; j <= n; j++) {
    dp[0][j] = j
    frames.push({
      r: 0, c: j, value: j, kind: 'init', depends: [[0, j - 1]],
      text: `dp[0][${j}] = ${j}：空串要变成 ${j} 个字符，需要 ${j} 次插入`,
    })
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      const del = dp[i - 1][j] + 1
      const ins = dp[i][j - 1] + 1
      const rep = dp[i - 1][j - 1] + cost
      const value = Math.min(del, ins, rep)
      dp[i][j] = value
      const who =
        value === rep
          ? cost === 0
            ? `A[${i}]='${a[i - 1]}' == B[${j}]='${b[j - 1]}'，直接继承左上角`
            : `把 A[${i}] 替换成 B[${j}]（代价 1）`
          : value === del
            ? `删掉 A[${i}]='${a[i - 1]}'（代价 1）`
            : `插入 B[${j}]='${b[j - 1]}'（代价 1）`
      frames.push({
        r: i, c: j, value, kind: cost === 0 ? 'match' : 'compute',
        depends: [[i - 1, j], [i, j - 1], [i - 1, j - 1]],
        text: `dp[${i}][${j}] = min(删 ${del}, 插 ${ins}, ${cost === 0 ? '同' : '改'} ${rep}) = ${value} → ${who}`,
      })
    }
  }

  const path = []
  let i = m
  let j = n
  const ops = []
  while (i > 0 || j > 0) {
    path.push([i, j])
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) {
      i--
      j--
    } else if (i > 0 && j > 0 && dp[i][j] === dp[i - 1][j - 1] + 1) {
      ops.unshift(`替换 A[${i}]='${a[i - 1]}' → '${b[j - 1]}'`)
      i--
      j--
    } else if (i > 0 && dp[i][j] === dp[i - 1][j] + 1) {
      ops.unshift(`删除 A[${i}]='${a[i - 1]}'`)
      i--
    } else {
      ops.unshift(`插入 '${b[j - 1]}'`)
      j--
    }
  }

  return {
    rowLabels: ['∅', ...a.split('').map((ch, k) => `${k + 1}:${ch}`)],
    colLabels: ['∅', ...b.split('').map((ch) => ch)],
    corner: 'A \\ B',
    frames,
    path,
    answer: `编辑距离 = ${dp[m][n]}；一种操作方案：${ops.join(' → ') || '无需操作'}`,
  }
}

// ------------------------------------------------------------ 8. 矩阵链乘（区间 DP）

function solveMatrixChain({ dims }) {
  const n = dims.length - 1
  const m = Array.from({ length: n }, () => new Array(n).fill(0))
  const s = Array.from({ length: n }, () => new Array(n).fill(0))
  const frames = []

  for (let i = 0; i < n; i++) {
    m[i][i] = 0
    frames.push({
      r: i, c: i, value: 0, kind: 'init', depends: [],
      text: `dp[${i + 1}][${i + 1}] = 0：单个矩阵不需要乘法`,
    })
  }

  for (let len = 2; len <= n; len++) {
    for (let i = 0; i <= n - len; i++) {
      const j = i + len - 1
      let best = Infinity
      let bestK = -1
      const cands = []
      for (let k = i; k < j; k++) {
        const q = m[i][k] + m[k + 1][j] + dims[i] * dims[k + 1] * dims[j + 1]
        cands.push(`k=${k + 1}:${m[i][k]}+${m[k + 1][j]}+${dims[i] * dims[k + 1] * dims[j + 1]}=${q}`)
        if (q < best) {
          best = q
          bestK = k
        }
      }
      m[i][j] = best
      s[i][j] = bestK
      frames.push({
        r: i, c: j, value: best, kind: 'compute',
        depends: [[i, bestK], [bestK + 1, j]],
        text: `dp[${i + 1}][${j + 1}] = min(${cands.join(' | ')}) = ${best}，最优断点 k=${bestK + 1}`,
      })
    }
  }

  const split = (i, j) => {
    if (i >= j) return `A${i + 1}`
    const k = s[i][j]
    return `(${split(i, k)} × ${split(k + 1, j)})`
  }

  return {
    rowLabels: Array.from({ length: n }, (_, i) => `i=${i + 1}`),
    colLabels: Array.from({ length: n }, (_, j) => `j=${j + 1}`),
    corner: 'i \\ j',
    frames,
    path: [[0, n - 1]],
    answer: `最少标量乘法次数 = ${m[0][n - 1]}；加括号方案：${split(0, n - 1)}`,
  }
}

// ------------------------------------------------------------ 题目注册表

export const dpProblems = {
  'climbing-stairs': {
    name: '爬楼梯',
    recurrence: 'dp[i] = dp[i-1] + dp[i-2]',
    brief: '每次可上 1 或 2 阶，求上到第 n 阶的方案数——一维 DP 的最小模型。',
    inputs: [{ key: 'n', label: '台阶数 n', type: 'number', min: 1, max: 14 }],
    defaults: { n: 6 },
    makeRandom: () => ({ n: randInt(5, 10) }),
    solve: solveClimbingStairs,
  },
  'max-subarray': {
    name: '最大子数组和',
    recurrence: 'f[i] = max(f[i-1] + a[i], a[i])',
    brief: 'f[i] 表示「必须以 i 结尾」的最大和，因此转移只有两种选择：接上或重开。',
    inputs: [{ key: 'arr', label: '数组 a（逗号分隔，可含负数，4~10 个）', type: 'intList', minLen: 4, maxLen: 10 }],
    defaults: { arr: [-2, 6, -3, 5, -1, 4] },
    makeRandom: () => ({ arr: randomIntArray(randInt(6, 8)) }),
    solve: solveMaxSubarray,
  },
  lis: {
    name: '最长递增子序列',
    recurrence: 'dp[i] = 1 + max{ dp[j] | j<i 且 a[j]<a[i] }',
    brief: '状态要带上「以 i 结尾」这个后缀条件，才能转移；O(n²) 版本最直观。',
    inputs: [{ key: 'arr', label: '数组 a（逗号分隔，5~10 个）', type: 'intList', minLen: 5, maxLen: 10 }],
    defaults: { arr: [3, 10, 2, 11, 5, 14, 7, 8] },
    makeRandom: () => ({ arr: Array.from({ length: randInt(7, 9) }, () => randInt(1, 20)) }),
    solve: solveLis,
  },
  'knapsack-01': {
    name: '0/1 背包问题',
    recurrence: 'dp[i][j] = max(dp[i-1][j], dp[i-1][j-w[i]] + v[i])',
    brief: '每件物品只有「选 / 不选」两种可能，第 i 层只能由第 i-1 层推出来。',
    inputs: [
      { key: 'capacity', label: '背包容量 W', type: 'number', min: 2, max: 12 },
      { key: 'count', label: '物品件数 n', type: 'number', min: 2, max: 6 },
    ],
    defaults: { capacity: 8, count: 4, items: [{ w: 2, v: 6 }, { w: 3, v: 5 }, { w: 4, v: 8 }, { w: 5, v: 9 }] },
    makeRandom: (cur) => ({ capacity: cur.capacity, count: cur.count, items: randomItems(cur.count) }),
    solve: (inp) => solveKnapsack({ ...normalizeItems(inp), complete: false }),
  },
  'complete-knapsack': {
    name: '完全背包问题',
    recurrence: 'dp[i][j] = max(dp[i-1][j], dp[i][j-w[i]] + v[i])',
    brief: '每件物品可以选无限次，区别只在那个转移来自「本行」而不是「上一行」。',
    inputs: [
      { key: 'capacity', label: '背包容量 W', type: 'number', min: 2, max: 12 },
      { key: 'count', label: '物品件数 n', type: 'number', min: 2, max: 6 },
    ],
    defaults: { capacity: 8, count: 4, items: [{ w: 2, v: 6 }, { w: 3, v: 5 }, { w: 4, v: 8 }, { w: 5, v: 9 }] },
    makeRandom: (cur) => ({ capacity: cur.capacity, count: cur.count, items: randomItems(cur.count) }),
    solve: (inp) => solveKnapsack({ ...normalizeItems(inp), complete: true }),
  },
  lcs: {
    name: '最长公共子序列',
    recurrence: '相等取左上 +1，否则 max(上, 左)',
    brief: '双字符串 DP 的模板题：二维表 + 左上角回溯即是答案序列。',
    inputs: [
      { key: 'a', label: '字符串 A（≤8，仅字母）', type: 'text', maxLen: 8 },
      { key: 'b', label: '字符串 B（≤8，仅字母）', type: 'text', maxLen: 8 },
    ],
    defaults: { a: 'ABCBDAB', b: 'BDCABA' },
    makeRandom: () => ({ a: randomString(randInt(5, 7)), b: randomString(randInt(5, 7)) }),
    solve: solveLcs,
  },
  'edit-distance': {
    name: '编辑距离',
    recurrence: 'dp[i][j] = min(dp[i-1][j]+1, dp[i][j-1]+1, dp[i-1][j-1]+cost)',
    brief: '三种操作对应三个方向的转移，Levenshtein 距离是拼写检查的基础。',
    inputs: [
      { key: 'a', label: '源串 A（≤8）', type: 'text', maxLen: 8 },
      { key: 'b', label: '目标串 B（≤8）', type: 'text', maxLen: 8 },
    ],
    defaults: { a: 'kitten', b: 'sitting' },
    makeRandom: () => ({ a: randomString(randInt(5, 7), 'abcde'), b: randomString(randInt(5, 7), 'abcde') }),
    solve: solveEditDistance,
  },
  'matrix-chain': {
    name: '矩阵链乘',
    recurrence: 'dp[i][j] = min{ dp[i][k] + dp[k+1][j] + p[i-1]p[k]p[j] }',
    brief: '区间 DP：枚举最后一个断点，把大区间切成两个已解好的小区间。',
    inputs: [{ key: 'dims', label: '维度序列 p（逗号分隔，3~6 个）', type: 'intList', minLen: 3, maxLen: 6 }],
    defaults: { dims: [10, 20, 30, 40, 30] },
    makeRandom: () => ({ dims: Array.from({ length: randInt(4, 5) }, () => randInt(5, 40)) }),
    solve: solveMatrixChain,
  },
}

export const dpAlgorithmIds = Object.keys(dpProblems)

/** 详情页可视化组件按 id 取题面配置 */
export function getDpProblem(id) {
  return dpProblems[id] || null
}
