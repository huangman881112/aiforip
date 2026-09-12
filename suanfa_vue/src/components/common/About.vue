<script setup>
// 关于页：站点定位 + 内容地图 + 学习工具 + 技术栈。
// 布局沿用站内约定：*.page（--surface-muted 背景）→ *.container（定宽居中）→ 卡片分区。
// 算法数量从单一数据源 data/algorithms.js 统计，新增算法时这里不用改。
import { computed } from 'vue'
import {
  dpAlgorithms,
  greedyAlgorithms,
  graphAlgorithms,
  searchingAlgorithms,
  sortingAlgorithms,
} from '../../data/algorithms.js'

const CATEGORIES = [
  {
    name: '排序算法',
    to: '/algorithms/sorting',
    desc: '冒泡、选择、插入、希尔、归并、快排、堆排，以及计数/桶/基数排序',
    list: sortingAlgorithms,
  },
  {
    name: '搜索与查找',
    to: '/algorithms/searching',
    desc: '线性、二分、插值、指数、跳表与哈希查找的边界条件对比',
    list: searchingAlgorithms,
  },
  {
    name: '图算法',
    to: '/algorithms/graph',
    desc: 'DFS/BFS、最短路、最小生成树、拓扑排序与网络流',
    list: graphAlgorithms,
  },
  {
    name: '动态规划',
    to: '/algorithms/dp',
    desc: '线性 DP、0/1 与完全背包、LCS/编辑距离、区间 DP，逐格看表怎么填',
    list: dpAlgorithms,
  },
  {
    name: '贪心算法',
    to: '/algorithms/greedy',
    desc: '活动选择、分数背包、哈夫曼编码，外加一个贪心失效的找零反例',
    list: greedyAlgorithms,
  },
]

const totalAlgorithms = computed(() => CATEGORIES.reduce((n, c) => n + c.list.length, 0))

const TOOLS = [
  { icon: '🏋️', name: '算法训练', to: '/training', desc: '经典题单 + 分级提示 + 参考解答，支持多语言代码在线测试' },
  { icon: '🤖', name: 'AI 助教', to: '/ai', desc: '原理讲解、复杂度分析、Debug 与刷题思路引导，回答会引用站内资料' },
  { icon: '📅', name: '学习日历', to: '/calendar', desc: '标记进度、写笔记、刷题都会记为活跃，看看自己的连续学习天数' },
  { icon: '📊', name: '我的进度', to: '/progress', desc: '按分类汇总「已掌握 / 收藏」的算法，随时回到没看完的那一页' },
]

const STACK = [
  { layer: '前端', items: ['Vue 3（Composition API）', 'Vite', 'Vue Router', 'Pinia'] },
  { layer: '后端', items: ['Java 17 + Spring Boot', 'SQLite', 'JWT（httpOnly Cookie）', '进度 / 笔记 / 评论 / 训练 API'] },
  { layer: 'AI 助教', items: ['后端代理 OpenAI 兼容接口', '多中转站配置与自动降级', '站内资料召回（轻量 RAG）'] },
]

const PRINCIPLES = [
  '先看见，再理解：每个算法都有可交互的动画，能改数据、能调速、能逐步回放。',
  '讲清复杂度，也讲清它什么时候会失效：最坏情况、常数因子、适用场景一起给。',
  '代码可直接抄进项目：同一份实现给 Python / JavaScript 两版，配伪代码与关键步骤注释。',
  '学到哪记到哪：详情页可标记进度、写笔记、留言讨论，进度与日历自动同步。',
]
</script>

