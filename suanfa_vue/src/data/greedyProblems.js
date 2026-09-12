// ============================================================
// 贪心算法可视化：题目「求解器 + 逐步 frame 生成」
// 每道题的 solve(inputs) 返回统一 model，供 GreedyViz.vue 按 kind 渲染：
//   {
//     kind: 'timeline' | 'pack' | 'coins',
//     frames: [{ kind, text, metrics:[{label,value}], items:[{...状态快照}] }],
//     answer: string,
//     note: string,
//   }
// 每帧都携带 items 快照，渲染层无需自己维护状态机。
// ============================================================

const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

const fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ''))

// ------------------------------------------------------------ 1. 活动选择问题（区间贪心）

function solveActivitySelection({ n }) {
  const raw = Array.from({ length: n }, (_, i) => {
    const s = randInt(0, 10)
    return { name: `a${i + 1}`, start: s, end: s + randInt(2, 5) }
  })
  return buildActivityModel(raw)
}

function buildActivityModel(raw) {
  const items = [...raw].sort((x, y) => x.end - y.end || x.start - y.start)
  const frames = []
  const status = items.map(() => 'pending')

  frames.push({
    kind: 'init',
    text: `贪心策略：按「结束时间」升序排序，先结束的给后面留的时间更多`,
    metrics: [{ label: '活动数', value: items.length }, { label: '已选', value: 0 }],
    items: snapshot(items, status),
  })

  let lastEnd = -Infinity
  let count = 0
  items.forEach((it, idx) => {
    const compatible = it.start >= lastEnd
    status[idx] = 'consider'
    frames.push({
      kind: 'consider',
      text: `看活动 ${it.name} [${it.start}, ${it.end})：${compatible
        ? `开始时间 ${it.start} ≥ 上一个已选的结束时间 ${lastEnd === -Infinity ? '-∞' : lastEnd}，相容`
        : `开始时间 ${it.start} < 上一个已选的结束时间 ${lastEnd}，冲突`}`,
      metrics: [{ label: '活动数', value: items.length }, { label: '已选', value: count }],
      items: snapshot(items, status, idx),
    })
    status[idx] = compatible ? 'taken' : 'rejected'
    if (compatible) {
      lastEnd = it.end
      count++
    }
    frames.push({
      kind: compatible ? 'take' : 'reject',
      text: compatible
        ? `选它 ✅ —— 已选集合大小变为 ${count}，当前结束时间推进到 ${it.end}`
        : `放弃它 ❌ —— 它与已选活动重叠，跳过`,
      metrics: [{ label: '活动数', value: items.length }, { label: '已选', value: count }],
      items: snapshot(items, status, idx),
    })
  })

  const chosen = items.filter((_, i) => status[i] === 'taken')
  frames.push({
    kind: 'done',
    text: '扫描结束：局部最优（每次挑最早结束的相容活动）= 全局最优',
    metrics: [{ label: '活动数', value: items.length }, { label: '已选', value: count }],
    items: snapshot(items, status),
  })

  return {
    kind: 'timeline',
    note: `排序后依次判断相容性；最多可同时安排 ${count} 个活动`,
    frames,
    answer: `最多能安排 ${count} 个互不冲突的活动：${chosen.map((c) => `${c.name}[${c.start},${c.end})`).join(' + ')}`,
  }
}

function snapshot(items, status, active) {
  return items.map((it, i) => ({
    ...it,
    status: status[i],
    active: i === active,
  }))
}

// ------------------------------------------------------------ 2. 分数背包（可以切）

