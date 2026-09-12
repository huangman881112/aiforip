// ============================================================
// 算法可视化组件注册表：algorithm id -> 懒加载组件
// 统一详情页按 id 动态挂载对应的可视化组件
// ============================================================
import { defineAsyncComponent } from 'vue'

const loaders = {
  'bubble-sort': () => import('./sorting_algorithms/BubbleSortDetail.vue'),
  'selection-sort': () => import('./sorting_algorithms/SelectionSortDetail.vue'),
  'insertion-sort': () => import('./sorting_algorithms/InsertionSortDetail.vue'),
  'shell-sort': () => import('./sorting_algorithms/ShellSortDetail.vue'),
  'merge-sort': () => import('./sorting_algorithms/MergeSortDetail.vue'),
  'quick-sort': () => import('./sorting_algorithms/QuickSortDetail.vue'),
  'heap-sort': () => import('./sorting_algorithms/HeapSortDetail.vue'),
  'counting-sort': () => import('./sorting_algorithms/CountingSortDetail.vue'),
  'bucket-sort': () => import('./sorting_algorithms/BucketSortDetail.vue'),
  'radix-sort': () => import('./sorting_algorithms/RadixSortDetail.vue'),
  'linear-search': () => import('./searching_algorithms/LinearSearchDetail.vue'),
  'binary-search': () => import('./searching_algorithms/BinarySearchDetail.vue'),
  'interpolation-search': () => import('./searching_algorithms/InterpolationSearchDetail.vue'),
  'jump-search': () => import('./searching_algorithms/JumpSearchDetail.vue'),
  'exponential-search': () => import('./searching_algorithms/ExponentialSearchDetail.vue'),
  'hashing-search': () => import('./searching_algorithms/HashingSearchDetail.vue'),
  dfs: () => import('./graph_algorithms/DFSDetail.vue'),
  bfs: () => import('./graph_algorithms/BFSDetail.vue'),
  dijkstra: () => import('./graph_algorithms/DijkstraDetail.vue'),
  'bellman-ford': () => import('./graph_algorithms/BellmanFordDetail.vue'),
  'floyd-warshall': () => import('./graph_algorithms/FloydWarshallDetail.vue'),
  astar: () => import('./graph_algorithms/AStarDetail.vue'),
  prim: () => import('./graph_algorithms/PrimDetail.vue'),
  kruskal: () => import('./graph_algorithms/KruskalDetail.vue'),
  'ford-fulkerson': () => import('./graph_algorithms/FordFulkersonDetail.vue'),
  'edmonds-karp': () => import('./graph_algorithms/EdmondsKarpDetail.vue'),
  'topological-sort': () => import('./graph_algorithms/TopologicalSortDetail.vue'),
  // 动态规划：一张通用 DP 表，按题目 id 取 data/dpProblems.js 里的求解器生成步骤
  'climbing-stairs': () => import('./dp_algorithms/DpTableViz.vue'),
  'max-subarray': () => import('./dp_algorithms/DpTableViz.vue'),
  lis: () => import('./dp_algorithms/DpTableViz.vue'),
  'knapsack-01': () => import('./dp_algorithms/DpTableViz.vue'),
  'complete-knapsack': () => import('./dp_algorithms/DpTableViz.vue'),
  lcs: () => import('./dp_algorithms/DpTableViz.vue'),
  'edit-distance': () => import('./dp_algorithms/DpTableViz.vue'),
  'matrix-chain': () => import('./dp_algorithms/DpTableViz.vue'),
  // 贪心算法：活动选择/分数背包/找零共用决策动画，哈夫曼单独建树
  'activity-selection': () => import('./greedy_algorithms/GreedyViz.vue'),
  'fractional-knapsack': () => import('./greedy_algorithms/GreedyViz.vue'),
  'coin-change-greedy': () => import('./greedy_algorithms/GreedyViz.vue'),
  'huffman-coding': () => import('./greedy_algorithms/HuffmanViz.vue'),
}

const cache = new Map()

export function hasViz(id) {
  return id in loaders
}

export function getVizComponent(id) {
  if (!(id in loaders)) return null
  if (!cache.has(id)) cache.set(id, defineAsyncComponent(loaders[id]))
  return cache.get(id)
}
