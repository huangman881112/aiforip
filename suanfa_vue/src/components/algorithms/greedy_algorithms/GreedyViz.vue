<script setup>
// 贪心算法通用可视化（活动选择 / 分数背包 / 贪心找零）。
// 题目步骤由 data/greedyProblems.js 生成，这里按 model.kind 选择工作区画法。
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { greedyProblems } from '../../../data/greedyProblems.js'

defineEmits(['close'])
const route = useRoute()

const problemId = computed(() => route.params.id)
const problem = computed(() => greedyProblems[problemId.value] || null)

const form = ref({})
const aux = ref({})

function resetForm() {
  const src = problem.value
  if (!src) return
  const next = {}
  for (const spec of src.inputs) next[spec.key] = src.defaults[spec.key]
  form.value = next
  aux.value = { items: (src.defaults.items || []).map((it) => ({ ...it })) }
}
resetForm()
watch(problem, resetForm)

const validation = computed(() => {
  const src = problem.value
  if (!src) return { inputs: null, error: '未找到该算法的可视化配置' }
  const out = {}
  const errors = []
  for (const spec of src.inputs) {
    const raw = form.value[spec.key]
    if (spec.type === 'number') {
      const n = Number.parseInt(raw, 10)
      if (!Number.isFinite(n)) {
        errors.push(`${spec.label} 需要是整数`)
        continue
      }
      out[spec.key] = Math.min(spec.max ?? Infinity, Math.max(spec.min ?? -Infinity, n))
    } else {
      const text = String(raw ?? '')
      if (!text.trim().length) {
        errors.push(`${spec.label} 不能为空`)
        continue
      }
      out[spec.key] = text
    }
  }
  if (aux.value.items?.length) out.items = aux.value.items
  return errors.length ? { inputs: null, error: errors[0] } : { inputs: out, error: '' }
})

const resolved = computed(() => validation.value.inputs)
const formError = computed(() => validation.value.error)

const model = computed(() => {
  if (!problem.value || !resolved.value) return null
  try {
    return problem.value.solve(resolved.value)
  } catch (e) {
    return null
  }
})

const frames = computed(() => model.value?.frames || [])
const total = computed(() => frames.value.length)
const step = ref(0)
const speed = ref(800)
const playing = ref(false)
let timer = null

const current = computed(() => (step.value > 0 ? frames.value[step.value - 1] : null))
const finished = computed(() => total.value > 0 && step.value >= total.value)
const view = computed(() => current.value || frames.value[0] || null)

/** 活动选择：时间轴需要全局时间范围 */
const timeRange = computed(() => {
  const items = view.value?.items || []
  if (!items.length) return { min: 0, max: 1 }
  const max = Math.max(...items.map((i) => i.end))
  const min = Math.min(...items.map((i) => i.start))
  return { min, max: max - min === 0 ? 1 : max }
})

function posOf(it) {
  const { min, max } = timeRange.value
  const span = max - min || 1
  return {
    left: `${((it.start - min) / span) * 100}%`,
    width: `${((it.end - it.start) / span) * 100}%`,
  }
}

/** 分数背包：容量条上的分段 */
const packSegments = computed(() => {
  const cap = view.value?.capacity || 1
  return (view.value?.items || [])
    .filter((it) => it.taken > 0)
    .map((it, i) => ({
      name: it.name,
      style: { width: `${(it.taken / cap) * 100}%` },
      tone: i % 4,
      title: `${it.name} 装入 ${it.taken}/${it.w}`,
    }))
})

const packFill = computed(() => {
  const cap = view.value?.capacity || 1
  const used = (view.value?.items || []).reduce((s, it) => s + it.taken, 0)
  return `${Math.min(100, (used / cap) * 100)}%`
})

const coinFill = computed(() => {
  const amount = view.value?.amount || 1
  const rest = view.value?.metrics?.find((m) => m.label === '待找零')?.value ?? 0
  return `${Math.max(0, Math.min(100, ((amount - rest) / amount) * 100))}%`
})

