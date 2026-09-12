<script setup>
// 算法训练·代码工作台：手动测试执行代码（C / C++ / Java / Python / Go / JavaScript）
// 两种模式：
//   函数模式（默认，题单已配参数元数据）——标准输入自动转为具名参数，
//     代码块预生成 typed 函数签名 + JSON harness，直接用参数名取值，无需解析输入；
//   自由模式——自己写完整程序，stdin 原样传入。
// 代码经后端 /api/code/execute 编译运行；草稿按 题目+语言+模式 存 localStorage，Ctrl+Enter 运行。
import { computed, onMounted, ref, watch } from 'vue'
import { executeCode, fetchCodeLanguages } from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'
import { runnerMeta, buildFnStdin, TYPE_LABELS } from '../../data/trainingRunner.js'
import { harnessParts, wrapWithHarness, FREE_TEMPLATES } from '../../data/codeTemplates.js'

const props = defineProps({
  problemId: { type: String, required: true },
  defaultInput: { type: String, default: '' },
})

const userStore = useUserStore()
const meta = runnerMeta(props.problemId)

const LANGUAGES = [
  { value: 'c', label: 'C' },
  { value: 'cpp', label: 'C++' },
  { value: 'java', label: 'Java' },
  { value: 'python', label: 'Python' },
  { value: 'go', label: 'Go' },
  { value: 'javascript', label: 'JavaScript' },
]

const STATUS_META = {
  Accepted: { label: '✓ 运行成功', color: '#2e7d32', bg: '#e8f5e9' },
  CompileError: { label: '✗ 编译失败', color: '#c62828', bg: '#ffebee' },
  RuntimeError: { label: '✗ 运行出错', color: '#c62828', bg: '#ffebee' },
  Timeout: { label: '⏱ 运行超时', color: '#ef6c00', bg: '#fff3e0' },
  Unsupported: { label: '⚠ 语言不可用', color: '#ef6c00', bg: '#fff3e0' },
}

const MODE_KEY = `suanfa.cr.${props.problemId}.mode`
const mode = ref(meta && localStorage.getItem(MODE_KEY) !== 'free' ? 'fn' : 'free')

const language = ref(localStorage.getItem(`suanfa.cr.${props.problemId}.lang`) || 'python')
const code = ref('')
const stdin = ref('')
const caseIdx = ref(0)
const paramVals = ref({})
const running = ref(false)
const result = ref(null) // { status, stdout, stderr, compileError, exitCode, timeMs, truncated }
const runError = ref('')
const availableLangs = ref(null) // null=未知；[]=后端不可达

const codeKey = computed(
  () => `suanfa.cr.${props.problemId}.${language.value}${mode.value === 'fn' && meta ? '.fn' : ''}`
)
const paramsKey = computed(() => `suanfa.cr.${props.problemId}.params.${caseIdx.value}`)
const statusMeta = computed(() => (result.value ? STATUS_META[result.value.status] || STATUS_META.RuntimeError : null))
const activeCase = computed(() => (meta ? meta.cases[caseIdx.value] : null))

/** 输出归一化：去空白 + 全角标点转半角（肉眼看不出的不可见差异常被这两类坑到）。 */
function normText(s) {
  const FW = { '，': ',', '：': ':', '；': ';', '［': '[', '］': ']', '【': '[', '】': ']', '｛': '{', '｝': '}', '（': '(', '）': ')' }
  return String(s).replace(/\s+/g, '').replace(/[，：；［］【】｛｝（）]/g, (c) => FW[c] || c)
}

/** 宽松解析一个值为 JSON 结构（兼容元组括号、True/False/None、裸字面量）。 */
function tryParseVal(t) {
  if (!t) return undefined
  try { return JSON.parse(t) } catch { /* 非标准 JSON，继续兼容 */ }
  if (/^\(.*\)$/.test(t)) {
    try { return JSON.parse('[' + t.slice(1, -1) + ']') } catch { /* 不是元组 */ }
  }
  const low = t.toLowerCase()
  if (low === 'true') return true
  if (low === 'false') return false
  if (low === 'null' || low === 'none') return null
  if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t)
  return undefined
}

