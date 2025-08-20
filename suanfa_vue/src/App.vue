<script setup>
// 不需要导入ReactWrapper，因为我们会通过路由加载
</script>

<template style="height: 100%; width: 1980px">
  <div class="app-container">
    <header class="app-header">
      <div class="header-content">
        <h1><router-link to="/" class="logo">算法学习</router-link></h1>
        <nav class="app-nav">
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/algorithms/sorting" active-class="active-link">排序算法</router-link></li>
            <li><router-link to="/algorithms/searching" active-class="active-link">搜索算法</router-link></li>
            <li><router-link to="/algorithms/graph" active-class="active-link">图算法</router-link></li>
            <li><router-link to="/algorithms">动态规划</router-link></li>
            <li><router-link to="/algorithms">贪心算法</router-link></li>
            <li><router-link to="/algorithms">更多分类</router-link></li>
          </ul>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <router-view></router-view>
    </main>
    <footer class="app-footer">
      <div class="footer-content">
        <div class="footer-logo">
          <h3>算法学习</h3>
          <p>致力于提供高质量的算法学习资源，帮助开发者掌握各类算法的原理和应用。</p>
        </div>
        <div class="footer-links">
          <h4>快速链接</h4>
          <ul>
            <li><router-link to="/">首页</router-link></li>
            <li><router-link to="/algorithms">排序算法</router-link></li>
            <li><router-link to="/algorithms/searching">搜索算法</router-link></li>
            <li><router-link to="/algorithms">图算法</router-link></li>
            <li><router-link to="/about">关于我们</router-link></li>
          </ul>
        </div>
        <div class="footer-contact">
          <h4>联系我们</h4>
          <p>有任何问题或建议，请随时联系我们。</p>
          <!-- 这里可以添加社交媒体图标或联系方式 -->
        </div>
      </div>
      <div class="footer-copyright">
        <p>© 2023 算法学习网站. 保留所有权利.</p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  width: 100%;
}

.app-header {
  background-color: #ffffff;
  padding: 15px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  /* max-width: 1200px; */
  margin: 0;
  padding: 0 20px;
}

.logo {
  color: #1e88e5;
  text-decoration: none;
  font-size: 1.8rem;
  font-weight: bold;
  padding: -20px 0 0 20px;
}

.app-nav {
  margin: 0;
}

.app-nav ul {
  list-style-type: none;
  padding: 0;
  display: flex;
  gap: 15px;
}

.app-nav a {
  color: #333;
  text-decoration: none;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.app-nav a:hover {
  background-color: #1e88e5;
  color: white;
}

.app-nav a.active-link {
  background-color: #1e88e5;
  color: white;
}

.app-main {
  flex: 1;
  /* padding: 20px; */
  /* max-width: 1200px; */
  margin: 0 auto;
  width: 100%;
}

.app-footer {
  background-color: #282c34;
  color: white;
  padding: 40px 0 20px;
}

.footer-content {
  display: flex;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 20px;
  border-bottom: 1px solid #444;
}

.footer-logo,
.footer-links,
.footer-contact {
  flex: 1;
  margin-right: 30px;
}

.footer-logo h3 {
  font-size: 1.5rem;
  margin-bottom: 15px;
  color: #1e88e5;
}

.footer-logo p {
  color: #aaa;
  line-height: 1.6;
}

.footer-links h4,
.footer-contact h4 {
  margin-bottom: 15px;
  font-size: 1.1rem;
}

.footer-links ul {
  list-style-type: none;
  padding: 0;
}

.footer-links li {
  margin-bottom: 10px;
}

.footer-links a {
  color: #aaa;
  text-decoration: none;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: white;
}

.footer-contact p {
  color: #aaa;
  margin-bottom: 15px;
}

.footer-copyright {
  text-align: center;
  padding-top: 20px;
  color: #aaa;
  font-size: 0.9rem;
}

.vue-section,
.react-section {
  margin-bottom: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 4px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.1);
}

.app-footer {
  background-color: #282c34;
  padding: 15px;
  color: white;
  text-align: center;
}
</style>
