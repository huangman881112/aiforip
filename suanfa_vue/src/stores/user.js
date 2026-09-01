import { defineStore } from 'pinia'
import { login as apiLogin, logout as apiLogout, register as apiRegister, fetchCurrentUser } from '../api/client.js'

/** 用户状态：跨页面管理登录态。 */
export const useUserStore = defineStore('user', {
  state: () => ({
    user: null,          // { id, username, createdAt } | null
    initialized: false,  // 是否已尝试恢复会话（/auth/me）
  }),
  getters: {
    isLoggedIn: (s) => s.user !== null,
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
  },
})