/** 结构等价：数组/对象逐元素递归，数值 1 与 1.0 等价，布尔/字符串精确。 */
function looseEq(a, b) {
  if (a === b) return true
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) < 1e-9
  if (a && b && typeof a === 'object' && typeof b === 'object') {
    if (Array.isArray(a) !== Array.isArray(b)) return false
    const ka = Object.keys(a), kb = Object.keys(b)
    if (ka.length !== kb.length) return false
    return ka.every((k) => looseEq(a[k], b[k]))
  }
  return false
}

/**
 * 期望输出比对（仅函数模式 + 运行成功时）。
 * 宽松策略：整体或逐行取输出去归一化后精确相等 → 通过；
 * 否则两边按 JSON 结构解析后深度等价（True/true、(0,1)/[0,1]、1/1.0 等）→ 通过；
 * 不通过时展示转义后的实际/期望文本，暴露不可见字符差异。
 */
const matchNote = computed(() => {
  if (mode.value !== 'fn' || !meta || !result.value || result.value.status !== 'Accepted' || !activeCase.value) return null
  const gotRaw = String(result.value.stdout || '')
  if (!gotRaw.trim()) return null
  const want = normText(activeCase.value.expect || '')
  const wantVal = tryParseVal(want)
  const candidates = [gotRaw, ...gotRaw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)]
  for (const c of candidates) {
    const n = normText(c)
    if (!n) continue
    if (n === want) return { ok: true, text: '✓ 与期望输出一致' }
    const v = tryParseVal(n)
    if (v !== undefined && wantVal !== undefined && looseEq(v, wantVal)) return { ok: true, text: '✓ 与期望输出一致（结构相同）' }
  }
  return {
    ok: false,
    text: `✗ 与期望输出不一致 · 实际 ${JSON.stringify(normText(gotRaw))} ≠ 期望 ${JSON.stringify(want)}`,
  }
})

function templateFor() {
  if (mode.value === 'fn' && meta) return harnessParts(meta, language.value).stub
  return FREE_TEMPLATES[language.value] || ''
}

function loadCode() {
  code.value = migrateDraft(localStorage.getItem(codeKey.value)) || templateFor()
}

/**
 * 旧草稿迁移：早期版本在编辑器里展示完整模板（含测试机样板）。
 * 按旧模板的「===== 你的实现区 =====」/「===== 测试机 =====」横幅切分：
 * 丢掉横幅之前的样板头，截掉测试机横幅及之后部分，保留用户实现。
 */
