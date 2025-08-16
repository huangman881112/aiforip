<script setup>
// About组件逻辑
</script>

<template>
  <div class="about-container">
    <h2>关于算法可视化平台</h2>
    <p>算法可视化平台旨在通过直观的方式展示各种算法的工作原理，帮助用户更好地理解和学习算法。</p>
    <div class="about-section">
      <h3>平台特点</h3>
      <ul>
        <li>直观的算法可视化展示</li>
        <li>交互式学习体验</li>
        <li>多种算法分类</li>
        <li>详细的算法解释</li>
      </ul>
    </div>
    <div class="about-section">
      <h3>技术栈</h3>
      <ul>
        <li>Vue 3 - 前端框架</li>
        <li>React - 组件库</li>
        <li>Vite - 构建工具</li>
        <li>Vue Router - 路由管理</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.about-container {
  padding: 20px;
}

.about-section {
  margin-top: 30px;
}

.about-section h3 {
  color: #333;
  margin-bottom: 15px;
}

.about-section ul {
  list-style-type: disc;
  padding-left: 20px;
}

.about-section li {
  margin-bottom: 8px;
}
</style>