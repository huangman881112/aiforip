import { createRouter, createWebHistory } from 'vue-router'

// 导入组件
const Home = () => import('../components/common/Home.vue')
const About = () => import('../components/common/About.vue')
// AlgorithmList 组件已删除，使用 SortingPage 替代
const SortingPage = () => import('../components/algorithms/sorting_algorithms/SortingPage.vue')
const ReactTestPage = () => import('../components/common/ReactTestPage.vue')
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
  {    path: '/algorithms',    name: 'AlgorithmList',    component: SortingPage  },
  {    path: '/algorithms/sorting/simple-bubble-sort',    name: 'SimpleBubbleSort',    component: SimpleBubbleSort  },
  {    path: '/algorithms/sorting/insertion-sort',    name: 'InsertionSortDetail',    component: InsertionSortDetail  },
  {    path: '/algorithms/sorting/selection-sort',    name: 'SelectionSortDetail',    component: SelectionSortDetail  },
  {    path: '/algorithms/sorting',    name: 'SortingPage',    component: SortingPage  },  
  // 图算法相关路由
  {    path: '/algorithms/graph',    name: 'GraphPage',    component: GraphPage  },
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
  },
  {
    path: '/react-test',
    name: 'ReactTestPage',
    component: ReactTestPage
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 导出路由实例
export default router