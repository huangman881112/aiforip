<script setup>
// AI 计算机语言助教对话页：与算法助教（/ai）共用后端代理 / SSE 流式 / 限流与中转站配置，
// 通过请求体里的 scene=language 切换后端人设与语言知识库（AiLanguageKnowledgeService）。
// 未配置/离线时自动降级为「本地答疑模式」（检索站内语言资料作答，见 client.js 的 localLanguageAnswer）。
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aiChatStream, aiStatus, AI_SCENE_LANGUAGE } from '../../api/client.js'
import { languages, getLanguageById } from '../../data/languages.js'
import { useUserStore } from '../../stores/user.js'
import AiSettingsPanel from './AiSettingsPanel.vue'
import MarkdownBlock from './MarkdownBlock.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const messages = ref([]) // {role, content, source?, model?, refs?, error?}
const input = ref('')
const sending = ref(false)
const aiReady = ref(false)
const activeModel = ref('')
const models = ref([])
const defaultToken = ref('')
const canManage = ref(false)
const loginRequired = ref(false)
const showSettings = ref(false)
const bodyEl = ref(null)
const inputEl = ref(null)
let controller = null
const reasoningHint = ref(false)

// 当前选中的语言（点语言芯片发送入门规划时用；仅前端展示态，不影响后端召回）
const activeLangId = ref('')

const QUICK_PROMPTS = [
  'Python 的 GIL 是什么？为什么多线程提速不明显？',
  'Java 的 HashMap 底层是怎么实现的？',
  'C++ 的智能指针 unique_ptr 和 shared_ptr 怎么选？',
  'JavaScript 的事件循环（Event Loop）讲一下',
  'C 语言的指针和数组到底是什么关系？',
]

const HISTORY_KEY = computed(() => `suanfa.ai.lang.history.${userStore.user?.id || 'guest'}`)
const currentModel = computed(
  () => models.value.find((m) => m.token === defaultToken.value) || models.value.find((m) => m.available) || null
)
const currentProviderText = computed(() => {
  const m = currentModel.value
  if (!m) return ''
  return m.providerLabel || m.provider || ''
})
const GENERIC_PROVIDER = 'AI 服务'
const publicModeText = computed(() => {
  const p = currentProviderText.value
  return p && p !== GENERIC_PROVIDER ? `AI 服务 · ${p}` : 'AI 服务已接入'
})
const currentModelText = computed(() => {
  if (!canManage.value) return currentProviderText.value
  const m = currentModel.value
  if (!m) return ''
  const label = m.label || m.name
  return m.providerLabel && m.providerLabel !== label ? `${label} · ${m.providerLabel}` : label
})
const modeText = computed(() => {
  if (localSession.value) return '本地答疑模式'
  if (!canManage.value) return publicModeText.value
  if (activeModel.value) return `本次模型 ${activeModel.value}`
  if (currentModelText.value) return `默认模型 ${currentModelText.value}`
  return ''
})
const modeTip = computed(() => {
  if (!canManage.value) {
    const p = currentProviderText.value
    return p && p !== GENERIC_PROVIDER
      ? `回答由「${p}」提供；具体模型与预算仅管理员可见`
      : '回答由服务器配置的中转站提供；具体模型与预算仅管理员可见'
  }
  if (activeModel.value) return '本轮实际服务的模型；默认模型熔断时会降级到下一个可用模型'
  const m = currentModel.value
  if (!m) return ''
  const extra = modelTitle(m)
  return `当前中转站配置的默认模型${extra ? `：${extra}` : ''}`
})
const localSession = computed(() => messages.value.some((m) => m.source === 'local'))

/** 选中语言后展示的问候语（未选语言时为 null） */
const activeLang = computed(() => (activeLangId.value ? getLanguageById(activeLangId.value) : null))

async function scrollToBottom(force = false) {
  await nextTick()
  const el = bodyEl.value
  if (!el) return
  const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 160
  if (force || nearBottom) el.scrollTop = el.scrollHeight
}

function persist() {
  try {
    const slim = messages.value
      .filter((m) => !m.error)
      .slice(-30)
      .map(({ role, content, source, model, refs }) => ({ role, content, source, model, refs }))
    localStorage.setItem(HISTORY_KEY.value, JSON.stringify(slim))
  } catch {
    /* 隐私模式/超额忽略 */
  }
}

