<script setup>
// 可编辑学习笔记块（查看/编辑双态，Markdown 渲染）
// 用法：<NoteSection algorithm-id="bubble-sort" />
// 预置内容来自 data/algorithms.js defaultNotes；用户笔记走后端 notes API，离线回退 localStorage
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getAlgorithmById } from '../../data/algorithms'
import { fetchNote, saveNote, deleteNote, aiChatStream, AI_SCENE_ALGORITHM } from '../../api/client'
import { useUserStore } from '../../stores/user'

const props = defineProps({
  algorithmId: {
    type: String,
    required: true,
  },
})

const userStore = useUserStore()

const userNote = ref(null)
const draft = ref('')
const isEditing = ref(false)
const isSaving = ref(false)
const feedback = ref('')
const feedbackKind = ref('ok')
const loadError = ref('')
let feedbackTimer = null

const presetNotes = computed(() => getAlgorithmById(props.algorithmId)?.defaultNotes || '')
const displayContent = computed(() => userNote.value?.content || presetNotes.value)
const renderedNotes = computed(() =>
  DOMPurify.sanitize(marked.parse(displayContent.value || '（暂无笔记）'))
)

// ------------------------------------------------------------ AI 助教：一键整理笔记

/** 编辑态的一键 AI 操作：mode=replace 用结果替换笔记，append 追加到笔记末尾。
 *  笔记为空时自动切换为「根据站内资料生成」语义（instructionEmpty），按钮不会因为没内容而点不了。 */
const AI_ACTIONS = [
  {
    key: 'polish',
    label: '✨ 整理格式',
    mode: 'replace',
    instruction: '请帮我整理这篇学习笔记：修正错别字、规范 Markdown 排版（标题层级、列表、代码块），保持原有信息不增不减，直接输出整理后的 Markdown 笔记正文，不要任何解释。',
    instructionEmpty: '请根据以下站内资料，为初学者生成一份结构清晰、适合复习的 Markdown 学习笔记（包含：核心思想、关键步骤、复杂度、适用场景），直接输出笔记正文，不要任何解释。',
  },
  {
    key: 'digest',
    label: '📌 提炼要点',
    mode: 'replace',
    instruction: '请从这篇学习笔记中提炼核心要点：输出一份精炼的 Markdown 要点清单，保留关键结论与易忘细节，直接输出结果，不要任何解释。',
    instructionEmpty: '请根据以下站内资料，提炼一份精炼的 Markdown 要点清单（关键结论与易忘细节），直接输出结果，不要任何解释。',
  },
  {
    key: 'pitfalls',
    label: '⚠️ 补充易错点',
    mode: 'append',
    instruction: '请基于这篇学习笔记的内容，补充 3~5 个学习者最容易踩的坑（Markdown 列表，每条一句话说清「错在哪、怎么避免」），直接输出补充内容，不要重复笔记原文。',
    instructionEmpty: '请根据以下站内资料，整理 3~5 个学习者最容易踩的坑（Markdown 列表，每条一句话说清「错在哪、怎么避免」），直接输出结果，不要任何解释。',
  },
  {
    key: 'outline',
    label: '📋 生成复习提纲',
    mode: 'append',
    instruction: '请把这篇学习笔记整理成一份可用于自测的复习提纲：按主题分层列出小标题与关键问题（不含答案），直接输出 Markdown 提纲，不要任何解释。',
    instructionEmpty: '请根据以下站内资料，生成一份可用于自测的复习提纲：按主题分层列出小标题与关键问题（不含答案），直接输出 Markdown 提纲，不要任何解释。',
  },
]

const aiBusy = ref('') // 正在执行的 AI 动作 key（空串 = 空闲）

