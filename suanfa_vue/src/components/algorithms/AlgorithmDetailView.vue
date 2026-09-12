<script setup>
// 统一算法详情页：内容由 Mongo 内容 API 驱动（本地数据兜底），
// 可视化区按 algorithm id 从 vizRegistry 动态挂载对应 viz 组件。
import { computed, onMounted, ref, watch } from 'vue'
import { fetchAlgorithmContent } from '../../api/client.js'
import MarkdownBlock from '../common/MarkdownBlock.vue'
import AlgorithmComplexity from '../common/AlgorithmComplexity.vue'
import NoteSection from '../common/NoteSection.vue'
import CommentSection from '../common/CommentSection.vue'
import { getVizComponent } from './vizRegistry.js'

const props = defineProps({
  algorithmId: { type: String, required: true },
})
const emit = defineEmits(['close'])

const TAB_LABELS = {
  basic: '基础',
  viz: '可视化',
  advanced: '进阶',
  notes: '笔记',
  comments: '评论',
  videos: '视频讲解',
}

const content = ref(null)
const loading = ref(false)
const loadError = ref('')
const activeTab = ref('basic')

const tabs = computed(() => {
  const base = content.value?.tabs?.length ? [...content.value.tabs] : ['viz']
  if (content.value?.videos?.length && !base.includes('videos')) base.push('videos')
  if (!base.includes('comments')) base.push('comments')
  return base
})
const vizComponent = computed(() => getVizComponent(props.algorithmId))

async function load() {
  loading.value = true
  loadError.value = ''
  content.value = null
  try {
    content.value = await fetchAlgorithmContent(props.algorithmId)
    activeTab.value = content.value?.tabs?.[0] || 'viz'
  } catch (err) {
    loadError.value = `内容加载失败：${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => props.algorithmId, load)

function bilibiliEmbedUrl(v) {
  if (v.platform === 'bilibili' && v.bvid) {
    return `https://player.bilibili.com/player.html?bvid=${encodeURIComponent(v.bvid)}&page=${v.page || 1}&autoplay=0`
  }
  return v.embedUrl || ''
}
</script>

<template>
  <div class="detail-container unified-detail">
    <div v-if="loading" class="detail-loading">内容加载中…</div>
    <div v-else-if="loadError" class="detail-loading">{{ loadError }}</div>

    <template v-else>
      <div class="detail-topbar">
        <div class="detail-title-group">
          <h2 class="detail-title">{{ content?.name || algorithmId }}</h2>
          <span v-if="content?.difficulty" class="detail-chip">{{ content.difficulty }}</span>
          <span v-if="content?.subCategory" class="detail-chip detail-chip-muted">{{ content.subCategory }}</span>
        </div>
        <div class="detail-topbar-actions">
          <router-link class="detail-ask-ai" :to="{ path: '/ai', query: { ask: `${content?.name || algorithmId} 这个算法怎么学？` } }">
            🤖 问问 AI
          </router-link>
          <button class="detail-close-btn" @click="emit('close')">收起详情 ×</button>
        </div>
      </div>

      <div class="detail-tabs">
        <button
          v-for="tab in tabs"
          :key="tab"
          :class="{ active: activeTab === tab }"
          @click="activeTab = tab"
        >
          {{ TAB_LABELS[tab] || tab }}
        </button>
      </div>

      <div v-if="activeTab === 'basic'" class="detail-pane">
        <MarkdownBlock :source="content?.sections?.basic || ''" />
        <AlgorithmComplexity :algorithm-id="algorithmId" />
      </div>

      <div v-else-if="activeTab === 'viz'" class="detail-pane detail-pane-viz">
        <component :is="vizComponent" @close="emit('close')" />
      </div>

      <div v-else-if="activeTab === 'advanced'" class="detail-pane">
        <MarkdownBlock :source="content?.sections?.advanced || ''" />
      </div>

      <div v-else-if="activeTab === 'notes'" class="detail-pane">
        <NoteSection :algorithm-id="algorithmId" />
      </div>

      <div v-else-if="activeTab === 'comments'" class="detail-pane">
        <CommentSection :algorithm-id="algorithmId" />
      </div>

      <div v-else-if="activeTab === 'videos'" class="detail-pane">
        <p v-if="!content?.videos?.length" class="videos-empty">该算法的视频讲解整理中，敬请期待。</p>
        <div v-for="v in content?.videos" :key="v.bvid || v.title" class="video-card">
          <h4>{{ v.title }}</h4>
          <p class="video-meta">{{ v.author }} · {{ v.platform }}</p>
          <iframe
            v-if="bilibiliEmbedUrl(v)"
            class="video-iframe"
            :src="bilibiliEmbedUrl(v)"
            scrolling="no"
            frameborder="no"
            allowfullscreen="true"
            loading="lazy"
          ></iframe>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.unified-detail {
  box-sizing: border-box;
  width: min(100% - 48px, 1200px);
  margin: 30px auto 48px;
  padding: 24px;
  text-align: left;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(30, 60, 110, 0.06);
}

.detail-loading {
  padding: 40px 0;
  color: var(--text-2);
  text-align: center;
}

.detail-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.detail-title-group {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.detail-title {
  margin: 0;
  color: var(--text-1);
}

.detail-chip {
  padding: 2px 10px;
  font-size: 0.8em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border-radius: 999px;
}

.detail-chip-muted {
  color: var(--text-2);
  background: var(--surface-2);
}

.detail-close-btn {
  padding: 6px 14px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
}

.detail-close-btn:hover {
  color: var(--c-red);
  border-color: var(--tint-red-border);
}

.detail-topbar-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-ask-ai {
  padding: 6px 14px;
  font-size: 0.9em;
  color: var(--c-blue);
  background: var(--tint-blue);
  border: 1px solid var(--tint-blue-border);
  border-radius: 6px;
  text-decoration: none;
}

.detail-ask-ai:hover {
  background: var(--tint-blue);
}

.detail-tabs {
  display: flex;
  gap: 8px;
  margin: 18px 0;
  border-bottom: 2px solid var(--border-1);
}

.detail-tabs button {
  padding: 8px 20px;
  font-size: 0.95em;
  color: var(--text-2);
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -2px;
  cursor: pointer;
  transition: all 0.2s;
}

.detail-tabs button:hover {
  color: var(--c-blue);
}

.detail-tabs button.active {
  color: var(--c-blue);
  font-weight: 600;
  border-bottom-color: #1e88e5;
}

.detail-pane {
  min-height: 120px;
}

/* 可视化 Tab 与其他 Tab 统一使用外壳 topbar（标题/徽章/收起按钮）。
   viz 子组件自带的 modal-header 与裸 × 按钮在此隐藏；
   用 !important 是因为子组件样式随懒加载注入、可能排在本样式之后。 */
.detail-pane-viz :deep(.modal-header),
.detail-pane-viz :deep(.close-btn) {
  display: none !important;
}

.videos-empty {
  padding: 30px 0;
  color: var(--text-2);
  text-align: center;
}

.video-card {
  margin-bottom: 26px;
}

.video-card h4 {
  margin: 0 0 4px;
  color: var(--text-1);
}

.video-meta {
  margin: 0 0 10px;
  font-size: 0.85em;
  color: var(--text-2);
}

.video-iframe {
  width: 100%;
  max-width: 780px;
  aspect-ratio: 16 / 9;
  border-radius: 8px;
}
</style>