function migrateDraft(text) {
  if (!text || (mode.value !== 'fn' && !meta)) return text
  const HEAD = /^[ \t]*(?:\/\/|#|\/\*)?[ \t]*=====[ \t]*你的实现区/m
  const TAIL = /^[ \t]*(?:\/\/|#|\/\*)?[ \t]*=====[ \t]*测试机/m
  const hm = HEAD.exec(text)
  if (!hm && !TAIL.test(text)) return text
  let out = hm ? text.slice(hm.index) : text
  const tm = TAIL.exec(out)
  if (tm) out = out.slice(0, tm.index)
  out = out.replace(/\s+$/, '')
  return out ? out + '\n' : null
}

function loadStdin() {
  const key = `suanfa.cr.${props.problemId}.stdin`
  const saved = localStorage.getItem(key)
  stdin.value = saved != null ? saved : props.defaultInput
}

function loadParams() {
  if (!meta) return
  const saved = JSON.parse(localStorage.getItem(paramsKey.value) || 'null')
  paramVals.value = { ...(activeCase.value?.in || {}), ...(saved || {}) }
}

watch([codeKey, mode], () => { result.value = null; runError.value = ''; loadCode() })
watch(code, (v) => { localStorage.setItem(codeKey.value, v) })
watch(stdin, (v) => { localStorage.setItem(`suanfa.cr.${props.problemId}.stdin`, v) })
watch(language, (v) => { localStorage.setItem(`suanfa.cr.${props.problemId}.lang`, v) })
watch(mode, (v) => { localStorage.setItem(MODE_KEY, v) })
watch(caseIdx, () => { loadParams(); result.value = null; runError.value = '' })
watch(paramVals, (v) => { localStorage.setItem(paramsKey.value, JSON.stringify(v)); result.value = null }, { deep: true })

function resetTemplate() {
  code.value = templateFor()
  result.value = null
  runError.value = ''
}

/** Tab 缩进而非跳焦点；Ctrl+Enter 运行。 */
function onCodeKeydown(e) {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
    e.preventDefault()
    run()
    return
  }
  if (e.key !== 'Tab') return
  e.preventDefault()
  const el = e.target
  const { selectionStart: s, selectionEnd: t, value } = el
  const indent = '    '
  el.value = value.slice(0, s) + indent + value.slice(t)
  el.selectionStart = el.selectionEnd = s + indent.length
  code.value = el.value
}

async function run() {
  if (running.value) return
  runError.value = ''
  result.value = null
  if (!userStore.isLoggedIn) {
    runError.value = '请先登录后再使用代码测试'
    return
  }
  if (!code.value.trim()) {
    runError.value = '代码为空'
    return
  }
  let stdinPayload = stdin.value
  if (mode.value === 'fn' && meta) {
    try {
      stdinPayload = buildFnStdin(meta, paramVals.value)
    } catch (err) {
      runError.value = err.message
      return
    }
  }
  // 函数模式：提交时才把测试机（head/tail）包上，编辑器里不展示
  const submitted = mode.value === 'fn' && meta ? wrapWithHarness(meta, language.value, code.value) : code.value
  running.value = true
  try {
    result.value = await executeCode(language.value, submitted, stdinPayload)
    if (result.value.status === 'Unsupported' && Array.isArray(result.value.supportedLanguages)) {
      availableLangs.value = result.value.supportedLanguages
    }
  } catch (err) {
    runError.value = err.status === 401 ? '登录已过期，请重新登录' : err.message || '执行失败'
  } finally {
    running.value = false
  }
}

function langDisabled(v) {
  return availableLangs.value != null && !availableLangs.value.includes(v)
}

onMounted(async () => {
  loadCode()
  loadStdin()
  loadParams()
  availableLangs.value = await fetchCodeLanguages()
  if (availableLangs.value && !availableLangs.value.includes(language.value)) {
    const first = LANGUAGES.find((l) => availableLangs.value.includes(l.value))
    if (first) language.value = first.value
  }
})
</script>

<template>
  <div class="code-runner">
    <div class="cr-toolbar">
      <div v-if="meta" class="cr-modes">
        <button class="cr-mode" :class="{ active: mode === 'fn' }" @click="mode = 'fn'">
          📌 函数模式
        </button>
        <button class="cr-mode" :class="{ active: mode === 'free' }" @click="mode = 'free'">
          📝 自由模式
        </button>
      </div>
      <select v-model="language" class="cr-select" title="选择语言">
        <option v-for="l in LANGUAGES" :key="l.value" :value="l.value" :disabled="langDisabled(l.value)">
          {{ l.label }}{{ langDisabled(l.value) ? '（未安装）' : '' }}
        </option>
      </select>
      <button class="cr-btn cr-run" :disabled="running" @click="run">
        {{ running ? '⏳ 运行中…' : '▶ 运行 (Ctrl+Enter)' }}
      </button>
      <button class="cr-btn" @click="resetTemplate">↺ 重置模板</button>
      <span v-if="availableLangs === null" class="cr-hint">后端不可达，代码测试暂不可用</span>
    </div>

    <p v-if="mode === 'fn' && meta" class="cr-mode-tip">
      直接实现 <code>{{ meta.fn }}</code>，用参数名
      <code>{{ meta.params.map((p) => p.name).join('、') }}</code> 取值；
      测试机（输入解析/调用/输出序列化）运行时自动附加，不展示在代码块里。
      <span v-if="meta.note" class="cr-note">{{ meta.note }}</span>
    </p>

    <div class="cr-panes">
      <label class="cr-pane cr-code-pane">
        <span class="cr-label">代码</span>
        <textarea
          v-model="code"
          class="cr-textarea"
          spellcheck="false"
          :readonly="running"
          @keydown="onCodeKeydown"
        ></textarea>
      </label>

      <div class="cr-pane cr-io-pane">
        <!-- 函数模式：具名参数输入 -->
        <div v-if="mode === 'fn' && meta" class="cr-sub cr-params">
          <span class="cr-label">
            参数输入（按名取值）
            <template v-if="meta.cases.length > 1">
              <button
                v-for="(c, ci) in meta.cases"
                :key="ci"
                class="cr-case"
                :class="{ active: caseIdx === ci }"
                @click="caseIdx = ci"
              >
                用例{{ ci + 1 }}
              </button>
            </template>
          </span>
          <div v-for="p in meta.params" :key="p.name" class="cr-param">
            <span class="cr-param-name" :title="TYPE_LABELS[p.type]">{{ p.name }}<i>{{ p.type }}</i></span>
            <input v-model="paramVals[p.name]" class="cr-param-input" :placeholder="activeCase?.in?.[p.name] || ''" />
          </div>
          <p v-if="activeCase" class="cr-expect">期望输出：<code>{{ activeCase.expect }}</code></p>
        </div>

        <!-- 自由模式：原始标准输入 -->
        <label v-else class="cr-sub">
          <span class="cr-label">标准输入</span>
          <textarea v-model="stdin" class="cr-textarea cr-stdin" spellcheck="false" placeholder="程序运行时的 stdin…"></textarea>
        </label>

        <div class="cr-sub">
          <span class="cr-label">
            输出
            <template v-if="statusMeta">
              <span class="cr-status" :style="{ color: statusMeta.color, background: statusMeta.bg }">{{ statusMeta.label }}</span>
              <span class="cr-time">{{ result.timeMs }} ms<template v-if="result.exitCode != null"> · exit {{ result.exitCode }}</template><template v-if="result.truncated"> · 已截断</template></span>
            </template>
          </span>
          <p v-if="matchNote" class="cr-match" :class="matchNote.ok ? 'ok' : 'bad'">{{ matchNote.text }}</p>
          <p v-if="runError" class="cr-error">{{ runError }}</p>
          <pre v-if="result?.compileError" class="cr-out cr-out-err">[编译错误]
{{ result.compileError }}</pre>
          <pre v-else-if="result" class="cr-out">{{ (result.stdout || '') + (result.stderr ? (result.stdout ? '\n' : '') + '[stderr]\n' + result.stderr : '') || '(无输出)' }}</pre>
          <pre v-else-if="!runError" class="cr-out cr-out-placeholder">点击「运行」查看输出…</pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.code-runner {
  border: 1px solid var(--border-1);
  border-radius: 10px;
  background: var(--surface-muted);
  overflow: hidden;
}

.cr-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border-1);
}

