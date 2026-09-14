<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../../stores/user.js'
import { sendRegisterEmailCode, verifyRegisterCode } from '../../api/client.js'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// 表单模式与 URL 同步（?mode=register / ?mode=login）：
// 注册与登录共用 /login 路由，若只改内部状态，导航栏「登录」在注册界面点击时
// 会被 vue-router 当作重复导航而忽略（表现为点了没反应），因此模式变化必须落 URL
const mode = ref(route.query.mode === 'register' ? 'register' : 'login')
const username = ref('')
const password = ref('')
const confirmPassword = ref('')
const email = ref('')
const emailCode = ref('')
const error = ref('')
const notice = ref('')
const loading = ref(false)

/** 注册验证码：发送中 / 重发冷却 / 未配置 SMTP 时回传的开发验证码 */
const sending = ref(false)
const codeCountdown = ref(0)
const devCode = ref('')
let countdownTimer = null

/** 验证码即时校验状态：'' 未校验 / 'checking' / 'ok' / 'fail' */
const codeCheck = ref('')
const codeCheckMsg = ref('')
const checking = ref(false)
let checkTimer = null

/** 与后端 Emails.PATTERN 同源的宽格式：拦住缺 @ / 缺域名 / 顶级域过短 / 非法字符等常见输错。 */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/
const EMAIL_MAX = 120

const emailTrimmed = computed(() => email.value.trim())
/** null = 未填（选填，不算错）；true / false = 已填且合法 / 已填但不合法。 */
const emailState = computed(() => {
  if (!emailTrimmed.value) return null
  return emailTrimmed.value.length <= EMAIL_MAX && EMAIL_RE.test(emailTrimmed.value)
})

const canSendCode = computed(() => emailState.value === true && !sending.value && codeCountdown.value <= 0)
const sendBtnText = computed(() => {
  if (sending.value) return '发送中…'
  if (codeCountdown.value > 0) return `${codeCountdown.value}s 后重发`
  return emailCode.value ? '重新发送' : '发送验证码'
})

onBeforeUnmount(() => {
  clearInterval(countdownTimer)
  clearTimeout(checkTimer)
})

/** 邮箱或验证码变化后重置校验状态；凑够 6 位自动预检（防抖 500ms，不终态消费）。 */
watch([emailTrimmed, () => emailCode.value], () => {
  codeCheck.value = ''
  codeCheckMsg.value = ''
  clearTimeout(checkTimer)
  if (emailState.value !== true || emailCode.value.trim().length !== 6) return
  checkTimer = setTimeout(checkCode, 500)
})

async function checkCode() {
  if (checking.value || emailState.value !== true) return
  checking.value = true
  codeCheck.value = 'checking'
  codeCheckMsg.value = ''
  try {
    await verifyRegisterCode(emailTrimmed.value, emailCode.value.trim())
    codeCheck.value = 'ok'
  } catch (e) {
    codeCheck.value = 'fail'
    codeCheckMsg.value = e.message || '验证码不正确'
  } finally {
    checking.value = false
  }
}

function startCountdown(seconds) {
  codeCountdown.value = Math.max(1, seconds || 60)
  clearInterval(countdownTimer)
  countdownTimer = setInterval(() => {
    codeCountdown.value -= 1
    if (codeCountdown.value <= 0) clearInterval(countdownTimer)
  }, 1000)
}

async function sendCode() {
  if (!canSendCode.value) return
  error.value = ''
  notice.value = ''
  sending.value = true
  try {
    const res = await sendRegisterEmailCode(emailTrimmed.value)
    devCode.value = res?.devCode || ''
    if (devCode.value) {
      emailCode.value = devCode.value
      notice.value = `未配置邮件服务，验证码 ${devCode.value} 已自动填入（同时写入后端日志）。`
    } else {
      notice.value = `验证码已发送至 ${res?.maskedEmail || emailTrimmed.value}，10 分钟内有效，请查收。`
    }
    startCountdown(res?.cooldownSeconds ?? 60)
  } catch (e) {
    error.value = e.message || '验证码发送失败'
  } finally {
    sending.value = false
  }
}

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
  // 邮箱选填，但填了就必须合法并完成验证码校验 —— 与后端同一套规则，提前拦截省一次往返
  if (mode.value === 'register' && emailState.value === false) {
    error.value = '邮箱格式不正确，请检查后重试（示例：name@example.com）'
    return
  }
  if (mode.value === 'register' && emailState.value === true) {
    if (emailCode.value.trim().length !== 6) {
      error.value = '请先点击「发送验证码」，并输入邮箱收到的 6 位验证码'
      return
    }
    if (codeCheck.value === 'fail') {
      error.value = codeCheckMsg.value || '验证码不正确，请核对后重试'
      return
    }
    if (codeCheck.value !== 'ok') {
      error.value = '验证码尚未校验通过，请稍候片刻或点击「校验」按钮'
      return
    }
  }
  loading.value = true
  try {
    if (mode.value === 'login') {
      await userStore.login(username.value.trim(), password.value)
    } else {
      await userStore.register(username.value.trim(), password.value, emailTrimmed.value, emailCode.value.trim())
    }
    router.push('/')
  } catch (e) {
    error.value = e.message || '操作失败，请重试'
  } finally {
    loading.value = false
  }
}

