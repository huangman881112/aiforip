<script setup>
// AI 助教对话页：后端代理上游大模型/API 中转站（需配置 AI_API_KEY），
// 走 SSE 流式打字机输出；未配置/离线时自动降级为「本地答疑模式」（检索站内算法资料作答）。
// 模型不由用户选：顶栏只展示「当前中转站配置的默认模型」（后端下发的 defaultModel）。
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { aiChatStream, aiStatus } from '../../api/client.js'
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
// 模型配置（多中转站）：后端下发清单，页面只用它展示「当前默认模型」，不再提供下拉选择
const models = ref([])
const defaultToken = ref('')
const canManage = ref(false)
// 未登录时后端不下发模型清单（也拿不到默认模型名，只能走本地答疑）
const loginRequired = ref(false)
const showSettings = ref(false)
const bodyEl = ref(null)
const inputEl = ref(null)
let controller = null
const reasoningHint = ref(false)

const QUICK_PROMPTS = [
  '快速排序为什么平均最快？',
  'Dijkstra 能处理负权边吗？',
  '二分查找的边界条件总是写错，怎么办？',
  '给我一个两周刷完排序算法的计划',
]

const HISTORY_KEY = computed(() => `suanfa.ai.history.${userStore.user?.id || 'guest'}`)
/** 当前生效的模型 = 后端 defaultModel（primary 置顶 → 其余按配置顺序，取首个可用项） */
const currentModel = computed(
  () => models.value.find((m) => m.token === defaultToken.value) || models.value.find((m) => m.available) || null
)
const currentModelText = computed(() => {
  const m = currentModel.value
  if (!m) return ''
  const label = m.label || m.name
  // 中转站名与模型名相同时不再重复拼接（常见于只接一个中转站）
  return m.providerLabel && m.providerLabel !== label ? `${label} · ${m.providerLabel}` : label
})
const modeText = computed(() => {
  if (localSession.value) return '本地答疑模式'
  if (activeModel.value) return `本次模型 ${activeModel.value}`
  if (currentModelText.value) return `默认模型 ${currentModelText.value}`
  return ''
})
/** 悬停补充预算/熔断信息：不能选模型了，也要看得出上游配得对不对。 */
const modeTip = computed(() => {
  if (activeModel.value) return '本轮实际服务的模型；默认模型熔断时会降级到下一个可用模型'
  const m = currentModel.value
  if (!m) return ''
  const extra = modelTitle(m)
  return `当前中转站配置的默认模型${extra ? `：${extra}` : ''}`
})
const localSession = computed(() => messages.value.some((m) => m.source === 'local'))

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

/** 预算/熔断/备注摘要，用于默认模型徽章的 tooltip。 */
function modelTitle(m) {
  const bits = []
  if (m.maxTokens) bits.push(`max_tokens ${m.maxTokens}`)
  if (m.timeoutSeconds) bits.push(`超时 ${m.timeoutSeconds}s`)
  if (m.reasoningEffort) bits.push(`reasoning ${m.reasoningEffort}`)
  if (m.cooldownSeconds > 0) bits.push(`熔断中，约 ${m.cooldownSeconds}s 后恢复`)
  if (m.note) bits.push(m.note)
  return bits.join(' · ')
}

/** 拉一次 /api/ai/status：可用性 + 当前默认模型（清单只用于展示，不再供选择）。 */
async function refreshStatus() {
  const s = await aiStatus()
  aiReady.value = s.configured
  canManage.value = !!s.canManage
  // 后端已按身份裁剪；这里再兜一层，避免旧版后端把清单漏给游客
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
  // 取回响应式代理（直接改 push 前的原始对象不会触发更新）
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
    // 不传 model：一律用「当前中转站配置的默认模型」回答（它不可用时由服务端降级）
    const res = await aiChatStream(history, {
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
    reply.model = res.model || ''
    reply.refs = res.refs || reply.refs || []
    if (res.source === 'ai') activeModel.value = res.model || activeModel.value
    // 实际服务的模型不是默认模型：说明默认模型被熔断/限流，给用户一个明确提示
    const def = currentModel.value
    if (res.source === 'ai' && def && res.model && res.model !== def.name) {
      reply.degradedTo = res.model
    }
    if (!flushed && res.source === 'local') scrollToBottom(true)
  } catch (err) {
    if (err.name === 'AbortError') {
      reply.content = reply.content || '（已停止回答）'
      reply.stopped = true
    } else {
      // 保留已吐出的部分，错误单独成条，便于「重试」
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

/** 回答正文里的站内链接（markdown 渲染为 <a>）走 SPA 路由，避免整页刷新丢失会话。 */
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
  // 中文输入法组词期间的 Enter 用于上屏，不能触发发送
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
    ? `你好，${userStore.user.username}！我是小白学算法的 AI 助教 🤖`
    : '你好！我是小白学算法的 AI 助教 🤖'
}

function consumeAsk() {
  const ask = route.query.ask
  if (typeof ask === 'string' && ask.trim()) {
    router.replace({ path: '/ai' })
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
  consumeAsk()
})

watch(() => route.query.ask, () => consumeAsk())
// 登录/退出（含同页登录、cookie 过期）后重取清单：游客没有模型列表
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
          <h2>🤖 AI 算法助教</h2>
          <div class="ai-header-right">
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
              有任何算法疑问都可以问我：原理讲解、复杂度分析、代码 Debug、刷题思路引导。
              回答会引用本站可视化页面的资料，也可以从下面的问题开始：
            </p>
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
                <MarkdownBlock v-if="m.content && !m.error" :source="m.content" />
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
                <span v-if="m.degradedTo" class="chat-degraded-tag">
                  默认模型暂不可用，本次由 {{ m.degradedTo }} 回答
                </span>
              </template>
              <p v-else class="chat-text">{{ m.content }}</p>
            </div>
          </div>

          <div v-if="sending" class="chat-row chat-row-ai">
            <span class="chat-avatar">AI</span>
            <div class="chat-bubble chat-thinking">
              <span v-if="!messages[messages.length - 1]?.content">
                {{ reasoningHint ? '兜底模型推理较慢，正在生成首字，请稍候…' : '正在检索站内资料并思考…' }}
              </span>
              <span v-else class="chat-caret">▍</span>
              <button class="chat-stop-btn" @click="stop">停止</button>
            </div>
          </div>
        </div>

        <footer class="ai-input-bar">
          <textarea
            ref="inputEl"
            v-model="input"
            class="ai-input"
            rows="2"
            placeholder="输入算法问题，Enter 发送 / Shift+Enter 换行（输入法组词时 Enter 不上屏）"
            @keydown="onKeydown"
          ></textarea>
          <button v-if="sending" class="ai-send-btn ai-send-stop" @click="stop">停止</button>
          <button v-else class="ai-send-btn" :disabled="!input.trim()" @click="send()">发送</button>
        </footer>
      </div>
      <p class="ai-foot-note">
        回答由大模型生成，复杂度与代码请以站内详情页和可视化演示为准；发现错误欢迎在详情页留言指出。
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
  max-width: 880px;
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

.ai-mode-badge {
  padding: 2px 10px;
  font-size: 0.78em;
  color: var(--c-orange);
  background: var(--tint-amber);
  border: 1px solid var(--tint-amber-border);
  border-radius: 999px;
  /* 只读展示当前默认模型，悬停看预算/熔断详情 */
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
  max-width: 520px;
  font-size: 0.9em;
  color: var(--text-2);
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

/* 默认模型熔断、实际换了其他模型时的提示 */
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
</style>
