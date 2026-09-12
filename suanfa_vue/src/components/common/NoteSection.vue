<script setup>
// 可编辑学习笔记块（查看/编辑双态，Markdown 渲染）
// 用法：<NoteSection algorithm-id="bubble-sort" />
// 预置内容来自 data/algorithms.js defaultNotes；用户笔记走后端 notes API，离线回退 localStorage
import { computed, onMounted, ref } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { getAlgorithmById } from '../../data/algorithms'
import { fetchNote, saveNote, deleteNote } from '../../api/client'
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
      ></textarea>
      <div class="note-actions">
        <button class="note-btn note-btn-primary" :disabled="isSaving" @click="submitSave">
          {{ isSaving ? '保存中…' : '保存' }}
        </button>
        <button class="note-btn" :disabled="isSaving" @click="cancelEdit">取消</button>
        <span v-if="feedback" :class="feedbackKind === 'err' ? 'note-feedback note-feedback-err' : 'note-feedback'">{{ feedback }}</span>
      </div>
    </div>

    <div v-else class="note-view">
      <div class="markdown-content" v-html="renderedNotes"></div>
      <p v-if="loadError" class="note-feedback note-feedback-err">{{ loadError }}</p>
      <div class="note-actions">
        <template v-if="userStore.isLoggedIn">
          <button class="note-btn note-btn-primary" @click="startEdit">编辑</button>
          <button v-if="userNote" class="note-btn" @click="restoreDefault">恢复默认</button>
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
