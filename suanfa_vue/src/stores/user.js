import { defineStore } from 'pinia'
import {
  changeEmail as apiChangeEmail,
  changePassword as apiChangePassword,
  fetchCurrentUser,
  login as apiLogin,
  logout as apiLogout,
  register as apiRegister,
} from '../api/client.js'

/** 用户状态：跨页面管理登录态。 */
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,          // { id, username, email, createdAt, admin } | null
    initialized: false,  // 是否已尝试恢复会话（/auth/me）
  }),
  getters: {
    isLoggedIn: (s) => s.user !== null,
    /** 是否管理员（后端 AdminGuard 判定：users.role='admin' 或 suanfa.ai.admin-usernames 白名单） */
    isAdmin: (s) => !!s.user?.admin,
    /** 是否有效会员（后端根据 users.membership_expire_at 判定，支付成功后自动顺延） */
    isMember: (s) => !!s.user?.membershipActive,
    /** 顶栏展示名称：个人中心设置的名称优先，未设置回退用户名 */
    displayName: (s) => s.user?.displayName || s.user?.username || '',
  },
  actions: {
    async init() {
      if (this.initialized) return
      try {
        this.user = await fetchCurrentUser()
      } catch {
        this.user = null
      } finally {
        this.initialized = true
      }
    },
    /** 重新拉取当前用户（管理员在「用户管理」里改了自己的用户名/邮箱后调用）。 */
    async reload() {
      try {
        this.user = await fetchCurrentUser()
      } catch {
        /* 保持原状态：拉取失败说明后端异常，不清掉已有登录态 */
      }
      return this.user
    },
    async login(username, password) {
      this.user = await apiLogin(username, password)
    },
    async register(username, password, email, code) {
      this.user = await apiRegister(username, password, email, code)
    },
    async logout() {
      await apiLogout().catch(() => {})
      this.user = null
    },
    /** 改密成功后刷新本地用户信息（新绑定邮箱等） */
    async changePassword(payload) {
      this.user = await apiChangePassword(payload)
      return this.user
    },
    /** 换绑邮箱成功后刷新本地用户信息（顶栏 / 个人中心展示的邮箱随之更新） */
    async changeEmail(payload) {
      this.user = await apiChangeEmail(payload)
      return this.user
    },
  },
})
