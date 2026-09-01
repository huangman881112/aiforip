<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user.js'

const router = useRouter()
const userStore = useUserStore()

const mode = ref('login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  if (!username.value.trim() || password.value.length < 4) {
    error.value = '用户名不能为空，密码至少 4 位'
    return
  }
  if (mode.value === 'register' && password.value !== confirmPassword.value) {
    error.value = '两次输入的密码不一致'
    return
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(username.value.trim(), password.value)
    } else {
      await userStore.register(username.value.trim(), password.value)
    }
    router.push('/')
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

function switchMode() {
  mode.value = mode.value === 'login' ? 'register' : 'login'
  error.value = ''
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h2>{{ mode === 'login' ? '登录' : '注册' }}</h2>
      <p class="auth-subtitle">
        {{ mode === 'login' ? '登录后可同步你的学习进度' : '创建账号，保存你的学习进度' }}
      </p>

      <form @submit.prevent="submit" class="auth-form">
        <label>
          用户名
          <input v-model="username" type="text" autocomplete="username" placeholder="请输入用户名" />
        </label>
        <label>
          密码
          <input v-model="password" type="password" autocomplete="current-password" placeholder="至少 4 位" />
        </label>
        <label v-if="mode === 'register'">
          确认密码
          <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入密码" />
        </label>

        <p v-if="error" class="auth-error">{{ error }}</p>

        <button type="submit" class="auth-btn" :disabled="loading">
          {{ loading ? '请稍候…' : mode === 'login' ? '登录' : '注册' }}
        </button>
      </form>

      <p class="auth-switch">
        {{ mode === 'login' ? '还没有账号？' : '已有账号？' }}
        <a href="#" @click.prevent="switchMode">
          {{ mode === 'login' ? '去注册' : '去登录' }}
        </a>
      </p>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 160px);
  padding: 40px 20px;
}

.auth-card {
  width: 100%;
  max-width: 380px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  padding: 32px;
}

.auth-card h2 {
  margin: 0 0 4px;
  color: #333;
  font-size: 1.4rem;
}

.auth-subtitle {
  margin: 0 0 24px;
  color: #999;
  font-size: 0.9rem;
}

.auth-form label {
  display: block;
  margin-bottom: 16px;
  color: #555;
  font-size: 0.9rem;
}

.auth-form input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.auth-form input:focus {
  outline: none;
  border-color: #1e88e5;
}

.auth-error {
  color: #d32f2f;
  font-size: 0.85rem;
  margin: 0 0 12px;
}

.auth-btn {
  width: 100%;
  padding: 11px;
  background: #1e88e5;
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.auth-btn:hover:not(:disabled) {
  background: #1565c0;
}

.auth-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.auth-switch {
  margin: 20px 0 0;
  text-align: center;
  color: #999;
  font-size: 0.9rem;
}

.auth-switch a {
  color: #1e88e5;
  text-decoration: none;
}
</style>
