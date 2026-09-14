<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import { useUserStore } from '../../stores/user.js'
import { sendChangeEmailCode } from '../../api/client.js'

/**
 * 个人中心 → 修改邮箱：换绑需要「新邮箱收到验证码」+「当前密码」双重确认。
 * 流程与修改密码页一致：先在前端拦住廉价错误（格式 / 与当前相同），
 * 再发码（60s 冷却），提交时后端先校密码后烧码，避免低级失误浪费一次性验证码。
 */
const userStore = useUserStore()

const newEmail = ref('')
const code = ref('')
const password = ref('')

const error = ref('')
const notice = ref('')
/** 后端未配置 SMTP 时回传的验证码（仅本地开发） */
const devCode = ref('')
const sending = ref(false)
const submitting = ref(false)
const done = ref(false)
const countdown = ref(0)
let timer = null

/** 与后端 Emails.PATTERN 同源的宽格式校验（Login.vue 同款） */
const EMAIL_RE = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/

const emailBound = computed(() => userStore.user?.email || '')
const emailTrimmed = computed(() => newEmail.value.trim())
/** null = 未填；true / false = 已填且合法 / 不合法 */
const emailState = computed(() => {
  if (!emailTrimmed.value) return null
  return emailTrimmed.value.length <= 120 && EMAIL_RE.test(emailTrimmed.value)
})
const sameAsCurrent = computed(() =>
  !!emailBound.value && emailTrimmed.value.toLowerCase() === emailBound.value.toLowerCase()
)
const canSend = computed(
  () => emailState.value === true && !sameAsCurrent.value && !sending.value && countdown.value <= 0
)
const canSubmit = computed(
  () => emailState.value === true && !sameAsCurrent.value
    && code.value.trim().length === 6 && !!password.value && !submitting.value
)

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
  if (!canSend.value) return
  error.value = ''
  notice.value = ''
  sending.value = true
  try {
    const res = await sendChangeEmailCode(emailTrimmed.value)
    devCode.value = res?.devCode || ''
    if (devCode.value) {
      // 开发模式（后端未接 SMTP）：自动填入，省去翻日志
      code.value = devCode.value
      notice.value = `未配置邮件服务，验证码 ${devCode.value} 已自动填入（同时写入后端日志）。`
    } else {
      notice.value = `验证码已发送至 ${res?.maskedEmail || emailTrimmed.value}，10 分钟内有效，请查收。`
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
  if (!canSubmit.value) {
    error.value = sameAsCurrent.value
      ? '新邮箱不能与当前绑定的邮箱相同'
      : '请填写新邮箱、6 位验证码与当前密码'
    return
  }
  submitting.value = true
  try {
    await userStore.changeEmail({
      email: emailTrimmed.value,
      code: code.value.trim(),
      password: password.value,
    })
    done.value = true
  } catch (e) {
    error.value = e.message || '修改失败，请重试'
    // 验证码失效（错误过多 / 已消费）才清空；密码写错不会消费验证码，保留方便重试
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
  newEmail.value = ''
  code.value = ''
  password.value = ''
}
</script>

<template>
  <div class="mail-page">
    <div class="mail-card">
      <template v-if="!done">
        <h2>修改邮箱</h2>
        <p class="mail-subtitle">
          当前账号 <strong>{{ userStore.user?.username }}</strong>
          ，绑定的邮箱：
          <strong>{{ emailBound || '未绑定' }}</strong>
          。换绑需验证新邮箱能收到验证码，并确认当前密码。
        </p>

        <form class="mail-form" @submit.prevent="submit">
          <label>
            新邮箱地址
            <input
              v-model="newEmail"
              type="email"
              autocomplete="email"
              placeholder="name@example.com"
              :class="{ 'input-invalid': emailState === false, 'input-valid': emailState === true }"
            />
            <small v-if="sameAsCurrent" class="mail-hint mail-hint-err">
              与当前绑定的邮箱相同，无需换绑
            </small>
            <small v-else-if="emailState === false" class="mail-hint mail-hint-err">
              格式不正确：应形如 name@example.com
            </small>
            <small v-else-if="emailState === true" class="mail-hint mail-hint-ok">格式正确 ✓</small>
            <small v-else class="mail-hint">
              换绑后原邮箱将被替换（后续验证码 / 找回密码均发往新邮箱）
            </small>
          </label>

          <label>
            邮箱验证码
            <div class="mail-code-row">
              <input
                v-model="code"
                class="mail-code-input"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                placeholder="6 位数字"
              />
              <button
                type="button"
                class="mail-code-btn"
                :disabled="!canSend"
                @click="submitCode"
              >
                {{ sending ? '发送中…' : countdown > 0 ? `${countdown}s 后重发` : '发送验证码' }}
              </button>
            </div>
            <span v-if="notice" class="mail-notice">{{ notice }}</span>
          </label>

          <label>
            当前密码
            <input v-model="password" type="password" autocomplete="current-password" placeholder="请输入当前登录密码" />
          </label>

          <p v-if="error" class="mail-error">{{ error }}</p>

          <button type="submit" class="mail-btn" :disabled="!canSubmit">
            {{ submitting ? '提交中…' : '确认换绑' }}
          </button>
        </form>
      </template>

      <template v-else>
        <h2>邮箱修改成功</h2>
        <p class="mail-subtitle">
          账号 <strong>{{ userStore.user?.username }}</strong>
          的绑定邮箱已更新为
          <strong>{{ userStore.user?.email || '—' }}</strong>
          ，后续验证码与账号通知将发往新邮箱。
        </p>
        <div class="mail-done-actions">
          <router-link to="/account/profile" class="mail-btn mail-btn-inline">返回个人信息</router-link>
          <button type="button" class="mail-code-btn" @click="reset">再改一次</button>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.mail-page {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  min-height: calc(100vh - 160px);
  padding: 40px 20px;
}

.mail-card {
  width: 100%;
  max-width: 420px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  padding: 32px;
}

.mail-card h2 {
  margin: 0 0 4px;
  color: var(--text-1);
  font-size: 1.4rem;
}

.mail-subtitle {
  margin: 0 0 24px;
  color: var(--text-3);
  font-size: 0.9rem;
  line-height: 1.6;
}

.mail-subtitle strong {
  color: var(--text-2);
  overflow-wrap: anywhere;
}

.mail-form label {
  display: block;
  margin-bottom: 16px;
  color: var(--text-2);
  font-size: 0.9rem;
}

.mail-form input {
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

.mail-form input:focus {
  outline: none;
  border-color: var(--brand-500);
}

.input-invalid {
  border-color: var(--c-red) !important;
}

.input-valid {
  border-color: var(--c-green);
}

.mail-hint {
  display: block;
  margin-top: 6px;
  color: var(--text-3);
  font-size: 0.78rem;
}

.mail-hint-err {
  color: var(--c-red);
}

.mail-hint-ok {
  color: var(--c-green);
}

.mail-code-row {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.mail-code-input {
  flex: 1;
  letter-spacing: 2px;
}

.mail-code-btn {
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

.mail-code-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.mail-code-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.mail-notice {
  margin: 8px 0 0;
  padding: 8px 10px;
  border-radius: 4px;
  background: var(--tint-blue);
  color: var(--text-2);
  font-size: 0.8rem;
  line-height: 1.5;
}

.mail-error {
  color: var(--c-red);
  font-size: 0.85rem;
  margin: 0 0 12px;
}

.mail-btn {
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

.mail-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.mail-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mail-btn-inline {
  display: block;
  text-align: center;
  text-decoration: none;
  box-sizing: border-box;
}

.mail-done-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.mail-done-actions .mail-code-btn {
  margin-top: 0;
}
</style>
