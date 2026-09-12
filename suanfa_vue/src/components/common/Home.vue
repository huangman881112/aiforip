<script setup>
// Home组件逻辑
import { getAlgorithmById } from '../../data/algorithms'

// 特色内容：复杂度对比表（数据驱动，从单一数据源取）
const complexityCompareRows = [
  'bubble-sort',
  'quick-sort',
  'merge-sort',
  'binary-search',
].map((id) => getAlgorithmById(id)).filter(Boolean)
</script>

<template>
  <div class="home-container">
    <section class="hero">
      <h1>探索计算机算法的奥秘</h1>
      <p>从基础到进阶，全面学习各类算法的原理、实现和应用场景</p>
      <router-link to="/algorithms/sorting" class="btn-primary">开始学习</router-link>
    </section>

    <section class="algorithm-categories">
      <h2>算法分类概览</h2>
      <div class="category-grid">
    <div class="category-card">
          <h3>排序算法</h3>
          <p>比较类排序（冒泡、选择、插入、希尔、归并、快速、堆排序）和非比较类排序（计数、桶、基数排序）</p>
          <router-link to="/algorithms/sorting">查看详情</router-link>
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
          <p>线性 DP（爬楼梯、最大子数组和、LIS）、背包（0/1 与完全）、字符串 DP（LCS、编辑距离）与区间 DP（矩阵链乘）</p>
          <router-link to="/algorithms/dp">查看详情</router-link>
        </div>
        <div class="category-card">
          <h3>贪心算法</h3>
          <p>活动选择、分数背包、哈夫曼编码，以及「贪心什么时候会失败」的找零反例</p>
          <router-link to="/algorithms/greedy">查看详情</router-link>
        </div>
        <div class="category-card disabled-card">
          <h3>更多分类</h3>
          <p>分治算法、数学与数论算法、字符串匹配、数据结构专题等</p>
          <span class="card-disabled">敬请期待</span>
        </div>
      </div>
    </section>

    <section class="learning-tools">
      <h2>学习工具</h2>
      <div class="category-grid">
        <div class="category-card">
          <h3>🏋️ 算法训练</h3>
          <p>经典题单 + 分级提示 + 参考解答，学完算法来实战，跟踪通过状态。</p>
          <router-link to="/training">去刷题</router-link>
        </div>
        <div class="category-card">
          <h3>📅 学习日历</h3>
          <p>标记进度、写笔记、评论、刷题都会记录为学习活跃，看看你的连续学习天数。</p>
          <router-link to="/calendar">查看日历</router-link>
        </div>
        <div class="category-card">
          <h3>🤖 AI 助教</h3>
          <p>原理讲解、复杂度分析、刷题思路引导，随时向 AI 算法助教提问。</p>
          <router-link to="/ai">开始对话</router-link>
        </div>
        <div class="category-card">
          <h3>💬 算法评论</h3>
          <p>在每个算法详情页与同学们交流学习心得、答疑补充。</p>
          <router-link to="/algorithms/sorting">去讨论</router-link>
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
                <tr v-for="algorithm in complexityCompareRows" :key="algorithm.id">
                  <td>{{ algorithm.name }}</td>
                  <td>{{ algorithm.complexity }}</td>
                  <td>{{ algorithm.complexityDetails.space }}</td>
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
  background-image: linear-gradient(135deg, var(--brand-700), var(--brand-500));
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
  background-color: var(--surface-inverse);
  color: var(--text-on-inverse);
  padding: 12px 24px;
  border-radius: 4px;
  font-weight: bold;
  text-decoration: none;
  transition: all 0.3s;
}

.btn-primary:hover {
  background-color: var(--surface-inverse-hover);
  transform: translateY(-2px);
}

.algorithm-categories, .learning-tools, .featured-content {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto 40px;
}

.algorithm-categories h2, .learning-tools h2, .featured-content h2 {
  text-align: center;
  margin-bottom: 30px;
  color: var(--text-1);
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 25px;
}

.category-card {
  padding: 25px;
  border: 1px solid var(--border-1);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
  transition: all 0.3s;
}

.category-card:hover {
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.5);
  transform: translateY(-5px);
}

.category-card h3 {
  color: var(--c-blue);
  margin-top: 0;
  margin-bottom: 15px;
}

.category-card p {
  color: var(--text-2);
  margin-bottom: 20px;
}

.category-card a {
  color: var(--c-green);
  text-decoration: none;
  font-weight: 500;
}

.category-card a:hover {
  text-decoration: underline;
}

.disabled-card {
  opacity: 0.6;
}

.card-disabled {
  color: var(--text-3);
  cursor: not-allowed;
  font-weight: 500;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 30px;
}

.feature-item {
  padding: 25px;
  background-color: var(--surface-muted);
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.5);
}

.feature-item h3 {
  color: var(--text-1);
  margin-top: 0;
  margin-bottom: 15px;
}

.feature-item p {
  color: var(--text-2);
  margin-bottom: 20px;
}

.complexity-table table {
  width: 100%;
  border-collapse: collapse;
}

.complexity-table th, .complexity-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid var(--border-1);
}

.complexity-table th {
  background-color: var(--surface-2);
  font-weight: bold;
}

.visualization-example {
  height: 200px;
  background-color: var(--surface-2);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 4px;
  color: var(--text-2);
}
</style>