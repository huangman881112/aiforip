<script setup>
// 计算机语言详情页：/languages/:lang
// 数据全部来自 data/languages.js 单一数据源；语言切换只改路由参数
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  languages,
  getLanguageById,
  getAccentVar,
  languageSections,
  languageOverviewPath,
} from '../../data/languages.js'
import MarkdownBlock from '../common/MarkdownBlock.vue'

const route = useRoute()
const router = useRouter()

// 当前语言（未知 id 一律回落到 java）
const lang = computed(() => {
  const found = getLanguageById(route.params.lang)
  return found || getLanguageById('java')
})

// 页面不做 tab 切换：语言概览 / 语法基础 / 数据结构 / 常用架构 / 经典面试题
// 全部纵向平铺展示（languageSections 即中间三个板块的清单）

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

// 强调色映射到主题语义色变量（与总览页共用同一份映射）
const accentVar = computed(() => getAccentVar(lang.value.accent))

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
    <!-- 面包屑：返回语言总览 -->
    <nav class="lang-crumb" aria-label="面包屑">
      <router-link :to="languageOverviewPath">← 计算机语言总览</router-link>
      <span class="crumb-sep">/</span>
      <span class="crumb-current">{{ lang.name }}</span>
    </nav>

    <!-- 语言切换 -->
    <nav class="lang-switcher" aria-label="语言切换">
      <button
        v-for="l in languages"
        :key="l.id"
        :class="{ active: l.id === lang.id }"
        @click="router.push(`/languages/${l.id}`)"
      >
        <span class="sw-icon">{{ l.icon }}</span>{{ l.name }}
      </button>
    </nav>


    <!-- 页头 -->
    <header class="lang-header">
      <h1><span class="lang-icon">{{ lang.icon }}</span>{{ lang.name }}</h1>
      <p class="lang-tagline">{{ lang.tagline }}</p>
      <div class="lang-intro">
        <MarkdownBlock :source="lang.intro" />
      </div>
    </header>

   

    <!-- 板块不再用 tab 切换：全部纵向平铺 -->

    <!-- 语言概览 -->
    <h2 class="page-section-title"><span class="pst-icon">🧭</span>语言概览</h2>
    <section class="overview">
      <ul class="meta-chips">
        <li v-for="m in lang.overview.meta" :key="m.label">
          <span class="meta-label">{{ m.label }}</span>{{ m.value }}
        </li>
      </ul>

      <div class="overview-grid">
        <article class="overview-block">
          <h2><span class="ob-icon">✨</span>语言特性</h2>
          <ul class="ob-list">
            <li v-for="f in lang.overview.features" :key="f.title">
              <strong>{{ f.title }}</strong>
              <span>{{ f.desc }}</span>
            </li>
          </ul>
        </article>

        <article class="overview-block">
          <h2><span class="ob-icon">⚙️</span>实现与编译原理</h2>
          <p class="compile-summary">{{ lang.overview.compile.summary }}</p>
          <ol class="pipeline">
            <li v-for="(p, i) in lang.overview.compile.pipeline" :key="p.stage">
              <span class="p-index">{{ i + 1 }}</span>
              <span class="p-text">
                <strong>{{ p.stage }}</strong>
                <em>{{ p.desc }}</em>
              </span>
            </li>
          </ol>
        </article>

        <article class="overview-block">
          <h2><span class="ob-icon">🎯</span>使用场景</h2>
          <ul class="ob-list">
            <li v-for="u in lang.overview.useCases" :key="u.title">
              <strong>{{ u.title }}</strong>
              <span>{{ u.desc }}</span>
            </li>
          </ul>
        </article>
      </div>

      <!-- 深入：编译原理长文 -->
      <div class="card-panel overview-detail">
        <MarkdownBlock :source="lang.overview.compile.detail" />
      </div>
    </section>

    <!-- 语法基础 / 数据结构 / 常用架构：逐个平铺 -->
    <template v-for="sec in languageSections" :key="sec.key">
      <h2 class="page-section-title"><span class="pst-icon">{{ sec.icon }}</span>{{ sec.label }}</h2>
      <section class="section-content card-panel">
        <MarkdownBlock :source="lang.sections[sec.key]" />
      </section>
    </template>

    <!-- 经典面试题：折叠问答 -->
    <h2 class="page-section-title"><span class="pst-icon">💼</span>经典面试题</h2>
    <section class="interview-list">
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

/* ---------- 面包屑 ---------- */
.lang-crumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  font-size: 0.88rem;
}

.lang-crumb a {
  color: var(--text-3);
  text-decoration: none;
  transition: color 0.2s ease;
}

.lang-crumb a:hover {
  color: var(--lang-accent);
}

.crumb-sep {
  color: var(--text-3);
}

.crumb-current {
  color: var(--text-2);
  font-weight: 600;
}

/* ---------- 页头 ---------- */
.lang-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--lang-accent);
  display: flex;
  align-items: center;
  gap: 10px;
}

.lang-icon {
  font-size: 1.7rem;
  line-height: 1;
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
  display: inline-flex;
  align-items: center;
  gap: 6px;
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

.sw-icon {
  font-size: 0.95rem;
  line-height: 1;
}

/* ---------- 板块标题（板块纵向平铺，无 tab） ---------- */
.page-section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 26px 0 14px;
  font-size: 1.3rem;
  color: var(--text-1);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--lang-accent);
}

.page-section-title:first-of-type {
  margin-top: 4px;
}

.pst-icon {
  font-size: 1.1rem;
  line-height: 1;
}

.section-content {
  margin-bottom: 6px;
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

/* ---------- 语言概览 ---------- */
.overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.meta-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.meta-chips li {
  padding: 4px 10px;
  border-radius: 6px;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  color: var(--text-2);
  font-size: 0.8rem;
}

.meta-label {
  margin-right: 6px;
  color: var(--text-3);
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 16px;
}

.overview-block {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 16px 18px;
}

.overview-block h2 {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: 1.05rem;
  color: var(--lang-accent);
}

.ob-icon {
  font-size: 1rem;
}

.ob-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ob-list li {
  padding: 6px 0 6px 12px;
  border-left: 2px solid var(--border-1);
  transition: border-color 0.2s ease;
}

.ob-list li:hover {
  border-left-color: var(--lang-accent);
}

.ob-list strong {
  display: block;
  color: var(--text-1);
  font-size: 0.92rem;
}

.ob-list span {
  display: block;
  margin-top: 2px;
  color: var(--text-3);
  font-size: 0.85rem;
  line-height: 1.65;
}

.compile-summary {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 8px;
  background: var(--tint-blue);
  color: var(--text-2);
  font-size: 0.86rem;
  line-height: 1.7;
}

.pipeline {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pipeline li {
  display: flex;
  gap: 8px;
  align-items: flex-start;
  padding: 5px 0;
}

.p-index {
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--surface-2);
  color: var(--lang-accent);
  font-size: 0.7rem;
  font-weight: 700;
}

.p-text strong {
  display: block;
  color: var(--text-1);
  font-size: 0.88rem;
}

.p-text em {
  display: block;
  margin-top: 1px;
  color: var(--text-3);
  font-size: 0.82rem;
  font-style: normal;
  line-height: 1.6;
}

.overview-detail {
  margin-top: 4px;
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
