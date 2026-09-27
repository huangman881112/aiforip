<script setup>
// 页面笔记面板（全站通用）：挂在 App.vue，每个页面都可用。
// 右侧贴着页面边框：收起时只露出一个竖向「笔记」把手，点击展开侧栏。
// 数据按「当前页面路由路径 × 用户」存后端 page_notes 表（离线时回退 localStorage）。
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user.js'
import { resolveMenuPath } from '../../utils/menuPath.js'
import {
  addPageNote,
  deletePageNote,
  fetchPageNotes,
  aiChatStream,
  AI_SCENE_ALGORITHM,
  AI_SCENE_LANGUAGE,
} from '../../api/client.js'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const open = ref(false)
const notes = ref([])
const loading = ref(false)
const loadError = ref('')
const draft = ref('')
const isSaving = ref(false)
const feedback = ref('')
const feedbackKind = ref('ok')
let feedbackTimer = null

// 当前页面的唯一标识（路由路径）与菜单路径（中文展示名）
const pagePath = computed(() => route.path || '/')
const menuPath = computed(() => resolveMenuPath(route))

const canAdd = computed(() => userStore.isLoggedIn && !isSaving.value)
const noteCount = computed(() => notes.value.length)

// 语言页面上的笔记优先问「AI 计算机语言助教」，其余页面问算法助教
const isLangPage = computed(() => route.path.startsWith('/languages'))
const aiChatRoute = computed(() => (isLangPage.value ? '/ai/language' : '/ai'))

// AI 汇总状态（独立于单条添加的 isSaving）
const aiBusy = ref(false)

function showFeedback(text, kind = 'ok') {
  feedback.value = text
  feedbackKind.value = kind
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = '' }, 2500)
}

async function loadNotes() {
  if (!userStore.isLoggedIn) {
    notes.value = []
    return
  }
  loading.value = true
  loadError.value = ''
  try {
    notes.value = await fetchPageNotes(userStore.user.id, pagePath.value)
  } catch (err) {
    loadError.value = `笔记加载失败：${err.message}`
  } finally {
    loading.value = false
  }
}

function toggleOpen() {
  open.value = !open.value
  if (open.value) loadNotes()
}

async function submitAdd() {
  const content = draft.value.trim()
  if (!content) return
  if (!userStore.isLoggedIn) {
    showFeedback('请先登录后再添加笔记', 'err')
    return
  }
  if (isSaving.value) return
  isSaving.value = true
  try {
    const saved = await addPageNote(userStore.user.id, pagePath.value, menuPath.value, content)
    notes.value.push(saved)
    draft.value = ''
    showFeedback('已添加')
  } catch (err) {
    showFeedback(`添加失败：${err.message}`, 'err')
  } finally {
    isSaving.value = false
  }
}

async function removeNote(id) {
  try {
    await deletePageNote(userStore.user.id, id)
    notes.value = notes.value.filter((n) => String(n.id) !== String(id))
    showFeedback('已删除')
  } catch (err) {
    showFeedback(`删除失败：${err.message}`, 'err')
  }
}

/** 带着这条笔记跳到 AI 助教对话页提问（对话页会自动发出 ask 问题；截断避免 URL 过长）。 */
function askAi(n) {
  const content = n.content.length > 800 ? `${n.content.slice(0, 800)}…` : n.content
  const ask = `请讲解这个知识点：${content}`
  router.push({ path: aiChatRoute.value, query: { ask } })
}

/** AI 汇总：把本页全部笔记交给 AI 助教归纳成一份要点清单，并作为一条新笔记保存。 */
async function aiSummarize() {
  if (aiBusy.value || isSaving.value) return
  if (!notes.value.length) return
  const scene = isLangPage.value ? AI_SCENE_LANGUAGE : AI_SCENE_ALGORITHM
  aiBusy.value = true
  try {
    // 拼接全部笔记（限制总长，避免 prompt 膨胀）
    const merged = notes.value
      .map((n) => `- ${n.content}`)
      .join('\n')
      .slice(0, 4000)
    const question = `请把我在「${menuPath.value}」页面记的 ${notes.value.length} 条笔记汇总成一份要点清单：合并重复、按主题分组、保留原始信息，用简洁的 Markdown 列表直接输出结果，不要任何解释。\n\n【我的笔记】\n${merged}`
    const res = await aiChatStream([{ role: 'user', content: question }], { scene })
    if (res.source === 'local') {
      showFeedback('AI 服务暂不可用（未登录 / 后端未配置），请稍后再试', 'err')
      return
    }
    const saved = await addPageNote(
      userStore.user.id,
      pagePath.value,
      menuPath.value,
      `🤖 AI 汇总（${notes.value.length} 条笔记）\n${res.reply}`
    )
    notes.value.push(saved)
    showFeedback('已生成 AI 汇总笔记')
  } catch (err) {
    showFeedback(`AI 汇总失败：${err.message}`, 'err')
  } finally {
    aiBusy.value = false
  }
}