function modelTitle(m) {
  const bits = []
  if (m.maxTokens) bits.push(`max_tokens ${m.maxTokens}`)
  if (m.timeoutSeconds) bits.push(`超时 ${m.timeoutSeconds}s`)
  if (m.reasoningEffort) bits.push(`reasoning ${m.reasoningEffort}`)
  if (m.cooldownSeconds > 0) bits.push(`熔断中，约 ${m.cooldownSeconds}s 后恢复`)
  if (m.note) bits.push(m.note)
  return bits.join(' · ')
}

async function refreshStatus() {
  const s = await aiStatus()
  aiReady.value = s.configured
  canManage.value = !!s.canManage
  loginRequired.value = !userStore.isLoggedIn || !!s.loginRequired
  models.value = loginRequired.value ? [] : s.modelDetails || []
  defaultToken.value = s.defaultModel || ''
  if (loginRequired.value || !s.configured) activeModel.value = ''
  return s
}

function gotoLogin() {
  router.push({ name: 'Login', query: { redirect: route.fullPath } })
}

function restore() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY.value)
    const list = raw ? JSON.parse(raw) : []
    messages.value = Array.isArray(list) ? list : []
  } catch {
    messages.value = []
  }
}

async function send(text) {
  const content = (text ?? input.value).trim()
  if (!content || sending.value) return
  messages.value.push({ role: 'user', content })
  input.value = ''
  sending.value = true
  scrollToBottom(true)

  messages.value.push({ role: 'assistant', content: '', source: 'ai', refs: [], model: '' })
  const replyIndex = messages.value.length - 1
  const reply = messages.value[replyIndex]
  const history = messages.value
    .slice(0, -1)
    .filter((m) => m.content)
    .map(({ role, content: c }) => ({ role, content: c }))

  controller = new AbortController()
  reasoningHint.value = false
  let flushed = false
  try {
    // scene=language：后端切换为语言助教人设 + 语言知识库；模型仍由服务端按中转站配置选择
    const res = await aiChatStream(history, {
      scene: AI_SCENE_LANGUAGE,
      signal: controller.signal,
      onDelta: (t) => {
        reply.content += t
        flushed = true
        scrollToBottom()
      },
      onMeta: ({ refs }) => {
        reply.refs = refs || []
      },
      onReasoning: () => {
        reasoningHint.value = true
      },
    })
    reply.content = res.reply || reply.content
    reply.source = res.source || 'ai'
    reply.refs = res.refs || reply.refs || []
    if (res.source !== 'ai') {
      reply.model = ''
    } else if (canManage.value) {
      reply.model = res.model || ''
      activeModel.value = res.model || activeModel.value
      const def = currentModel.value
      if (def && res.model && res.model !== def.name) {
        reply.degradedTo = res.model
      }
    } else {
      reply.model = ''
    }
    if (!flushed && res.source === 'local') scrollToBottom(true)
  } catch (err) {
    if (err.name === 'AbortError') {
      reply.content = reply.content || '（已停止回答）'
      reply.stopped = true
    } else {
      if (!reply.content) messages.value.splice(replyIndex, 1)
      else reply.content += '\n\n（回答中断）'
      messages.value.push({ role: 'assistant', content: err.message || '请求失败，请稍后再试', error: true, retry: content })
    }
  } finally {
    sending.value = false
    controller = null
    persist()
    scrollToBottom(true)
  }
}

function stop() {
  if (controller) controller.abort()
}

function onBodyClick(e) {
  const a = e.target instanceof Element ? e.target.closest('a[href]') : null
  if (!a) return
  const href = a.getAttribute('href') || ''
  if (href.startsWith('/') && !href.startsWith('//')) {
    e.preventDefault()
    router.push(href)
  }
}

function retry(msg) {
  messages.value = messages.value.filter((m) => m !== msg)
  send(msg.retry)
}

function onKeydown(e) {
  if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
    e.preventDefault()
    send()
  }
}

function clearChat() {
  messages.value = []
  activeModel.value = ''
  try {
    localStorage.removeItem(HISTORY_KEY.value)
  } catch {
    /* ignore */
  }
}

function greeting() {
  return userStore.isLoggedIn
    ? `你好，${userStore.user.username}！我是小白学算法的 AI 计算机语言助教 🤖`
    : '你好！我是小白学算法的 AI 计算机语言助教 🤖'
}

