<script setup>
// 实现与编译原理子页：/languages/:lang/compile
// 一句话摘要 + 编译流水线 + 深入长文（Markdown），数据来自 data/languages.js。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLanguageById } from '../../../data/languages.js'
import MarkdownBlock from '../../common/MarkdownBlock.vue'

const route = useRoute()

// 当前语言（未知 id 由父级布局重定向，这里兜底回落到 java）
const lang = computed(() => getLanguageById(route.params.lang) || getLanguageById('java'))
</script>

<template>
  <section class="lang-module">
    <h2 class="page-section-title"><span class="pst-icon">⚙️</span>实现与编译原理</h2>
    <div class="overview">
      <div class="overview-grid">
        <article class="overview-block">
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
      </div>

      <!-- 深入：编译原理长文 -->
      <div class="card-panel overview-detail">
        <MarkdownBlock :source="lang.overview.compile.detail" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.overview {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.overview-grid {
  display: grid;
  grid-template-columns: 1fr;
}

.overview-block {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 16px 18px;
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
</style>
