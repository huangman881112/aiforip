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

// 当前选中的算法ID
const selectedAlgorithm = ref(null)

// 滚动到详情区域
const scrollToDetail = () => {
  console.log('scrollToDetail called, selectedAlgorithm:', selectedAlgorithm.value);
  
  // 直接显示详情区域，不依赖滚动
  const showDetail = () => {
    console.log('尝试直接显示详情区域');
    // 确保selectedAlgorithm被正确设置
    let detailElement = null;
    
    switch(selectedAlgorithm.value) {
      case 1:
        detailElement = document.querySelector('.dfs-detail');
        break;
      case 2:
        detailElement = document.querySelector('.bfs-detail');
        break;
      case 3:
        detailElement = document.querySelector('.dijkstra-detail');
        break;
      case 4:
        detailElement = document.querySelector('.bellman-ford-detail');
        break;
      case 5:
        detailElement = document.querySelector('.floyd-warshall-detail');
        break;
      case 6:
        detailElement = document.querySelector('.a-star-detail');
        break;
      default:
        console.warn('未找到对应的算法详情元素');
        return;
    }
    
    if (detailElement) {
      console.log('找到算法详情元素，滚动到视图');
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      // 确保元素可见
      detailElement.style.display = 'block';
      detailElement.style.visibility = 'visible';
      detailElement.style.opacity = '1';
    } else {
      console.error('未找到算法详情元素');
      alert('无法找到算法详情区域，请尝试刷新页面或稍后再试。');
    }
  };

  // 强制重绘后执行
  nextTick(showDetail);
}

