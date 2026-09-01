<script setup>
// 图算法页面组件
import { ref, computed, nextTick } from 'vue'
// 导入DFS详情组件
import DFSDetail from './DFSDetail.vue'
// 导入BFS详情组件
import BFSDetail from './BFSDetail.vue'
// 导入Dijkstra详情组件
import DijkstraDetail from './DijkstraDetail.vue'
// 导入Bellman-Ford详情组件
import BellmanFordDetail from './BellmanFordDetail.vue'
// 导入Floyd-Warshall详情组件
import FloydWarshallDetail from './FloydWarshallDetail.vue'
// 导入A*算法详情组件
import AStarDetail from './AStarDetail.vue'
// 导入Prim算法详情组件
import PrimDetail from './PrimDetail.vue'
// 导入Kruskal算法详情组件
import KruskalDetail from './KruskalDetail.vue'
// 导入Ford-Fulkerson算法详情组件
import FordFulkersonDetail from './FordFulkersonDetail.vue'
// 导入Edmonds-Karp算法详情组件
import EdmondsKarpDetail from './EdmondsKarpDetail.vue'
// 导入拓扑排序算法详情组件
import TopologicalSortDetail from './TopologicalSortDetail.vue'
// 单一数据源
import { graphAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

// 当前选中的算法ID（语义 id，如 'dfs'）
const selectedAlgorithm = ref(null)

// 滚动到详情区域
const scrollToDetail = () => {
  // 直接显示详情区域，不依赖滚动
  const showDetail = () => {
    const detailElement = document.querySelector('.detail-container');
    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 确保元素可见
      detailElement.style.display = 'block';
      detailElement.style.visibility = 'visible';
      detailElement.style.opacity = '1';
    } else {
      console.error('未找到算法详情元素');
    }
  };

  // 强制重绘后执行
  nextTick(showDetail);
}

// 分类标签
const categories = [
  { id: 'all', name: '全部算法' },
  { id: 'traversal', name: '图遍历' },
  { id: 'shortest-path', name: '最短路径' },
  { id: 'mst', name: '最小生成树' },
  { id: 'network-flow', name: '网络流' },
  { id: 'topology', name: '拓扑结构' }
]

// 当前选中的分类
const currentCategory = ref('all')

// 筛选算法
const filteredAlgorithms = computed(() => {
  if (currentCategory.value === 'all') {
    return graphAlgorithms
  } else if (currentCategory.value === 'traversal') {
    return graphAlgorithms.filter(algo => algo.subCategory === '图遍历')
  } else if (currentCategory.value === 'shortest-path') {
    return graphAlgorithms.filter(algo => algo.subCategory === '最短路径')
  } else if (currentCategory.value === 'mst') {
    return graphAlgorithms.filter(algo => algo.subCategory === '最小生成树')
  } else if (currentCategory.value === 'network-flow') {
    return graphAlgorithms.filter(algo => algo.subCategory === '网络流')
  } else if (currentCategory.value === 'topology') {
    return graphAlgorithms.filter(algo => algo.subCategory === '拓扑结构')
  }
  return graphAlgorithms
})
</script>

<template>
  <div class="graph-page-container">
    <h1>图算法</h1>
    <p class="page-description">
      图算法是用于解决图结构相关问题的算法。图是由顶点和边组成的数据结构，广泛应用于计算机网络、社交网络、路由算法等领域。以下是常见的图算法分类和实现。
    </p>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ 'active': currentCategory === category.id }"
        @click="currentCategory = category.id"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 算法卡片容器 -->
    <div class="algorithms-grid">
      <div v-for="algorithm in filteredAlgorithms" :key="algorithm.id" :class="['algorithm-card', { 'selected': selectedAlgorithm === algorithm.id }]" @click="selectedAlgorithm = algorithm.id">
        <div class="card-header">
          <h3>{{ algorithm.name }}</h3>
          <div class="tags-container">
            <span class="tag difficulty-tag">{{ algorithm.difficulty }}</span>
            <span class="tag category-tag">{{ algorithm.subCategory }}</span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity">{{ algorithm.complexity }}</span>
          <ProgressMark :algorithm-id="algorithm.id" />
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 算法详情区域 -->
    <div v-if="selectedAlgorithm !== null" class="algorithm-detail">
      
      <div class="detail-content">
        <!-- 深度优先搜索详情 -->
        <DFSDetail v-if="selectedAlgorithm === 'dfs'" @close="selectedAlgorithm = null" />
        <!-- 广度优先搜索详情 -->
        <BFSDetail v-else-if="selectedAlgorithm === 'bfs'" @close="selectedAlgorithm = null" class="bfs-detail" />
        <!-- Dijkstra算法详情 -->
        <DijkstraDetail v-else-if="selectedAlgorithm === 'dijkstra'" @close="selectedAlgorithm = null" class="dijkstra-detail" />
      <!-- Bellman-Ford算法详情 -->
      <BellmanFordDetail v-else-if="selectedAlgorithm === 'bellman-ford'" @close="selectedAlgorithm = null" class="bellman-ford-detail" />
      <!-- Floyd-Warshall算法详情 -->
      <FloydWarshallDetail v-else-if="selectedAlgorithm === 'floyd-warshall'" @close="selectedAlgorithm = null" class="floyd-warshall-detail" />
      <!-- A*算法详情 -->
      <AStarDetail v-else-if="selectedAlgorithm === 'astar'" @close="selectedAlgorithm = null" class="a-star-detail" />
      <!-- Prim算法详情 -->
      <PrimDetail v-else-if="selectedAlgorithm === 'prim'" @close="selectedAlgorithm = null" class="prim-detail" />
      <!-- Kruskal算法详情 -->
      <KruskalDetail v-else-if="selectedAlgorithm === 'kruskal'" @close="selectedAlgorithm = null" class="kruskal-detail" />
      <!-- Ford-Fulkerson算法详情 -->
      <FordFulkersonDetail v-else-if="selectedAlgorithm === 'ford-fulkerson'" @close="selectedAlgorithm = null" class="ford-fulkerson-detail" />
      <!-- Edmonds-Karp算法详情 -->
      <EdmondsKarpDetail v-else-if="selectedAlgorithm === 'edmonds-karp'" @close="selectedAlgorithm = null" class="edmonds-karp-detail" />
      <!-- 拓扑排序算法详情 -->
      <TopologicalSortDetail v-else-if="selectedAlgorithm === 'topological-sort'" @close="selectedAlgorithm = null" class="topological-sort-detail" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 引入公共样式文件 */
@import '../sorting_algorithms/common-algorithm-page.css';

/* 分类标签样式 */
.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.category-tabs button {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-tabs button.active {
  background-color: #42b983;
  color: white;
}

/* 卡片底部样式调整 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.complexity {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}

/* 详情按钮样式 */
.detail-btn {
  padding: 6px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.detail-btn:hover {
  background-color: #389e70;
}

/* 算法卡片标签样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-tag {
  background-color: #e6f7ff;
  color: #1890ff;
}

.category-tag {
  background-color: #fff7e6;
  color: #faad14;
}
</style>