<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  adminCreateUser,
  adminDeleteUser,
  adminResetUserPassword,
  adminUpdateUser,
  fetchAdminUsers,
} from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'

const userStore = useUserStore()

const users = ref([])
const allCount = ref(0)
const total = ref(0)
const keyword = ref('')
const loading = ref(false)
const loadError = ref('')
const toast = reactive({ type: '', text: '' })

// ---------- 弹窗状态：新建 / 编辑 / 重置密码 / 删除确认 ----------
const formVisible = ref(false)
const formMode = ref('create') // create | edit
const form = reactive({ id: null, username: '', email: '', role: 'user', password: '' })
/** 正在编辑的账号是否命中配置白名单（角色/改名/删除都不允许在本页动） */
const formWhitelisted = ref(false)
const formError = ref('')
const submitting = ref(false)
/** 管理员填的是临时密码，默认明文可见以免写错；可切到掩码 */
const reveal = ref(true)

const pwdVisible = ref(false)
const pwd = reactive({ id: null, username: '', value: '', confirm: '' })
const pwdError = ref('')

const delVisible = ref(false)
const delTarget = ref(null)
const delConfirm = ref('')
const delError = ref('')

const canSubmitForm = computed(() => {
  if (submitting.value) return false
  if (!form.username.trim() || form.username.trim().length < 2) return false
  if (formMode.value === 'create' && form.password.length < 4) return false
  return true
})

const canSubmitPwd = computed(() => pwd.value.length >= 4 && pwd.value === pwd.confirm)

const filteredTip = computed(() =>
  keyword.value ? `共 ${total.value} 个匹配账号（全站 ${allCount.value} 个）` : `共 ${total.value} 个账号`
)

