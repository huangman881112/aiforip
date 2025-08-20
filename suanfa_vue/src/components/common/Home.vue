<script setup>
// Home组件逻辑
</script>

<template>
  <div class="home-container">
    <section class="hero">
      <h1>探索计算机算法的奥秘</h1>
      <p>从基础到进阶，全面学习各类算法的原理、实现和应用场景</p>
      <router-link to="/algorithms" class="btn-primary">开始学习</router-link>
    </section>

    <section class="algorithm-categories">
      <h2>算法分类概览</h2>
      <div class="category-grid">
    <div class="category-card">
          <h3>排序算法</h3>
          <p>比较类排序（冒泡、选择、插入、希尔、归并、快速、堆排序）和非比较类排序（计数、桶、基数排序）</p>
          <router-link to="/algorithms">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>搜索与查找算法</h3>
          <p>线性查找、二分查找、插值查找、跳表查找、指数查找和哈希查找</p>
          <router-link to="/algorithms/searching">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>图算法</h3>
          <p>DFS、BFS、最短路径算法、最小生成树、网络流和拓扑排序算法</p>
          <router-link to="/algorithms/graph">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>动态规划</h3>
          <p>背包问题、最长公共子序列、最长递增子序列、编辑距离和矩阵链乘</p>
          <router-link to="/algorithms">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>贪心算法</h3>
          <p>活动选择问题、霍夫曼编码、最小生成树和分数背包问题</p>
          <router-link to="/algorithms">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>更多分类</h3>
          <p>分治算法、数学与数论算法、字符串算法、机器学习算法等</p>
          <router-link to="/algorithms">查看详情</router-link>
        </div>
      </div>
    </section>

    <section class="featured-content">
      <h2>特色内容</h2>
      <div class="feature-grid">
        <div class="feature-item">
          <h3>算法复杂度比较</h3>
          <p>了解不同算法在时间和空间上的性能差异，选择最适合特定问题的算法。</p>
          <div class="complexity-table">
            <table>
              <thead>
                <tr>
                  <th>算法</th>
                  <th>时间复杂度</th>
                  <th>空间复杂度</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>冒泡排序</td>
                  <td>O(n²)</td>
                  <td>O(1)</td>
                </tr>
                <tr>
                  <td>快速排序</td>
                  <td>O(n log n)</td>
                  <td>O(log n)</td>
                </tr>
                <tr>
                  <td>归并排序</td>
                  <td>O(n log n)</td>
                  <td>O(n)</td>
                </tr>
                <tr>
                  <td>二分查找</td>
                  <td>O(log n)</td>
                  <td>O(1)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="feature-item">
          <h3>算法可视化</h3>
          <p>通过交互式可视化理解算法的工作原理和执行过程。</p>
          <div class="visualization-example">
            <p>排序算法可视化示例</p>
            <p>(实际项目中将包含交互式动画)</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.home-container {
  padding: 0;
  margin: 0;
  width: 100%;
}

.hero {
  background-color: #1e88e5;
  color: white;
  padding: 60px 20px;
  text-align: center;
  margin-bottom: 40px;
}

.hero h1 {
  font-size: 2.5rem;
  margin-bottom: 15px;
}

.hero p {
  font-size: 1.2rem;
  margin-bottom: 30px;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
}

.btn-primary {
  background-color: white;
  color: #1e88e5;
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-color: #f0f0f0;
  transform: translateY(-2px);
}

.algorithm-categories, .featured-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto 40px;
}

.algorithm-categories h2, .featured-content h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.category-card {
  padding: 25px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
}

.category-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  transform: translateY(-5px);
}

.category-card h3 {
  color: #1e88e5;
  margin-top: 0;
  margin-bottom: 15px;
}

.category-card p {
  color: #666;
  margin-bottom: 20px;
}

.category-card a {
  color: #42b983;
  text-decoration: none;
  font-weight: 500;
}

.category-card a:hover {
  text-decoration: underline;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-item {
  padding: 25px;
  background-color: #f9f9f9;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.feature-item h3 {
  color: #333;
  margin-top: 0;
  margin-bottom: 15px;
}

.feature-item p {
  color: #666;
  margin-bottom: 20px;
}

.complexity-table table {
  width: 100%;
  border-collapse: collapse;
}

.complexity-table th, .complexity-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #e0e0e0;
}

.complexity-table th {
  background-color: #f0f0f0;
  font-weight: bold;
}

.visualization-example {
  height: 200px;
  background-color: #e0e0e0;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  color: #666;
}
</style>