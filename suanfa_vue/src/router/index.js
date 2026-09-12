import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user.js'

// 导入组件
const Home = () => import('../components/common/Home.vue')
const About = () => import('../components/common/About.vue')
const Login = () => import('../components/common/Login.vue')
const ProgressPage = () => import('../components/common/ProgressPage.vue')
const CalendarPage = () => import('../components/common/CalendarPage.vue')
const TrainingPage = () => import('../components/common/TrainingPage.vue')
const AiChatPage = () => import('../components/common/AiChatPage.vue')
const SortingPage = () => import('../components/algorithms/sorting_algorithms/SortingPage.vue')
const SearchingPage = () => import('../components/algorithms/searching_algorithms/SearchingPage.vue')
const GraphPage = () => import('../components/algorithms/graph_algorithms/GraphPage.vue')
const DPPage = () => import('../components/algorithms/dp_algorithms/DPPage.vue')
const GreedyPage = () => import('../components/algorithms/greedy_algorithms/GreedyPage.vue')
const SimpleBubbleSort = () => import('../components/algorithms/sorting_algorithms/SimpleBubbleSort.vue')
const AlgorithmDetailPage = () => import('../components/algorithms/AlgorithmDetailPage.vue')

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
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { public: true }
  },
  {
    path: '/progress',
    name: 'ProgressPage',
    component: ProgressPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/calendar',
    name: 'CalendarPage',
    component: CalendarPage,
    meta: { requiresAuth: true }
  },
  {
    path: '/training',
    name: 'TrainingPage',
    component: TrainingPage
  },
  {
    path: '/ai',
    name: 'AiChatPage',
    component: AiChatPage
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
    path: '/algorithms/searching',
    name: 'SearchingPage',
    component: SearchingPage
  },
  {
    path: '/algorithms/graph',
    name: 'GraphPage',
    component: GraphPage
  },
  {
    path: '/algorithms/dp',
    name: 'DPPage',
    component: DPPage
  },
  {
    path: '/algorithms/greedy',
    name: 'GreedyPage',
    component: GreedyPage
  },
  {
    path: '/algorithms/sorting/simple-bubble-sort',
    name: 'SimpleBubbleSort',
    component: SimpleBubbleSort
  },
  // 统一算法详情页：/algorithms/:category/:id（静态路由优先级高于动态，simple-bubble-sort 不受影响）
  {
    path: '/algorithms/:category/:id',
    name: 'AlgorithmDetail',
    component: AlgorithmDetailPage
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：先恢复会话，再按 meta 判断是否需要登录
router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.init()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  if (to.meta.public && userStore.isLoggedIn && (to.name === 'Login')) {
    return { name: 'Home' }
  }
})

// 导出路由实例
export default router