function buildFractionalModel(raw, capacity) {
  const items = [...raw]
    .map((it, i) => ({ ...it, name: `物品${i + 1}`, ratio: it.v / it.w }))
    .sort((a, b) => b.ratio - a.ratio)
  const frames = []
  const taken = items.map(() => 0)
  let rest = capacity
  let value = 0

  const push = (kind, text, active) => {
    frames.push({
      kind,
      text,
      metrics: [
        { label: '剩余容量', value: fmt(rest) },
        { label: '已装重量', value: fmt(capacity - rest) },
        { label: '累计价值', value: fmt(value) },
      ],
      capacity,
      items: items.map((it, i) => ({
        ...it,
        taken: taken[i],
        fraction: taken[i] / it.w,
        active: i === active,
        status: taken[i] >= it.w - 1e-9 ? 'full' : taken[i] > 0 ? 'part' : 'idle',
      })),
    })
  }

  push('init', `按「单位价值 v/w」降序排序：性价比最高的先装`, -1)

  items.forEach((it, i) => {
    if (rest <= 1e-9) {
      push('skip', `容量已满，剩下的 ${it.name} 只能全部放弃`, i)
      return
    }
    if (it.w <= rest) {
      taken[i] = it.w
      rest -= it.w
      value += it.v
      push('take', `${it.name} 单位价值 ${fmt(it.ratio)} 最高，整件装入（重 ${it.w}，价值 +${it.v}）`, i)
    } else {
      const frac = rest / it.w
      taken[i] = rest
      value += it.v * frac
      const label = rest
      rest = 0
      push('part', `${it.name} 重 ${it.w} 装不下整件，剩余容量 ${label} → 切 ${fmt(frac)} 件装入，价值 +${fmt(it.v * frac)}`, i)
    }
  })

  frames.push({
    kind: 'done',
    text: '分数背包具有贪心选择性质：按比例切分使每一步都不可改进',
    metrics: [
      { label: '剩余容量', value: fmt(rest) },
      { label: '已装重量', value: fmt(capacity - rest) },
      { label: '累计价值', value: fmt(value) },
    ],
    capacity,
    items: snapshotPack(items, taken),
  })

  return {
    kind: 'pack',
    note: '物品可以切分（区别于 0/1 背包），所以「性价比排序」就是最优策略',
    frames,
    answer: `容量 ${capacity} 的分数背包最大价值 = ${fmt(value)}`,
  }
}

function snapshotPack(items, taken) {
  return items.map((it, i) => ({
    ...it,
    taken: taken[i],
    fraction: taken[i] / it.w,
    active: false,
    status: taken[i] >= it.w - 1e-9 ? 'full' : taken[i] > 0 ? 'part' : 'idle',
  }))
}

// ------------------------------------------------------------ 3. 贪心找零

function buildCoinModel(coins, amount) {
  const denoms = [...new Set(coins)].sort((a, b) => b - a)
  const frames = []
  const used = denoms.map(() => 0)
  let rest = amount
  let total = 0

  const push = (kind, text, active) => {
    frames.push({
      kind,
      text,
      metrics: [
        { label: '待找零', value: rest },
        { label: '已用枚数', value: total },
      ],
      amount,
      denoms: denoms.map((d, i) => ({ denom: d, count: used[i], active: i === active })),
    })
  }

  push('init', `面额从大到小排序：[${denoms.join(', ')}]，每次能拿最大面额就拿`, -1)

  denoms.forEach((d, i) => {
    if (rest === 0) {
      push('skip', `已找零完成，${d} 分不再使用`, i)
      return
    }
    const k = Math.floor(rest / d)
    if (k === 0) {
      push('skip', `${d} 分比剩余 ${rest} 分大，拿不了，降到下一档`, i)
      return
    }
    used[i] = k
    rest -= k * d
    total += k
    push('take', `剩余 ${rest + k * d} 分 ÷ ${d} 分 = ${k} 枚，拿 ${k} 枚 ${d} 分，找零后剩 ${rest} 分`, i)
  })

  const greedyOk = rest === 0
  frames.push({
    kind: 'done',
    text: greedyOk
      ? `共 ${total} 枚完成找零。注意：只有「规范货币系统」里贪心才一定最优`
      : `贪心卡住了：剩 ${rest} 分无法用现有面额凑出 —— 这正是贪心会失败的例子`,
    metrics: [
      { label: '待找零', value: rest },
      { label: '已用枚数', value: total },
    ],
    amount,
    denoms: denoms.map((d, i) => ({ denom: d, count: used[i], active: false })),
  })

  return {
    kind: 'coins',
    note: '反例：面额 [1, 3, 4] 找 6 分，贪心给出 4+1+1（3 枚），最优是 3+3（2 枚）',
    frames,
    answer: greedyOk ? `贪心方案：${total} 枚硬币` : `贪心无法完成找零（剩 ${rest} 分），需要动态规划`,
  }
}

