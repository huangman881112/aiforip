import { createRouter, createWebHistory } from 'vue-router'

// 导入组件
const Home = () => import('../components/common/Home.vue')
const About = () => import('../components/common/About.vue')
// AlgorithmList 组件已删除，使用 SortingPage 替代
const SortingPage = () => import('../components/algorithms/sorting_algorithms/SortingPage.vue')
const SimpleBubbleSort = () => import('../components/algorithms/sorting_algorithms/SimpleBubbleSort.vue')
// 导入排序详情页组件
const InsertionSortDetail = () => import('../components/algorithms/sorting_algorithms/InsertionSortDetail.vue')
const SelectionSortDetail = () => import('../components/algorithms/sorting_algorithms/SelectionSortDetail.vue')
// 导入搜索算法页面组件
const SearchingPage = () => import('../components/algorithms/searching_algorithms/SearchingPage.vue')
// 导入搜索详情页组件
const LinearSearchDetail = () => import('../components/algorithms/searching_algorithms/LinearSearchDetail.vue')
const BinarySearchDetail = () => import('../components/algorithms/searching_algorithms/BinarySearchDetail.vue')
const InterpolationSearchDetail = () => import('../components/algorithms/searching_algorithms/InterpolationSearchDetail.vue')
// 导入任务导出组件
const TaskExportComponent = () => import('../components/common/TaskExportComponent.vue')
const JumpSearchDetail = () => import('../components/algorithms/searching_algorithms/JumpSearchDetail.vue')
const ExponentialSearchDetail = () => import('../components/algorithms/searching_algorithms/ExponentialSearchDetail.vue')
const HashingSearchDetail = () => import('../components/algorithms/searching_algorithms/HashingSearchDetail.vue')
// 导入图算法页面组件
const GraphPage = () => import('../components/algorithms/graph_algorithms/GraphPage.vue')
// 导入图算法详情页组件
const BFSDetail = () => import('../components/algorithms/graph_algorithms/BFSDetail.vue')
const DijkstraDetail = () => import('../components/algorithms/graph_algorithms/DijkstraDetail.vue')
const PrimDetail = () => import('../components/algorithms/graph_algorithms/PrimDetail.vue')
const AStarDetail = () => import('../components/algorithms/graph_algorithms/AStarDetail.vue')
const DFSDetail = () => import('../components/algorithms/graph_algorithms/DFSDetail.vue')
const KruskalDetail = () => import('../components/algorithms/graph_algorithms/KruskalDetail.vue')
// 导入排序详情页组件
const BubbleSortDetail = () => import('../components/algorithms/sorting_algorithms/BubbleSortDetail.vue')
const QuickSortDetail = () => import('../components/algorithms/sorting_algorithms/QuickSortDetail.vue')
const MergeSortDetail = () => import('../components/algorithms/sorting_algorithms/MergeSortDetail.vue')
const HeapSortDetail = () => import('../components/algorithms/sorting_algorithms/HeapSortDetail.vue')
const ShellSortDetail = () => import('../components/algorithms/sorting_algorithms/ShellSortDetail.vue')
const CountingSortDetail = () => import('../components/algorithms/sorting_algorithms/CountingSortDetail.vue')
const BucketSortDetail = () => import('../components/algorithms/sorting_algorithms/BucketSortDetail.vue')
const RadixSortDetail = () => import('../components/algorithms/sorting_algorithms/RadixSortDetail.vue')
// 导入图算法详情页组件
const BellmanFordDetail = () => import('../components/algorithms/graph_algorithms/BellmanFordDetail.vue')
const FloydWarshallDetail = () => import('../components/algorithms/graph_algorithms/FloydWarshallDetail.vue')
const TopologicalSortDetail = () => import('../components/algorithms/graph_algorithms/TopologicalSortDetail.vue')

