<script setup>
// 算法总览页：/algorithms
// 顶部导航「算法」不再做下拉弹框，直接链到本页（与计算机语言 /languages 同一套模式），
// 每个分类一张卡片（组成 / 代表算法 / 应用场景 + 数量与难度分布，数据从 data/algorithms.js 派生），
// 点卡片「查看算法」进入 /algorithms/:category 分类页，再看具体算法详情。
// 「算法训练」原来是下拉菜单里的一项，现在收进本页作为收尾卡片。
import { algorithmCategoryCards } from '../../data/algorithms.js'
import { trainingProblems } from '../../data/trainingProblems.js'
import AlgorithmCategoryCard from './AlgorithmCategoryCard.vue'

// 训练卡片：结构与分类卡片一致，计数从题库派生，文案与 TrainingPage 保持同一口径
const trainingCard = {
  key: 'training',
  label: '算法训练',
  to: '/training',
  icon: '🏋️',
  accentVar: 'var(--c-pink)',
  tagline: '用题目巩固所学',
  subCategories: [...new Set(trainingProblems.flatMap((p) => p.topics || []))].slice(0, 6),
  representatives: [],
  useCases: ['分级题单', '在线判题', '思路提示与参考解答'],
  count: trainingProblems.length,
  countUnit: '道题',
  difficulties: [],
  moreLabel: '去刷题',
}

const cards = [...algorithmCategoryCards, trainingCard]
</script>

<template>
  <div class="algo-list-container">
    <!-- 页头 -->
    <header class="list-header">
      <h1>算法</h1>
      <p class="list-desc">
        每张卡片先看三块摘要：<strong>🧮 组成</strong> 这个分类包含哪几路，
        <strong>⚡ 代表算法</strong> 从哪几个入手，<strong>🎯 应用</strong> 学完能用在哪。
        点卡片「查看算法」进入分类页——那里有该分类的全部算法卡片，
        再往下是每个算法的原理详解、复杂度、代码实现与学习笔记。
      </p>
      <!-- 学习路线速查：从分类卡片派生，不另写一份文案 -->
      <ul class="pick-hint">
        <li v-for="c in cards" :key="c.to">
          <span class="pick-icon">{{ c.icon }}</span>
          <strong>{{ c.label }}</strong>
          <span class="pick-arrow">→</span>
          <span>{{ c.tagline }}</span>
        </li>
      </ul>
    </header>

    <!-- 分类卡片 -->
    <div class="algo-card-grid">
      <AlgorithmCategoryCard v-for="c in cards" :key="c.to" :item="c" />
    </div>
  </div>
</template>

<style scoped>
.algo-list-container {
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

/* 学习路线速查 */
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
/* 与计算机语言主页面同一套布局：等宽 + 等高，「查看算法」统一贴底对齐 */
.algo-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(340px, 100%), 1fr));
  grid-auto-rows: 1fr;
  align-items: stretch;
  gap: 16px;
}

@media (max-width: 640px) {
  .algo-list-container {
    padding: 18px 14px 40px;
  }

  .list-header h1 {
    font-size: 1.6rem;
  }
}
</style>