function onKeydown(e) {
  if (e.key === 'Escape' && open.value) open.value = false
}

// 路由切换：清空草稿并按需刷新列表（面板开着就重新拉，收起时下次打开再拉）
watch(() => route.path, () => {
  draft.value = ''
  feedback.value = ''
  if (open.value) {
    nextTick(loadNotes)
  } else {
    notes.value = []
  }
})

// 登录态变化（登录 / 退出）后刷新
watch(() => userStore.isLoggedIn, () => {
  if (open.value) loadNotes()
  else notes.value = []
})

onMounted(() => document.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
  clearTimeout(feedbackTimer)
})
</script>

<template>
  <!-- 把手：贴着视口右缘、垂直居中，竖排文字 -->
  <button
    type="button"
    class="pn-handle"
    :class="{ 'pn-handle-open': open }"
    :aria-expanded="open ? 'true' : 'false'"
    :title="`页面笔记：${menuPath}`"
    @click="toggleOpen"
  >
    <span class="pn-handle-icon" aria-hidden="true">📝</span>
    <span class="pn-handle-text">笔记</span>
    <span v-if="noteCount" class="pn-handle-count">{{ noteCount > 99 ? '99+' : noteCount }}</span>
  </button>

  <!-- 侧栏：贴着页面右边框滑出 -->
  <aside class="pn-panel" :class="{ 'pn-panel-open': open }" aria-label="页面笔记">
    <header class="pn-header">
      <div class="pn-title">
        <strong>页面笔记</strong>
        <span class="pn-menu-path" :title="menuPath">{{ menuPath }}</span>
      </div>
      <button type="button" class="pn-close" title="收起" @click="open = false">✕</button>
    </header>

    <div class="pn-body">
      <p v-if="!userStore.isLoggedIn" class="pn-login-hint">
        登录后即可在本页面记录笔记，并跨设备同步。
        <router-link :to="{ name: 'Login', query: { redirect: route.fullPath } }">去登录</router-link>
      </p>

      <template v-else>
        <p v-if="loading" class="pn-tip">加载中…</p>
        <p v-else-if="loadError" class="pn-tip pn-tip-err">{{ loadError }}</p>
        <p v-else-if="!notes.length" class="pn-tip">本页面还没有笔记，写下第一条吧 ✍️</p>

        <ul v-else class="pn-list">
          <li v-for="n in notes" :key="n.id" class="pn-item">
            <div class="pn-item-content">{{ n.content }}</div>
            <div class="pn-item-meta">
              <span class="pn-item-creator" :title="`创建人：${n.creator}`">{{ n.creator }}</span>
              <span class="pn-item-time">{{ n.createdAt }}</span>
              <button
                type="button"
                class="pn-item-ai"
                :title="`带着这条笔记去${isLangPage ? '计算机语言' : '算法'}助教提问`"
                @click="askAi(n)"
              >问 AI</button>
              <button
                type="button"
                class="pn-item-del"
                title="删除这条笔记"
                @click="removeNote(n.id)"
              >删除</button>
            </div>
          </li>
        </ul>
      </template>
    </div>

    <footer v-if="userStore.isLoggedIn" class="pn-footer">
      <textarea
        v-model="draft"
        class="pn-textarea"
        rows="3"
        maxlength="20000"
        placeholder="记一点本页面的要点、疑问或待办…"
        @keydown.enter.ctrl.prevent="submitAdd"
      ></textarea>
      <div class="pn-footer-bar">
        <span v-if="feedback" :class="feedbackKind === 'err' ? 'pn-feedback pn-feedback-err' : 'pn-feedback'">
          {{ feedback }}
        </span>
        <button
          type="button"
          class="pn-ai-btn"
          :disabled="aiBusy || isSaving || !notes.length"
          title="把本页全部笔记交给 AI 助教归纳，并保存为一条新笔记"
          @click="aiSummarize"
        >{{ aiBusy ? 'AI 汇总中…' : '🤖 AI 汇总' }}</button>
        <button type="button" class="pn-add-btn" :disabled="!canAdd || !draft.trim()" @click="submitAdd">
          {{ isSaving ? '保存中…' : '添加笔记' }}
        </button>
      </div>
    </footer>
  </aside>
</template>

<style scoped>
/* ===== 把手：贴视口右缘 ===== */
.pn-handle {
  position: fixed;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  z-index: 300;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 14px 8px;
  border: 1px solid var(--tint-blue-border);
  border-right: none;
  border-radius: 10px 0 0 10px;
  background-color: var(--nav-bg-sticky);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: var(--text-2);
  cursor: pointer;
  box-shadow: -2px 2px 10px rgba(0, 0, 0, 0.35);
  transition: background-color 0.2s, color 0.2s, transform 0.25s;
}

.pn-handle:hover {
  background-color: var(--brand-500);
  color: var(--text-on-brand);
}

/* 面板展开时藏起把手：它固定在 right:0 且 z-index(300) 高于面板(299)，
   会压在面板右侧内容上方，正好挡住视口中部笔记条目的「问 AI / 删除」按钮；
   展开后用面板头部的 ✕ 收起即可 */