function next() {
  if (step.value < total.value) step.value++
}
function prev() {
  if (step.value > 0) step.value--
}
function pause() {
  playing.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function play() {
  if (playing.value) return pause()
  if (!total.value) return
  if (finished.value) step.value = 0
  playing.value = true
  timer = setInterval(() => {
    if (step.value >= total.value) {
      pause()
      return
    }
    step.value++
  }, speed.value)
}
watch(speed, () => {
  if (playing.value) {
    pause()
    play()
  }
})
watch(model, () => {
  pause()
  step.value = 0
})
function restart() {
  pause()
  step.value = 0
}
function randomize() {
  const src = problem.value
  if (!src?.makeRandom) return
  const cur = { ...form.value, ...(aux.value.items ? { items: aux.value.items } : {}) }
  const patch = src.makeRandom(cur)
  for (const spec of src.inputs) {
    if (patch[spec.key] !== undefined) form.value[spec.key] = patch[spec.key]
  }
  if (patch.items) aux.value = { ...aux.value, items: patch.items }
  restart()
}
onBeforeUnmount(pause)
</script>

<template>
  <div class="greedy-viz">
    <template v-if="model">
      <section class="viz-section">
        <span class="viz-recurrence">贪心策略：{{ problem.strategy }}</span>
        <p class="viz-hint">{{ problem.brief }}</p>
        <div class="viz-inputs">
          <div
            v-for="spec in problem.inputs"
            :key="spec.key"
            class="viz-field"
            :class="{ 'viz-field-wide': spec.type !== 'number' }"
          >
            <label :for="`g-${spec.key}`">{{ spec.label }}</label>
            <input
              :id="`g-${spec.key}`"
              v-model="form[spec.key]"
              :type="spec.type === 'number' ? 'number' : 'text'"
              :min="spec.min"
              :max="spec.max"
              :maxlength="spec.maxLen"
              :disabled="playing"
            />
          </div>
        </div>
        <p v-if="formError" class="viz-error">{{ formError }}</p>
      </section>

      <section class="viz-section">
        <div class="viz-controls">
          <button class="primary" :disabled="!total" @click="play">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
          <button :disabled="!step || playing" @click="prev">上一步</button>
          <button :disabled="!total || finished" @click="next">下一步</button>
          <button :disabled="!step" @click="restart">回到开头</button>
          <button v-if="problem.makeRandom" :disabled="playing" @click="randomize">随机数据</button>
          <div class="viz-speed">
            <label for="g-speed">速度</label>
            <input id="g-speed" v-model.number="speed" type="range" min="200" max="2000" step="100" />
            <span>{{ speed }}ms</span>
          </div>
          <span class="viz-progress">步骤 {{ step }} / {{ total }}</span>
        </div>
      </section>

      <!-- 工作区：按题目类型三选一 -->
      <section class="viz-section">
        <h3>决策现场</h3>
        <div class="viz-stats">
          <span v-for="m in view?.metrics || []" :key="m.label" class="viz-stat">{{ m.label }}<b>{{ m.value }}</b></span>
        </div>

        <!-- 1) 活动选择：甘特条 -->
        <div v-if="model.kind === 'timeline'" class="timeline">
          <div v-for="it in view.items" :key="it.name" class="tl-row" :class="[it.status, { active: it.active }]">
            <span class="tl-name">{{ it.name }}</span>
            <span class="tl-range">[{{ it.start }}, {{ it.end }})</span>
            <span class="tl-track">
              <span class="tl-bar" :style="posOf(it)"></span>
            </span>
            <span class="tl-mark">
              {{ it.status === 'taken' ? '✔ 选' : it.status === 'rejected' ? '✘ 弃' : it.status === 'consider' ? '？判断中' : '' }}
            </span>
          </div>
        </div>

        <!-- 2) 分数背包：容量条 + 物品卡 -->
        <template v-else-if="model.kind === 'pack'">
          <div class="cap-bar">
            <div class="cap-inner">
              <span
                v-for="seg in packSegments"
                :key="seg.name"
                class="cap-seg"
                :class="`tone-${seg.tone}`"
                :style="seg.style"
                :title="seg.title"
              >{{ seg.name.replace('物品', '') }}</span>
            </div>
            <span class="cap-text">背包容量 {{ view.capacity }}（已装 {{ packFill }}）</span>
          </div>
          <div class="pack-grid">
            <div
              v-for="it in view.items"
              :key="it.name"
              class="pack-card"
              :class="[it.status, { active: it.active }]"
            >
              <div class="pack-head">
                <b>{{ it.name }}</b>
                <span class="pack-ratio">性价比 {{ (it.v / it.w).toFixed(2) }}</span>
              </div>
              <div class="pack-meta">重量 {{ it.w }} · 价值 {{ it.v }}</div>
              <div class="pack-fill">
                <span :style="{ width: `${it.fraction * 100}%` }"></span>
              </div>
              <div class="pack-taken">已装入 {{ it.taken.toFixed(2).replace(/\.00$/, '') }} / {{ it.w }}</div>
            </div>
          </div>
        </template>

        <!-- 3) 贪心找零 -->
        <template v-else-if="model.kind === 'coins'">
          <div class="cap-bar">
            <div class="cap-inner coin">
              <span class="cap-seg coin-fill" :style="{ width: coinFill }"></span>
            </div>
            <span class="cap-text">目标金额 {{ view.amount }}（已凑 {{ coinFill }}）</span>
          </div>
          <div class="coin-row">
            <div
              v-for="d in view.denoms"
              :key="d.denom"
              class="coin-card"
              :class="{ active: d.active, used: d.count > 0 }"
            >
              <span class="coin-face">{{ d.denom }}</span>
              <span class="coin-count">× {{ d.count }}</span>
            </div>
          </div>
        </template>

        <div class="viz-current">{{ current ? current.text : '点「播放」或「下一步」开始逐步决策' }}</div>
        <div v-if="finished" class="viz-answer">✅ {{ model.answer }}</div>
        <p v-if="model.note" class="viz-note">💡 {{ model.note }}</p>
      </section>

      <section class="viz-section">
        <h3>决策历史</h3>
        <div class="viz-steps">
          <div
            v-for="(f, i) in frames.slice(0, step)"
            :key="i"
            class="viz-step"
            :class="[f.kind, { active: i === step - 1 }]"
          >
            <span class="idx">{{ i + 1 }}</span>
            <i class="tag-dot"></i>
            <span>{{ f.text }}</span>
          </div>
          <p v-if="!step" class="viz-hint">还没有步骤。</p>
        </div>
      </section>
    </template>

    <div v-else class="viz-section">
      <p class="viz-error">{{ formError || '这道题还没有可视化数据，检查一下输入吧。' }}</p>
    </div>
  </div>
