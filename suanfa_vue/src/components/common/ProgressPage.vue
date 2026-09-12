<script setup>
import { computed, onMounted, ref } from 'vue'
import { fetchAlgorithms, fetchProgress } from '../../api/client.js'
import { algorithmCategories } from '../../data/algorithms.js'
import { useUserStore } from '../../stores/user.js'

const userStore = useUserStore()

const progress = ref([])
const algorithms = ref([])
const loading = ref(true)
const error = ref('')

// 分类中文名与展示顺序统一取自单一数据源
const CATEGORY_LABELS = Object.fromEntries(algorithmCategories.map((c) => [c.key, c.label]))
const CATEGORY_ORDER = algorithmCategories.map((c) => c.key)

/** 算法 id → 元数据 */
const algorithmMap = computed(() => {
  const map = {}
  for (const a of algorithms.value) map[a.id] = a
  return map
})

/** 按分类分组：已学 + 收藏 */
const groups = computed(() => {
  const byCat = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, []]))
  for (const p of progress.value) {
    const a = algorithmMap.value[p.algorithmId]
    if (!a) continue
    byCat[a.category]?.push({
      id: a.id,
      name: a.name,
      status: p.status,
      route: a.route,
    })
  }
  return CATEGORY_ORDER
    .filter((cat) => (byCat[cat] || []).length > 0)
    .map((cat) => ({ cat, label: CATEGORY_LABELS[cat], items: byCat[cat] }))
})

const statusText = (s) => ({ learning: '学习中', learned: '已掌握', favorited: '已收藏' }[s] || s)

onMounted(async () => {
  try {
    const [prog, algs] = await Promise.all([
      fetchProgress(userStore.user.id),
      fetchAlgorithms(),
    ])
    progress.value = prog
    algorithms.value = algs
  } catch (e) {
    error.value = e.message || '加载进度失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="progress-page">
    <h2>我的学习进度</h2>
    <p class="progress-user">用户：{{ userStore.user?.username }}</p>

    <p v-if="loading" class="progress-tip">加载中…</p>
    <p v-else-if="error" class="progress-tip error">{{ error }}</p>

    <template v-else>
      <p v-if="groups.length === 0" class="progress-tip">
        暂无学习记录。去浏览算法并点击「已掌握」或收藏，进度会自动保存在这里。
      </p>

      <div v-for="group in groups" :key="group.cat" class="progress-group">
        <h3>{{ group.label }}</h3>
        <div class="progress-grid">
          <router-link v-for="item in group.items" :key="item.id" :to="item.route" class="progress-card">
            <span class="progress-name">{{ item.name }}</span>
            <span class="progress-status" :class="item.status">{{ statusText(item.status) }}</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.progress-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px 20px;
}

.progress-page h2 {
  color: var(--text-1);
  margin: 0 0 4px;
}

.progress-user {
  color: var(--text-3);
  margin: 0 0 24px;
  font-size: 0.9rem;
}

.progress-tip {
  color: var(--text-3);
  padding: 20px 0;
}

.progress-tip.error {
  color: var(--c-red);
}

.progress-group {
  margin-bottom: 28px;
}

.progress-group h3 {
  color: var(--text-2);
  margin: 0 0 12px;
  font-size: 1.05rem;
  border-left: 3px solid #1e88e5;
  padding-left: 10px;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.progress-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  background: var(--surface);
  border-radius: 6px;
  border: 1px solid var(--border-1);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.5);
  text-decoration: none;
  transition: box-shadow 0.2s, transform 0.2s;
}

.progress-card:hover {
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.5);
  transform: translateY(-1px);
}

.progress-name {
  color: var(--text-1);
  font-size: 0.95rem;
}

.progress-status {
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 10px;
  flex-shrink: 0;
}

.progress-status.learning {
  background: var(--tint-blue);
  color: var(--c-blue);
}

.progress-status.learned {
  background: var(--tint-green);
  color: var(--c-green);
}

.progress-status.favorited {
  background: var(--tint-amber);
  color: var(--c-orange);
}
</style>