/** 点语言芯片：选中并直接要一份入门路线（再次点击取消选中） */
function pickLang(l) {
  if (sending.value) return
  if (activeLangId.value === l.id) {
    activeLangId.value = ''
    return
  }
  activeLangId.value = l.id
  send(`我想学习 ${l.name}，请结合它的特点给我一份从零开始的入门学习路线。`)
}

function consumeQuery() {
  const ask = route.query.ask
  const lang = route.query.lang
  if (typeof lang === 'string' && getLanguageById(lang)) {
    activeLangId.value = lang
    router.replace({ path: '/ai/language', query: typeof ask === 'string' && ask.trim() ? { ask } : {} })
    if (typeof ask !== 'string' || !ask.trim()) return true
  }
  if (typeof ask === 'string' && ask.trim()) {
    router.replace({ path: '/ai/language' })
    send(ask.trim())
    return true
  }
  return false
}

onMounted(async () => {
  restore()
  inputEl.value?.focus()
  await refreshStatus()
  scrollToBottom(true)
  consumeQuery()
})

watch(() => route.query.ask, () => consumeQuery())
watch(() => userStore.isLoggedIn, () => refreshStatus())
watch(HISTORY_KEY, () => {
  restore()
  scrollToBottom(true)
})

onUnmounted(stop)
</script>

<template>
  <div class="ai-page">
    <div class="ai-container">
      <div class="ai-card">
        <header class="ai-header">
          <h2>🤖 AI 计算机语言助教</h2>
          <div class="ai-header-right">
            <router-link class="ai-scene-switch" to="/ai" title="切换到算法助教">算法助教 →</router-link>
            <span
              v-if="modeText"
              class="ai-mode-badge"
              :class="{ 'is-ai': !localSession }"
              :title="modeTip"
            >{{ modeText }}</span>
            <span v-else-if="!aiReady" class="ai-mode-badge">未配置后端 · 本地答疑</span>
            <button
              v-if="loginRequired"
              class="ai-clear-btn ai-login-btn"
              title="登录后由服务端按中转站配置的默认模型回答；现在先看本地资料答疑"
              @click="gotoLogin"
            >
              🔒 登录解锁自由对话
            </button>
            <button
              v-if="canManage"
              class="ai-clear-btn"
              title="配置第三方 API 中转站（地址 / token / 模型）并测试连接"
              @click="showSettings = true"
            >
              ⚙️ 中转站配置
            </button>
            <button class="ai-clear-btn" :disabled="!messages.length" @click="clearChat">清空对话</button>
          </div>
        </header>

        <div ref="bodyEl" class="ai-body" @click="onBodyClick">
          <div v-if="!messages.length" class="ai-welcome">
            <p class="ai-greet">{{ greeting() }}</p>
            <p class="ai-desc">
              本站收录 Java / Python / C++ / C / JavaScript 五门语言的系统教程，任何语言疑问都可以问我：
              语法讲解、底层原理、代码 Debug、语言选型、入门路线规划。
              回答会引用站内语言板块的资料，也可以从下面的快捷问题开始：
            </p>
            <div class="lang-chips" role="group" aria-label="选择语言">
              <button
                v-for="l in languages"
                :key="l.id"
                class="lang-chip"
                :class="{ active: activeLangId === l.id }"
                :disabled="sending"
                :title="`让助教规划一份 ${l.name} 的入门学习路线`"
                @click="pickLang(l)"
              >
                {{ l.icon }} {{ l.name }}
              </button>
            </div>
            <div class="quick-prompts">
              <button
                v-for="q in QUICK_PROMPTS"
                :key="q"
                class="quick-btn"
                :disabled="sending"
                @click="send(q)"
              >
                {{ q }}
              </button>
            </div>
          </div>

          <div
            v-for="(m, i) in messages"
            :key="i"
            class="chat-row"
            :class="m.role === 'user' ? 'chat-row-user' : 'chat-row-ai'"
          >
            <span class="chat-avatar">{{ m.role === 'user' ? '我' : 'AI' }}</span>
            <div class="chat-bubble" :class="{ 'chat-bubble-err': m.error }">
              <template v-if="m.role === 'assistant'">
                <template v-if="m.content && !m.error">
                  <MarkdownBlock :source="m.content" />
                  <span v-if="sending && i === messages.length - 1" class="chat-caret">▍</span>
                </template>
                <div v-else-if="sending && i === messages.length - 1 && !m.error" class="chat-thinking">
                  <span>{{ reasoningHint ? '兜底模型推理较慢，正在生成首字，请稍候…' : '正在检索站内语言资料并思考…' }}</span>
                  <button class="chat-stop-btn" @click="stop">停止</button>
                </div>
                <p v-else class="chat-text">{{ m.content }}</p>
                <div v-if="m.refs && m.refs.length" class="chat-refs">
                  <span class="chat-refs-label">站内参考</span>
                  <router-link v-for="r in m.refs" :key="r.id" :to="r.route" class="chat-ref-link">
                    {{ r.name }}
                  </router-link>
                </div>
                <div v-if="m.error && m.retry" class="chat-err-actions">
                  <button class="chat-retry-btn" :disabled="sending" @click="retry(m)">重试</button>
                </div>
                <span v-if="m.source === 'local'" class="chat-local-tag">本地答疑</span>
                <span v-if="m.degradedTo && canManage" class="chat-degraded-tag">
                  默认模型暂不可用，本次由 {{ m.degradedTo }} 回答
                </span>
              </template>
              <p v-else class="chat-text">{{ m.content }}</p>
            </div>
          </div>
        </div>

        <footer class="ai-input-bar">
          <textarea
            ref="inputEl"
            v-model="input"
            class="ai-input"
            rows="2"
            :placeholder="activeLang ? `正在学 ${activeLang.name}，问点什么…（Enter 发送 / Shift+Enter 换行）` : '输入语言学习问题，Enter 发送 / Shift+Enter 换行（输入法组词时 Enter 不上屏）'"
            @keydown="onKeydown"
          ></textarea>
          <button v-if="sending" class="ai-send-btn ai-send-stop" @click="stop">停止</button>
          <button v-else class="ai-send-btn" :disabled="!input.trim()" @click="send()">发送</button>
        </footer>
      </div>
      <p class="ai-foot-note">
        回答由大模型生成，语法细节与底层机制请以站内语言板块的图文为准；发现错误欢迎留言指出。
        算法问题请去 <router-link to="/ai">AI 算法助教</router-link>。
      </p>
    </div>

    <AiSettingsPanel :visible="showSettings" @close="showSettings = false" @saved="refreshStatus" />
  </div>
