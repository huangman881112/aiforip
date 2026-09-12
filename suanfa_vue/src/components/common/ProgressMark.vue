<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { fetchProgress, updateProgress } from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'

const props = defineProps({
  algorithmId: { type: String, required: true },
})

const userStore = useUserStore()
const router = useRouter()

const status = ref(null) // 'learned' | 'favorited' | null
const loading = ref(false)

/** 已登录则加载当前状态 */
async function load() {
  if (!userStore.isLoggedIn) return
  try {
    const list = await fetchProgress(userStore.user.id)
    status.value = list.find((p) => p.algorithmId === props.algorithmId)?.status || null
  } catch {
    status.value = null
  }
}

load()

async function toggle(next) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: router.currentRoute.value.fullPath } })
    return
  }
  loading.value = true
  try {
    status.value = status.value === next ? null : next
    if (status.value) {
      await updateProgress(userStore.user.id, props.algorithmId, status.value)
    } else {
      await updateProgress(userStore.user.id, props.algorithmId, 'learning')
    }
  } catch {
    status.value = null
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="progress-mark" @click.stop>
    <button
      class="pm-btn"
      :class="{ active: status === 'learned', learned: status === 'learned' }"
      :disabled="loading"
      title="标记为已掌握"
      @click="toggle('learned')"
    >
      ✓ 掌握
    </button>
    <button
      class="pm-btn"
      :class="{ active: status === 'favorited', favorited: status === 'favorited' }"
      :disabled="loading"
      title="收藏该算法"
      @click="toggle('favorited')"
    >
      ♥ 收藏
    </button>
  </div>
</template>

<style scoped>
.progress-mark {
  display: inline-flex;
  gap: 6px;
}

.pm-btn {
  border: 1px solid var(--border-1);
  background: var(--surface);
  color: var(--text-2);
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  line-height: 1.4;
}

.pm-btn:hover:not(:disabled) {
  border-color: #1e88e5;
  color: var(--c-blue);
}

.pm-btn.active {
  background: #1e88e5;
  border-color: #1e88e5;
  color: #fff;
}

.pm-btn.active.learned {
  background: #2e7d32;
  border-color: #2e7d32;
}

.pm-btn.active.favorited {
  background: #e65100;
  border-color: #e65100;
}

.pm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
