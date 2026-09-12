import { defineStore } from 'pinia'
import {
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
    async register(username, password) {
      this.user = await apiRegister(username, password)
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
  },
})
