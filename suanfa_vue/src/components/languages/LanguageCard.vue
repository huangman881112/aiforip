<script setup>
// 语言卡片：主页面 /languages 上每门语言一张，介绍 ✨特性 / ⚙️实现与编译原理 / 🎯使用场景，
// 整张卡片即链接，点「查看详情」进入 /languages/:id 子页面（默认停在「🧭 语言概览」完整介绍）。
// item 结构见 data/languages.js 的 languageCards；新增语言时自动多出一张卡片。
defineProps({
  item: {
    type: Object,
    required: true, // { label, to, icon, tagline, accentVar, features, compile, useCases, interviewCount }
  },
})
</script>

<template>
  <router-link
    :to="item.to"
    class="lang-card"
    :style="{ '--lang-accent': item.accentVar }"
    active-class="is-active"
  >
    <span class="lc-head">
      <span class="lc-icon">{{ item.icon }}</span>
      <strong class="lc-name">{{ item.label }}</strong>
      <span class="lc-tagline">{{ item.tagline }}</span>
    </span>

    <span class="lc-row">
      <span class="lc-key">✨ 特性</span>
      <span class="lc-chips">
        <em v-for="f in item.features" :key="f">{{ f }}</em>
      </span>
    </span>

    <span class="lc-row">
      <span class="lc-key">⚙️ 原理</span>
      <span class="lc-compile">{{ item.compile }}</span>
    </span>

    <span class="lc-row">
      <span class="lc-key">🎯 场景</span>
      <span class="lc-chips">
        <em v-for="u in item.useCases" :key="u">{{ u }}</em>
      </span>
    </span>

    <span class="lc-sub">
      子页含：语言概览 · 语法基础 · 数据结构 · 常用架构 · 经典面试题（{{ item.interviewCount }} 道）
    </span>

    <span class="lc-more">查看详情<span class="lc-arrow">→</span></span>
  </router-link>
</template>

<style scoped>
.lang-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px 20px;
  border: 1px solid var(--border-1);
  border-radius: 12px;
  background-color: var(--surface);
  color: var(--text-2);
  text-align: left;
  text-decoration: none;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease,
    transform 0.2s ease;
}

.lang-card:hover {
  border-color: var(--lang-accent);
  background-color: var(--nav-menu-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32);
}

/* 当前语言（从子页面回看主页面时不会出现，保留以防复用） */
.lang-card.is-active {
  border-color: var(--lang-accent);
  background-color: var(--nav-menu-active-bg);
}

/* ---------- 头部 ---------- */
.lc-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.lc-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.lc-name {
  color: var(--lang-accent);
  font-size: 1.3rem;
  line-height: 1.2;
}

.lc-tagline {
  font-size: 0.88rem;
  color: var(--text-3);
}

/* ---------- 三行摘要：特性 / 原理 / 场景 ---------- */
.lc-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.88rem;
  line-height: 1.6;
}

.lc-key {
  flex-shrink: 0;
  color: var(--text-3);
}

.lc-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.lc-chips em {
  padding: 1px 7px;
  border-radius: 999px;
  background-color: var(--surface-2);
  color: var(--text-2);
  font-size: 0.82rem;
  font-style: normal;
  white-space: nowrap;
}

.lang-card:hover .lc-chips em {
  background-color: var(--surface-3);
}

/* 编译原理一句话：最多三行，超出省略 */
.lc-compile {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  color: var(--text-2);
}

/* ---------- 子页说明 + 查看详情 ---------- */
.lc-sub {
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-1);
  color: var(--text-3);
  font-size: 0.84rem;
  line-height: 1.6;
}

/* margin-top: auto 让「查看详情」贴底：卡片被网格拉成等高后不会上下错落 */
.lc-more {
  align-self: flex-end;
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--lang-accent);
  font-size: 0.88rem;
  font-weight: 600;
}

.lc-arrow {
  transition: transform 0.2s ease;
}

.lang-card:hover .lc-arrow {
  transform: translateX(3px);
}
</style>
