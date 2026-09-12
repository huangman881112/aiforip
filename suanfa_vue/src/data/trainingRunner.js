// ============================================================
// 算法训练·函数模式元数据（代码工作台）
// 把题面示例（如 nums = [2,7,11,15], target = 9）转成具名参数：
// harness 按参数名取值后调用用户函数，用户代码无需做任何输入解析。
//
// 字段说明：
//   fn     用户要实现（可改名）的函数名，六语统一用 LeetCode 驼峰名
//   params 参数列表：name 参数名（与题面一致）、type 取自 int/bool/string/int[]/int[][]/string[]
//   ret    返回值类型（同上）；python/js 动态类型仅作注释提示
//   cases  测试用例：in 各参数的 JSON 字面量文本（直接填入输入框）、expect 期望输出（JSON 序列化）
//   note   函数模式下的建模说明（如链表用数组传递）
// ============================================================

export const RUNNER_META = {
  'two-sum': {
    fn: 'twoSum', ret: 'int[]',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    cases: [{ in: { nums: '[2, 7, 11, 15]', target: '9' }, expect: '[0,1]' }],
  },
  'valid-anagram': {
    fn: 'isAnagram', ret: 'bool',
    params: [{ name: 's', type: 'string' }, { name: 't', type: 'string' }],
    cases: [
      { in: { s: '"anagram"', t: '"nagaram"' }, expect: 'true' },
      { in: { s: '"rat"', t: '"car"' }, expect: 'false' },
    ],
  },
  'merge-intervals': {
    fn: 'merge', ret: 'int[][]',
    params: [{ name: 'intervals', type: 'int[][]' }],
    cases: [{ in: { intervals: '[[1, 3], [2, 6], [8, 10], [15, 18]]' }, expect: '[[1,6],[8,10],[15,18]]' }],
  },
  'kth-largest': {
    fn: 'findKthLargest', ret: 'int',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'k', type: 'int' }],
    cases: [{ in: { nums: '[3, 2, 1, 5, 6, 4]', k: '2' }, expect: '5' }],
  },
  'search-rotated': {
    fn: 'search', ret: 'int',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    cases: [{ in: { nums: '[4, 5, 6, 7, 0, 1, 2]', target: '0' }, expect: '4' }],
  },
  'first-last-position': {
    fn: 'searchRange', ret: 'int[]',
    params: [{ name: 'nums', type: 'int[]' }, { name: 'target', type: 'int' }],
    cases: [{ in: { nums: '[5, 7, 7, 8, 8, 10]', target: '8' }, expect: '[3,4]' }],
  },
  'reverse-linked-list': {
    fn: 'reverseList', ret: 'int[]',
    params: [{ name: 'head', type: 'int[]' }],
    cases: [{ in: { head: '[1, 2, 3, 4, 5]' }, expect: '[5,4,3,2,1]' }],
    note: '函数模式下链表以 int 数组传递/返回（头节点 → 数组）',
  },
  'number-of-islands': {
    fn: 'numIslands', ret: 'int',
    params: [{ name: 'grid', type: 'string[]' }],
    cases: [{ in: { grid: '["110", "010", "001"]' }, expect: '2' }],
    note: '函数模式下网格按行传字符串："110" 表示一行 1,1,0',
  },
  'course-schedule': {
    fn: 'canFinish', ret: 'bool',
    params: [{ name: 'numCourses', type: 'int' }, { name: 'prerequisites', type: 'int[][]' }],
    cases: [
      { in: { numCourses: '2', prerequisites: '[[1, 0]]' }, expect: 'true' },
      { in: { numCourses: '2', prerequisites: '[[1, 0], [0, 1]]' }, expect: 'false' },
    ],
  },
  'network-delay-time': {
    fn: 'networkDelayTime', ret: 'int',
    params: [{ name: 'times', type: 'int[][]' }, { name: 'n', type: 'int' }, { name: 'k', type: 'int' }],
    cases: [{ in: { times: '[[2, 1, 1], [2, 3, 1], [3, 4, 1]]', n: '4', k: '2' }, expect: '2' }],
  },
  'word-ladder': {
    fn: 'ladderLength', ret: 'int',
    params: [{ name: 'beginWord', type: 'string' }, { name: 'endWord', type: 'string' }, { name: 'wordList', type: 'string[]' }],
    cases: [{
      in: { beginWord: '"hit"', endWord: '"cog"', wordList: '["hot", "dot", "dog", "lot", "log", "cog"]' },
      expect: '5',
    }],
  },
  'climbing-stairs': {
    fn: 'climbStairs', ret: 'int',
    params: [{ name: 'n', type: 'int' }],
    cases: [{ in: { n: '3' }, expect: '3' }],
  },
  'longest-increasing-subsequence': {
    fn: 'lengthOfLIS', ret: 'int',
    params: [{ name: 'nums', type: 'int[]' }],
    cases: [{ in: { nums: '[10, 9, 2, 5, 3, 7, 101, 18]' }, expect: '4' }],
  },
  'minimum-path-sum': {
    fn: 'minPathSum', ret: 'int',
    params: [{ name: 'grid', type: 'int[][]' }],
    cases: [{ in: { grid: '[[1, 3, 1], [1, 5, 1], [4, 2, 1]]' }, expect: '7' }],
  },
}

/** 各类型的中文/伪签名提示（注释与 UI 用）。 */
export const TYPE_LABELS = {
  int: '整数',
  bool: '布尔',
  string: '字符串',
  'int[]': '整数数组',
  'int[][]': '二维整数数组',
  'string[]': '字符串数组',
}

export function runnerMeta(problemId) {
  return RUNNER_META[problemId] || null
}

/** 把 {nums: '[2,7]', target: '9'} 的参数字面量文本序列化为 harness 读取的 JSON 对象行。 */
export function buildFnStdin(meta, values) {
  const obj = {}
  for (const p of meta.params) {
    let text = String(values[p.name] ?? '').trim()
    if (text === '') {
      obj[p.name] = p.type === 'string' ? '' : p.type === 'bool' ? false
        : p.type === 'int[]' || p.type === 'string[]' ? [] : p.type === 'int[][]' ? [] : 0
      continue
    }
    let v
    try {
      v = JSON.parse(text)
    } catch {
      if (p.type === 'string') {
        v = text // 字符串允许不加引号直接输入
      } else {
        const err = new Error(`参数 ${p.name}（${TYPE_LABELS[p.type]}）不是合法值：数组形如 [1,2]，整数直接写数字，字符串可加引号`)
        err.param = p.name
        throw err
      }
    }
    if (p.type === 'string' && typeof v !== 'string') v = String(v)
    obj[p.name] = v
  }
  return JSON.stringify(obj) + '\n'
}