// 外部导航（导航栏「登录」、带 ?mode= 的链接）改变 query 时同步表单模式。
// 同一路由组件复用不会重新挂载，必须用 watch 接住。
watch(() => route.query.mode, (m) => {
  const next = m === 'register' ? 'register' : 'login'
  if (next === mode.value) return
  mode.value = next
  error.value = ''
  notice.value = ''
})

function switchMode() {
  const next = mode.value === 'login' ? 'register' : 'login'
  mode.value = next
  error.value = ''
  notice.value = ''
  // replace 而非 push：内部切换不污染浏览历史；保留 redirect 等已有参数
  router.replace({ query: { ...route.query, mode: next } })
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
        <template v-if="mode === 'register'">
          <label class="email-label">
            邮箱 <span class="optional">（选填，验证后可用验证码找回密码）</span>
            <span class="input-row">
              <input
                v-model="email"
                type="email"
                autocomplete="email"
                placeholder="name@example.com"
                :class="{ 'input-invalid': emailState === false, 'input-valid': emailState === true }"
              />
              <button
                type="button"
                class="send-btn"
                :disabled="!canSendCode"
                @click="sendCode"
              >{{ sendBtnText }}</button>
            </span>
            <span v-if="emailState === false" class="field-hint field-hint-err">
              格式不正确：应形如 name@example.com
            </span>
            <span v-else-if="emailState === true" class="field-hint field-hint-ok">格式正确 ✓</span>
          </label>
          <label v-if="emailState !== null">
            邮箱验证码
            <span class="input-row">
              <input
                v-model="emailCode"
                type="text"
                inputmode="numeric"
                maxlength="6"
                placeholder="6 位验证码"
                autocomplete="one-time-code"
                :class="{
                  'input-invalid': codeCheck === 'fail',
                  'input-valid': codeCheck === 'ok',
                }"
              />
              <button
                type="button"
                class="send-btn"
                :disabled="checking || emailState !== true || emailCode.trim().length !== 6"
                @click="checkCode"
              >{{ checking ? '校验中…' : '校验' }}</button>
            </span>
            <span v-if="codeCheck === 'checking'" class="field-hint">正在校验验证码…</span>
            <span v-else-if="codeCheck === 'ok'" class="field-hint field-hint-ok">✓ 验证通过，邮箱真实有效</span>
            <span v-else-if="codeCheck === 'fail'" class="field-hint field-hint-err">✗ {{ codeCheckMsg }}</span>
            <span v-else-if="emailCode.trim().length === 6" class="field-hint">输入完成，正在自动校验…</span>
          </label>
        </template>
        <label v-if="mode === 'register'">
          确认密码
          <input v-model="confirmPassword" type="password" autocomplete="new-password" placeholder="再次输入密码" />
        </label>

        <p v-if="notice" class="auth-notice">{{ notice }}</p>
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
  background: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  padding: 32px;
}

.auth-card h2 {
  margin: 0 0 4px;
  color: var(--text-1);
  font-size: 1.4rem;
}

.auth-subtitle {
  margin: 0 0 24px;
  color: var(--text-3);
  font-size: 0.9rem;
}

.auth-form label {
  display: block;
  margin-bottom: 16px;
  color: var(--text-2);
  font-size: 0.9rem;
}

.auth-form input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 10px 12px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  font-size: 0.95rem;
  box-sizing: border-box;
}

.auth-form input:focus {
  outline: none;
  border-color: #1e88e5;
}

.auth-error {
  color: var(--c-red);
  font-size: 0.85rem;
  margin: 0 0 12px;
}

/* ---------- 邮箱（选填）实时校验 + 验证码 ---------- */
.email-label .optional {
  color: var(--text-3);
  font-size: 0.78rem;
}

.input-row {
  display: flex;
  gap: 8px;
}

.input-row input {
  flex: 1;
  min-width: 0;
}

.send-btn {
  flex-shrink: 0;
  border: 1px solid var(--brand-500);
  background: var(--brand-50);
  color: var(--brand-400);
  border-radius: 4px;
  padding: 0 12px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, opacity 0.15s;
}

.send-btn:hover:not(:disabled) {
  background: var(--brand-100);
}

.send-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.auth-notice {
  color: var(--c-green);
  font-size: 0.82rem;
  margin: 0 0 12px;
  line-height: 1.5;
}

.field-hint {
  display: block;
  margin-top: 4px;
  font-size: 0.78rem;
  line-height: 1.4;
}

.field-hint-err {
  color: var(--c-red);
}

.field-hint-ok {
  color: var(--c-green);
}

.input-invalid {
  border-color: var(--c-red) !important;
}

.input-valid {
  border-color: var(--c-green);
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
  color: var(--text-3);
  font-size: 0.9rem;
}

.auth-switch a {
  color: var(--c-blue);
  text-decoration: none;
}
</style>