/** 笔记为空时的生成素材：站内简介 + 基础讲解摘录（去掉代码块、限长，控制 prompt 体积）。 */
function siteMaterial() {
  const algo = getAlgorithmById(props.algorithmId)
  if (!algo) return ''
  const basic = (algo.detailSections?.basic || '')
    .replace(/```[\s\S]*?```/g, '（代码详见详情页可视化演示）')
    .replace(/~~~[\s\S]*?~~~/g, '（代码详见详情页可视化演示）')
  return [
    `简介：${algo.description || ''}`,
    algo.complexity ? `时间复杂度：${algo.complexity}` : '',
    basic ? `基础讲解：${basic}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2500)
}

const hasSiteMaterial = computed(() => !!siteMaterial())

/** 让 AI 助教处理当前笔记：结果流式写入编辑区，保存前可继续修改，取消可丢弃。
 *  笔记为空时用站内资料作为素材（生成语义），有笔记时用笔记本身（整理语义）。 */
async function runAiAction(action) {
  if (aiBusy.value || isSaving.value) return
  const content = draft.value.trim()
  const material = content || siteMaterial()
  if (!material) return
  const algo = getAlgorithmById(props.algorithmId)
  aiBusy.value = action.key
  loadError.value = ''
  const original = draft.value
  try {
    const fromSite = !content
    const instruction = fromSite ? action.instructionEmpty : action.instruction
    const question = `我在学习算法「${algo?.name || props.algorithmId}」。${instruction}\n\n${fromSite ? '【站内资料】' : '【我的笔记】'}\n${material}`
    // 笔记为空（从资料生成）或 replace 模式：清空后流式写入新内容；append 模式：在原文后面接着写
    if (fromSite || action.mode === 'replace') draft.value = ''
    else draft.value = original.replace(/\s*$/, '\n\n')
    const res = await aiChatStream([{ role: 'user', content: question }], {
      scene: AI_SCENE_ALGORITHM,
      onDelta: (t) => {
        draft.value += t
      },
    })
    if (res.source === 'local') {
      // 本地答疑是「问答」不是「整理」，直接回填会破坏笔记：还原并提示
      draft.value = original
      showFeedbackError('AI 服务暂不可用（未登录 / 后端未配置），请稍后再试')
      return
    }
    showFeedback('AI 已生成，确认后点「保存」')
  } catch (err) {
    draft.value = original
    showFeedbackError(`AI 处理失败：${err.message}`)
  } finally {
    aiBusy.value = ''
  }
}

/** 查看态入口：还没有任何笔记时，一键让 AI 根据站内资料生成一份笔记草稿（进入编辑态并流式写入）。 */
async function aiGenerateNote() {
  if (aiBusy.value || !siteMaterial()) return
  startEdit() // 进入编辑态（草稿此时为空）
  await runAiAction(AI_ACTIONS[0]) // 空草稿 → polish 动作自动切换为「根据站内资料生成笔记」语义
}

onMounted(async () => {
  if (!userStore.isLoggedIn) return
  try {
    userNote.value = await fetchNote(userStore.user.id, props.algorithmId)
  } catch {
    loadError.value = '笔记加载失败，当前显示预置内容'
  }
})

function showFeedback(text) {
  feedback.value = text
  feedbackKind.value = 'ok'
  clearTimeout(feedbackTimer)
  feedbackTimer = setTimeout(() => { feedback.value = '' }, 2500)
}

function showFeedbackError(text) {
  feedback.value = text
  feedbackKind.value = 'err'
  clearTimeout(feedbackTimer)
}

function startEdit() {
  draft.value = displayContent.value
  feedback.value = ''
  isEditing.value = true
}

function cancelEdit() {
  isEditing.value = false
  feedback.value = ''
}

async function submitSave() {
  if (isSaving.value) return
  isSaving.value = true
  loadError.value = ''
  try {
    userNote.value = await saveNote(userStore.user.id, props.algorithmId, draft.value)
    isEditing.value = false
    showFeedback('已保存')
  } catch (err) {
    showFeedbackError(`保存失败：${err.message}`)
  } finally {
    isSaving.value = false
  }
}

async function restoreDefault() {
  try {
    await deleteNote(userStore.user.id, props.algorithmId)
    userNote.value = null
    isEditing.value = false
    showFeedback('已恢复默认笔记')
  } catch (err) {
    showFeedbackError(`恢复失败：${err.message}`)
  }
}
</script>

<template>
  <div class="note-section">
    <div v-if="isEditing" class="note-editor">
      <textarea
        v-model="draft"
        class="note-textarea"
        rows="14"
        placeholder="支持 Markdown：# 标题、**加粗**、- 列表、`代码`"
        spellcheck="false"
        :disabled="!!aiBusy"
      ></textarea>
      <!-- AI 助教一键操作：结果写入编辑区，保存前可再改，取消可丢弃；
           笔记为空时按钮不会禁用——改为根据站内资料生成内容 -->
      <div class="note-ai-bar">
        <span class="note-ai-label" title="由 AI 助教整理当前笔记（笔记为空时根据站内资料生成），结果先写入编辑区，确认后再保存">🤖 AI 助教</span>
        <button
          v-for="a in AI_ACTIONS"
          :key="a.key"
          class="note-btn note-btn-ai"
          :disabled="!!aiBusy || isSaving || (!draft.trim() && !hasSiteMaterial)"
          :title="!draft.trim()
            ? '笔记还是空的：将根据本站资料直接生成内容'
            : a.mode === 'replace'
              ? 'AI 结果会替换当前编辑内容（取消可还原）'
              : 'AI 结果会追加到笔记末尾'"
          @click="runAiAction(a)"
        >{{ aiBusy === a.key ? '生成中…' : a.label }}</button>
        <!-- 上游模型可能较慢（本地模型首字可达几十秒）：给一个持续提示，避免误以为点击无效 -->
        <span v-if="aiBusy" class="note-ai-busy">AI 正在生成，慢模型可能需要几十秒…</span>
      </div>
      <div class="note-actions">
        <button class="note-btn note-btn-primary" :disabled="isSaving || !!aiBusy" @click="submitSave">
          {{ isSaving ? '保存中…' : '保存' }}
        </button>
        <button class="note-btn" :disabled="isSaving || !!aiBusy" @click="cancelEdit">取消</button>
        <span v-if="feedback" :class="feedbackKind === 'err' ? 'note-feedback note-feedback-err' : 'note-feedback'">{{ feedback }}</span>
      </div>
    </div>

    <div v-else class="note-view">
      <div class="markdown-content" v-html="renderedNotes"></div>
      <p v-if="loadError" class="note-feedback note-feedback-err">{{ loadError }}</p>
      <div class="note-actions">
        <template v-if="userStore.isLoggedIn">
          <!-- 还没有任何笔记（且无预置）时：一键让 AI 根据站内资料生成草稿 -->
          <button
            v-if="!displayContent"
            class="note-btn note-btn-ai"
            :disabled="!!aiBusy"
            title="根据站内资料自动生成一份学习笔记草稿，可直接保存或再修改"
            @click="aiGenerateNote"
          >🤖 AI 生成笔记</button>
          <button class="note-btn note-btn-primary" :disabled="!!aiBusy" @click="startEdit">编辑</button>
          <button v-if="userNote" class="note-btn" :disabled="!!aiBusy" @click="restoreDefault">恢复默认</button>
        </template>
        <span v-else class="note-hint">登录后可记录你的学习笔记</span>
        <span v-if="feedback" :class="feedbackKind === 'err' ? 'note-feedback note-feedback-err' : 'note-feedback'">{{ feedback }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.note-section {
  text-align: left;
}

.note-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.95em;
  line-height: 1.6;
  color: var(--text-1);
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  resize: vertical;
}

.note-textarea:focus {
  outline: none;
  border-color: #1e88e5;
  background: var(--surface);
}

.note-textarea:disabled {
  opacity: 0.75;
  cursor: progress;
}

/* AI 助教操作条：编辑态下紧跟输入框 */
.note-ai-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
  padding: 8px 10px;
  border: 1px dashed var(--tint-blue-border);
  border-radius: 8px;
  background: var(--tint-blue);
}

.note-ai-label {
  font-size: 0.82em;
  font-weight: 600;
  color: var(--c-blue);
  white-space: nowrap;
}

/* 生成中的持续提示（不自动消失，与 feedback 的 2.5s 自动清除区分） */
.note-ai-busy {
  font-size: 0.78em;
  color: var(--c-orange);
  animation: note-ai-pulse 1.2s ease-in-out infinite;
}

@keyframes note-ai-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.45; }
}

.note-btn-ai {
  padding: 4px 12px;
  font-size: 0.82em;
  color: var(--c-blue);
  background: var(--surface);
  border-color: var(--tint-blue-border);
}

.note-btn-ai:hover:not(:disabled) {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.note-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
}

.note-btn {
  padding: 6px 18px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.note-btn:hover:not(:disabled) {
  border-color: #1e88e5;
  color: var(--c-blue);
}

.note-btn-primary {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.note-btn-primary:hover:not(:disabled) {
  color: #fff;
  background: #1976d2;
}

.note-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.note-hint {
  font-size: 0.88em;
  color: var(--text-2);
}

.note-feedback {
  font-size: 0.88em;
  color: var(--c-green);
}

.note-feedback-err {
  color: var(--c-red);
}

.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: 1em 0 0.5em;
  color: var(--text-1);
}

.markdown-content :deep(p) {
  margin: 0.6em 0;
  line-height: 1.8;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.6em;
  margin: 0.6em 0;
}

.markdown-content :deep(code) {
  padding: 2px 6px;
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-size: 0.9em;
  background: var(--surface-muted);
  border-radius: 4px;
}

.markdown-content :deep(strong) {
  color: var(--text-1);
}
</style>
