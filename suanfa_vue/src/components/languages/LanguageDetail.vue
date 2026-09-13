<script setup>
// 计算机语言详情页：/languages/:lang
// 数据全部来自 data/languages.js 单一数据源；语言切换只改路由参数
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { languages, getLanguageById, languageSections } from '../../data/languages.js'
import MarkdownBlock from '../common/MarkdownBlock.vue'

const route = useRoute()
const router = useRouter()

// 当前语言（未知 id 一律回落到 java）
const lang = computed(() => {
  const found = getLanguageById(route.params.lang)
  return found || getLanguageById('java')
})

// 四大板块：语法 / 数据结构 / 常用架构 / 经典面试题
const tabs = [...languageSections, { key: 'interview', label: '经典面试题', icon: '💼' }]
const activeTab = ref('syntax')

// 切换语言（路由参数变化）时回到第一个板块
watch(
  () => route.params.lang,
  () => {
    activeTab.value = 'syntax'
  }
)

// 未知语言 id 直接重定向（含首次整页直达非法地址的场景），避免停留在空页面
watch(
  lang,
  (cur) => {
    if (cur && cur.id !== route.params.lang) {
      router.replace(`/languages/${cur.id}`)
    }
  },
  { immediate: true }
)

// 强调色映射到主题语义色变量
const accentVar = computed(() => {
  const map = {
    orange: 'var(--c-orange)',
    blue: 'var(--c-blue)',
    purple: 'var(--c-purple)',
    amber: 'var(--c-amber)',
    green: 'var(--c-green)',
  }
  return map[lang.value.accent] || 'var(--c-blue)'
})

// 面试题展开状态：默认全部收起，切换语言时重置
const openSet = ref(new Set())
function toggleQuestion(i) {
  const next = new Set(openSet.value)
  if (next.has(i)) next.delete(i)
  else next.add(i)
  openSet.value = next
}
watch(
  () => route.params.lang,
  () => {
    openSet.value = new Set()
  }
)
</script>

<template>
  <div class="lang-page-container" :style="{ '--lang-accent': accentVar }">
    <!-- 页头 -->
    <header class="lang-header">
      <h1>{{ lang.name }}</h1>
      <p class="lang-tagline">{{ lang.tagline }}</p>
      <div class="lang-intro">
        <MarkdownBlock :source="lang.intro" />
      </div>
    </header>

    <!-- 语言切换 -->
    <nav class="lang-switcher" aria-label="语言切换">
      <button
        v-for="l in languages"
        :key="l.id"
        :class="{ active: l.id === lang.id }"
        @click="router.push(`/languages/${l.id}`)"
      >
        {{ l.name }}
      </button>
    </nav>

    <!-- 板块切换 -->
    <nav class="section-tabs" role="tablist">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        role="tab"
        :aria-selected="activeTab === tab.key"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </nav>

    <!-- 内容区 -->
    <section v-if="activeTab !== 'interview'" class="section-content card-panel">
      <MarkdownBlock :source="lang.sections[activeTab]" />
    </section>

    <!-- 经典面试题：折叠问答 -->
    <section v-else class="interview-list">
      <p class="interview-tip">
        共 {{ lang.interview.length }} 道高频面试题，先自己想一想，再点击卡片查看参考答案。
      </p>
      <article
        v-for="(item, i) in lang.interview"
        :key="i"
        class="interview-card"
        :class="{ open: openSet.has(i) }"
      >
        <button class="interview-question" @click="toggleQuestion(i)">
          <span class="q-index">Q{{ i + 1 }}</span>
          <span class="q-text">{{ item.q }}</span>
          <span class="q-caret" :class="{ open: openSet.has(i) }">▾</span>
        </button>
        <div v-show="openSet.has(i)" class="interview-answer">
          <MarkdownBlock :source="item.a" />
        </div>
      </article>
    </section>
  </div>
</template>

<style scoped>
.lang-page-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  text-align: left;
}

/* ---------- 页头 ---------- */
.lang-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--lang-accent);
}

.lang-tagline {
  margin: 6px 0 10px;
  color: var(--text-3);
  font-size: 0.95rem;
}

.lang-intro {
  margin: 0 0 18px;
  color: var(--text-2);
  line-height: 1.8;
}

/* ---------- 语言切换 ---------- */
.lang-switcher {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 18px;
}

.lang-switcher button {
  padding: 7px 18px;
  border: 1px solid var(--border-1);
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-2);
  font-size: 0.92rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.lang-switcher button:hover {
  border-color: var(--lang-accent);
  color: var(--text-1);
}

.lang-switcher button.active {
  background: var(--lang-accent);
  border-color: var(--lang-accent);
  color: var(--text-on-bright);
  font-weight: 600;
}

/* ---------- 板块标签 ---------- */
.section-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 18px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-1);
}

.section-tabs button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-2);
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.section-tabs button:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.section-tabs button.active {
  background: var(--tint-blue);
  color: var(--lang-accent);
  font-weight: 600;
}

.tab-icon {
  font-size: 1rem;
}

/* ---------- 内容面板 ---------- */
.card-panel {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 22px 26px;
  color: var(--text-2);
}

.card-panel :deep(h2) {
  color: var(--text-1);
  font-size: 1.35rem;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--lang-accent);
}

.card-panel :deep(h3) {
  color: var(--lang-accent);
  font-size: 1.08rem;
  margin-top: 1.6em;
}

.card-panel :deep(table) {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
  font-size: 0.92rem;
}

.card-panel :deep(th),
.card-panel :deep(td) {
  border: 1px solid var(--border-1);
  padding: 8px 12px;
  text-align: left;
}

.card-panel :deep(th) {
  background: var(--surface-muted);
  color: var(--text-1);
}

.card-panel :deep(blockquote) {
  margin: 0.8em 0;
  padding: 8px 16px;
  border-left: 3px solid var(--lang-accent);
  background: var(--surface-muted);
  color: var(--text-2);
  border-radius: 0 8px 8px 0;
}

/* ---------- 面试题 ---------- */
.interview-tip {
  margin: 0 0 14px;
  color: var(--text-3);
  font-size: 0.9rem;
}

.interview-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.interview-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  overflow: hidden;
  transition: border-color 0.2s ease;
}

.interview-card:hover,
.interview-card.open {
  border-color: var(--lang-accent);
}

.interview-question {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 18px;
  border: none;
  background: transparent;
  color: var(--text-1);
  font-size: 1rem;
  text-align: left;
  cursor: pointer;
}

.q-index {
  flex-shrink: 0;
  min-width: 34px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--tint-blue);
  color: var(--lang-accent);
  font-size: 0.82rem;
  font-weight: 700;
}

.q-text {
  flex: 1;
  line-height: 1.5;
}

.q-caret {
  flex-shrink: 0;
  color: var(--text-3);
  transition: transform 0.2s ease;
}

.q-caret.open {
  transform: rotate(180deg);
}

.interview-answer {
  padding: 4px 18px 16px;
  border-top: 1px dashed var(--border-1);
  color: var(--text-2);
  font-size: 0.95rem;
}

/* 移动端适配 */
@media (max-width: 640px) {
  .card-panel {
    padding: 16px;
  }

  .lang-header h1 {
    font-size: 1.6rem;
  }

  .interview-question {
    padding: 12px 14px;
  }

  .interview-answer {
    padding: 4px 14px 14px;
  }
}
</style>
