<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useUserStore } from '../../stores/user.js'
import { sendEmailCode } from '../../api/client.js'

const userStore = useUserStore()

const email = ref('')
const code = ref('')
const oldPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const error = ref('')
const notice = ref('')
/** 后端未配置 SMTP 时回传的验证码（仅本地开发） */
const devCode = ref('')
const sending = ref(false)
const submitting = ref(false)
const done = ref(false)
const countdown = ref(0)
let timer = null

const emailBound = computed(() => userStore.user?.email || '')
const emailChanged = computed(
  () => !!emailBound.value && email.value.trim().toLowerCase() !== emailBound.value.toLowerCase()
)
const canSubmit = computed(
  () => !!email.value.trim() && code.value.trim().length === 6
    && !!oldPassword.value && newPassword.value.length >= 6
    && newPassword.value === confirmPassword.value && !submitting.value
)

onMounted(() => {
  email.value = emailBound.value
})

onBeforeUnmount(() => clearInterval(timer))

function startCountdown(seconds) {
  clearInterval(timer)
  countdown.value = Math.max(0, seconds)
  timer = setInterval(() => {
    countdown.value -= 1
    if (countdown.value <= 0) clearInterval(timer)
  }, 1000)
}

async function submitCode() {
  error.value = ''
  notice.value = ''
  const value = email.value.trim()
  if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    error.value = '请先填写正确的邮箱地址'
    return
  }
  sending.value = true
  try {
    const res = await sendEmailCode(value)
    devCode.value = res?.devCode || ''
    if (devCode.value) {
      // 开发模式（后端未接 SMTP）：自动填入，省去翻日志
      code.value = devCode.value
      notice.value = `未配置邮件服务，验证码 ${devCode.value} 已自动填入（同时写入后端日志）。`
    } else {
      code.value = ''
      notice.value = `验证码已发送至 ${res?.maskedEmail || value}，10 分钟内有效。`
    }
    startCountdown(res?.cooldownSeconds ?? 60)
  } catch (e) {
    error.value = e.message || '验证码发送失败，请稍后重试'
  } finally {
    sending.value = false
  }
}

async function submit() {
  error.value = ''
  notice.value = ''
  if (!canSubmit.value) {
    error.value = '请完整填写邮箱、验证码与原密码，新密码至少 6 位且两次一致'
    return
  }
  submitting.value = true
  try {
    await userStore.changePassword({
      email: email.value.trim(),
      code: code.value.trim(),
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    done.value = true
  } catch (e) {
    error.value = e.message || '修改失败，请重试'
    // 只有验证码本身失效才清空；原密码写错不会消费验证码，保留方便重试
    if (/验证码/.test(error.value)) {
      code.value = ''
      devCode.value = ''
    }
  } finally {
    submitting.value = false
  }
}

function reset() {
  done.value = false
  error.value = ''
  notice.value = ''
  devCode.value = ''
  code.value = ''
  oldPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}
</script>

<template>
  <div class="pwd-page">
    <div class="pwd-card">
      <template v-if="!done">
        <h2>修改密码</h2>
        <p class="pwd-subtitle">
          {{ userStore.isAdmin ? '当前账号：管理员' : '当前账号' }}
          <strong>{{ userStore.user?.username }}</strong>
          ，为保护账号安全，修改密码需先通过邮箱验证码校验。
        </p>

        <form class="pwd-form" @submit.prevent="submit">
          <label>
            邮箱
            <input v-model="email" type="email" autocomplete="email" placeholder="用于接收验证码，如 you@example.com" />
            <small v-if="emailBound" class="pwd-hint">
              已绑定 {{ emailBound }}<template v-if="emailChanged">（提交后改绑到上面这个邮箱）</template>
            </small>
            <small v-else class="pwd-hint">该账号尚未绑定邮箱，验证通过后会随本次修改一起绑定</small>
          </label>

          <label>
            邮箱验证码
            <div class="pwd-code-row">
              <input
                v-model="code"
                class="pwd-code-input"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="6 位数字"
              />
              <button
                type="button"
                class="pwd-code-btn"
                :disabled="sending || countdown > 0"
                @click="submitCode"
              >
                {{ sending ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
              </button>
            </div>
            <span v-if="notice" class="pwd-notice">{{ notice }}</span>
          </label>

          <label>
            原密码
            <input v-model="oldPassword" type="password" autocomplete="current-password" placeholder="请输入当前登录密码" />
          </label>

          <label>
            新密码
            <input v-model="newPassword" type="password" autocomplete="new-password" placeholder="至少 6 位" />
          </label>

          <label>
            确认新密码
            <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入新密码" />
          </label>

          <p v-if="error" class="pwd-error">{{ error }}</p>

          <button type="submit" class="pwd-btn" :disabled="!canSubmit">
            {{ submitting ? '提交中…' : '确认修改' }}
          </button>
        </form>
      </template>

      <template v-else>
        <h2>密码修改成功</h2>
        <p class="pwd-subtitle">
          新密码已生效，绑定邮箱：
          <strong>{{ userStore.user?.email || '—' }}</strong>
          。请牢记新密码，若在其他设备登录需要重新登录。
        </p>
        <div class="pwd-done-actions">
          <router-link to="/" class="pwd-btn pwd-btn-inline">返回首页</router-link>
          <button type="button" class="pwd-code-btn" @click="reset">再改一次</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.pwd-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 160px);
  padding: 40px 20px;
}

.pwd-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  padding: 32px;
}

.pwd-card h2 {
  margin: 0 0 4px;
  color: var(--text-1);
  font-size: 1.4rem;
}

.pwd-subtitle {
  margin: 0 0 24px;
  color: var(--text-3);
  font-size: 0.9rem;
  line-height: 1.6;
}

.pwd-subtitle strong {
  color: var(--text-2);
}

.pwd-form label {
  display: block;
  margin-bottom: 16px;
  color: var(--text-2);
  font-size: 0.9rem;
}

.pwd-form input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
  background: var(--surface-2);
  color: var(--text-1);
}

.pwd-form input:focus {
  outline: none;
  border-color: var(--brand-500);
}

.pwd-hint {
  display: block;
  margin-top: 6px;
  color: var(--text-3);
  font-size: 0.78rem;
}

.pwd-code-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.pwd-code-input {
  flex: 1;
  letter-spacing: 2px;
}

.pwd-code-btn {
  flex: none;
  align-self: flex-start;
  margin-top: 6px;
  padding: 10px 14px;
  border: 1px solid var(--border-2);
  border-radius: 4px;
  background: var(--surface-3);
  color: var(--text-1);
  font-size: 0.85rem;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.3s, opacity 0.3s;
}

.pwd-code-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.pwd-code-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.pwd-notice {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--tint-blue);
  color: var(--text-2);
  font-size: 0.8rem;
  line-height: 1.5;
}

.pwd-error {
  color: var(--c-red);
  font-size: 0.85rem;
  margin: 0 0 12px;
}

.pwd-btn {
  width: 100%;
  padding: 11px;
  background: var(--brand-500);
  color: #fff;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.pwd-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.pwd-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pwd-btn-inline {
  display: block;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
}

.pwd-done-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.pwd-done-actions .pwd-code-btn {
  margin-top: 0;
}
</style>