.cr-modes {
  display: flex;
  border: 1px solid var(--border-1);
  border-radius: 6px;
  overflow: hidden;
}

.cr-mode {
  padding: 5px 12px;
  font-size: 0.85em;
  color: var(--text-2);
  background: var(--surface);
  border: none;
  cursor: pointer;
}

.cr-mode.active {
  color: #fff;
  background: #1e88e5;
}

.cr-select {
  padding: 6px 10px;
  font-size: 0.9em;
  color: var(--text-1);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
}

.cr-btn {
  padding: 6px 14px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
}

.cr-btn:hover {
  border-color: #1e88e5;
  color: var(--c-blue);
}

.cr-run {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
  font-weight: 600;
}

.cr-run:hover {
  background: #1976d2;
  color: #fff;
}

.cr-run:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.cr-hint {
  font-size: 0.8em;
  color: var(--c-orange);
}

.cr-mode-tip {
  margin: 0;
  padding: 8px 14px;
  font-size: 0.82em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border-bottom: 1px solid var(--border-1);
}

.cr-mode-tip code {
  padding: 0 4px;
  font-weight: 600;
  background: var(--surface);
  border-radius: 4px;
}

.cr-note {
  margin-left: 8px;
  color: var(--text-2);
}

.cr-panes {
  display: flex;
  gap: 10px;
  padding: 10px 12px 12px;
}

