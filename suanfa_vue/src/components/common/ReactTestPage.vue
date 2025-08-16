<script setup>
import { defineAsyncComponent } from 'vue'
// 异步加载React包装组件
const ReactWrapper = defineAsyncComponent(() => import('../ReactWrapper.vue'))
</script>

<template>
  <div class="react-test-page-container">
    <h2>React 组件集成测试</h2>
    <p>这个页面展示了如何在Vue项目中集成React组件。</p>
    <div class="react-component-container">
      <ReactWrapper />
    </div>
  </div>
</template>

<style scoped>
.react-test-page-container {
  padding: 20px;
}

.react-component-container {
  margin-top: 30px;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>