// ------------------------------------------------------------ 4. 哈夫曼编码

function buildHuffmanModel(freqs) {
  let uidSeq = 0
  const nodes = freqs.map((f) => ({
    type: 'leaf',
    label: f.ch,
    chars: f.ch,
    weight: f.freq,
    uid: ++uidSeq,
    left: null,
    right: null,
  }))
  let pool = nodes.slice().sort((a, b) => a.weight - b.weight)
  const frames = []
  let round = 0

  const snap = (arr, newUid) =>
    [...arr]
      .sort((a, b) => a.weight - b.weight)
      .map((nd) => ({
        label: nd.chars,
        weight: nd.weight,
        type: nd.type,
        state: nd.uid === newUid ? 'new' : 'idle',
      }))

  frames.push({
    kind: 'init',
    text: `每个字符按出现次数作为权值放进最小堆：${pool.map((p) => `${p.chars}(${p.weight})`).join(' ')}`,
    pool: snap(pool),
  })

  const totalWeight = pool.reduce((s, p) => s + p.weight, 0)
  while (pool.length > 1) {
    pool.sort((a, b) => a.weight - b.weight)
    const [x, y] = [pool[0], pool[1]]
    round++
    const merged = {
      type: 'node',
      label: x.chars + y.chars,
      chars: x.chars + y.chars,
      weight: x.weight + y.weight,
      left: x,
      right: y,
      uid: ++uidSeq,
    }
    pool = [merged, ...pool.slice(2)]
    frames.push({
      kind: 'merge',
      text: `第 ${round} 轮：取出最小的两棵 ${x.chars}(${x.weight}) 与 ${y.chars}(${y.weight})，合并成权值 ${merged.weight} 的新树放回堆中`,
      pool: snap(pool, merged.uid),
      merging: [x.chars, y.chars],
      mergedLabel: merged.chars,
    })
  }

  const root = pool[0]
  const codes = {}
  const walk = (nd, prefix) => {
    if (!nd) return
    if (nd.type === 'leaf') {
      codes[nd.label] = prefix || '0'
      return
    }
    walk(nd.left, `${prefix}0`)
    walk(nd.right, `${prefix}1`)
  }
  walk(root, '')

  const table = freqs.map((f) => ({ ...f, code: codes[f.ch] || '0', bits: (codes[f.ch] || '0').length }))
  const wpl = table.reduce((s, t) => s + t.bits * t.freq, 0)
  const bitLen = Math.max(...table.map((t) => t.bits))
  const naiveBits = table.reduce((s, t) => s + bitLen * t.freq, 0)

  frames.push({
    kind: 'done',
    text: `堆里只剩一棵树，编码完成：左分支记 0、右分支记 1，得到无前缀冲突的变长码`,
    pool: snap(pool),
  })

  return {
    kind: 'huffman',
    frames,
    table,
    tree: root,
    totalWeight,
    answer: `WPL（带权路径长）= ${wpl} 位；对比定长 ${bitLen} 位编码的 ${naiveBits} 位，节省 ${(((naiveBits - wpl) / naiveBits) * 100).toFixed(1)}%`,
    note: '每次合并权值最小的两棵树 ⇒ 高频字符离根更近、码更短',
  }
}

// ------------------------------------------------------------ 题目注册表

