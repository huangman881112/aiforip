<script setup>
// 算法分类卡片：总览页 /algorithms 上每个分类一张，与计算机语言 LanguageCard 同一套模式。
// 整张卡片即链接，点「查看算法」进入 /algorithms/:category 分类页；
// item 结构见 data/algorithms.js 的 algorithmCategoryCards，新增分类时自动多出一张卡片。
defineProps({
  item: {
    type: Object,
    required: true, // { label, to, icon, accentVar, tagline, subCategories, representatives, useCases, count, countUnit, difficulties, moreLabel }
  },
})
</script>

<template>
  <router-link
    :to="item.to"
    class="algo-card"
    :style="{ '--algo-accent': item.accentVar }"
    active-class="is-active"
  >
    <span class="ac-head">
      <span class="ac-icon">{{ item.icon }}</span>
      <strong class="ac-name">{{ item.label }}</strong>
      <span class="ac-tagline">{{ item.tagline }}</span>
    </span>

    <span class="ac-row">
      <span class="ac-key">🧮 组成</span>
      <span class="ac-chips">
        <em v-for="s in item.subCategories" :key="s">{{ s }}</em>
      </span>
    </span>

    <span class="ac-row" v-if="item.representatives.length">
      <span class="ac-key">⚡ 代表</span>
      <span class="ac-chips">
        <em v-for="r in item.representatives" :key="r.name">
          {{ r.name }} <b>{{ r.complexity }}</b>
        </em>
      </span>
    </span>

    <span class="ac-row">
      <span class="ac-key">🎯 应用</span>
      <span class="ac-chips">
        <em v-for="u in item.useCases" :key="u">{{ u }}</em>
      </span>
    </span>

    <span class="ac-sub">
      共 {{ item.count }} {{ item.countUnit }}
      <template v-if="item.difficulties.length">
        ·
        <span v-for="(d, i) in item.difficulties" :key="d.label">
          <span v-if="i > 0"> / </span>{{ d.label }} {{ d.count }}
        </span>
      </template>
    </span>

    <span class="ac-more">{{ item.moreLabel }}<span class="ac-arrow">→</span></span>
  </router-link>
</template>

<style scoped>
.algo-card {
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

.algo-card:hover {
  border-color: var(--algo-accent);
  background-color: var(--nav-menu-hover-bg);
  transform: translateY(-2px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.32);
}

.algo-card.is-active {
  border-color: var(--algo-accent);
  background-color: var(--nav-menu-active-bg);
}

/* ---------- 头部 ---------- */
.ac-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px;
}

.ac-icon {
  font-size: 1.3rem;
  line-height: 1;
}

.ac-name {
  color: var(--algo-accent);
  font-size: 1.3rem;
  line-height: 1.2;
}

.ac-tagline {
  font-size: 0.88rem;
  color: var(--text-3);
}

/* ---------- 摘要行：组成 / 代表 / 应用 ---------- */
.ac-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  font-size: 0.88rem;
  line-height: 1.6;
}

.ac-key {
  flex-shrink: 0;
  color: var(--text-3);
}

.ac-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.ac-chips em {
  padding: 1px 7px;
  border-radius: 999px;
  background-color: var(--surface-2);
  color: var(--text-2);
  font-size: 0.82rem;
  font-style: normal;
  white-space: nowrap;
}

/* 代表算法的复杂度：等宽小字，弱化名称与复杂度间的视觉差 */
.ac-chips em b {
  margin-left: 4px;
  color: var(--text-3);
  font-weight: 400;
  font-size: 0.78rem;
}

.algo-card:hover .ac-chips em {
  background-color: var(--surface-3);
}

/* ---------- 数量说明 + 查看详情 ---------- */
.ac-sub {
  margin-top: 2px;
  padding-top: 8px;
  border-top: 1px dashed var(--border-1);
  color: var(--text-3);
  font-size: 0.84rem;
  line-height: 1.6;
}

/* margin-top: auto 让「查看算法」贴底：卡片被网格拉成等高后不会上下错落 */
.ac-more {
  align-self: flex-end;
  margin-top: auto;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--algo-accent);
  font-size: 0.88rem;
  font-weight: 600;
}

.ac-arrow {
  transition: transform 0.2s ease;
}

.algo-card:hover .ac-arrow {
  transform: translateX(3px);
}
</style>
