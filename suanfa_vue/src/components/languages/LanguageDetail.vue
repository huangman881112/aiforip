<script setup>
// 计算机语言详情布局页：/languages/:lang/*
// 数据全部来自 data/languages.js 单一数据源。
// 布局：页头 → 顶部横向板块导航（吸顶）→ 全宽内容区。各板块（语言概览 /
// 实现与编译原理 / 语法基础 / 数据结构 / 常用架构 / 经典面试题）通过子路由
// 独立成页：每个板块有自己的 URL，可直达、可收藏、可浏览器前进后退，
// 切换板块自动回到页首。
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getLanguageById,
  getAccentVar,
  languageSectionPages,
  languageSectionPath,
} from '../../data/languages.js'
import MarkdownBlock from '../common/MarkdownBlock.vue'

const route = useRoute()
const router = useRouter()

// 当前语言（未知 id 一律回落到 java）
const lang = computed(() => {
  const found = getLanguageById(route.params.lang)
  return found || getLanguageById('java')
})

// 未知语言 id 直接重定向（含首次整页直达非法地址的场景），避免停留在空页面；
// 重定向保留当前板块，/languages/xyz/syntax → /languages/java/syntax
const activeSlug = computed(() => route.path.replace(/^\/languages\/[^/]+\/?/, ''))
watch(
  lang,
  (cur) => {
    if (cur && cur.id !== route.params.lang) {
      router.replace(languageSectionPath(cur.id, activeSlug.value))
    }
  },
  { immediate: true }
)

// 强调色映射到主题语义色变量（与总览页共用同一份映射）
const accentVar = computed(() => getAccentVar(lang.value.accent))

// ------------------------------------------------------------ 子页导航：每个板块一页

/** 当前板块在 languageSectionPages 里的下标（按 slug 匹配，未知回落到第一项） */
const activeIndex = computed(() => {
  const i = languageSectionPages.findIndex((p) => p.slug === activeSlug.value)
  return i === -1 ? 0 : i
})

/** 当前板块（页头标题徽章用） */
const activePage = computed(() => languageSectionPages[activeIndex.value])

/** 顶部横向导航：板块间用路由跳转（各板块独立 URL） */
const navAnchors = computed(() =>
  languageSectionPages.map((p, i) => ({
    ...p,
    to: languageSectionPath(lang.value.id, p.slug),
    active: i === activeIndex.value,
  }))
)

/** 上一页 / 下一页（页底翻页） */
const prevPage = computed(() => languageSectionPages[activeIndex.value - 1] || null)
const nextPage = computed(() => languageSectionPages[activeIndex.value + 1] || null)

// 子页切换（含换语言）都回到页首重新阅读
watch(
  () => route.fullPath,
  () => {
    window.scrollTo({ top: 0 })
  }
)

// ------------------------------------------------------------ 顶部导航吸顶：钉在全局顶栏下方

const pageRef = ref(null) // 页面容器（接收 CSS 变量）

// 吸顶偏移用全局顶栏实际高度（会随窗口换行变高），ResizeObserver 跟随写入变量
let headerRO = null
onMounted(() => {
  const appHeader = document.querySelector('.app-header')
  const syncStickyOffset = () => {
    if (!pageRef.value) return
    if (appHeader) pageRef.value.style.setProperty('--app-header-h', `${appHeader.offsetHeight}px`)
  }
  syncStickyOffset()
  if (typeof ResizeObserver !== 'undefined' && appHeader) {
    headerRO = new ResizeObserver(syncStickyOffset)
    headerRO.observe(appHeader)
  }
})
onBeforeUnmount(() => {
  headerRO?.disconnect()
  headerRO = null
})
</script>

<template>
  <div ref="pageRef" class="lang-page-container" :style="{ '--lang-accent': accentVar }">
    <!-- 页头：标题带上当前板块名，一眼可知自己读到哪一页 -->
    <header class="lang-header">
      <h1><span class="lang-icon">{{ lang.icon }}</span>{{ lang.name }}<span class="lang-section-in-title">{{ activePage.label }}</span>
        <!-- 就地提问：带着当前语言直达 AI 计算机语言助教 -->
        <router-link class="lang-ask-ai" :to="`/ai/language?lang=${lang.id}`" title="向 AI 计算机语言助教提问">🤖 问 AI 助教</router-link>
      </h1>
      <p class="lang-tagline">{{ lang.tagline }}</p>
      <div class="lang-intro">
        <MarkdownBlock :source="lang.intro" />
      </div>
    </header>

    <!-- 顶部横向导航切换子页：滚动时钉在全局顶栏下方，窄屏可横向滑动 -->
    <nav class="lang-topnav" aria-label="板块导航">
      <router-link
        v-for="a in navAnchors"
        :key="a.slug || 'overview'"
        class="topnav-btn"
        :class="{ active: a.active }"
        :to="a.to"
      >
        <span class="topnav-icon">{{ a.icon }}</span>{{ a.label }}
      </router-link>
    </nav>

    <!-- 子页内容：全宽展示 -->
    <div class="lang-main">
      <!-- 子页出口：语言概览 / 实现与编译原理 / 语法基础 / 数据结构 / 常用架构 / 经典面试题 -->
      <router-view :key="route.fullPath"></router-view>

      <!-- 上一页 / 下一页：按 languageSectionPages 的阅读顺序翻页 -->
      <nav v-if="prevPage || nextPage" class="section-pager" aria-label="板块翻页">
        <router-link
          v-if="prevPage"
          class="pager-btn prev"
          :to="languageSectionPath(lang.id, prevPage.slug)"
        >
          <span class="pager-dir">← 上一页</span>
          <span class="pager-label">{{ prevPage.label }}</span>
        </router-link>
        <span v-else class="pager-spacer"></span>
        <router-link
          v-if="nextPage"
          class="pager-btn next"
          :to="languageSectionPath(lang.id, nextPage.slug)"
        >
          <span class="pager-dir">下一页 →</span>
          <span class="pager-label">{{ nextPage.label }}</span>
        </router-link>
      </nav>
    </div><!-- /.lang-main -->
  </div>
