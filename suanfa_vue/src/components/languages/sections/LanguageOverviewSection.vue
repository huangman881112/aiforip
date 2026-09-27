<script setup>
// 语言概览子页：/languages/:lang（语言默认页）
// 元信息 / 语言特性 / 使用场景，数据全部来自 data/languages.js 单一数据源。
// 布局（页头 + 左侧导航）由父级 LanguageDetail.vue 提供，本组件只渲染板块内容。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLanguageById } from '../../../data/languages.js'

const route = useRoute()

// 当前语言（未知 id 由父级布局重定向，这里兜底回落到 java）
const lang = computed(() => getLanguageById(route.params.lang) || getLanguageById('java'))
</script>

<template>
  <section class="lang-module">
    <h2 class="page-section-title"><span class="pst-icon">🧭</span>语言概览</h2>
    <div class="overview">
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
          <h2><span class="ob-icon">🎯</span>使用场景</h2>
          <ul class="ob-list">
            <li v-for="u in lang.overview.useCases" :key="u.title">
              <strong>{{ u.title }}</strong>
              <span>{{ u.desc }}</span>
            </li>
          </ul>
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
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

@media (max-width: 640px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
