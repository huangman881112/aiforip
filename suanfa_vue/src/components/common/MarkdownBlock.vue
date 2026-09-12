<script setup>
// Markdown 渲染块：marked 解析 + DOMPurify 消毒
import { computed } from 'vue'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

const props = defineProps({
  source: {
    type: String,
    default: '',
  },
})

const html = computed(() => DOMPurify.sanitize(marked.parse(props.source || '')))
</script>

<template>
  <div class="markdown-content" v-html="html"></div>
</template>

<style scoped>
.markdown-content {
  text-align: left;
  line-height: 1.8;
}

.markdown-content :deep(h3),
.markdown-content :deep(h4) {
  margin: 1.2em 0 0.6em;
  color: var(--text-1);
}

.markdown-content :deep(h3:first-child) {
  margin-top: 0;
}

.markdown-content :deep(p) {
  margin: 0.6em 0;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  padding-left: 1.6em;
  margin: 0.6em 0;
}

.markdown-content :deep(code) {
  padding: 2px 6px;
  font-family: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
  font-size: 0.88em;
  background: var(--surface-2);
  border-radius: 4px;
}

.markdown-content :deep(pre) {
  padding: 14px 16px;
  overflow-x: auto;
  background: var(--code-bg);
  border-radius: 8px;
}

.markdown-content :deep(pre code) {
  padding: 0;
  color: #dce6f0;
  background: transparent;
}

.markdown-content :deep(table) {
  width: 100%;
  margin: 0.8em 0;
  border-collapse: collapse;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 6px 10px;
  border: 1px solid var(--border-1);
  text-align: left;
}

.markdown-content :deep(strong) {
  color: var(--text-1);
}
</style>
