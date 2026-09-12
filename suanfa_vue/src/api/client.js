// ============================================================
// 后端 API 客户端（阶段三）
// 设计原则：优先请求后端，失败（后端未部署/离线）时回退本地数据，
// 保证纯静态部署（无后端）时网站功能完整可用。
// ============================================================

import { algorithms } from '../data/algorithms.js'
import { algorithmVideos } from '../data/videos.js'

const API_BASE = '/api'

/** 后端是否可用（懒探测缓存：成功永久缓存；失败仅缓存 30s，避免后端重启窗口把会话锁死在降级模式） */
let backendAvailable = null
let backendProbeAt = 0
const NEGATIVE_PROBE_TTL = 30_000

async function checkBackend() {
  if (backendAvailable === true) return true
  if (backendAvailable === false && Date.now() - backendProbeAt < NEGATIVE_PROBE_TTL) return false
  try {
    const res = await fetch(`${API_BASE}/algorithms`, { method: 'HEAD' })
    backendAvailable = res.ok
  } catch {
    backendAvailable = false
  }
  backendProbeAt = Date.now()
  return backendAvailable
}

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const err = new Error(body?.message || `请求失败 (${res.status})`)
    err.status = res.status
    throw err
  }
  return res.json()
}

// ============================================================
// 算法元数据（后端优先，本地兜底）
// ============================================================

export async function fetchAlgorithms() {
  if (await checkBackend()) {
    return request('/algorithms')
  }
  return algorithms
}

export async function fetchAlgorithmById(id) {
  if (await checkBackend()) {
    return request(`/algorithms/${id}`)
  }
  return algorithms.find((a) => a.id === id) || null
}

// ============================================================
// 算法详情内容（Mongo 文档：sections/tabs/videos）
// ============================================================

export async function fetchAlgorithmContent(id) {
  if (await checkBackend()) {
    try {
      return await request(`/algorithms/${id}/content`)
    } catch {
      // 任意失败（旧版后端无此路由/服务异常）均降级本地数据
    }
  }
  const a = algorithms.find((x) => x.id === id)
  if (!a) return null
  const sections = {
    basic: a.detailSections?.basic || null,
    advanced: a.detailSections?.advanced || null,
    defaultNotes: a.defaultNotes || null,
  }
  const tabs = []
  if (sections.basic) tabs.push('basic')
  tabs.push('viz')
  if (sections.advanced) tabs.push('advanced')
  if (sections.defaultNotes) tabs.push('notes')
  // 视频兜底：本地数据无 videos 字段时取 data/videos.js 的 B 站视频清单
  const videos = a.videos?.length ? a.videos : algorithmVideos[a.id] || []
  if (videos.length) tabs.push('videos')
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    subCategory: a.subCategory || null,
    difficulty: a.difficulty || null,
    stability: a.stability || null,
    description: a.description || null,
    complexity: a.complexity || null,
    route: a.route || null,
    complexityDetails: a.complexityDetails || null,
    sections,
    videos,
    tabs,
  }
}

// ============================================================
// 认证
// ============================================================

export async function register(username, password) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function login(username, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  })
}

export async function logout() {
  return request('/auth/logout', { method: 'POST' })
}

export async function fetchCurrentUser() {
  return request('/auth/me')
}

/**
 * 发送「修改密码」邮箱验证码（需登录）。
 * 返回 { sent, mailConfigured, maskedEmail, expiresInSeconds, cooldownSeconds, devCode? }
 * ——devCode 仅在后端未配置 SMTP 时出现（本地开发用）。
 */
export async function sendEmailCode(email) {
  return request('/auth/email-code', { method: 'POST', body: JSON.stringify({ email }) })
}

/** 修改密码（需登录 + 邮箱验证码），成功返回最新用户信息（含新绑定邮箱）。 */
export async function changePassword({ email, code, oldPassword, newPassword }) {
  return request('/auth/password', {
    method: 'PUT',
    body: JSON.stringify({ email, code, oldPassword, newPassword }),
  })
}

// ============================================================
// 用户管理（仅管理员；非管理员调后端会拿 401/403）
// ============================================================

/**
 * 用户列表。返回 { total, users: [{id, username, email, role, admin, whitelisted, createdAt,
 * progressCount, noteCount, commentCount, trainingCount}] }。
 */
export async function fetchAdminUsers(keyword) {
  const q = keyword ? `?keyword=${encodeURIComponent(keyword)}` : ''
  return request(`/admin/users${q}`)
}

