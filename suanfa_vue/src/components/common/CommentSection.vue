<script setup>
// 算法评论区：列表公开可读，登录后可发表/删除自己的评论
// 后端优先，离线回退 localStorage（见 api/client.js）
import { computed, onMounted, ref, watch } from 'vue'
import { fetchComments, postComment, removeComment } from '../../api/client'
import { useUserStore } from '../../stores/user'

const props = defineProps({
  algorithmId: { type: String, required: true },
})

const userStore = useUserStore()

const comments = ref([])
const loading = ref(false)
const submitting = ref(false)
const draft = ref('')
const error = ref('')

const MAX_LENGTH = 2000

const sorted = computed(() =>
  [...comments.value].sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))
)

async function load() {
  loading.value = true
  error.value = ''
  try {
    comments.value = (await fetchComments(props.algorithmId)) || []
  } catch (err) {
    error.value = `评论加载失败：${err.message}`
  } finally {
    loading.value = false
  }
}

async function submit() {
  const content = draft.value.trim()
  if (!content || submitting.value) return
  submitting.value = true
  error.value = ''
  try {
    const saved = await postComment(props.algorithmId, content, userStore.user?.username)
    comments.value.push(saved)
    draft.value = ''
  } catch (err) {
    error.value = `发表失败：${err.message}`
  } finally {
    submitting.value = false
  }
}

async function remove(comment) {
  if (!window.confirm('确定删除这条评论吗？')) return
  try {
    await removeComment(props.algorithmId, comment.id)
    comments.value = comments.value.filter((c) => String(c.id) !== String(comment.id))
  } catch (err) {
    error.value = `删除失败：${err.message}`
  }
}

const canDelete = (c) =>
  userStore.isLoggedIn && String(c.userId) === String(userStore.user.id)

function avatarChar(name) {
  return (name || '?').slice(0, 1).toUpperCase()
}

onMounted(load)
watch(() => props.algorithmId, load)
</script>

<template>
  <div class="comment-section">
    <div v-if="userStore.isLoggedIn" class="comment-editor">
      <textarea
        v-model="draft"
        class="comment-textarea"
        rows="4"
        :maxlength="MAX_LENGTH"
        placeholder="分享你的学习心得、疑问或补充见解……（纯文本，2000 字以内）"
      ></textarea>
      <div class="comment-editor-bar">
        <span class="comment-count">{{ draft.trim().length }} / {{ MAX_LENGTH }}</span>
        <button
          class="comment-btn comment-btn-primary"
          :disabled="!draft.trim() || submitting"
          @click="submit"
        >
          {{ submitting ? '发表中…' : '发表评论' }}
        </button>
      </div>
    </div>
    <div v-else class="comment-login-hint">
      <router-link to="/login" class="comment-login-link">登录</router-link>
      后即可发表评论
    </div>

    <p v-if="error" class="comment-error">{{ error }}</p>

    <div class="comment-list">
      <p v-if="loading" class="comment-empty">评论加载中…</p>
      <p v-else-if="!sorted.length" class="comment-empty">还没有评论，来抢占沙发吧 🛋️</p>
      <div v-for="c in sorted" :key="c.id" class="comment-item">
        <span class="comment-avatar">{{ avatarChar(c.username) }}</span>
        <div class="comment-body">
          <div class="comment-meta">
            <span class="comment-author">{{ c.username }}</span>
            <span class="comment-time">{{ c.createdAt }}</span>
            <button v-if="canDelete(c)" class="comment-del" @click="remove(c)">删除</button>
          </div>
          <p class="comment-content">{{ c.content }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.comment-section {
  text-align: left;
}

.comment-editor {
  margin-bottom: 18px;
}

.comment-textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 12px 14px;
  font-family: inherit;
  font-size: 0.95em;
  line-height: 1.6;
  color: var(--text-1);
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  resize: vertical;
}

.comment-textarea:focus {
  outline: none;
  border-color: #1e88e5;
  background: var(--surface);
}

.comment-editor-bar {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 14px;
  margin-top: 8px;
}

.comment-count {
  font-size: 0.82em;
  color: var(--text-2);
}

.comment-btn {
  padding: 6px 18px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.comment-btn-primary {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.comment-btn-primary:hover:not(:disabled) {
  background: #1976d2;
}

.comment-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.comment-login-hint {
  margin-bottom: 18px;
  padding: 12px 14px;
  font-size: 0.92em;
  color: var(--text-2);
  background: var(--surface-muted);
  border: 1px dashed var(--border-1);
  border-radius: 8px;
}

.comment-login-link {
  color: var(--c-blue);
  font-weight: 600;
}

.comment-error {
  margin: 0 0 12px;
  font-size: 0.88em;
  color: var(--c-red);
}

.comment-item {
  display: flex;
  gap: 12px;
  padding: 14px 4px;
  border-top: 1px solid var(--border-1);
}

.comment-avatar {
  flex: none;
  width: 38px;
  height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #fff;
  background: linear-gradient(135deg, #42a5f5, #1e88e5);
  border-radius: 50%;
}

.comment-body {
  flex: 1;
  min-width: 0;
}

.comment-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.comment-author {
  font-weight: 600;
  font-size: 0.92em;
  color: var(--text-1);
}

.comment-time {
  font-size: 0.8em;
  color: var(--text-2);
}

.comment-del {
  margin-left: auto;
  padding: 2px 8px;
  font-size: 0.8em;
  color: var(--text-2);
  background: none;
  border: none;
  cursor: pointer;
}

.comment-del:hover {
  color: var(--c-red);
}

.comment-content {
  margin: 4px 0 0;
  font-size: 0.95em;
  line-height: 1.7;
  color: var(--text-1);
  white-space: pre-wrap;
  word-break: break-word;
}

.comment-empty {
  padding: 24px 0;
  color: var(--text-2);
  text-align: center;
}
</style>
