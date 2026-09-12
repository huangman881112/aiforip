<script setup>
// 动态规划通用可视化：把「dp 表如何被一格一格填出来」做成可播放的逐步演示。
// 组件本身与具体题目解耦——题目由 data/dpProblems.js 提供 solve() 生成的 frame 序列，
// 组件只负责：输入控件 → 生成 frames → 按步渲染表格 + 依赖高亮 + 回溯路径 + 步骤历史。
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getDpProblem } from '../../../data/dpProblems.js'

defineEmits(['close'])
const route = useRoute()

const problem = computed(() => getDpProblem(route.params.id))

/** 表单里放的是「用户看到的原始值」（intList 用逗号字符串），求解时再解析 */
const form = ref({})
/** 非表单数据（如随机生成的物品表），由「随机数据」按钮维护 */
const aux = ref({})

function resetForm() {
  const src = problem.value
  if (!src) return
  const next = {}
  for (const spec of src.inputs) {
    const v = src.defaults[spec.key]
    next[spec.key] = spec.type === 'intList' ? (v || []).join(', ') : v
  }
  form.value = next
  aux.value = { items: (src.defaults.items || []).map((it) => ({ ...it })) }
}
resetForm()
watch(problem, resetForm)

/** 把表单解析成 solve() 需要的 inputs，同时做长度/取值校验 */
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
    } else if (spec.type === 'intList') {
      const list = String(raw)
        .split(/[,，\s]+/)
        .filter((s) => s.length)
        .map(Number)
      if (list.some((v) => !Number.isFinite(v))) {
        errors.push(`${spec.label} 含非法数字`)
        continue
      }
      if (list.length < (spec.minLen ?? 1) || list.length > (spec.maxLen ?? 99)) {
        errors.push(`${spec.label} 需要 ${spec.minLen ?? 1}~${spec.maxLen ?? 99} 个数字`)
        continue
      }
      out[spec.key] = list
    } else {
      let text = String(raw ?? '')
        .trim()
        .replace(/[^A-Za-z]/g, '')
      if (spec.maxLen) text = text.slice(0, spec.maxLen)
      if (!text.length) {
        errors.push(`${spec.label} 不能为空（仅字母）`)
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

const step = ref(0)
const speed = ref(600)
const playing = ref(false)
let timer = null

const frames = computed(() => model.value?.frames || [])
const total = computed(() => frames.value.length)
const finished = computed(() => total.value > 0 && step.value >= total.value)
const currentFrame = computed(() => (step.value > 0 ? frames.value[step.value - 1] : null))

/** 已填出的单元格：key = "r-c" */
const cells = computed(() => {
  const map = new Map()
  const upto = Math.min(step.value, total.value)
  for (let i = 0; i < upto; i++) {
    const f = frames.value[i]
    map.set(`${f.r}-${f.c}`, { value: f.value, kind: f.kind })
  }
  return map
})

const depKeys = computed(
  () => new Set((currentFrame.value?.depends || []).map(([r, c]) => `${r}-${c}`))
)
const pathKeys = computed(() =>
  finished.value ? new Set((model.value?.path || []).map(([r, c]) => `${r}-${c}`)) : new Set()
)

const gridStyle = computed(() => {
  const cols = model.value?.colLabels?.length || 1
  return { gridTemplateColumns: `minmax(96px, max-content) repeat(${cols}, minmax(52px, 64px))` }
})

function cellClass(r, c) {
  const key = `${r}-${c}`
  const cell = cells.value.get(key)
  return {
    filled: !!cell,
    'is-init': cell?.kind === 'init',
    'is-skip': cell?.kind === 'skip',
    'is-match': cell?.kind === 'match',
    'is-active': currentFrame.value?.r === r && currentFrame.value?.c === c,
    'is-dep': depKeys.value.has(key),
    'is-path': pathKeys.value.has(key),
  }
}

function next() {
  if (step.value < total.value) step.value++
}

function prev() {
  if (step.value > 0) step.value--
}

function restart() {
  step.value = 0
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

function randomize() {
  const src = problem.value
  if (!src?.makeRandom) return
  const merged = { ...form.value, ...aux.value, ...src.makeRandom({ ...form.value, ...(aux.value.items ? { items: aux.value.items } : {}) }) }
  for (const spec of src.inputs) {
    if (merged[spec.key] !== undefined) {
      form.value[spec.key] = spec.type === 'intList' ? merged[spec.key].join(', ') : merged[spec.key]
    }
  }
  if (merged.items) aux.value = { ...aux.value, items: merged.items }
  pause()
  step.value = 0
}

onBeforeUnmount(pause)
</script>

<template>
  <div class="dp-viz">
    <template v-if="model">
      <section class="viz-section">
        <span class="viz-recurrence">{{ problem.recurrence }}</span>
        <p class="viz-hint">{{ problem.brief }}</p>
        <div class="viz-inputs">
          <div
            v-for="spec in problem.inputs"
            :key="spec.key"
            class="viz-field"
            :class="{ 'viz-field-wide': spec.type === 'intList' || spec.type === 'text' }"
          >
            <label :for="`dp-${spec.key}`">{{ spec.label }}</label>
            <input
              :id="`dp-${spec.key}`"
              v-model="form[spec.key]"
              :type="spec.type === 'number' ? 'number' : 'text'"
              :min="spec.min"
              :max="spec.max"
              :maxlength="spec.maxLen && spec.type === 'text' ? spec.maxLen : undefined"
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
            <label for="dp-speed">速度</label>
            <input id="dp-speed" v-model.number="speed" type="range" min="120" max="1500" step="60" />
            <span>{{ speed }}ms</span>
          </div>
          <span class="viz-progress">步骤 {{ step }} / {{ total }}</span>
        </div>
      </section>

      <section class="viz-section">
        <h3>DP 表（共 {{ model.rowLabels.length }} × {{ model.colLabels.length }}）</h3>
        <div class="dp-table-scroll">
          <div class="dp-table" :style="gridStyle">
            <div class="dp-cell dp-corner">{{ model.corner }}</div>
            <div v-for="(cl, c) in model.colLabels" :key="`col-${c}`" class="dp-cell dp-col-head">
              {{ cl }}
            </div>
            <template v-for="(rl, r) in model.rowLabels" :key="`row-${r}`">
              <div class="dp-cell dp-row-head">{{ rl }}</div>
              <div
                v-for="(cl, c) in model.colLabels"
                :key="`cell-${r}-${c}`"
                class="dp-cell dp-value"
                :class="cellClass(r, c)"
              >
                <span v-if="cells.has(`${r}-${c}`)" class="num">{{ cells.get(`${r}-${c}`).value }}</span>
                <span v-else class="blank">·</span>
              </div>
            </template>
          </div>
        </div>
        <div class="dp-legend">
          <span><i class="dot dot-init"></i>边界值</span>
          <span><i class="dot dot-compute"></i>转移得到</span>
          <span><i class="dot dot-dep"></i>本步依赖</span>
          <span><i class="dot dot-active"></i>正在计算</span>
          <span><i class="dot dot-path"></i>回溯路径</span>
        </div>
      </section>

      <section class="viz-section">
        <h3>当前步骤</h3>
        <div class="viz-current">{{ currentFrame ? currentFrame.text : '点「播放」或「下一步」，看这张表如何被填满' }}</div>
        <div v-if="finished" class="viz-answer">✅ {{ model.answer }}</div>
      </section>

      <section class="viz-section">
        <h3>推演历史</h3>
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

.dp-table-scroll {
  overflow-x: auto;
  padding-bottom: 6px;
}

.dp-table {
  display: grid;
  gap: 4px;
  min-width: max-content;
}

.dp-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 4px 6px;
  border-radius: 4px;
  font-size: 0.82rem;
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.dp-corner {
  background-color: var(--surface-muted);
  color: var(--text-3);
  font-size: 0.75rem;
}

.dp-col-head,
.dp-row-head {
  background-color: var(--surface-2);
  color: var(--c-blue);
  font-weight: 600;
}

.dp-row-head {
  justify-content: flex-start;
  white-space: nowrap;
  font-size: 0.75rem;
}

.dp-value {
  background-color: var(--code-bg);
  color: var(--text-3);
  border: 1px solid var(--border-1);
}

.dp-value .blank {
  opacity: 0.4;
}

.dp-value.filled {
  color: var(--text-1);
  background-color: var(--surface-2);
  border-color: var(--border-2);
}

.dp-value.filled.is-init {
  color: var(--c-blue);
  background-color: var(--tint-blue);
}

.dp-value.filled.is-skip {
  color: var(--text-2);
  background-color: var(--surface-muted);
}

.dp-value.filled.is-match {
  color: var(--c-green);
  background-color: var(--tint-green);
}

.dp-value.is-dep {
  border-color: var(--c-purple);
  box-shadow: inset 0 0 0 1px var(--tint-purple);
}

.dp-value.is-active {
  border-color: var(--c-amber);
  background-color: var(--tint-amber);
  color: var(--text-on-bright);
  font-weight: 700;
  transform: translateY(-1px);
}

.dp-value.is-path {
  border-color: var(--c-green);
  background-color: var(--tint-green);
  color: var(--c-green);
  font-weight: 700;
}

.dp-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 18px;
  margin-top: 12px;
  font-size: 0.78rem;
  color: var(--text-2);
}

.dp-legend span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 3px;
  display: inline-block;
}

.dot-init { background-color: var(--tint-blue); border: 1px solid var(--c-blue); }
.dot-compute { background-color: var(--surface-2); border: 1px solid var(--border-2); }
.dot-dep { background-color: var(--tint-purple); border: 1px solid var(--c-purple); }
.dot-active { background-color: var(--tint-amber); border: 1px solid var(--c-amber); }
.dot-path { background-color: var(--tint-green); border: 1px solid var(--c-green); }
</style>