<template>
  <div class="about-page">
    <div class="about-container">
      <header class="about-header">
        <h2>🧭 关于小白学算法</h2>
        <p class="about-sub">
          一个把算法「演」给你看的站内教材：{{ totalAlgorithms }} 个算法的交互式可视化 + 原理讲解 +
          复杂度分析 + 题单实战，全部免费，无需注册即可浏览。
        </p>
      </header>

      <section class="about-card">
        <h3>我们相信什么</h3>
        <ul class="about-list">
          <li v-for="p in PRINCIPLES" :key="p">{{ p }}</li>
        </ul>
      </section>

      <section class="about-card">
        <h3>内容地图</h3>
        <div class="about-grid">
          <div v-for="c in CATEGORIES" :key="c.to" class="about-item">
            <h4>
              <router-link :to="c.to" class="about-item-title">{{ c.name }}</router-link>
              <span class="about-count">{{ c.list.length }}</span>
            </h4>
            <p class="about-item-desc">{{ c.desc }}</p>
            <router-link :to="c.to" class="about-more">查看 {{ c.list.length }} 个算法 →</router-link>
          </div>
        </div>
        <p class="about-note">分治、数学与数论、字符串匹配等分类在路上。</p>
      </section>

      <section class="about-card">
        <h3>学习工具</h3>
        <div class="about-grid about-grid-2">
          <router-link v-for="t in TOOLS" :key="t.to" :to="t.to" class="about-item about-item-link">
            <h4>{{ t.icon }} {{ t.name }}</h4>
            <p class="about-item-desc">{{ t.desc }}</p>
          </router-link>
        </div>
      </section>

      <section class="about-card">
        <h3>技术栈</h3>
        <dl class="about-stack">
          <template v-for="row in STACK" :key="row.layer">
            <dt>{{ row.layer }}</dt>
            <dd>
              <span v-for="item in row.items" :key="item" class="about-tag">{{ item }}</span>
            </dd>
          </template>
        </dl>
        <p class="about-note">
          没有部署后端时，前端会自动降级：算法内容与可视化照常浏览，进度与笔记暂存本地。
        </p>
      </section>

      <section class="about-card about-card-cta">
        <h3>开始你的第一步</h3>
        <p class="about-cta-desc">从最熟悉的冒泡排序入手，或者直接把你的疑问丢给 AI 助教。</p>
        <div class="about-actions">
          <router-link to="/algorithms/sorting" class="about-btn about-btn-primary">浏览算法</router-link>
          <router-link to="/ai" class="about-btn">问 AI 助教</router-link>
          <router-link to="/training" class="about-btn">去刷题</router-link>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* 与 AI 助教 / 训练 / 日历页一致的外壳 */
.about-page {
  width: 100%;
  padding: 30px 24px 60px;
  background: var(--surface-muted);
}

.about-container {
  max-width: 960px;
  margin: 0 auto;
}

.about-header {
  margin-bottom: 20px;
}

.about-header h2 {
  margin: 0 0 6px;
  color: var(--text-1);
}

.about-sub {
  margin: 0;
  color: var(--text-2);
  line-height: 1.7;
}

.about-card {
  padding: 22px 24px;
  margin-bottom: 18px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);
}

.about-card h3 {
  margin: 0 0 14px;
  font-size: 1.1rem;
  color: var(--text-1);
}

.about-list {
  margin: 0;
  padding-left: 20px;
  color: var(--text-2);
}

.about-list li {
  margin-bottom: 8px;
  line-height: 1.7;
}

.about-list li:last-child {
  margin-bottom: 0;
}

/* 三/四张卡片自适应成列，和首页 category-grid 同一手感 */
/* 三/四张卡片自适应成列，和首页 category-grid 同一手感；
   min(… , 100%) 保证窄屏不会撑出横向滚动 */
.about-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 16px;
}

/* 工具卡只有 4 张，按两列排成 2×2，避免末尾落单 */
.about-grid-2 {
  grid-template-columns: repeat(auto-fill, minmax(min(360px, 100%), 1fr));
}

.about-item {
  padding: 16px 18px;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 8px;
}

.about-item h4 {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin: 0 0 8px;
  font-size: 1rem;
  color: var(--text-1);
}

.about-item-link {
  display: block;
  text-decoration: none;
  transition: border-color 0.2s, transform 0.2s;
}

.about-item-link:hover {
  border-color: var(--brand-500);
  transform: translateY(-2px);
}

.about-item-title {
  color: var(--c-blue);
  text-decoration: none;
}

.about-item-title:hover {
  text-decoration: underline;
}

.about-count {
  flex: none;
  padding: 1px 8px;
  font-size: 0.8em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 999px;
}

.about-item-desc {
  margin: 0 0 10px;
  font-size: 0.9em;
  line-height: 1.65;
  color: var(--text-2);
}

.about-item-link .about-item-desc {
  margin-bottom: 0;
}

.about-more {
  font-size: 0.86em;
  color: var(--c-green);
  text-decoration: none;
}

.about-more:hover {
  text-decoration: underline;
}

.about-note {
  margin: 14px 0 0;
  font-size: 0.86em;
  color: var(--text-3);
}

.about-stack {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 10px 16px;
  margin: 0;
}

.about-stack dt {
  padding-top: 3px;
  font-weight: 600;
  color: var(--text-2);
}

.about-stack dd {
  margin: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.about-tag {
  padding: 2px 10px;
  font-size: 0.84em;
  color: var(--text-2);
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 999px;
}

.about-card-cta {
  text-align: center;
}

.about-cta-desc {
  margin: 0 0 16px;
  color: var(--text-2);
  font-size: 0.92em;
}

.about-actions {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 12px;
}

.about-btn {
  padding: 9px 18px;
  font-size: 0.92em;
  color: var(--text-1);
  text-decoration: none;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  transition: all 0.2s;
}

.about-btn:hover {
  border-color: var(--brand-500);
  transform: translateY(-1px);
}

.about-btn-primary {
  color: var(--text-on-inverse);
  background: var(--surface-inverse);
  border-color: var(--surface-inverse);
}

.about-btn-primary:hover {
  background: var(--surface-inverse-hover);
}
</style>