</template>

<style scoped>
.ai-page {
  width: 100%;
  padding: 30px 24px 60px;
  background: var(--surface-muted);
}

.ai-container {
  max-width: 1200px;
  margin: 0 auto;
}

.ai-card {
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  overflow: hidden;
}

.ai-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-1);
}

.ai-header h2 {
  margin: 0;
  font-size: 1.15rem;
  color: var(--text-1);
}

.ai-header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* 场景切换：算法助教 ↔ 语言助教 */
.ai-scene-switch {
  font-size: 0.82em;
  color: var(--c-blue);
  text-decoration: none;
  padding: 3px 10px;
  border: 1px dashed var(--tint-blue-border);
  border-radius: 999px;
  white-space: nowrap;
}

.ai-scene-switch:hover {
  background: var(--tint-blue);
}

.ai-mode-badge {
  padding: 2px 10px;
  font-size: 0.78em;
  color: var(--c-orange);
  background: var(--tint-amber);
  border: 1px solid var(--tint-amber-border);
  border-radius: 999px;
  cursor: help;
}

.ai-mode-badge.is-ai {
  color: var(--c-green);
  background: var(--tint-green);
  border-color: var(--tint-green-border);
}

.ai-clear-btn {
  padding: 5px 12px;
  font-size: 0.85em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
}

.ai-login-btn {
  border-style: dashed;
  color: var(--text-2);
}

.ai-clear-btn:disabled {
  opacity: 0.5;
  cursor: default;
}

.ai-clear-btn:hover:not(:disabled) {
  color: var(--c-red);
  border-color: var(--tint-red-border);
}

.ai-body {
  flex: 1;
  min-height: 360px;
  max-height: 60vh;
  overflow-y: auto;
  padding: 20px;
}

.ai-welcome {
  text-align: center;
  padding: 30px 10px;
}

.ai-greet {
  margin: 0 0 8px;
  font-size: 1.05em;
  font-weight: 600;
  color: var(--text-1);
}