.pn-handle-open {
  opacity: 0;
  pointer-events: none;
}

.pn-handle-icon {
  font-size: 1rem;
  line-height: 1;
}

/* 竖排「笔记」二字，紧贴边框 */
.pn-handle-text {
  writing-mode: vertical-rl;
  letter-spacing: 4px;
  font-size: 0.85rem;
  font-weight: 600;
}

.pn-handle-count {
  min-width: 18px;
  padding: 1px 5px;
  border-radius: 999px;
  background-color: var(--c-amber);
  color: var(--text-on-bright);
  font-size: 0.68rem;
  font-weight: 700;
  line-height: 1.4;
  text-align: center;
}

/* ===== 侧栏：贴页面右边框 ===== */
.pn-panel {
  position: fixed;
  top: 64px; /* 顶栏（sticky header）高度以下 */
  right: 0;
  bottom: 0;
  width: min(320px, 92vw);
  z-index: 299;
  display: flex;
  flex-direction: column;
  background-color: var(--surface);
  border-left: 1px solid var(--border-2);
  box-shadow: -6px 0 24px rgba(0, 0, 0, 0.45);
  transform: translateX(100%);
  transition: transform 0.25s ease;
}

.pn-panel-open {
  transform: translateX(0);
}

.pn-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border-1);
  background-color: var(--surface-muted);
}

.pn-title {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.pn-title strong {
  font-size: 0.95rem;
  color: var(--text-1);
}

.pn-menu-path {
  font-size: 0.75rem;
  color: var(--text-3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pn-close {
  flex: none;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 6px;
}

.pn-close:hover {
  color: var(--text-1);
  background-color: var(--surface-3);
}

.pn-body {
  flex: 1;
  overflow-y: auto;
  padding: 10px 14px;
}

.pn-login-hint {
  margin: 8px 0;
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-2);
}

.pn-login-hint a {
  color: var(--c-blue);
}

.pn-tip {
  margin: 10px 0;
  font-size: 0.82rem;
  color: var(--text-3);
  text-align: center;
}

.pn-tip-err {
  color: var(--c-red);
}

.pn-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pn-item {
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 10px;
  background-color: var(--surface-muted);
}

.pn-item-content {
  font-size: 0.85rem;
  line-height: 1.7;
  color: var(--text-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.pn-item-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.72rem;
  color: var(--text-3);
}

.pn-item-creator {
  max-width: 40%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pn-item-time {
  flex: 1;
  white-space: nowrap;
}

.pn-item-del {
  flex: none;
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 1px 6px;
  border-radius: 6px;
}

.pn-item-del:hover {
  color: var(--c-red);
  background-color: var(--tint-red);
}

/* 单条笔记「问 AI」：跳到对应场景的 AI 助教页提问 */
.pn-item-ai {
  flex: none;
  border: none;
  background: transparent;
  color: var(--c-blue);
  font-size: 0.72rem;
  cursor: pointer;
  padding: 1px 6px;
  border-radius: 6px;
}

.pn-item-ai:hover {
  background-color: var(--tint-blue);
}

/* 底部「AI 汇总」按钮 */
.pn-ai-btn {
  flex: none;
  padding: 6px 14px;
  border: 1px solid var(--tint-blue-border);
  border-radius: 999px;
  background-color: var(--tint-blue);
  color: var(--c-blue);
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}

.pn-ai-btn:hover:not(:disabled) {
  background-color: var(--brand-500);
  color: var(--text-on-brand);
  border-color: var(--brand-500);
}

.pn-ai-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.pn-footer {
  padding: 10px 14px 12px;
  border-top: 1px solid var(--border-1);
  background-color: var(--surface-muted);
}

.pn-textarea {
  width: 100%;
  box-sizing: border-box;
  resize: vertical;
  min-height: 64px;
  max-height: 180px;
  padding: 8px 10px;
  border: 1px solid var(--border-2);
  border-radius: 8px;
  background-color: var(--surface-2);
  color: var(--text-1);
  font-size: 0.85rem;
  line-height: 1.6;
  font-family: inherit;
}

.pn-textarea:focus {
  outline: none;
  border-color: var(--brand-400);
}

.pn-footer-bar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 8px;
  min-height: 30px;
}

.pn-feedback {
  flex: 1;
  font-size: 0.75rem;
  color: var(--c-green);
}

.pn-feedback-err {
  color: var(--c-red);
}

.pn-add-btn {
  flex: none;
  padding: 6px 16px;
  border: none;
  border-radius: 999px;
  background-color: var(--brand-500);
  color: var(--text-on-brand);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}

.pn-add-btn:hover:not(:disabled) {
  background-color: var(--brand-600);
}

.pn-add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 窄屏：面板铺满，避免压住正文 */
@media (max-width: 720px) {
  .pn-panel {
    width: 100vw;
    top: 56px;
  }
}
</style>
