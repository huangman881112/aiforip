<script setup>
// 计算机语言主页面：/languages
// 顶部导航「计算机语言」直接链到本页（不再做下拉弹框与悬停），
// 每门语言一张卡片，介绍 ✨特性 / ⚙️实现与编译原理 / 🎯使用场景；
// 点卡片「查看详情」进入 /languages/:id 子页面，子页默认停在「🧭 语言概览」，
// 那里才是每门语言的完整介绍（元信息 / 特性详解 / 编译原理流水线 + 长文 / 使用场景）。
// 数据来自 data/languages.js 单一数据源，新增语言时自动多出一张卡片。
import { languageCards } from '../../data/languages.js'
import LanguageCard from './LanguageCard.vue'
</script>

<template>
  <div class="lang-list-container">
    <!-- 页头 -->
    <header class="list-header">
      <h1>计算机语言</h1>
      <p class="list-desc">
        每张卡片先给三块摘要：<strong>✨ 特性</strong> 知道它擅长什么，
        <strong>⚙️ 实现与编译原理</strong> 明白它为什么快（或为什么慢），
        <strong>🎯 使用场景</strong> 判断该学哪门。
        点卡片「查看详情」进入该语言的主页——默认打开「🧭 语言概览」完整介绍，
        再往下是语法基础、数据结构、常用架构与经典面试题。
      </p>
      <!-- 选型速查：由各语言「使用场景」首条派生，不另写一份文案 -->
      <ul class="pick-hint">
        <li v-for="c in languageCards" :key="c.to">
          <span class="pick-icon">{{ c.icon }}</span>
          <strong>{{ c.label }}</strong>
          <span class="pick-arrow">→</span>
          <span>{{ c.useCases[0] }}</span>
        </li>
      </ul>
    </header>

    <!-- 语言卡片 -->
    <div class="lang-card-grid">
      <LanguageCard v-for="c in languageCards" :key="c.to" :item="c" />
    </div>
  </div>
</template>

<style scoped>
.lang-list-container {
  max-width: 1180px;
  margin: 0 auto;
  padding: 24px 20px 48px;
  text-align: left;
}

/* ---------- 页头 ---------- */
.list-header {
  margin-bottom: 22px;
}

.list-header h1 {
  margin: 0;
  font-size: 2rem;
  color: var(--text-1);
}

.list-desc {
  margin: 8px 0 14px;
  max-width: 900px;
  color: var(--text-2);
  line-height: 1.85;
}

.list-desc strong {
  color: var(--c-blue);
}

/* 选型速查 */
.pick-hint {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pick-hint li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 5px 12px;
  border: 1px solid var(--border-1);
  border-radius: 999px;
  background: var(--surface-muted);
  color: var(--text-2);
  font-size: 0.82rem;
}

.pick-hint strong {
  color: var(--text-1);
}

.pick-arrow {
  color: var(--text-3);
}

/* ---------- 卡片网格 ---------- */
/* 等宽：1fr 均分列宽，末行不满时卡片宽度也与上面一致。
   等高：grid-auto-rows: 1fr 让所有隐式行都取「最高那一行」的高度，
   配合 align-items: stretch 与卡片内 .lc-more 的 margin-top: auto，
   5 张卡片长宽完全统一，「查看详情」统一贴底对齐。 */
.lang-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 16px;
}

@media (max-width: 640px) {
  .lang-list-container {
    padding: 18px 14px 40px;
  }

  .list-header h1 {
    font-size: 1.6rem;
  }
}
</style>