.ai-desc {
  margin: 0 auto 18px;
  max-width: 560px;
  font-size: 0.9em;
  color: var(--text-2);
}

/* 语言芯片：点一下让助教给该语言的入门路线 */
.lang-chips {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.lang-chip {
  padding: 7px 16px;
  font-size: 0.9em;
  color: var(--text-1);
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 999px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.lang-chip:hover:not(:disabled) {
  border-color: var(--c-blue);
  color: var(--c-blue);
}

.lang-chip.active {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.lang-chip:disabled {
  opacity: 0.5;
  cursor: default;
}

.quick-prompts {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.quick-btn {
  max-width: 100%;
  padding: 8px 16px;
  font-size: 0.88em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border: 1px solid var(--tint-blue-border);
  border-radius: 999px;
  cursor: pointer;
}

.quick-btn:hover:not(:disabled) {
  background: var(--tint-blue);
}

.chat-row {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.chat-row-user {
  flex-direction: row-reverse;
}

.chat-avatar {
  flex: none;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  font-weight: 600;
  color: #fff;
  border-radius: 50%;
  background: #1e88e5;
}

.chat-row-user .chat-avatar {
  background: #26a69a;
}

.chat-bubble {
  position: relative;
  max-width: 78%;
  padding: 10px 14px;
  background: var(--surface-muted);
  border-radius: 10px;
  font-size: 0.95em;
}

.chat-row-user .chat-bubble {
  background: var(--tint-blue);
}

.chat-bubble-err {
  background: var(--tint-red);
  color: var(--c-red);
}

.chat-text {
  margin: 0;
  white-space: pre-wrap;
  word-break: break-word;
}

.chat-refs {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-1);
}

.chat-refs-label {
  font-size: 0.76em;
  color: var(--text-2);
}

.chat-ref-link {
  padding: 2px 10px;
  font-size: 0.78em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border: 1px solid var(--tint-blue-border);
  border-radius: 999px;
  text-decoration: none;
}

.chat-ref-link:hover {
  background: var(--tint-blue);
}

.chat-err-actions {
  margin-top: 8px;
}

.chat-retry-btn {
  padding: 3px 12px;
  font-size: 0.8em;
  color: var(--c-red);
  background: var(--surface);
  border: 1px solid var(--tint-red-border);
  border-radius: 6px;
  cursor: pointer;
}

.chat-local-tag {
  position: absolute;
  top: -8px;
  right: 8px;
  padding: 0 8px;
  font-size: 0.68em;
  color: var(--c-orange);
  background: var(--tint-amber);
  border: 1px solid var(--tint-amber-border);
  border-radius: 999px;
}

.chat-degraded-tag {
  display: inline-block;
  margin-top: 6px;
  padding: 1px 8px;
  font-size: 0.72em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border: 1px solid var(--tint-blue-border);
  border-radius: 999px;
}

.chat-thinking {
  display: flex;
  align-items: center;
  gap: 10px;
  color: var(--text-2);
}

.chat-caret {
  color: var(--c-blue);
  animation: chat-blink 1s steps(2, start) infinite;
}

.chat-bubble .chat-thinking {
  margin: -2px 0;
}

@keyframes chat-blink {
  to {
    visibility: hidden;
  }
}

.chat-stop-btn {
  padding: 2px 10px;
  font-size: 0.78em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
}

.ai-input-bar {
  display: flex;
  gap: 10px;
  align-items: flex-end;
  padding: 14px 20px;
  border-top: 1px solid var(--border-1);
}

.ai-input {
  flex: 1;
  padding: 10px 12px;
  font-family: inherit;
  font-size: 0.95em;
  line-height: 1.5;
  color: var(--text-1);
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  resize: none;
}

.ai-input:focus {
  outline: none;
  border-color: #1e88e5;
  background: var(--surface);
}

.ai-send-btn {
  padding: 10px 22px;
  font-size: 0.95em;
  color: #fff;
  background: #1e88e5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.ai-send-btn:hover:not(:disabled) {
  background: #1976d2;
}

.ai-send-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.ai-send-stop {
  background: #78909c;
}

.ai-send-stop:hover {
  background: #607d8b !important;
}

.ai-foot-note {
  margin: 12px 4px 0;
  font-size: 0.78em;
  color: var(--text-2);
  text-align: center;
}

.ai-foot-note a {
  color: var(--c-blue);
}
</style>
