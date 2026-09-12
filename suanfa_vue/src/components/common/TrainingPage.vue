<script setup>
// 算法训练：静态题单 + 分类/难度筛选 + 分级提示 + 参考解答 + 完成状态跟踪
import { computed, onMounted, ref, watch } from 'vue'
import { trainingProblems, DIFFICULTY_COLORS } from '../../data/trainingProblems.js'
import { fetchAlgorithms, fetchTraining, updateTraining, removeTraining } from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'
import MarkdownBlock from './MarkdownBlock.vue'
import CodeRunner from './CodeRunner.vue'

const userStore = useUserStore()

const problems = trainingProblems
const topicFilter = ref('全部')
const difficultyFilter = ref('全部')
const statusFilter = ref('全部')
const keyword = ref('')

const expandedId = ref(null)
const hintLevel = ref({}) // problemId -> 已展示提示数
const loading = ref(true)
const error = ref('')
const trainingMap = ref({}) // problemId -> {status, updatedAt}
const algorithmMap = ref({}) // 算法 id -> 元数据（关联跳转用）

const topics = computed(() => ['全部', ...new Set(problems.flatMap((p) => p.topics))])
const difficulties = ['全部', '简单', '中等', '困难']
const statuses = ['全部', '未做', '练习中', '已通过']