export const greedyProblems = {
  'activity-selection': {
    name: '活动选择问题',
    strategy: '每次挑「结束最早」的相容活动（最早结束时间贪心）',
    brief: '同一间会场安排尽可能多的活动，按结束时间排序后一次线性扫描即可。',
    inputs: [{ key: 'n', label: '活动数量 n', type: 'number', min: 4, max: 8 }],
    defaults: { n: 6 },
    makeRandom: () => ({ n: randInt(5, 7) }),
    solve: solveActivitySelection,
  },
  'fractional-knapsack': {
    name: '分数背包问题',
    strategy: '按单位价值 v/w 从高到低装，最后一件可以切开',
    brief: '物品可分割时，性价比排序贪心即最优；这也是它比 0/1 背包简单的根本原因。',
    inputs: [
      { key: 'capacity', label: '背包容量 W', type: 'number', min: 5, max: 30 },
      { key: 'count', label: '物品件数 n', type: 'number', min: 3, max: 6 },
    ],
    defaults: {
      capacity: 15,
      count: 4,
      items: [{ w: 5, v: 10 }, { w: 6, v: 9 }, { w: 4, v: 8 }, { w: 3, v: 6 }],
    },
    makeRandom: (cur) => ({
      capacity: cur.capacity,
      count: cur.count,
      items: Array.from({ length: cur.count }, () => ({ w: randInt(2, 9), v: randInt(4, 20) })),
    }),
    solve: (inp) => buildFractionalModel(normalizePackItems(inp), inp.capacity),
  },
  'coin-change-greedy': {
    name: '贪心找零',
    strategy: '每次取不超过剩余金额的最大面额',
    brief: '日常货币系统下很好用，但面额不「规范」时会给出错误答案——用它理解贪心的边界。',
    inputs: [
      { key: 'amount', label: '待找零金额', type: 'number', min: 5, max: 99 },
      { key: 'coinsText', label: '硬币面额（逗号分隔）', type: 'text', maxLen: 20 },
    ],
    defaults: { amount: 63, coinsText: '25, 10, 5, 1' },
    makeRandom: () => ({ amount: randInt(20, 60), coinsText: '1, 3, 4' }),
    solve: (inp) =>
      buildCoinModel(
        String(inp.coinsText)
          .split(/[,，\s]+/)
          .map((s) => parseInt(s, 10))
          .filter((v) => Number.isFinite(v) && v > 0),
        inp.amount
      ),
  },
  'huffman-coding': {
    name: '哈夫曼编码',
    strategy: '每次合并权值最小的两棵树（最小堆贪心）',
    brief: '贪心地让高频字符靠近根部，得到带权路径长度最短的前缀码。',
    inputs: [{ key: 'freqText', label: '字符频次（形如 a:5,b:2,…）', type: 'text', maxLen: 40 }],
    defaults: { freqText: 'a:45, b:13, c:12, d:16, e:9, f:5' },
    makeRandom: () => {
      const chars = ['a', 'b', 'c', 'd', 'e', 'f']
      const k = randInt(4, 6)
      return { freqText: chars.slice(0, k).map((c) => `${c}:${randInt(2, 40)}`).join(', ') }
    },
    solve: (inp) =>
      buildHuffmanModel(
        String(inp.freqText)
          .split(/[,，\s]+/)
          .map((s) => {
            const [ch, freq] = s.split(/[:：]/)
            return { ch, freq: parseInt(freq, 10) }
          })
          .filter((x) => x.ch && Number.isFinite(x.freq) && x.freq > 0)
      ),
  },
}

function normalizePackItems(inp) {
  const items = [...(inp.items || [])]
  while (items.length < inp.count) items.push({ w: randInt(2, 9), v: randInt(4, 20) })
  items.length = inp.count
  return items
}

export const greedyAlgorithmIds = Object.keys(greedyProblems)

/** 详情页可视化组件按 id 取题面配置 */
export function getGreedyProblem(id) {
  return greedyProblems[id] || null
}