.cr-pane {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.cr-code-pane {
  flex: 1.2;
}

.cr-io-pane {
  flex: 1;
  gap: 10px;
}

.cr-sub {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
}

.cr-label {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 4px;
  font-size: 0.82em;
  font-weight: 600;
  color: var(--text-2);
}

.cr-params {
  flex: none;
  gap: 6px;
}

.cr-case {
  padding: 1px 10px;
  font-size: 0.9em;
  font-weight: 400;
  color: var(--text-2);
  background: var(--surface-2);
  border: 1px solid transparent;
  border-radius: 999px;
  cursor: pointer;
}

.cr-case.active {
  color: var(--c-blue);
  background: var(--tint-blue);
  border-color: var(--tint-blue-border);
}

.cr-param {
  display: flex;
  align-items: center;
  gap: 8px;
}

.cr-param-name {
  flex: none;
  width: 130px;
  font-size: 0.82em;
  color: var(--text-1);
  text-align: right;
}

.cr-param-name i {
  margin-left: 4px;
  font-style: normal;
  color: var(--text-2);
}

.cr-param-input {
  flex: 1;
  min-width: 0;
  padding: 6px 10px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
  font-size: 0.84em;
  color: var(--text-1);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
}

.cr-param-input:focus {
  outline: none;
  border-color: #1e88e5;
}

.cr-expect {
  margin: 2px 0 0;
  font-size: 0.8em;
  color: var(--text-2);
}

.cr-expect code {
  padding: 0 4px;
  color: var(--c-green);
  background: var(--tint-green);
  border-radius: 4px;
}

.cr-textarea {
  width: 100%;
  box-sizing: border-box;
  flex: 1;
  min-height: 260px;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
  font-size: 0.86em;
  line-height: 1.55;
  color: var(--text-1);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  resize: vertical;
}

.cr-textarea:focus {
  outline: none;
  border-color: #1e88e5;
}

.cr-stdin {
  min-height: 64px;
  max-height: 110px;
}

.cr-out {
  flex: 1;
  min-height: 120px;
  max-height: 320px;
  overflow: auto;
  margin: 0;
  padding: 10px 12px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, 'Courier New', monospace;
  font-size: 0.86em;
  line-height: 1.5;
  color: var(--text-1);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--code-bg);
  border-radius: 8px;
}

.cr-out-err {
  color: var(--c-red);
}

.cr-out-placeholder {
  color: var(--text-2);
}

.cr-match {
  margin: 0 0 6px;
  font-size: 0.85em;
  font-weight: 600;
}

.cr-match.ok {
  color: var(--c-green);
}

.cr-match.bad {
  color: var(--c-orange);
}

.cr-error {
  margin: 0 0 6px;
  font-size: 0.85em;
  color: var(--c-red);
}

.cr-status {
  padding: 1px 8px;
  font-size: 0.92em;
  font-weight: 600;
  border-radius: 999px;
}

.cr-time {
  font-weight: 400;
  color: var(--text-2);
}

@media (max-width: 760px) {
  .cr-panes {
    flex-direction: column;
  }

  .cr-textarea {
    min-height: 200px;
  }

  .cr-param-name {
    width: auto;
    text-align: left;
  }
}
</style>
