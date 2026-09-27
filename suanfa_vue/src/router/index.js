import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '../stores/user.js'

// 导入组件
const Home = () => import('../components/common/Home.vue')
const About = () => import('../components/common/About.vue')
const Login = () => import('../components/common/Login.vue')
const ProgressPage = () => import('../components/common/ProgressPage.vue')
const ChangePasswordPage = () => import('../components/common/ChangePasswordPage.vue')
const ChangeEmailPage = () => import('../components/common/ChangeEmailPage.vue')
const CalendarPage = () => import('../components/common/CalendarPage.vue')
const TrainingPage = () => import('../components/common/TrainingPage.vue')
const AiChatPage = () => import('../components/common/AiChatPage.vue')
const AiLanguageChatPage = () => import('../components/common/AiLanguageChatPage.vue')
const SortingPage = () => import('../components/algorithms/sorting_algorithms/SortingPage.vue')
const SearchingPage = () => import('../components/algorithms/searching_algorithms/SearchingPage.vue')
const GraphPage = () => import('../components/algorithms/graph_algorithms/GraphPage.vue')
const DPPage = () => import('../components/algorithms/dp_algorithms/DPPage.vue')
const GreedyPage = () => import('../components/algorithms/greedy_algorithms/GreedyPage.vue')
const SimpleBubbleSort = () => import('../components/algorithms/sorting_algorithms/SimpleBubbleSort.vue')
const AlgorithmListPage = () => import('../components/algorithms/AlgorithmListPage.vue')
const AlgorithmDetailPage = () => import('../components/algorithms/AlgorithmDetailPage.vue')
const LanguageListPage = () => import('../components/languages/LanguageListPage.vue')
const LanguageDetail = () => import('../components/languages/LanguageDetail.vue')
const LanguageOverviewSection = () => import('../components/languages/sections/LanguageOverviewSection.vue')
const LanguageCompileSection = () => import('../components/languages/sections/LanguageCompileSection.vue')
const LanguageSectionPage = () => import('../components/languages/sections/LanguageSectionPage.vue')
const LanguageInterviewSection = () => import('../components/languages/sections/LanguageInterviewSection.vue')
const UserManagePage = () => import('../components/common/UserManagePage.vue')
const MembershipPage = () => import('../components/common/MembershipPage.vue')
const AdminOrdersPage = () => import('../components/common/AdminOrdersPage.vue')
const ProfilePage = () => import('../components/common/ProfilePage.vue')

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
    // 个人中心→修改邮箱：新邮箱验证码 + 当前密码双重确认后换绑，需登录
    path: '/account/email',
    name: 'ChangeEmail',
    component: ChangeEmailPage,
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
    // 个人中心 → 个人信息（名称 / 性别 / 年龄 / 城市 / 职业 / 学习目的），需登录
    path: '/account/profile',
    name: 'Profile',
    component: ProfilePage,
    meta: { requiresAuth: true }
  },
  {
    // 会员中心（公开：未登录也能看价格表，下单时再引导登录）
    path: '/membership',
    name: 'Membership',
    component: MembershipPage
  },
  {
    // 订单管理（仅管理员）：全站订单 / 营收统计 / 手工确认支付与退款
    path: '/admin/orders',
    name: 'AdminOrders',
    component: AdminOrdersPage,
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
    // AI 计算机语言助教：与算法助教共用后端代理/限流/中转站配置，
    // 通过 scene=language 切换后端人设与语言知识库；支持 ?lang=java 预选语言、?ask= 直接提问
    path: '/ai/language',
    name: 'AiLanguageChatPage',
    component: AiLanguageChatPage
  },
  {
    // 算法总览页：每个分类一张卡片（组成 / 代表算法 / 应用），「算法训练」收在末尾；
    // 顶部导航「算法」直接链到本页，与 /languages 同一套模式（不再做下拉、不再 redirect 到 sorting）
    path: '/algorithms',
    name: 'AlgorithmList',
    component: AlgorithmListPage
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
    // 计算机语言总览页：每门语言的特性 / 实现与编译原理 / 使用场景，「查看详情」进子页
    path: '/languages',
    name: 'LanguageList',
    component: LanguageListPage
  },
  {
    // 语言详情布局页：页头 + 左侧导航固定，各板块通过子路由独立成页
    // （每个板块有自己的 URL，可直达 / 收藏 / 前进后退），数据在 data/languages.js
    path: '/languages/:lang',
    component: LanguageDetail,
    children: [
      // 🧭 语言概览（默认页）
      { path: '', name: 'LanguageOverview', component: LanguageOverviewSection },
      // ⚙️ 实现与编译原理
      { path: 'compile', name: 'LanguageCompile', component: LanguageCompileSection },
      // 📖 语法基础 / 🧱 数据结构 / 🏗️ 常用架构：共用一个 Markdown 页组件，按路由名区分板块
      { path: 'syntax', name: 'LanguageSyntax', component: LanguageSectionPage },
      { path: 'data-structures', name: 'LanguageDataStructures', component: LanguageSectionPage },
      { path: 'architecture', name: 'LanguageArchitecture', component: LanguageSectionPage },
      // 💼 经典面试题
      { path: 'interview', name: 'LanguageInterview', component: LanguageInterviewSection },
      // 未知板块回落到语言概览
      { path: ':pathMatch(.*)*', redirect: (to) => `/languages/${to.params.lang}` },
    ],
  },
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