</template>

<style scoped>
.lang-page-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  text-align: left;
}

/* ---------- 页头 ---------- */
.lang-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--lang-accent);
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.lang-icon {
  font-size: 1.7rem;
  line-height: 1;
}

/* 标题里的板块名：弱化为副标题样式，避免喧宾夺主 */
.lang-section-in-title {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-3);
  padding: 3px 10px;
  border: 1px solid var(--border-1);
  border-radius: 999px;
  background: var(--surface-muted);
}

/* 标题行右侧的「问 AI 助教」入口：带当前语言直达对话页 */
.lang-ask-ai {
  margin-left: auto;
  padding: 5px 14px;
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--c-blue);
  text-decoration: none;
  border: 1px solid var(--tint-blue-border);
  border-radius: 999px;
  background: var(--tint-blue);
  white-space: nowrap;
  transition: all 0.15s ease;
}

.lang-ask-ai:hover {
  color: #fff;
  background: #1e88e5;
  border-color: #1e88e5;
}

.lang-tagline {
  margin: 6px 0 10px;
  color: var(--text-3);
  font-size: 0.95rem;
}

.lang-intro {
  margin: 0;
  color: var(--text-2);
  line-height: 1.8;
}

/* ---------- 顶部横向板块导航：吸顶在全局顶栏下方，长内容滚动时也能随时切换板块 ---------- */
.lang-topnav {
  position: sticky;
  top: var(--app-header-h, 64px);
  z-index: 40; /* 低于全局顶栏（100）与其下拉菜单（200） */
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 18px -20px 8px; /* 左右负边距抵消页面内边距，导航条通栏到底 */
  padding: 10px 20px;
  background: var(--app-bg); /* 不透明，滚动内容从下方穿过时不透出 */
  border-bottom: 1px solid var(--border-1);
  overflow-x: auto; /* 窄屏放不下时横向滑动，不换行撑高 */
  scrollbar-width: thin;
}

.topnav-btn {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 8px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: transparent;
  color: var(--text-2);
  font-size: 0.9rem;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.topnav-btn:hover {
  background: var(--surface-2);
  color: var(--text-1);
}

.topnav-btn.active {
  background: var(--surface-muted);
  border-color: var(--lang-accent);
  color: var(--lang-accent);
  font-weight: 600;
}

.topnav-icon {
  font-size: 0.95rem;
  line-height: 1;
}

/* ---------- 全宽内容区 ---------- */
.lang-main {
  min-width: 0;
}

/* ---------- 页底翻页 ---------- */
.section-pager {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 12px;
  margin-top: 28px;
}

.pager-spacer {
  flex: 1;
}

.pager-btn {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 180px;
  padding: 12px 16px;
  border: 1px solid var(--border-1);
  border-radius: 12px;
  background: var(--surface);
  text-decoration: none;
  transition: border-color 0.2s ease, transform 0.2s ease;
}

.pager-btn:hover {
  border-color: var(--lang-accent);
  transform: translateY(-2px);
}

.pager-btn.next {
  margin-left: auto;
  text-align: right;
}

.pager-dir {
  font-size: 0.78rem;
  color: var(--text-3);
}

.pager-label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--lang-accent);
}

@media (max-width: 640px) {
  .lang-header h1 {
    font-size: 1.6rem;
  }

  .lang-topnav {
    margin: 14px -14px 6px;
    padding: 8px 14px;
  }

  .topnav-btn {
    padding: 7px 13px;
    font-size: 0.86rem;
  }

  .section-pager {
    flex-direction: column;
  }

  .pager-btn {
    min-width: 0;
  }
}
</style>

<!-- 子页共用样式（非 scoped：板块子组件渲染在 .lang-main 内，用容器前缀限定作用范围，
     避免逐个组件复制一份） -->
<style>
/* ---------- 板块标题 ---------- */
.lang-main .page-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 26px 0 14px;
  font-size: 1.3rem;
  color: var(--text-1);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--lang-accent);
}

.lang-main > .lang-module:first-child .page-section-title {
  margin-top: 4px;
}

.lang-main .pst-icon {
  font-size: 1.1rem;
  line-height: 1;
}

/* ---------- 内容面板（Markdown 长文） ---------- */
.lang-main .card-panel {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 22px 26px;
  color: var(--text-2);
}

.lang-main .card-panel h2 {
  color: var(--text-1);
  font-size: 1.35rem;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--lang-accent);
}

.lang-main .card-panel h3 {
  color: var(--lang-accent);
  font-size: 1.08rem;
  margin-top: 1.6em;
}

.lang-main .card-panel table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.8em 0;
  font-size: 0.92rem;
}

.lang-main .card-panel th,
.lang-main .card-panel td {
  border: 1px solid var(--border-1);
  padding: 8px 12px;
  text-align: left;
}

.lang-main .card-panel th {
  background: var(--surface-muted);
  color: var(--text-1);
}

.lang-main .card-panel blockquote {
  margin: 0.8em 0;
  padding: 8px 16px;
  border-left: 3px solid var(--lang-accent);
  background: var(--surface-muted);
  color: var(--text-2);
  border-radius: 0 8px 8px 0;
}

@media (max-width: 640px) {
  .lang-main .card-panel {
    padding: 16px;
  }
}
</style>