</template>

<style scoped>
@import '../algo-viz-common.css';

.viz-note {
  margin: 12px 0 0;
  font-size: 0.85rem;
  color: var(--text-2);
}

/* ---------------- 活动选择时间轴 ---------------- */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 14px;
}

.tl-row {
  display: grid;
  grid-template-columns: 46px 78px 1fr 62px;
  align-items: center;
  gap: 8px;
  font-size: 0.82rem;
  color: var(--text-2);
}

.tl-name {
  color: var(--text-1);
  font-weight: 600;
}

.tl-range {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--text-3);
}

.tl-track {
  position: relative;
  height: 20px;
  background-color: var(--code-bg);
  border-radius: 4px;
  border-left: 1px solid var(--border-1);
}

.tl-bar {
  position: absolute;
  top: 3px;
  bottom: 3px;
  border-radius: 3px;
  background-color: var(--surface-3);
  border: 1px solid var(--border-2);
}

.tl-row.taken .tl-bar {
  background-color: var(--c-green);
  border-color: var(--c-green);
}

.tl-row.rejected .tl-bar {
  background-color: var(--tint-red);
  border-color: var(--c-red);
}

.tl-row.consider .tl-bar {
  background-color: var(--c-amber);
  border-color: var(--c-amber);
}

.tl-row.active .tl-name {
  color: var(--c-amber);
}

.tl-mark {
  font-size: 0.78rem;
}

.tl-row.taken .tl-mark { color: var(--c-green); }
.tl-row.rejected .tl-mark { color: var(--c-red); }
.tl-row.consider .tl-mark { color: var(--c-amber); }

/* ---------------- 背包容量条 ---------------- */
.cap-bar {
  margin-bottom: 16px;
}

.cap-inner {
  display: flex;
  height: 26px;
  background-color: var(--code-bg);
  border: 1px solid var(--border-2);
  border-radius: 6px;
  overflow: hidden;
}

.cap-seg {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.72rem;
  color: var(--text-on-bright);
  border-right: 1px solid var(--border-1);
  white-space: nowrap;
  overflow: hidden;
}

.cap-seg.tone-0 { background-color: var(--c-green); }
.cap-seg.tone-1 { background-color: var(--c-blue); }
.cap-seg.tone-2 { background-color: var(--c-amber); }
.cap-seg.tone-3 { background-color: var(--c-purple); }
.cap-seg.coin-fill { background-color: var(--brand-500); color: var(--text-on-brand); }

.cap-text {
  display: block;
  margin-top: 6px;
  font-size: 0.8rem;
  color: var(--text-2);
}

.pack-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.pack-card {
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 8px;
  background-color: var(--surface-muted);
  font-size: 0.82rem;
  color: var(--text-2);
}

.pack-card.active {
  border-color: var(--c-amber);
  background-color: var(--tint-amber);
}

.pack-card.full {
  border-color: var(--c-green);
}

.pack-card.part {
  border-color: var(--c-purple);
}

.pack-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: var(--text-1);
}

.pack-ratio {
  font-size: 0.75rem;
  color: var(--c-cyan);
}

.pack-meta {
  margin: 4px 0 6px;
}

.pack-fill {
  height: 6px;
  border-radius: 3px;
  background-color: var(--surface-2);
  overflow: hidden;
}

.pack-fill span {
  display: block;
  height: 100%;
  background-color: var(--c-green);
  transition: width 0.3s ease;
}

.pack-taken {
  margin-top: 5px;
  font-size: 0.75rem;
  color: var(--text-3);
}

/* ---------------- 找零 ---------------- */
.coin-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
}

.coin-card {
  min-width: 92px;
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 999px;
  background-color: var(--surface-muted);
  text-align: center;
  font-size: 0.82rem;
  color: var(--text-2);
}

.coin-card.used {
  border-color: var(--c-green);
  color: var(--c-green);
}

.coin-card.active {
  border-color: var(--c-amber);
  background-color: var(--tint-amber);
  color: var(--text-on-bright);
}

.coin-face {
  display: block;
  font-size: 1.05rem;
  font-weight: 700;
  font-family: 'JetBrains Mono', Consolas, monospace;
}
</style>
