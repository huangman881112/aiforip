<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { fetchMyProfile, updateMyProfile } from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'

/**
 * 个人中心 → 个人信息：名称 / 性别 / 年龄 / 城市 / 职业 / 学习目的。
 * PUT 全量语义保存；名称设置后顶栏与评论等处的展示名优先于用户名。
 * 用户名 / 邮箱 / 密码不在本页（分别走用户管理与账号安全）。
 */
const userStore = useUserStore()

const loading = ref(true)
const loadError = ref('')
const saving = ref(false)
const toast = reactive({ type: '', text: '' })

const form = reactive({
  displayName: '',
  gender: '',
  age: null,
  city: '',
  occupation: '',
  learningGoal: '',
})

const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
]
const GOAL_PRESETS = ['求职面试', '算法竞赛', '课程学习', '兴趣自学', '科研深造', '提升工作技能']

const genderText = { male: '男', female: '女', other: '其他' }

const profileSummary = ref(null) // 只读的账号上下文（username/email/会员状态）

const dirty = computed(() => true) // 全量语义下始终可保存（也承担清空字段的能力）
const filledCount = computed(() =>
  [form.displayName, form.gender, form.age, form.city, form.occupation, form.learningGoal]
    .filter((v) => v !== null && v !== undefined && String(v).trim() !== '').length
)

onMounted(load)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const p = await fetchMyProfile()
    profileSummary.value = p
    form.displayName = p.displayName && p.displayName !== p.username ? p.displayName : ''
    form.gender = p.gender || ''
    form.age = p.age ?? null
    form.city = p.city || ''
    form.occupation = p.occupation || ''
    form.learningGoal = p.learningGoal || ''
  } catch (err) {
    loadError.value = err.message || '资料加载失败'
  } finally {
    loading.value = false
  }
}

function say(type, text) {
  toast.type = type
  toast.text = text
  setTimeout(() => {
    if (toast.text === text) {
      toast.type = ''
      toast.text = ''
    }
  }, 4000)
}

function applyPreset(g) {
  form.learningGoal = form.learningGoal === g ? '' : g
}

async function save() {
  if (saving.value) return
  if (form.displayName.trim().length > 32) {
    say('err', '名称最多 32 字')
    return
  }
  if (form.age !== null && form.age !== '' && (Number(form.age) < 6 || Number(form.age) > 120)) {
    say('err', '年龄需在 6 ~ 120 之间')
    return
  }
  saving.value = true
  try {
    const payload = {
      displayName: form.displayName.trim(),
      gender: form.gender || null,
      age: form.age === null || form.age === '' || Number.isNaN(Number(form.age)) ? null : Number(form.age),
      city: form.city.trim(),
      occupation: form.occupation.trim(),
      learningGoal: form.learningGoal.trim(),
    }
    await updateMyProfile(payload)
    say('ok', '资料已保存')
    // 名称可能在顶栏展示：刷新登录态里的 displayName
    await userStore.reload()
  } catch (err) {
    say('err', err.message || '保存失败')
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <h2>个人中心 · 个人信息</h2>

    <div v-if="toast.text" class="toast" :class="toast.type === 'ok' ? 'toast-ok' : 'toast-err'">{{ toast.text }}</div>
    <div v-if="loadError" class="page-error">{{ loadError }}</div>
    <div v-if="loading" class="muted">加载中…</div>

    <div v-else class="layout">
      <!-- 左：账号上下文（只读） -->
      <aside class="side-card">
        <h3>账号信息</h3>
        <dl class="account-list">
          <div><dt>用户名</dt><dd>{{ profileSummary?.username || '—' }}</dd></div>
          <div><dt>邮箱</dt><dd>{{ profileSummary?.email || '未绑定' }}</dd></div>
          <div>
            <dt>会员状态</dt>
            <dd>
              <span v-if="profileSummary?.membershipActive" class="vip-chip">会员生效中</span>
              <span v-else class="muted">免费账户</span>
            </dd>
          </div>
        </dl>
        <router-link to="/membership" class="side-link">开通 / 续费会员 →</router-link>
        <router-link to="/account/password" class="side-link">修改密码 →</router-link>
        <router-link to="/account/email" class="side-link">修改邮箱 →</router-link>
        <p class="side-tip">已填写 {{ filledCount }}/6 项资料</p>
      </aside>

      <!-- 右：资料表单 -->
      <section class="form-card">
        <h3>基本资料</h3>
        <form @submit.prevent="save">
          <label>
            名称
            <input
              v-model="form.displayName"
              type="text"
              maxlength="32"
              placeholder="展示昵称，留空则使用用户名（≤32 字）"
            />
          </label>

          <fieldset class="gender-group">
            <legend>性别</legend>
            <label v-for="g in GENDER_OPTIONS" :key="g.value" class="radio">
              <input v-model="form.gender" type="radio" :value="g.value" name="gender" />
              <span>{{ g.label }}</span>
            </label>
            <button
              v-if="form.gender"
              type="button"
              class="clear-mini"
              @click="form.gender = ''"
            >清除</button>
          </fieldset>

          <label>
            年龄
            <input
              v-model="form.age"
              type="number"
              min="6"
              max="120"
              placeholder="6 ~ 120"
            />
          </label>

          <label>
            城市
            <input v-model="form.city" type="text" maxlength="50" placeholder="如：杭州（≤50 字）" />
          </label>

          <label>
            职业
            <input v-model="form.occupation" type="text" maxlength="50" placeholder="如：后端工程师 / 在校学生（≤50 字）" />
          </label>

          <label>
            学习目的
            <input
              v-model="form.learningGoal"
              type="text"
              maxlength="200"
              placeholder="一句话描述你的学习目标（≤200 字），可点下方标签快速填入"
            />
          </label>
          <div class="goal-presets">
            <button
              v-for="g in GOAL_PRESETS"
              :key="g"
              type="button"
              class="chip"
              :class="{ picked: form.learningGoal === g }"
              @click="applyPreset(g)"
            >{{ g }}</button>
          </div>

          <div class="form-ops">
            <span class="muted small">用户名、邮箱、密码请分别在登录 / 账号安全处管理</span>
            <button type="submit" class="btn btn-primary" :disabled="saving || !dirty">
              {{ saving ? '保存中…' : '保存资料' }}
            </button>
          </div>
        </form>
      </section>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  max-width: 920px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}

h2 {
  margin: 0 0 20px;
}

h3 {
  margin: 0 0 14px;
  font-size: 1.02rem;
}

.muted {
  color: var(--text-3);
}

.small {
  font-size: 0.8rem;
}

.layout {
  display: grid;
  grid-template-columns: 260px 1fr;
  gap: 16px;
  align-items: start;
}

/* ---------- 左侧账号卡 ---------- */
.side-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 16px;
  position: sticky;
  top: 76px;
}