/** 新建用户：{ username, password, email?, role? } */
export async function adminCreateUser(payload) {
  return request('/admin/users', { method: 'POST', body: JSON.stringify(payload) })
}

/** 编辑用户：{ username?, email?, role? }（email 传空串 = 解绑） */
export async function adminUpdateUser(id, payload) {
  return request(`/admin/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) })
}

/** 管理员重置密码（不需要原密码 / 邮箱验证码）。 */
export async function adminResetUserPassword(id, password) {
  return request(`/admin/users/${id}/password`, { method: 'PUT', body: JSON.stringify({ password }) })
}

/** 删除用户（连带清掉它的进度 / 笔记 / 评论 / 刷题记录）。 */
export async function adminDeleteUser(id) {
  return request(`/admin/users/${id}`, { method: 'DELETE' })
}

// ============================================================
// 学习进度
// ============================================================

export async function fetchProgress(userId) {
  return request(`/users/${userId}/progress`)
}

export async function updateProgress(userId, algorithmId, status) {
  return request(`/users/${userId}/progress/${algorithmId}`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

// ============================================================
// 学习笔记（后端优先，离线回退 localStorage）
// ============================================================

const localNoteKey = (algorithmId) => `suanfa:note:${algorithmId}`

export async function fetchNote(userId, algorithmId) {
  if (await checkBackend()) {
    try {
      return await request(`/users/${userId}/notes/${algorithmId}`)
    } catch (err) {
      if (err.status === 404) return null
      throw err
    }
  }
  const cached = localStorage.getItem(localNoteKey(algorithmId))
  return cached ? JSON.parse(cached) : null
}

export async function saveNote(userId, algorithmId, content) {
  if (await checkBackend()) {
    return request(`/users/${userId}/notes/${algorithmId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
  }
  const note = { algorithmId, content, updatedAt: new Date().toISOString() }
  localStorage.setItem(localNoteKey(algorithmId), JSON.stringify(note))
  recordLocalActivity()
  return note
}

export async function deleteNote(userId, algorithmId) {
  if (await checkBackend()) {
    await request(`/users/${userId}/notes/${algorithmId}`, { method: 'DELETE' })
    return
  }
  localStorage.removeItem(localNoteKey(algorithmId))
}

// ============================================================
// 学习活跃记录（本地回退时记录当日行为，供学习日历使用）
// ============================================================

const ACTIVITY_KEY = 'suanfa:activity'

function recordLocalActivity() {
  const key = todayKey()
  const map = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}')
  map[key] = (map[key] || 0) + 1
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify(map))
}

function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** 拉取学习活跃日：[{date:'YYYY-MM-DD', count}]，后端优先，离线回退本地记录 */
export async function fetchActivity(userId) {
  if (await checkBackend()) {
    return request(`/users/${userId}/activity`)
  }
  const map = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || '{}')
  return Object.entries(map)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

// ============================================================
// 算法评论（后端优先，离线回退 localStorage）
// ============================================================

const localCommentsKey = (algorithmId) => `suanfa:comments:${algorithmId}`

export async function fetchComments(algorithmId) {
  if (await checkBackend()) {
    try {
      return await request(`/algorithms/${algorithmId}/comments`)
    } catch {
      // 后端异常时降级本地
    }
  }
  return JSON.parse(localStorage.getItem(localCommentsKey(algorithmId)) || '[]')
}