onMounted(load)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await fetchAdminUsers(keyword.value)
    users.value = res.users || []
    total.value = res.total ?? users.value.length
    if (!keyword.value) allCount.value = total.value
  } catch (err) {
    users.value = []
    total.value = 0
    loadError.value = err.status
      ? err.message || `加载失败（${err.status}）`
      : '后端不可用，用户管理需要后端服务支撑'
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

// ---------- 新建 / 编辑 ----------

function openCreate() {
  formMode.value = 'create'
  Object.assign(form, { id: null, username: '', email: '', role: 'user', password: '' })
  formWhitelisted.value = false
  formError.value = ''
  formVisible.value = true
}

function openEdit(u) {
  formMode.value = 'edit'
  Object.assign(form, {
    id: u.id,
    username: u.username,
    email: u.email || '',
    // 用真实 role 而不是 admin 标记：白名单账号可能 role=user 但仍是管理员
    role: u.role || (u.admin ? 'admin' : 'user'),
    password: '',
  })
  formWhitelisted.value = !!u.whitelisted
  formError.value = ''
  formVisible.value = true
}

async function submitForm() {
  formError.value = ''
  if (!canSubmitForm.value) {
    formError.value = formMode.value === 'create'
      ? '请填写用户名（≥2 位）与密码（≥4 位）'
      : '用户名至少 2 位'
    return
  }
  submitting.value = true
  try {
    if (formMode.value === 'create') {
      await adminCreateUser({
        username: form.username.trim(),
        password: form.password,
        email: form.email.trim(),
        role: form.role,
      })
      say('ok', `已创建用户 ${form.username.trim()}`)
    } else {
      // email 允许清空（解绑）；role 只在非白名单账号上生效
      await adminUpdateUser(form.id, {
        username: form.username.trim(),
        email: form.email.trim(),
        role: form.role,
      })
      say('ok', '已保存')
    }
    formVisible.value = false
    await refreshSelfIfChanged(form.id)
  } catch (err) {
    formError.value = err.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

/** 改的是自己（尤其是改名）时，顺手刷新登录态，避免顶栏用户名与实际不一致。 */
async function refreshSelfIfChanged(id) {
  if (id != null && userStore.user?.id === id) {
    await userStore.reload()
  }
  await load()
}

// ---------- 重置密码 ----------

function openPwd(u) {
  Object.assign(pwd, { id: u.id, username: u.username, value: '', confirm: '' })
  pwdError.value = ''
  pwdVisible.value = true
}

async function submitPwd() {
  pwdError.value = ''
  if (!canSubmitPwd.value) {
    pwdError.value = pwd.value.length < 4 ? '新密码至少 4 位' : '两次输入的新密码不一致'
    return
  }
  submitting.value = true
  try {
    await adminResetUserPassword(pwd.id, pwd.value)
    pwdVisible.value = false
    say('ok', `已重置 ${pwd.username} 的密码`)
  } catch (err) {
    pwdError.value = err.message || '重置失败'
  } finally {
    submitting.value = false
  }
}

// ---------- 删除 ----------

function openDelete(u) {
  delTarget.value = u
  delConfirm.value = ''
  delError.value = ''
  delVisible.value = true
}

async function submitDelete() {
  const u = delTarget.value
  if (!u) return
  if (delConfirm.value.trim() !== u.username) {
    delError.value = `请输入用户名 ${u.username} 以确认`
    return
  }
  submitting.value = true
  delError.value = ''
  try {
    await adminDeleteUser(u.id)
    delVisible.value = false
    delTarget.value = null
    say('ok', `已删除用户 ${u.username}`)
    await load()
  } catch (err) {
    delError.value = err.message || '删除失败'
  } finally {
    submitting.value = false
  }
}

// ---------- 展示辅助 ----------

function isSelf(u) {
  return userStore.user?.id === u.id
}

function dataCount(u) {
  return u.progressCount + u.noteCount + u.commentCount + u.trainingCount
}

function fmtDate(v) {
  if (!v) return '—'
  return String(v).replace('T', ' ').slice(0, 16)
}
</script>

<template>
  <div class="um-page">
    <div class="um-container">
      <header class="um-head">
        <div>
          <h2>用户管理</h2>
          <p class="um-sub">
            查看、编辑站点账号：新建用户、改用户名 / 绑定邮箱、授予或取消管理员、重置密码、删除账号。
            <strong>仅管理员可见</strong>。
          </p>
        </div>
        <div class="um-head-actions">
          <button class="um-btn um-btn-ghost" :disabled="loading" @click="load">
            {{ loading ? '加载中…' : '刷新' }}
          </button>
          <button class="um-btn" @click="openCreate">＋ 新建用户</button>
        </div>
      </header>

      <p v-if="toast.text" class="um-toast" :class="toast.type === 'ok' ? 'um-toast-ok' : 'um-toast-err'">
        {{ toast.text }}
      </p>

      <form class="um-search" @submit.prevent="load">
        <input v-model="keyword" type="search" placeholder="按用户名或邮箱搜索…" />
        <button class="um-btn um-btn-ghost" type="submit" :disabled="loading">搜索</button>
        <button v-if="keyword" class="um-btn um-btn-ghost" type="button" :disabled="loading"
                @click="keyword = ''; load()">
          清除
        </button>
      </form>

      <p v-if="loadError" class="um-alert">{{ loadError }}</p>

      <div class="um-card">
        <table class="um-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>用户名</th>
              <th>绑定邮箱</th>
              <th>角色</th>
              <th>学习数据</th>
              <th>注册时间</th>
              <th class="um-th-ops">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td class="um-empty" colspan="7">加载中…</td>
            </tr>
            <tr v-else-if="!users.length">
              <td class="um-empty" colspan="7">{{ loadError ? '暂无数据（后端不可用或无匹配账号）' : '没有匹配的账号' }}</td>
            </tr>
            <tr v-for="u in users" :key="u.id" :class="{ 'um-row-self': isSelf(u) }">
              <td class="um-td-id">{{ u.id }}</td>
              <td>
                <span class="um-name">{{ u.username }}</span>
                <span v-if="isSelf(u)" class="um-tag um-tag-self">当前账号</span>
                <span v-if="u.whitelisted" class="um-tag um-tag-wl" title="由后端配置 suanfa.ai.admin-usernames 授予，不能改名/删除">配置白名单</span>
              </td>
              <td class="um-td-email">{{ u.email || '未绑定' }}</td>
              <td>
                <span class="um-role" :class="u.admin ? 'um-role-admin' : 'um-role-user'">
                  {{ u.whitelisted ? '管理员（配置白名单）' : u.admin ? '管理员' : '普通用户' }}
                </span>
              </td>
              <td class="um-td-data">
                <span title="学习进度">进度 {{ u.progressCount }}</span>
                <span title="学习笔记">笔记 {{ u.noteCount }}</span>
                <span title="算法评论">评论 {{ u.commentCount }}</span>
                <span title="刷题记录">刷题 {{ u.trainingCount }}</span>
              </td>
              <td class="um-td-date">{{ fmtDate(u.createdAt) }}</td>
              <td class="um-td-ops">
                <button class="um-link" @click="openEdit(u)">编辑</button>
                <button class="um-link" @click="openPwd(u)">重置密码</button>
                <button
                  class="um-link um-link-danger"
                  :disabled="isSelf(u) || u.whitelisted"
                  :title="isSelf(u) ? '不能删除当前登录账号' : u.whitelisted ? '配置白名单账号不可删除' : '删除该账号及其学习数据'"
                  @click="openDelete(u)"
                >
                  删除
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        <footer class="um-foot">
          <span>{{ filteredTip }}</span>
          <span class="um-tip">
            管理员身份有两个来源：<code>role=admin</code>（本页授予）与后端配置
            <code>suanfa.ai.admin-usernames</code>（白名单兜底，本页不改其角色）。
          </span>
        </footer>
      </div>
    </div>

    <!-- 新建 / 编辑 -->
    <div v-if="formVisible" class="um-mask" @click.self="formVisible = false">
      <div class="um-modal" role="dialog" :aria-label="formMode === 'create' ? '新建用户' : '编辑用户'">
        <header class="um-modal-head">
          <h3>{{ formMode === 'create' ? '新建用户' : `编辑用户 #${form.id}` }}</h3>
          <button class="um-x" title="关闭" @click="formVisible = false">✕</button>
        </header>
        <form class="um-form" @submit.prevent="submitForm">
          <label>
            用户名
            <input v-model="form.username" type="text" autocomplete="off" placeholder="2-32 位，字母/数字/下划线/中文" />
          </label>
          <label v-if="formMode === 'create'">
            初始密码
            <input
              v-model="form.password"
              :type="reveal ? 'text' : 'password'"
              autocomplete="new-password"
              placeholder="至少 4 位，请提醒用户登录后自行修改"
            />
          </label>
          <label>
            绑定邮箱
            <input v-model="form.email" type="email" autocomplete="off" placeholder="可留空；清空即解绑（改密码时需要它收验证码）" />
          </label>
          <label>
            角色
            <select v-model="form.role" :disabled="formWhitelisted">
              <option value="user">普通用户</option>
              <option value="admin">管理员（可进入本页与 AI 中转站配置）</option>
            </select>
            <small v-if="formWhitelisted" class="um-hint">
              该账号命中后端配置白名单，身份与用户名由 <code>suanfa.ai.admin-usernames</code> 决定，本页不可改。
            </small>
          </label>
          <p v-if="formError" class="um-alert">{{ formError }}</p>
          <div class="um-modal-actions">
            <button type="button" class="um-btn um-btn-ghost" @click="formVisible = false">取消</button>
            <button type="submit" class="um-btn" :disabled="!canSubmitForm">
              {{ submitting ? '提交中…' : '保存' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 重置密码 -->
    <div v-if="pwdVisible" class="um-mask" @click.self="pwdVisible = false">
      <div class="um-modal um-modal-sm" role="dialog" aria-label="重置密码">
        <header class="um-modal-head">
          <h3>重置密码 · {{ pwd.username }}</h3>
          <button class="um-x" title="关闭" @click="pwdVisible = false">✕</button>
        </header>
        <form class="um-form" @submit.prevent="submitPwd">
          <p class="um-note">重置不需要原密码与邮箱验证码；提交后该账号在已登录设备上的会话仍然有效，但下次登录要用新密码。</p>
          <label>
            新密码
            <input v-model="pwd.value" :type="reveal ? 'text' : 'password'" autocomplete="new-password" placeholder="至少 4 位" />
          </label>
          <label>
            确认新密码
            <input v-model="pwd.confirm" :type="reveal ? 'text' : 'password'" autocomplete="new-password" placeholder="再次输入" />
          </label>
          <label class="um-check"><input v-model="reveal" type="checkbox" /> 明文显示密码</label>
          <p v-if="pwdError" class="um-alert">{{ pwdError }}</p>
          <div class="um-modal-actions">
            <button type="button" class="um-btn um-btn-ghost" @click="pwdVisible = false">取消</button>
            <button type="submit" class="um-btn" :disabled="!canSubmitPwd || submitting">
              {{ submitting ? '提交中…' : '确认重置' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- 删除确认 -->
    <div v-if="delVisible && delTarget" class="um-mask" @click.self="delVisible = false">
      <div class="um-modal um-modal-sm" role="dialog" aria-label="删除用户">
        <header class="um-modal-head">
          <h3>删除用户 · {{ delTarget.username }}</h3>
          <button class="um-x" title="关闭" @click="delVisible = false">✕</button>
        </header>
        <form class="um-form" @submit.prevent="submitDelete">
          <p class="um-note um-note-danger">
            该账号下有 <strong>{{ dataCount(delTarget) }}</strong> 条学习数据
            （进度 {{ delTarget.progressCount }} / 笔记 {{ delTarget.noteCount }} /
            评论 {{ delTarget.commentCount }} / 刷题 {{ delTarget.trainingCount }}），
            删除后<strong>一并清除且不可恢复</strong>。
          </p>
          <label>
            输入用户名 <code>{{ delTarget.username }}</code> 以确认
            <input v-model="delConfirm" type="text" autocomplete="off" :placeholder="delTarget.username" />
          </label>
          <p v-if="delError" class="um-alert">{{ delError }}</p>
          <div class="um-modal-actions">
            <button type="button" class="um-btn um-btn-ghost" @click="delVisible = false">取消</button>
            <button type="submit" class="um-btn um-btn-danger" :disabled="submitting">
              {{ submitting ? '删除中…' : '确认删除' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.um-page {
  width: 100%;
  padding: 30px 24px 60px;
  background: var(--surface-muted);
  min-height: calc(100vh - 120px);
  box-sizing: border-box;
}

.um-container {
  max-width: 1080px;
  margin: 0 auto;
}

.um-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.um-head h2 {
  margin: 0 0 6px;
  color: var(--text-1);
  font-size: 1.35rem;
}

.um-sub {
  margin: 0;
  color: var(--text-3);
  font-size: 0.86rem;
  line-height: 1.6;
  max-width: 640px;
}

.um-sub strong {
  color: var(--text-2);
}

.um-head-actions {
  display: flex;
  gap: 10px;
}

/* ---------- 控件 ---------- */

.um-btn {
  padding: 8px 14px;
  border: 1px solid var(--brand-500);
  border-radius: 6px;
  background: var(--brand-500);
  color: #fff;
  font-size: 0.86rem;
  cursor: pointer;
  transition: background 0.25s;
}

.um-btn:hover:not(:disabled) {
  background: var(--brand-600);
}

.um-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.um-btn-ghost {
  background: var(--surface-3);
  border-color: var(--border-2);
  color: var(--text-1);
}

.um-btn-ghost:hover:not(:disabled) {
  background: var(--border-2);
}

.um-btn-danger {
  background: var(--c-red);
  border-color: var(--c-red);
  color: #2b0b0b;
}

.um-btn-danger:hover:not(:disabled) {
  filter: brightness(0.92);
}

.um-search {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.um-search input {
  flex: 1;
  max-width: 360px;
  padding: 9px 12px;
  border: 1px solid var(--border-1);
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--text-1);
  font-size: 0.88rem;
  box-sizing: border-box;
}

.um-search input:focus {
  outline: none;
  border-color: var(--brand-500);
}

/* ---------- 表格 ---------- */

.um-card {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  overflow: hidden;
}

.um-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.86rem;
}

.um-table thead th {
  text-align: left;
  padding: 11px 14px;
  background: var(--surface-2);
  color: var(--text-2);
  font-weight: 600;
  white-space: nowrap;
}

.um-table tbody td {
  padding: 11px 14px;
  border-top: 1px solid var(--border-1);
  color: var(--text-1);
  vertical-align: middle;
}

.um-row-self {
  background: var(--tint-blue);
}

.um-td-id {
  color: var(--text-3);
  font-variant-numeric: tabular-nums;
}

.um-name {
  font-weight: 600;
}

.um-tag {
  margin-left: 6px;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 0.72rem;
}

.um-tag-self {
  background: var(--tint-blue);
  border: 1px solid var(--tint-blue-border);
  color: var(--c-blue);
}

.um-tag-wl {
  background: var(--tint-purple);
  border: 1px solid var(--tint-purple-border);
  color: var(--c-purple);
}

.um-td-email {
  color: var(--text-2);
  word-break: break-all;
}

.um-role {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.78rem;
}

.um-role-admin {
  background: var(--tint-amber);
  border: 1px solid var(--tint-amber-border);
  color: var(--c-amber);
}

.um-role-user {
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  color: var(--text-2);
}

.um-td-data {
  color: var(--text-2);
  white-space: nowrap;
  font-size: 0.8rem;
}

.um-td-data span + span::before {
  content: '·';
  margin: 0 6px;
  color: var(--text-3);
}

.um-td-date {
  color: var(--text-3);
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}

.um-th-ops {
  width: 190px;
}

.um-td-ops {
  white-space: nowrap;
}

.um-link {
  padding: 2px 6px;
  border: none;
  background: none;
  color: var(--c-blue);
  font-size: 0.84rem;
  cursor: pointer;
}

.um-link:hover:not(:disabled) {
  text-decoration: underline;
}

.um-link-danger {
  color: var(--c-red);
}

.um-link:disabled {
  color: var(--text-3);
  cursor: not-allowed;
  opacity: 0.7;
}

.um-empty {
  text-align: center;
  color: var(--text-3);
  padding: 28px 14px !important;
}

.um-foot {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  padding: 10px 14px;
  border-top: 1px solid var(--border-1);
  background: var(--surface-2);
  color: var(--text-3);
  font-size: 0.8rem;
}

.um-tip code {
  color: var(--text-2);
}

.um-alert {
  margin: 0 0 12px;
  padding: 9px 12px;
  border-radius: 6px;
  background: var(--tint-red);
  border: 1px solid var(--tint-red-border);
  color: var(--c-red);
  font-size: 0.85rem;
}

.um-toast {
  margin: 0 0 12px;
  padding: 9px 12px;
  border-radius: 6px;
  font-size: 0.85rem;
}

.um-toast-ok {
  background: var(--tint-green);
  border: 1px solid var(--tint-green-border);
  color: var(--c-green);
}

.um-toast-err {
  background: var(--tint-red);
  border: 1px solid var(--tint-red-border);
  color: var(--c-red);
}

/* ---------- 弹窗 ---------- */

.um-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 16px;
  background: var(--overlay-bg);
  overflow-y: auto;
}

.um-modal {
  width: 100%;
  max-width: 460px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.35);
}

.um-modal-sm {
  max-width: 420px;
}

.um-modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-1);
}

.um-modal-head h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-1);
}

.um-x {
  border: none;
  background: none;
  color: var(--text-2);
  font-size: 1rem;
  cursor: pointer;
}

.um-form {
  padding: 16px 18px 18px;
}

.um-form label {
  display: block;
  margin-bottom: 14px;
  color: var(--text-2);
  font-size: 0.86rem;
}

.um-form input,
.um-form select {
  display: block;
  width: 100%;
  margin-top: 6px;
  padding: 9px 12px;
  border: 1px solid var(--border-1);
  border-radius: 6px;
  background: var(--surface-2);
  color: var(--text-1);
  font-size: 0.9rem;
  box-sizing: border-box;
}

.um-form input:focus,
.um-form select:focus {
  outline: none;
  border-color: var(--brand-500);
}

.um-form select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.um-hint {
  display: block;
  margin-top: 6px;
  color: var(--text-3);
  font-size: 0.76rem;
  line-height: 1.5;
}

.um-hint code {
  color: var(--text-2);
}

.um-check {
  display: flex !important;
  align-items: center;
  gap: 6px;
  margin: -6px 0 14px !important;
  color: var(--text-3);
  font-size: 0.8rem;
}

.um-check input {
  display: inline !important;
  width: auto !important;
  margin: 0 !important;
}

.um-note {
  margin: 0 0 14px;
  padding: 9px 11px;
  border-radius: 6px;
  background: var(--tint-blue);
  color: var(--text-2);
  font-size: 0.8rem;
  line-height: 1.6;
}

.um-note-danger {
  background: var(--tint-red);
  color: var(--text-1);
}

.um-modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 6px;
}
</style>
