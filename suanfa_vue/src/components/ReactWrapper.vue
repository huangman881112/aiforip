<template>
  <div ref="reactContainer"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const reactContainer = ref(null)
let root = null

// 使用动态导入加载React和相关组件
onMounted(async () => {
  if (reactContainer.value) {
    try {
      // 动态导入React和ReactDOM
      const React = (await import('react')).default
      const ReactDOM = await import('react-dom/client')
      // 动态导入React测试组件
      const ReactTest = (await import('./ReactTest')).default

      // 创建React根节点并渲染React组件
      root = ReactDOM.createRoot(reactContainer.value)
      root.render(React.createElement(ReactTest))
    } catch (error) {
      console.error('Failed to load React components:', error)
    }
  }
})

onUnmounted(() => {
  // 组件卸载时清理React根节点
  if (root) {
    root.unmount()
  }
})
</script>

<style scoped>
/* 可以在这里添加React组件容器的样式 */
.react-container {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>