const filtered = computed(() =>
  problems.filter((p) => {
    if (topicFilter.value !== '全部' && !p.topics.includes(topicFilter.value)) return false
    if (difficultyFilter.value !== '全部' && p.difficulty !== difficultyFilter.value) return false
    if (statusFilter.value !== '全部' && statusOf(p.id) !== statusFilter.value) return false
    if (keyword.value) {
      const q = keyword.value.toLowerCase()
      const hay = `${p.title} ${p.source} ${p.topics.join(' ')}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    return true
  })
)

const solvedCount = computed(
  () => problems.filter((p) => trainingMap.value[p.id]?.status === 'solved').length
)

function statusOf(id) {
  const t = trainingMap.value[id]
  if (!t) return '未做'
  return t.status === 'solved' ? '已通过' : '练习中'
}

function statusColor(s) {
  return { 未做: '#90a4ae', 练习中: '#ef6c00', 已通过: '#2e7d32' }[s]
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function showMoreHints(id) {
  hintLevel.value = { ...hintLevel.value, [id]: (hintLevel.value[id] || 0) + 1 }
}

function requireLogin() {
  if (userStore.isLoggedIn) return true
  error.value = '请先登录后再记录训练状态'
  setTimeout(() => { error.value = '' }, 2500)
  return false
}

async function mark(id, status) {
  if (!requireLogin()) return
  try {
    trainingMap.value = {
      ...trainingMap.value,
      [id]: await updateTraining(userStore.user.id, id, status),
    }
  } catch (err) {
    error.value = err.message
  }
}

async function clearMark(id) {
  if (!requireLogin()) return
  try {
    await removeTraining(userStore.user.id, id)
    const map = { ...trainingMap.value }
    delete map[id]
    trainingMap.value = map
  } catch (err) {
    error.value = err.message
  }
}

function algoRoute(algoId) {
  const a = algorithmMap.value[algoId]
  return a ? a.route || `/algorithms/${a.category}/${a.id}` : null
}

onMounted(async () => {
  try {
    const [algs, tr] = await Promise.all([
      fetchAlgorithms().catch(() => []),
      userStore.isLoggedIn ? fetchTraining(userStore.user.id).catch(() => []) : Promise.resolve([]),
    ])
    const amap = {}
    for (const a of algs) amap[a.id] = a
    algorithmMap.value = amap
    const tmap = {}
    for (const t of tr) tmap[t.problemId] = t
    trainingMap.value = tmap
  } finally {
    loading.value = false
  }
})

watch(() => userStore.isLoggedIn, async (logged) => {
  if (!logged) return
  const tr = await fetchTraining(userStore.user.id).catch(() => [])
  const tmap = {}
  for (const t of tr) tmap[t.problemId] = t
  trainingMap.value = tmap
})
</script>

<template>
  <div class="training-page">
    <div class="training-container">
      <header class="training-header">
        <div>
          <h2>🏋️ 算法训练</h2>
          <p class="training-sub">学完算法来实战：题单覆盖本站三大类算法的经典应用题，支持分级提示、参考解答与代码在线测试（C / C++ / Java / Python / Go / JavaScript）。</p>
        </div>
        <div class="training-progress">
          已通过 <strong>{{ solvedCount }}</strong> / {{ problems.length }} 题
        </div>
      </header>

      <div class="training-filters">
        <input v-model="keyword" class="filter-search" placeholder="搜索题目标题 / 出处…" />
        <select v-model="topicFilter" class="filter-select">
          <option v-for="t in topics" :key="t" :value="t">{{ t === '全部' ? '全部专题' : t }}</option>
        </select>
        <select v-model="difficultyFilter" class="filter-select">
          <option v-for="d in difficulties" :key="d" :value="d">{{ d === '全部' ? '全部难度' : d }}</option>
        </select>
        <select v-model="statusFilter" class="filter-select">
          <option v-for="s in statuses" :key="s" :value="s">{{ s === '全部' ? '全部状态' : s }}</option>
        </select>
      </div>

      <p v-if="loading" class="training-tip">题目加载中…</p>
      <p v-if="error" class="training-error">{{ error }}</p>

      <div class="problem-list">
        <article v-for="p in filtered" :key="p.id" class="problem-card" :class="{ expanded: expandedId === p.id }">
          <div class="problem-row" @click="toggleExpand(p.id)">
            <span class="problem-status-dot" :style="{ background: statusColor(statusOf(p.id)) }" :title="statusOf(p.id)"></span>
            <div class="problem-info">
              <span class="problem-title">{{ p.title }}</span>
              <span class="problem-source">{{ p.source }}</span>
            </div>
            <div class="problem-tags">
              <span class="tag-difficulty" :style="{ color: DIFFICULTY_COLORS[p.difficulty], borderColor: DIFFICULTY_COLORS[p.difficulty] }">
                {{ p.difficulty }}
              </span>
              <span v-for="t in p.topics" :key="t" class="tag-topic">{{ t }}</span>
            </div>
            <span class="problem-caret">{{ expandedId === p.id ? '▲' : '▼' }}</span>
          </div>

          <div v-if="expandedId === p.id" class="problem-body" @click.stop>
            <MarkdownBlock :source="p.description" />

            <h4>示例</h4>
            <div v-for="(ex, i) in p.examples" :key="i" class="example-box">
              <p><strong>输入：</strong>{{ ex.input }}</p>
              <p><strong>输出：</strong>{{ ex.output }}</p>
              <p v-if="ex.note" class="example-note">{{ ex.note }}</p>
            </div>

            <h4>代码测试</h4>
            <CodeRunner :problem-id="p.id" :default-input="p.examples?.[0]?.input || ''" />

            <h4>提示</h4>
            <div v-if="!p.hints.length" class="training-tip">本题暂无提示。</div>
            <ol v-else class="hint-list">
              <li v-for="(h, i) in p.hints.slice(0, hintLevel[p.id] || 0)" :key="i" class="hint-item">{{ h }}</li>
            </ol>
            <button
              v-if="(hintLevel[p.id] || 0) < p.hints.length"
              class="tr-btn"
              @click="showMoreHints(p.id)"
            >
              💡 显示第 {{ (hintLevel[p.id] || 0) + 1 }} 条提示
            </button>

            <h4>参考解答</h4>
            <details class="solution-box">
              <summary>展开查看 {{ p.complexity.time }} / {{ p.complexity.space }} 解法</summary>
              <MarkdownBlock :source="p.solution" />
            </details>

            <div v-if="p.relatedAlgorithms.length" class="related-algos">
              关联算法：
              <router-link
                v-for="aid in p.relatedAlgorithms"
                :key="aid"
                :to="algoRoute(aid) || '/algorithms'"
                class="related-link"
              >
                {{ algorithmMap[aid]?.name || aid }}
              </router-link>
            </div>

            <div class="problem-actions">
              <template v-if="statusOf(p.id) === '已通过'">
                <button class="tr-btn tr-btn-done" disabled>✓ 已通过</button>
                <button class="tr-btn" @click="clearMark(p.id)">清除记录</button>
              </template>
              <template v-else>
                <button class="tr-btn tr-btn-primary" @click="mark(p.id, 'solved')">✓ 标记通过</button>
                <button v-if="statusOf(p.id) === '未做'" class="tr-btn" @click="mark(p.id, 'solving')">✍ 标记练习中</button>
              </template>
              <router-link class="tr-btn tr-btn-ai" :to="{ path: '/ai', query: { ask: `我在做「${p.title}」（${p.source}），完全没有思路，请给我一些引导（先别给答案）。` } }">
                🤖 求助 AI
              </router-link>
            </div>
          </div>
        </article>

        <p v-if="!loading && !filtered.length" class="training-tip">没有匹配的题目，换个筛选条件试试。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.training-page {
  width: 100%;
  padding: 30px 24px 60px;
  background: var(--surface-muted);
}

.training-container {
  max-width: 960px;
  margin: 0 auto;
}

.training-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: wrap;
}

.training-header h2 {
  margin: 0 0 6px;
  color: var(--text-1);
}

.training-sub {
  margin: 0;
  color: var(--text-2);
  font-size: 0.92em;
}

.training-progress {
  padding: 10px 18px;
  font-size: 0.95em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border-radius: 999px;
}

.training-progress strong {
  font-size: 1.15em;
}

.training-filters {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin: 18px 0;
}

.filter-search {
  flex: 1;
  min-width: 200px;
}

.filter-search,
.filter-select {
  padding: 8px 12px;
  font-size: 0.92em;
  color: var(--text-1);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 8px;
}

.filter-search:focus,
.filter-select:focus {
  outline: none;
  border-color: #1e88e5;
}

.training-tip {
  padding: 16px 0;
  color: var(--text-2);
  text-align: center;
}

.training-error {
  color: var(--c-red);
  font-size: 0.9em;
}

.problem-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.problem-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  overflow: hidden;
}

.problem-card.expanded {
  border-color: var(--tint-blue-border);
  box-shadow: 0 2px 12px rgba(30, 136, 229, 0.08);
}

.problem-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  cursor: pointer;
}

.problem-row:hover {
  background: var(--surface-muted);
}

.problem-status-dot {
  flex: none;
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.problem-info {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex: 1;
  min-width: 0;
  flex-wrap: wrap;
}

.problem-title {
  font-weight: 600;
  color: var(--text-1);
}

.problem-source {
  font-size: 0.8em;
  color: var(--text-2);
}

.problem-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-difficulty {
  padding: 1px 10px;
  font-size: 0.78em;
  border: 1px solid;
  border-radius: 999px;
}

.tag-topic {
  padding: 1px 10px;
  font-size: 0.78em;
  color: var(--text-2);
  background: var(--surface-2);
  border-radius: 999px;
}

.problem-caret {
  font-size: 0.75em;
  color: var(--text-2);
}

.problem-body {
  padding: 4px 18px 18px;
  border-top: 1px dashed var(--border-1);
}

.problem-body h4 {
  margin: 18px 0 8px;
  color: var(--text-1);
}

.example-box {
  padding: 10px 14px;
  margin-bottom: 8px;
  font-size: 0.92em;
  background: var(--surface-muted);
  border-radius: 8px;
}

.example-box p {
  margin: 3px 0;
}

.example-note {
  color: var(--text-2);
}

.hint-list {
  padding-left: 1.4em;
  margin: 0 0 8px;
}

.hint-item {
  margin: 6px 0;
  padding: 8px 12px;
  font-size: 0.92em;
  color: var(--text-1);
  background: var(--tint-amber);
  border-radius: 6px;
  list-style: none;
}

.solution-box {
  padding: 4px 14px;
  background: var(--surface-muted);
  border: 1px solid var(--tint-green-border);
  border-radius: 8px;
}

.solution-box summary {
  padding: 8px 0;
  color: var(--c-green);
  font-size: 0.92em;
  cursor: pointer;
}

.related-algos {
  margin: 14px 0 4px;
  font-size: 0.9em;
  color: var(--text-2);
}

.related-link {
  margin-right: 8px;
  color: var(--c-blue);
  text-decoration: none;
}

.related-link:hover {
  text-decoration: underline;
}

.problem-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 14px;
}

.tr-btn {
  padding: 6px 16px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
  text-decoration: none;
}

.tr-btn:hover {
  border-color: #1e88e5;
  color: var(--c-blue);
}

.tr-btn-primary {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.tr-btn-primary:hover {
  background: #1976d2;
  color: #fff;
}

.tr-btn-done {
  color: #fff;
  background: #2e7d32;
  border-color: #2e7d32;
}

.tr-btn-ai {
  color: var(--c-blue);
  background: var(--tint-blue);
  border-color: var(--tint-blue-border);
}
</style>