.account-list {
  margin: 0 0 12px;
}

.account-list > div {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px dashed var(--border-1);
  font-size: 0.88rem;
}

.account-list dt {
  color: var(--text-3);
  white-space: nowrap;
}

.account-list dd {
  margin: 0;
  color: var(--text-1);
  text-align: right;
  overflow-wrap: anywhere;
}

.vip-chip {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  background: var(--tint-amber);
  color: var(--c-amber);
  font-size: 0.78rem;
  font-weight: 600;
}

.side-link {
  display: block;
  margin-top: 8px;
  color: var(--c-blue);
  font-size: 0.86rem;
  text-decoration: none;
}

.side-link:hover {
  text-decoration: underline;
}

.side-tip {
  margin: 14px 0 0;
  padding-top: 10px;
  border-top: 1px solid var(--border-1);
  color: var(--text-3);
  font-size: 0.78rem;
}

/* ---------- 右侧表单 ---------- */
.form-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 18px 20px 20px;
}

.form-card form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

label {
  display: block;
  color: var(--text-2);
  font-size: 0.88rem;
}

input {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 9px 12px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  border-radius: 8px;
  color: var(--text-1);
  font-size: 0.92rem;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: var(--brand-500);
}

.gender-group {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
  gap: 16px;
}

.gender-group legend {
  color: var(--text-2);
  font-size: 0.88rem;
  padding: 0;
  margin-bottom: 6px;
  float: left;
}

.gender-group .radio {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
  color: var(--text-1);
  margin-top: 0;
}

.gender-group input {
  width: auto;
  margin-top: 0;
  accent-color: var(--brand-500);
}

.clear-mini {
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 0.78rem;
  cursor: pointer;
}

.clear-mini:hover {
  color: var(--c-red);
}

.goal-presets {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: -6px;
}

.chip {
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-2);
  border-radius: 999px;
  padding: 5px 13px;
  font-size: 0.82rem;
  cursor: pointer;
  transition: all 0.15s;
}

.chip:hover {
  background: var(--surface-3);
  color: var(--text-1);
}

.chip.picked {
  background: var(--brand-100);
  border-color: var(--brand-500);
  color: var(--brand-400);
  font-weight: 600;
}

.form-ops {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

/* ---------- 按钮 / 提示 ---------- */
.btn {
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-1);
  border-radius: 8px;
  padding: 8px 18px;
  cursor: pointer;
  font-size: 0.9rem;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--brand-500);
  border-color: var(--brand-500);
  color: var(--text-on-brand);
  font-weight: 600;
}

.btn-primary:hover:not(:disabled) {
  background: var(--brand-600);
}

.page-error {
  background: var(--tint-red);
  border: 1px solid var(--tint-red-border);
  color: var(--c-red);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 16px;
}

.toast {
  position: fixed;
  right: 20px;
  bottom: 24px;
  z-index: 400;
  padding: 10px 16px;
  border-radius: 10px;
  font-size: 0.9rem;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
}

.toast-ok {
  background: var(--tint-green);
  border: 1px solid var(--tint-green-border);
  color: var(--c-green);
}

.toast-err {
  background: var(--tint-red);
  border: 1px solid var(--tint-red-border);
  color: var(--c-red);
}

@media (max-width: 760px) {
  .layout {
    grid-template-columns: 1fr;
  }

  .side-card {
    position: static;
  }
}
</style>