// 图算法数据
const graphAlgorithms = [
  {
    id: 1,
    name: '深度优先搜索(DFS)',
    difficulty: '简单',
    category: '图遍历',
    description: '深度优先搜索是一种用于遍历或搜索树或图的算法。它尽可能深地搜索树的分支，当节点v的所有边都已被探寻过，搜索将回溯到发现节点v的那条边的起始节点。',
    complexity: 'O(V + E)'
  },
  {
    id: 2,
    name: '广度优先搜索(BFS)',
    difficulty: '简单',
    category: '图遍历',
    description: '广度优先搜索是一种图形搜索算法。它从根节点开始，沿着树的宽度遍历树的节点。如果所有节点均被访问，则算法中止。',
    complexity: 'O(V + E)'
  },
  {
    id: 3,
    name: 'Dijkstra算法',
    difficulty: '中等',
    category: '最短路径',
    description: 'Dijkstra算法是一种用于寻找带权图中单源最短路径的算法。它以起点为中心，逐步向外扩展，每次选择距离起点最近的节点加入已访问集合。',
    complexity: 'O((V + E) log V)'
  },
  {
    id: 4,
    name: 'Bellman-Ford算法',
    difficulty: '中等',
    category: '最短路径',
    description: 'Bellman-Ford算法用于寻找带权图中单源最短路径，能够处理包含负权边的图，但不能处理包含负权环的图。',
    complexity: 'O(V * E)'
  },
  {
    id: 5,
    name: 'Floyd-Warshall算法',
    difficulty: '中等',
    category: '最短路径',
    description: 'Floyd-Warshall算法是一种用于寻找加权图中所有顶点对之间最短路径的动态规划算法。',
    complexity: 'O(V³)'
  },
  {
    id: 6,
    name: 'A*算法',
    difficulty: '较难',
    category: '最短路径',
    description: 'A*算法是一种启发式搜索算法，它结合了Dijkstra算法和贪心最佳优先搜索的优点，使用启发式函数来引导搜索方向。',
    complexity: 'O(E) 最坏情况 O(V²)'
  },
  {
    id: 7,
    name: 'Prim算法',
    difficulty: '中等',
    category: '最小生成树',
    description: 'Prim算法是一种用于构建加权无向图的最小生成树的贪心算法。它从一个顶点开始，每次选择与当前生成树相邻且权值最小的边加入生成树。',
    complexity: 'O(E log V)'
  },
  {
    id: 8,
    name: 'Kruskal算法',
    difficulty: '中等',
    category: '最小生成树',
    description: 'Kruskal算法是一种用于构建加权无向图的最小生成树的贪心算法。它按权值从小到大选择边，确保每次选择的边不会形成环。',
    complexity: 'O(E log E)'
  },
  {
    id: 9,
    name: 'Ford-Fulkerson算法',
    difficulty: '较难',
    category: '网络流',
    description: 'Ford-Fulkerson算法是一种用于计算网络最大流的贪心算法。它通过不断寻找增广路径来增加流量，直到没有增广路径为止。',
    complexity: 'O(E * F) F为最大流'
  },
  {
    id: 10,
    name: 'Edmonds-Karp算法',
    difficulty: '较难',
    category: '网络流',
    description: 'Edmonds-Karp算法是Ford-Fulkerson算法的一个特例，它使用广度优先搜索来寻找增广路径，时间复杂度更为稳定。',
    complexity: 'O(V * E²)'
  },
  {
    id: 11,
    name: '拓扑排序',
    difficulty: '中等',
    category: '拓扑结构',
    description: '拓扑排序是一种对有向无环图(DAG)中的顶点进行排序的算法，使得对于每条有向边(u, v)，顶点u在排序结果中都出现在顶点v之前。',
    complexity: 'O(V + E)'
  },
  {
    id: 12,
    name: 'Tarjan算法',
    difficulty: '较难',
    category: '拓扑结构',
    description: 'Tarjan算法用于寻找有向图中的强连通分量。它通过一次深度优先搜索就能找出所有的强连通分量。',
    complexity: 'O(V + E)'
  },
  {
    id: 13,
    name: 'Kosaraju算法',
    difficulty: '较难',
    category: '拓扑结构',
    description: 'Kosaraju算法用于寻找有向图中的强连通分量。它需要进行两次深度优先搜索，第一次在原图上进行，第二次在转置图上进行。',
    complexity: 'O(V + E)'
  }
]

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
    return graphAlgorithms.filter(algo => algo.category === '图遍历')
  } else if (currentCategory.value === 'shortest-path') {
    return graphAlgorithms.filter(algo => algo.category === '最短路径')
  } else if (currentCategory.value === 'mst') {
    return graphAlgorithms.filter(algo => algo.category === '最小生成树')
  } else if (currentCategory.value === 'network-flow') {
    return graphAlgorithms.filter(algo => algo.category === '网络流')
  } else if (currentCategory.value === 'topology') {
    return graphAlgorithms.filter(algo => algo.category === '拓扑结构')
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
            <span class="tag category-tag">{{ algorithm.category }}</span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity">{{ algorithm.complexity }}</span>
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 算法详情区域 -->
    <div v-if="selectedAlgorithm !== null" class="algorithm-detail">
      
      <div class="detail-content">
        <!-- 深度优先搜索详情 -->
        <DFSDetail v-if="selectedAlgorithm === 1" @close="selectedAlgorithm = null" />
        <!-- 广度优先搜索详情 -->
        <BFSDetail v-else-if="selectedAlgorithm === 2" @close="selectedAlgorithm = null" class="bfs-detail" />
        <!-- Dijkstra算法详情 -->
        <DijkstraDetail v-else-if="selectedAlgorithm === 3" @close="selectedAlgorithm = null" class="dijkstra-detail" />
      <!-- Bellman-Ford算法详情 -->
      <BellmanFordDetail v-else-if="selectedAlgorithm === 4" @close="selectedAlgorithm = null" class="bellman-ford-detail" />
      <!-- Floyd-Warshall算法详情 -->
      <FloydWarshallDetail v-else-if="selectedAlgorithm === 5" @close="selectedAlgorithm = null" class="floyd-warshall-detail" />
      <!-- A*算法详情 -->
      <AStarDetail v-else-if="selectedAlgorithm === 6" @close="selectedAlgorithm = null" class="a-star-detail" />
      <!-- 其他算法详情（待实现） -->
      <div v-else>
        <p>该算法的详细实现将在后续添加。</p>
      </div>
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