<script setup>
// 经典面试题子页：/languages/:lang/interview
// 折叠问答：默认全部收起，点击卡片展开参考答案（Markdown 渲染）。
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { getLanguageById } from '../../../data/languages.js'
import MarkdownBlock from '../../common/MarkdownBlock.vue'

const route = useRoute()

// 当前语言（未知 id 由父级布局重定向，这里兜底回落到 java）
const lang = computed(() => getLanguageById(route.params.lang) || getLanguageById('java'))

// 展开状态：默认全部收起，切换语言时重置
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
  <section class="lang-module">
    <h2 class="page-section-title"><span class="pst-icon">💼</span>经典面试题</h2>
    <p class="interview-tip">
      共 {{ lang.interview.length }} 道高频面试题，先自己想一想，再点击卡片查看参考答案。
    </p>
    <div class="interview-list">
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
    </div>
  </section>
</template>

<style scoped>
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

@media (max-width: 640px) {
  .interview-question {
    padding: 12px 14px;
  }

  .interview-answer {
    padding: 4px 14px 14px;
  }
}
</style>