// 定义路由
const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/algorithms',
    name: 'AlgorithmList',
    redirect: '/algorithms/sorting'
  },
  {
    path: '/algorithms/sorting',
    name: 'SortingPage',
    component: SortingPage
  },
  {
    path: '/algorithms/sorting/simple-bubble-sort',
    name: 'SimpleBubbleSort',
    component: SimpleBubbleSort
  },
  {
    path: '/algorithms/sorting/bubble-sort',
    name: 'BubbleSortDetail',
    component: BubbleSortDetail
  },
  {
    path: '/algorithms/sorting/quick-sort',
    name: 'QuickSortDetail',
    component: QuickSortDetail
  },
  {
    path: '/algorithms/sorting/merge-sort',
    name: 'MergeSortDetail',
    component: MergeSortDetail
  },
  {
    path: '/algorithms/sorting/heap-sort',
    name: 'HeapSortDetail',
    component: HeapSortDetail
  },
  {
    path: '/algorithms/sorting/shell-sort',
    name: 'ShellSortDetail',
    component: ShellSortDetail
  },
  {
    path: '/algorithms/sorting/counting-sort',
    name: 'CountingSortDetail',
    component: CountingSortDetail
  },
  {
    path: '/algorithms/sorting/bucket-sort',
    name: 'BucketSortDetail',
    component: BucketSortDetail
  },
  {
    path: '/algorithms/sorting/radix-sort',
    name: 'RadixSortDetail',
    component: RadixSortDetail
  },
  {
    path: '/algorithms/sorting/insertion-sort',
    name: 'InsertionSortDetail',
    component: InsertionSortDetail
  },
  {
    path: '/algorithms/sorting/selection-sort',
    name: 'SelectionSortDetail',
    component: SelectionSortDetail
  },
  {
    path: '/algorithms/graph',
    name: 'GraphPage',
    component: GraphPage
  },
  {
    path: '/algorithms/graph/bfs',
    name: 'BFSDetail',
    component: BFSDetail
  },
  {
    path: '/algorithms/graph/dijkstra',
    name: 'DijkstraDetail',
    component: DijkstraDetail
  },
  {
    path: '/algorithms/graph/prim',
    name: 'PrimDetail',
    component: PrimDetail
  },
  {
    path: '/algorithms/graph/astar',
    name: 'AStarDetail',
    component: AStarDetail
  },
  {
    path: '/algorithms/graph/dfs',
    name: 'DFSDetail',
    component: DFSDetail
  },
  {
    path: '/algorithms/graph/kruskal',
    name: 'KruskalDetail',
    component: KruskalDetail
  },
  {
    path: '/algorithms/graph/edmonds-karp',
    name: 'EdmondsKarpDetail',
    component: () => import('../components/algorithms/graph_algorithms/EdmondsKarpDetail.vue')
  },
  {
    path: '/algorithms/graph/ford-fulkerson',
    name: 'FordFulkersonDetail',
    component: () => import('../components/algorithms/graph_algorithms/FordFulkersonDetail.vue')
  },
  {
    path: '/algorithms/graph/bellman-ford',
    name: 'BellmanFordDetail',
    component: BellmanFordDetail
  },
  {
    path: '/algorithms/graph/floyd-warshall',
    name: 'FloydWarshallDetail',
    component: FloydWarshallDetail
  },
  {
    path: '/algorithms/graph/topological-sort',
    name: 'TopologicalSortDetail',
    component: TopologicalSortDetail
  },
  // 搜索算法相关路由
  {
    path: '/algorithms/searching',
    name: 'SearchingPage',
    component: SearchingPage
  },
  {
    path: '/algorithms/searching/linear-search',
    name: 'LinearSearchDetail',
    component: LinearSearchDetail
  },
  {
    path: '/algorithms/searching/binary-search',
    name: 'BinarySearchDetail',
    component: BinarySearchDetail
  },
  {
    path: '/algorithms/searching/interpolation-search',
    name: 'InterpolationSearchDetail',
    component: InterpolationSearchDetail
  },
  {
    path: '/algorithms/searching/jump-search',
    name: 'JumpSearchDetail',
    component: JumpSearchDetail
  },
  {
    path: '/algorithms/searching/exponential-search',
    name: 'ExponentialSearchDetail',
    component: ExponentialSearchDetail
  },
  {
    path: '/algorithms/searching/hashing-search',
    name: 'HashingSearchDetail',
    component: HashingSearchDetail
  },
  {
    path: '/task-export',
    name: 'TaskExport',
    component: TaskExportComponent
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导出路由实例
export default router