<script setup>
// 语法基础 / 数据结构 / 常用架构 三个板块共用的 Markdown 子页：
// /languages/:lang/syntax、/languages/:lang/data-structures、/languages/:lang/architecture
// 三个路由复用本组件，按路由名映射到 data/languages.js 里的板块 key。
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { getLanguageById, languageSections } from '../../../data/languages.js'
import MarkdownBlock from '../../common/MarkdownBlock.vue'

const route = useRoute()

// 当前语言（未知 id 由父级布局重定向，这里兜底回落到 java）
const lang = computed(() => getLanguageById(route.params.lang) || getLanguageById('java'))

// 路由名 → 板块 key（与 router/index.js 中三个子路由一一对应）
const nameToKey = {
  LanguageSyntax: 'syntax',
  LanguageDataStructures: 'dataStructures',
  LanguageArchitecture: 'architecture',
}

// 当前板块元信息（标题 + 图标）
const section = computed(() => languageSections.find((s) => s.key === nameToKey[route.name]))
</script>

<template>
  <section v-if="section" class="lang-module">
    <h2 class="page-section-title"><span class="pst-icon">{{ section.icon }}</span>{{ section.label }}</h2>
    <div class="section-content card-panel">
      <MarkdownBlock :source="lang.sections[section.key]" />
    </div>
  </section>
</template>

<style scoped>
.section-content {
  margin-bottom: 6px;
}
</style>
