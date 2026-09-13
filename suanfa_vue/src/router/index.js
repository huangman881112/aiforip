import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user.js'

// 导入组件
const Home = () => import('../components/common/Home.vue')
const About = () => import('../components/common/About.vue')
const Login = () => import('../components/common/Login.vue')
const ProgressPage = () => import('../components/common/ProgressPage.vue')
const ChangePasswordPage = () => import('../components/common/ChangePasswordPage.vue')
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
const LanguageDetail = () => import('../components/languages/LanguageDetail.vue')
const UserManagePage = () => import('../components/common/UserManagePage.vue')

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
    // 个人中心→修改密码（admin 从顶部用户名子菜单展开进入），需登录
    path: '/account/password',
    name: 'ChangePassword',
    component: ChangePasswordPage,
    meta: { requiresAuth: true }
  },
  {
    // 用户管理（仅管理员）：requiresAdmin 在路由守卫里按 userStore.isAdmin 拦截，后端接口同样会 403
    path: '/admin/users',
    name: 'UserManage',
    component: UserManagePage,
    meta: { requiresAuth: true, requiresAdmin: true }
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
  },
  {
    // 计算机语言：总入口重定向到第一门语言
    path: '/languages',
    name: 'LanguageList',
    redirect: '/languages/java'
  },
  {
    // 语言详情页：语法 / 数据结构 / 常用架构 / 经典面试题，数据在 data/languages.js
    path: '/languages/:lang',
    name: 'LanguageDetail',
    component: LanguageDetail
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：先恢复会话，再按 meta 判断是否需要登录 / 是否需要管理员
router.beforeEach(async (to) => {
  const userStore = useUserStore()
  await userStore.init()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'Login', query: { redirect: to.fullPath } }
  }
  // 非管理员直访管理页：回首页（手输地址 / 收藏夹 / 权限被收掉后的旧标签页都会走到这里）
  if (to.meta.requiresAdmin && !userStore.isAdmin) {
    return { name: 'Home' }
  }
  if (to.meta.public && userStore.isLoggedIn && (to.name === 'Login')) {
    return { name: 'Home' }
  }
})

// 导出路由实例
export default router