export async function postComment(algorithmId, content, username) {
  if (await checkBackend()) {
    return request(`/algorithms/${algorithmId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    })
  }
  const list = JSON.parse(localStorage.getItem(localCommentsKey(algorithmId)) || '[]')
  const comment = {
    id: `local-${Date.now()}`,
    algorithmId,
    userId: username || 'guest',
    username: username || '访客',
    content,
    createdAt: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }
  list.push(comment)
  localStorage.setItem(localCommentsKey(algorithmId), JSON.stringify(list))
  recordLocalActivity()
  return comment
}

export async function removeComment(algorithmId, commentId) {
  if (await checkBackend()) {
    await request(`/comments/${commentId}`, { method: 'DELETE' })
    return
  }
  const list = JSON.parse(localStorage.getItem(localCommentsKey(algorithmId)) || '[]')
  localStorage.setItem(
    localCommentsKey(algorithmId),
    JSON.stringify(list.filter((c) => String(c.id) !== String(commentId)))
  )
}

// ============================================================
// 算法训练刷题记录（后端优先，离线回退 localStorage）
// ============================================================

const localTrainingKey = (userId) => `suanfa:training:${userId}`

export async function fetchTraining(userId) {
  if (await checkBackend()) {
    try {
      return await request(`/users/${userId}/training`)
    } catch {
      // 旧版后端无此路由时降级本地
    }
  }
  return JSON.parse(localStorage.getItem(localTrainingKey(userId)) || '[]')
}

export async function updateTraining(userId, problemId, status) {
  if (await checkBackend()) {
    try {
      return await request(`/users/${userId}/training/${problemId}`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
    } catch {
      // 降级本地
    }
  }
  const record = { problemId, status, updatedAt: new Date().toISOString() }
  saveLocalTraining(userId, record)
  recordLocalActivity()
  return record
}

export async function removeTraining(userId, problemId) {
  if (await checkBackend()) {
    try {
      await request(`/users/${userId}/training/${problemId}`, { method: 'DELETE' })
      return
    } catch {
      // 降级本地
    }
  }
  const list = JSON.parse(localStorage.getItem(localTrainingKey(userId)) || '[]')
  localStorage.setItem(
    localTrainingKey(userId),
    JSON.stringify(list.filter((t) => t.problemId !== problemId))
  )
}

function saveLocalTraining(userId, record) {
  const list = JSON.parse(localStorage.getItem(localTrainingKey(userId)) || '[]')
  const idx = list.findIndex((t) => t.problemId === record.problemId)
  if (idx >= 0) list[idx] = record
  else list.push(record)
  localStorage.setItem(localTrainingKey(userId), JSON.stringify(list))
}

// ============================================================
// 代码工作台（算法训练·手动测试执行代码，需后端）
// ============================================================

/** 服务器可用的语言工具链；后端不可达时返回 null（前端据此提示/置灰）。 */
export async function fetchCodeLanguages() {
  if (!(await checkBackend())) return null
  try {
    const res = await request('/code/languages')
    return res.languages || []
  } catch {
    return null
  }
}

/** 在后端编译运行代码，返回 { status, stdout, stderr, compileError, exitCode, timeMs, truncated } */
export async function executeCode(language, code, stdin) {
  return request('/code/execute', {
    method: 'POST',
    body: JSON.stringify({ language, code, stdin }),
  })
}

// ============================================================
// AI 助教（后端代理上游模型/中转站；优先 SSE 流式，不可用时回退本地资料答疑）
// ============================================================

/**
 * 后端 AI 能力探测（失败时视为不可用，走本地答疑）。
 * 返回 { configured, offline, loginRequired, models: [名字], modelDetails: [模型详情], defaultModel, providers, ratePerMinute, canManage }
 *
 * <p>modelDetails 由后端按身份裁剪：未登录一律为空（loginRequired=true）；普通用户只拿到
 * 管理员开放（且可用）的模型；管理员拿到全量（含不可用/仅管理员项）。前端不用自己判断可见性。
 */
export async function aiStatus() {
  if (!(await checkBackend()))
    return { configured: false, offline: true, loginRequired: false, models: [], modelDetails: [] }
  try {
    const s = await request('/ai/status')
    return {
      configured: !!s.configured,
      offline: false,
      models: s.models || [],
      modelDetails: s.modelDetails || [],
      defaultModel: s.defaultModel || '',
      providers: s.providers || [],
      ratePerMinute: s.ratePerMinute,
      canManage: !!s.canManage,
      loginRequired: !!s.loginRequired,
    }
  } catch {
    return { configured: false, offline: false, loginRequired: false, models: [], modelDetails: [] }
  }
}

/** 拉取各中转站真实可用的模型名（OpenAI 兼容 GET /models），用于校对配置。仅管理员（后端会 403）。 */
export async function aiUpstreamModels(provider) {
  const q = provider ? `?provider=${encodeURIComponent(provider)}` : ''
  return request(`/ai/upstream-models${q}`)
}

// ---------- 中转站页面配置（仅管理员）----------

/** 当前配置：providers（token 脱敏，带 origin=runtime/env）+ env 出厂配置 + effective 生效模型。 */
export async function aiSettings() {
  return request('/ai/settings')
}

/** 保存页面配置并热生效（不需重启）。apiKey 留空 = 沿用已存 token；传 '__CLEAR__' = 清除。 */
export async function aiSaveSettings(providers) {
  return request('/ai/settings', { method: 'PUT', body: JSON.stringify({ providers }) })
}

/**
 * 清空页面配置，回到 yml / 环境变量。
 *
 * <p>后端有两条等价路由：{@code POST /api/ai/settings/reset} 与 {@code PUT /api/ai/settings} +
 * {@code {"reset":true}}。旧前端误写成 {@code POST /api/ai/settings}（该路径只允许 PUT），会被路由成 405、
 * 又被全局异常处理器包成 500「服务器内部错误」，症状就是「清空页面配置失败」。
 * 这里走专用 reset 路由，若后端版本不认识它（404/405/500）就退回 PUT 写法，两边都能清空。
 */
export async function aiResetSettings() {
  try {
    return await request('/ai/settings/reset', { method: 'POST' })
  } catch (err) {
    if (err.status === 404 || err.status === 405 || err.status === 501 || err.status === 500) {
      return request('/ai/settings', { method: 'PUT', body: JSON.stringify({ reset: true }) })
    }
    throw err
  }
}

/**
 * 测试连接（可传未保存的草稿）：{ providerId, baseUrl, apiKey, model, headers } 均可省略。
 * 返回 { ok, baseUrl, model, discoveredModels, steps:[{name,title,ok,latencyMs,count,models,reply,error}] }
 */
export async function aiTestConnection(payload = {}) {
  return request('/ai/settings/test', { method: 'POST', body: JSON.stringify(payload) })
}

/** 把 SSE 字节流按「空行分隔的事件块」解析，跨 chunk 安全。 */
function createSseParser(onEvent) {
  let buf = ''
  return (text) => {
    buf += text
    let idx
    while ((idx = buf.indexOf('\n\n')) >= 0) {
      const block = buf.slice(0, idx)
      buf = buf.slice(idx + 2)
      let name = 'message'
      const dataLines = []
      for (const line of block.split('\n')) {
        if (line.startsWith('event:')) name = line.slice(6).trim()
        else if (line.startsWith('data:')) dataLines.push(line.slice(5).replace(/^ /, ''))
      }
      if (!dataLines.length) continue
      let payload = dataLines.join('\n')
      try {
        payload = JSON.parse(payload)
      } catch {
        /* 保留纯文本 */
      }
      onEvent(name, payload)
    }
  }
}

async function httpError(res) {
  const body = await res.json().catch(() => null)
  const err = new Error(body?.message || `AI 请求失败 (${res.status})`)
  err.status = res.status
  return err
}

/**
 * 流式提问。onDelta(增量文本) 用于打字机渲染，onMeta({refs}) 用于展示站内引用。
 * 默认不指定模型：服务端用「当前中转站配置的默认模型」，它不可用时自动降级到下一个可用模型。
 * （options.model 仍保留给排障脚本等场景手工指定；聊天页不再暴露选择器。）
 * 后端不支持流式（旧版/404）时自动退化为一次性返回。
 */
/** 后端限制单次请求条数，长会话只带最近若干轮（更早内容对本轮回答价值低）。 */
const AI_MAX_TURNS = 24

export async function aiChatStream(rawMessages, { model, onDelta, onMeta, onReasoning, signal } = {}) {
  const messages = rawMessages.slice(-AI_MAX_TURNS)
  if (!(await checkBackend())) {
    return { reply: localAiAnswer(messages), source: 'local', refs: [] }
  }
  let res
  try {
    res = await fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
      body: JSON.stringify({ messages, model: model || undefined }),
      signal,
    })
  } catch (err) {
    if (err.name === 'AbortError') throw err
    throw new Error('无法连接后端，请检查网络或稍后再试')
  }

  if (res.status === 404 || res.status === 405) {
    // 旧版后端无 stream 路由
    const out = await aiChat(messages, { model })
    if (onDelta && out.reply) onDelta(out.reply)
    return out
  }
  if (res.status === 401 || res.status === 403) {
    // 未登录：保持可用，降级本地答疑并提示
    return {
      reply: `${localAiAnswer(messages)}\n\n> 你尚未登录，当前为本地答疑模式；[登录](/login) 后可解锁 AI 助教自由对话。`,
      source: 'local',
      refs: [],
      needLogin: true,
    }
  }
  if (res.status === 503) {
    // 后端未配 AI_API_KEY / 上游不可用
    return { reply: localAiAnswer(messages), source: 'local', refs: [] }
  }
  if (!res.ok || !res.body) {
    throw await httpError(res)
  }

  let full = ''
  let refs = []
  let usedModel = ''
  let errMsg = ''
  const parser = createSseParser((event, data) => {
    if (event === 'meta') {
      refs = data?.refs || []
      onMeta && onMeta({ refs })
    } else if (event === 'delta') {
      const t = typeof data === 'string' ? data : data?.t || ''
      if (t) {
        full += t
        onDelta && onDelta(t)
      }
    } else if (event === 'reasoning') {
      onReasoning && onReasoning()
    } else if (event === 'done') {
      usedModel = data?.model || ''
    } else if (event === 'error') {
      errMsg = data?.message || 'AI 服务异常'
    }
  })

  const reader = res.body.getReader()
  const decoder = new TextDecoder('utf-8')
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    parser(decoder.decode(value, { stream: true }))
  }
  parser(decoder.decode())

  if (!full) {
    if (errMsg) {
      const err = new Error(errMsg)
      err.status = 502
      throw err
    }
    return { reply: localAiAnswer(messages), source: 'local', refs: [] }
  }
  return { reply: full, source: 'ai', refs, model: usedModel, note: errMsg || undefined }
}

/** 一次性（非流式）提问，保留给不支持 fetch 流的场景。 */
export async function aiChat(rawMessages, { model } = {}) {
  const messages = rawMessages.slice(-AI_MAX_TURNS)
  if (await checkBackend()) {
    try {
      const res = await request('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, model: model || undefined }),
      })
      return { reply: res.reply, source: 'ai', refs: res.refs || [], model: res.model || '' }
    } catch (err) {
      if (err.status === 429) throw err // 限流要让用户看到真实提示
      // 401/503/502 等：降级本地答疑
    }
  }
  return { reply: localAiAnswer(messages), source: 'local', refs: [] }
}

/** 本地答疑的算法同义词（中英/缩写），与后端 AiKnowledgeService 保持一致的思路。 */
const LOCAL_ALIASES = {
  'bubble-sort': ['冒泡', 'bubble'],
  'selection-sort': ['简单选择'],
  'insertion-sort': ['直接插入'],
  'shell-sort': ['希尔', 'shell', '缩小增量'],
  'merge-sort': ['归并', '合并排序', 'merge'],
  'quick-sort': ['快排', 'quicksort', 'quick'],
  'heap-sort': ['堆排', 'heap'],
  'counting-sort': ['counting'],
  'bucket-sort': ['桶排序', 'bucket'],
  'radix-sort': ['基数排序', 'radix'],
  'linear-search': ['顺序查找', 'linear'],
  'binary-search': ['二分', '折半', 'binary'],
  'interpolation-search': ['插值', 'interpolation'],
  'jump-search': ['跳跃', 'jump'],
  'exponential-search': ['指数搜索', 'exponential'],
  'hashing-search': ['哈希', 'hash', '散列', '冲突'],
  dfs: ['深度优先', '回溯'],
  bfs: ['广度优先', '层序'],
  dijkstra: ['迪杰斯特拉', '单源最短路'],
  'bellman-ford': ['贝尔曼', '负权边', '负环'],
  'floyd-warshall': ['弗洛伊德', 'floyd', '多源最短路'],
  astar: ['a*', 'a星', 'a 星', '启发式搜索'],
  prim: ['普里姆', '最小生成树'],
  kruskal: ['克鲁斯卡尔', '并查集', '最小生成树'],
  'ford-fulkerson': ['最大流', '增广路', '网络流'],
  'edmonds-karp': ['最大流'],
  'topological-sort': ['拓扑', 'topological', '入度', '关键路径'],
  'climbing-stairs': ['爬楼梯', '斐波那契', 'climb'],
  'max-subarray': ['kadane', '最大子段和', '连续子数组'],
  lis: ['最长递增子序列', '递增子序列', '子序列'],
  'knapsack-01': ['0/1 背包', '01 背包', '背包', 'knapsack', '滚动数组'],
  'complete-knapsack': ['完全背包', '零钱兑换', '无限背包'],
  lcs: ['最长公共子序列', '公共子序列', 'diff'],
  'edit-distance': ['编辑距离', 'levenshtein', '拼写纠错', '字符串相似度'],
  'matrix-chain': ['矩阵链乘', '矩阵连乘', "区间 dp"],
  'activity-selection': ['活动选择', '活动安排', '区间调度', '会议室外'],
  'fractional-knapsack': ['分数背包', '部分背包', '性价比'],
  'huffman-coding': ['哈夫曼', '霍夫曼', 'huffman', '前缀码', '熵编码'],
  'coin-change-greedy': ['贪心找零', '找零', '硬币面额', '货币系统'],
}

function aliasListOf(a) {
  const set = new Set()
  const push = (v) => {
    if (!v) return
    const s = String(v).trim().toLowerCase()
    if (s.length >= 2) set.add(s)
  }
  push(a.name)
  push(a.name.replace(/算法$/, ''))
  push(a.id)
  push(a.id.replace(/-/g, ''))
  push(a.id.replace(/-/g, ' '))
  ;(LOCAL_ALIASES[a.id] || []).forEach(push)
  return [...set]
}

function localHits(q) {
  return algorithms
    .map((a) => {
      let score = 0
      for (const alias of aliasListOf(a)) if (q.includes(alias)) score += Math.min(6, Math.max(2, alias.length))
      return { a, score }
    })
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .map((x) => x.a)
}

const CAT_NAMES = {
  sorting: '排序算法',
  searching: '搜索/查找算法',
  graph: '图算法',
  dp: '动态规划',
  greedy: '贪心算法',
}

function complexityLine(a) {
  const time = (a.complexityDetails?.time || [])
    .map((t) => `${t.label} ${t.value}`)
    .join(' / ')
  return [`时间：${time || a.complexity || '—'}`, `空间：${a.complexityDetails?.space || '—'}`,
    `稳定性：${a.stability || '—'}`, `难度：${a.difficulty || '—'}`]
}

function stripCode(md, max) {
  const t = (md || '').replace(/```[\s\S]*?```/g, '（完整代码见详情页的可视化演示）')
  return t.length > max ? `${t.slice(0, max)}…` : t
}

/** 本地答疑：在后端不可用/未登录时，用站内资料拼答案（检索 + 模板）。 */
function localAiAnswer(messages) {
  const last = [...messages].reverse().find((m) => m.role === 'user')
  const q = (last?.content || '').toLowerCase()
  if (!q) return '你好！我是小白学算法的本地答疑助手，试试问：“快速排序的原理是什么？”'

  const hits = localHits(q)

  if (!hits.length) {
    return [
      '（后端 AI 不可达，当前为**本地答疑模式**）',
      '',
      `我能检索本站收录的 ${algorithms.length} 个算法资料，但无法自由推理。换个问法试试，例如：`,
      '- 冒泡排序的时间复杂度是多少？',
      '- Dijkstra 和 Bellman-Ford 有什么区别？',
      '- 0/1 背包和完全背包的转移有什么不同？',
      '- 为什么贪心找零会失败？',
      '',
      '若你是站点维护者：在后端配好 `AI_API_KEY`（本地中转站 `http://192.168.1.8:8000/v1`）即可解锁自由对话。',
    ].join('\n')
  }

  const compare = hits.length > 1 && /(区别|对比|比较|哪个|versus|\bvs\b|和|与)/.test(q)
  if (compare) {
    const list = hits.slice(0, 3)
    const rows = list.map((a) => {
      const avg = (a.complexityDetails?.time || []).find((t) => /平均/.test(t.label))?.value || a.complexity || '—'
      return `| ${a.name} | ${avg} | ${a.complexityDetails?.space || '—'} | ${a.stability || '—'} | ${a.difficulty || '—'} |`
    })
    return [
      `### ${list.map((a) => a.name).join(' vs ')}（本地答疑）`,
      '',
      '| 算法 | 平均时间 | 空间 | 稳定性 | 难度 |',
      '| --- | --- | --- | --- | --- |',
      ...rows,
      '',
      ...list.map((a) => `- **${a.name}**：${a.description || ''}`),
      '',
      `👉 逐个看详情页可对比执行过程：${list.map((a) => a.route).join('、')}`,
    ].join('\n')
  }

  const top = hits[0]
  const wantCode = /(代码|实现|怎么写|写法|python|java|js|javascript|bug|报错)/.test(q)
  const sec = top.detailSections?.basic || ''
  const body = wantCode ? sec : stripCode(sec, 700)
  return [
    `### ${top.name}（本地答疑模式）`,
    '',
    top.description || '',
    '',
    ...complexityLine(top),
    `分类：${CAT_NAMES[top.category] || top.category}`,
    '',
    body ? `**资料摘录**\n\n${body}` : '',
    '',
    `👉 详情页：${top.route}（有交互动画）`,
  ].join('\n')
}

export { checkBackend }
