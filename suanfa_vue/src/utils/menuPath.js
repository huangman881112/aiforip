// ============================================================
// 路由 → 菜单路径（页面笔记用）
// 把当前路由解析成「一级菜单 / 二级菜单 / 页面名」的中文路径，
// 作为 page_notes 的 menu_path 存库并在笔记面板展示。
// ============================================================

import { algorithmCategories, getAlgorithmById } from '../data/algorithms.js'
import { getLanguageById, languageSectionPages } from '../data/languages.js'

/** 路由名 → 一级菜单段（与顶部导航一致） */
const ROUTE_LABELS = {
  Home: '首页',
  About: '关于我们',
  Login: '登录 / 注册',
  ProgressPage: '我的进度',
  ChangePassword: '个人中心 / 修改密码',
  ChangeEmail: '个人中心 / 修改邮箱',
  Profile: '个人中心 / 个人信息',
  UserManage: '个人中心 / 用户管理',
  AdminOrders: '个人中心 / 订单管理',
  Membership: '会员中心',
  CalendarPage: '学习日历',
  TrainingPage: '算法 / 算法训练',
  AiChatPage: 'AI 助教',
  AlgorithmList: '算法 / 算法总览',
  SortingPage: '算法 / 排序算法',
  SearchingPage: '算法 / 搜索算法',
  GraphPage: '算法 / 图算法',
  DPPage: '算法 / 动态规划',
  GreedyPage: '算法 / 贪心算法',
  SimpleBubbleSort: '算法 / 排序算法 / 简单冒泡排序',
  LanguageList: '计算机语言',
}

/** 分类 key → 中文标签（sorting → 排序算法） */
const CATEGORY_LABELS = Object.fromEntries(
  algorithmCategories.map((c) => [c.key, c.label])
)

/** 语言详情子页：路由名 → 板块 slug（与 languageSectionPages 对应） */
const LANGUAGE_ROUTE_SLUGS = {
  LanguageOverview: '',
  LanguageCompile: 'compile',
  LanguageSyntax: 'syntax',
  LanguageDataStructures: 'data-structures',
  LanguageArchitecture: 'architecture',
  LanguageInterview: 'interview',
}

/**
 * 解析当前路由的菜单路径。
 * @param {object} route vue-router 的 route 对象
 * @returns {string} 如「算法 / 排序算法 / 冒泡排序」；无法识别时回退到解码后的完整路径
 */
export function resolveMenuPath(route) {
  if (!route) return ''
  const name = route.name
  if (ROUTE_LABELS[name]) return ROUTE_LABELS[name]

  // 统一算法详情页：/algorithms/:category/:id
  if (name === 'AlgorithmDetail') {
    const algo = getAlgorithmById(route.params.id)
    const cat = CATEGORY_LABELS[route.params.category] || route.params.category
    return `算法 / ${cat} / ${algo?.name || route.params.id}`
  }

  // 计算机语言详情子页：/languages/:lang(/:板块)
  if (String(name || '').startsWith('Language')) {
    const lang = getLanguageById(route.params.lang)
    const langName = lang?.name || route.params.lang
    const slug = LANGUAGE_ROUTE_SLUGS[name]
    const section = slug != null && languageSectionPages.find((s) => s.slug === slug)?.label
    return section
      ? `计算机语言 / ${langName} / ${section}`
      : `计算机语言 / ${langName}`
  }

  // 兜底：用解码后的路径，保证任何页面（含未来新增的）都有可读标识
  return decodeURIComponent(route.path || '/')
}
