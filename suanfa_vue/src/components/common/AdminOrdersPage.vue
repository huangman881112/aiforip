<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import {
  adminMarkOrderPaid,
  adminRefundOrder,
  adminUpdatePlan,
  fetchAdminOrders,
  fetchAdminPlans,
  fetchOrderStats,
  fmtCents,
} from '../../api/client.js'

/**
 * 订单管理（仅管理员）：营收统计 + 订单列表（筛选 / 手工确认支付 / 退款）+ 会员套餐配置。
 * 后端接口同套拦截（AdminGuard），非管理员进来只会看到 403 错误。
 */
const orders = ref([])
const total = ref(0)
const page = ref(1)
const size = ref(20)
const keyword = ref('')
const statusFilter = ref('')
const loading = ref(false)
const loadError = ref('')
const toast = reactive({ type: '', text: '' })

const stats = ref(null) // StatsResponse
const plans = ref([])
const planEdits = reactive({}) // planId -> { name, priceCents, durationDays, active }
const savingPlan = ref('')

const STATUS_OPTIONS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'cancelled', label: '已取消' },
  { value: 'expired', label: '已过期' },
  { value: 'refunded', label: '已退款' },
]

const STATUS_TEXT = {
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  expired: '已过期',
  refunded: '已退款',
}
const STATUS_CLASS = {
  pending: 'st-pending',
  paid: 'st-paid',
  cancelled: 'st-cancelled',
  expired: 'st-expired',
  refunded: 'st-refunded',
}
const CHANNEL_TEXT = { mock: '模拟', alipay: '支付宝', wechat: '微信' }

const money = (c) => fmtCents(c)
const fmtTime = (t) => (t ? String(t).replace('T', ' ').slice(0, 16) : '—')
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))

onMounted(load)

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const [list, st, pl] = await Promise.all([
      fetchAdminOrders({ keyword: keyword.value, status: statusFilter.value, page: page.value, size: size.value }),
      fetchOrderStats().catch(() => null),
      fetchAdminPlans().catch(() => []),
    ])
    orders.value = list.orders || []
    total.value = list.total ?? orders.value.length
    stats.value = st
    plans.value = pl || []
  } catch (err) {
    loadError.value = err.status
      ? err.message || `加载失败（${err.status}）`
      : '后端不可用，订单管理需要后端服务支撑'
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  load()
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

// ---------- 订单操作 ----------

async function markPaid(o) {
  if (!confirm(`确认订单 ${o.orderNo} 已收到款项（${money(o.amountCents)}）？确认后立即为 ${o.username} 开通/顺延会员。`)) return
  try {
    await adminMarkOrderPaid(o.orderNo)
    say('ok', `订单 ${o.orderNo} 已确认支付`)
    await load()
  } catch (err) {
    say('err', err.message || '操作失败')
  }
}

async function refund(o) {
  if (!confirm(`确认将订单 ${o.orderNo} 标记为退款？（${money(o.amountCents)}，不回收已生效会员）`)) return
  try {
    await adminRefundOrder(o.orderNo)
    say('ok', `订单 ${o.orderNo} 已标记退款`)
    await load()
  } catch (err) {
    say('err', err.message || '操作失败')
  }
}

// ---------- 套餐配置 ----------

function editOf(p) {
  if (!planEdits[p.id]) {
    planEdits[p.id] = {
      name: p.name,
      priceCents: p.priceCents,
      durationDays: p.durationDays,
      active: !!p.active,
    }
  }
  return planEdits[p.id]
}

async function savePlan(p) {
  const e = planEdits[p.id]
  if (!e || savingPlan.value) return
  if (!e.name?.trim() || !(e.priceCents >= 0) || !(e.durationDays > 0)) {
    say('err', '套餐名称 / 价格 / 时长不合法')
    return
  }
  savingPlan.value = p.id
  try {
    await adminUpdatePlan(p.id, {
      name: e.name.trim(),
      priceCents: Math.round(Number(e.priceCents)),
      durationDays: Math.round(Number(e.durationDays)),
      active: !!e.active,
    })
    say('ok', `套餐 ${p.id} 已保存`)
    await load()
  } catch (err) {
    say('err', err.message || '保存失败')
  } finally {
    savingPlan.value = ''
  }
}

const maxDayAmount = computed(() =>
  Math.max(1, ...(stats.value?.last7Days || []).map((d) => d.amountCents))
)
</script>

<template>
  <div class="admin-orders">
    <h2>订单管理</h2>

    <div v-if="toast.text" class="toast" :class="toast.type === 'ok' ? 'toast-ok' : 'toast-err'">{{ toast.text }}</div>
    <div v-if="loadError" class="page-error">{{ loadError }}</div>

    <!-- 营收统计 -->
    <section v-if="stats" class="stats">
      <div class="stat-card">
        <span class="stat-label">累计营收</span>
        <span class="stat-value revenue">{{ money(stats.revenueCents) }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">成交订单</span>
        <span class="stat-value">{{ stats.paidCount }}</span>
        <span class="stat-sub">全站 {{ stats.totalOrders }} 单</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">待支付</span>
        <span class="stat-value warn">{{ stats.pendingCount }}</span>
      </div>
      <div class="stat-card">
        <span class="stat-label">退款 / 过期 / 取消</span>
        <span class="stat-value muted">{{ stats.refundedCount }} / {{ stats.expiredCount }} / {{ stats.cancelledCount }}</span>
      </div>
      <div class="stat-card chart-card">
        <span class="stat-label">最近 7 日成交</span>
        <div class="bars">
          <div v-for="d in stats.last7Days" :key="d.date" class="bar-col" :title="`${d.date}：${money(d.amountCents)}（${d.count} 单）`">
            <div class="bar" :style="{ height: Math.max(4, (d.amountCents / maxDayAmount) * 72) + 'px' }"></div>
            <span class="bar-day">{{ d.date.slice(5) }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- 套餐配置 -->
    <section class="panel">
      <h3>会员套餐配置</h3>
      <div class="order-table-wrap">
        <table class="order-table">
          <thead>
            <tr><th>ID</th><th>名称</th><th class="num">价格（分）</th><th class="num">时长（天）</th><th>状态</th><th>操作</th></tr>
          </thead>
          <tbody>
            <tr v-for="p in plans" :key="p.id">
              <td class="mono">{{ p.id }}</td>
              <td><input v-model="editOf(p).name" class="cell-input" /></td>
              <td class="num"><input v-model.number="editOf(p).priceCents" type="number" min="0" class="cell-input num-input" /></td>
              <td class="num"><input v-model.number="editOf(p).durationDays" type="number" min="1" class="cell-input num-input" /></td>
              <td>
                <label class="switch">
                  <input v-model="editOf(p).active" type="checkbox" />
                  <span>{{ editOf(p).active ? '上架' : '下架' }}</span>
                </label>
              </td>
              <td>
                <button class="btn btn-mini btn-primary" :disabled="savingPlan === p.id" @click="savePlan(p)">
                  {{ savingPlan === p.id ? '保存中…' : '保存' }}
                </button>
              </td>
            </tr>
            <tr v-if="!plans.length">
              <td colspan="6" class="muted">暂无套餐（后端不可用或未导入种子）</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 订单列表 -->
    <section class="panel">
      <div class="toolbar">
        <h3>订单列表</h3>
        <div class="filters">
          <input
            v-model="keyword"
            class="filter-input"
            placeholder="订单号 / 用户名"
            @keyup.enter="search"
          />
          <select v-model="statusFilter" class="filter-input" @change="search">
            <option v-for="o in STATUS_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</option>
          </select>
          <button class="btn btn-mini btn-primary" :disabled="loading" @click="search">查询</button>
          <button class="btn btn-mini" :disabled="loading" @click="load">刷新</button>
        </div>
      </div>

      <div class="order-table-wrap">
        <table class="order-table">
          <thead>
            <tr>
              <th>订单号</th><th>用户</th><th>套餐</th><th class="num">金额</th><th>状态</th><th>渠道</th>
              <th>创建时间</th><th>支付时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.orderNo">
              <td class="mono">{{ o.orderNo }}</td>
              <td>{{ o.username }}</td>
              <td>{{ o.planName }}</td>
              <td class="num">{{ money(o.amountCents) }}</td>
              <td><span class="st" :class="STATUS_CLASS[o.status]">{{ STATUS_TEXT[o.status] || o.status }}</span></td>
              <td>{{ CHANNEL_TEXT[o.payChannel] || o.payChannel }}</td>
              <td>{{ fmtTime(o.createdAt) }}</td>
              <td>{{ fmtTime(o.paidAt) }}</td>
              <td class="ops">
                <button v-if="o.status === 'pending'" class="btn btn-mini btn-primary" @click="markPaid(o)">确认收款</button>
                <button v-if="o.status === 'paid'" class="btn btn-mini btn-danger" @click="refund(o)">退款</button>
                <span v-if="!['pending', 'paid'].includes(o.status)" class="muted">—</span>
              </td>
            </tr>
            <tr v-if="!orders.length && !loading">
              <td colspan="9" class="muted">没有符合条件的订单</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pager" v-if="totalPages > 1">
        <button class="btn btn-mini" :disabled="page <= 1" @click="page--; load()">上一页</button>
        <span class="muted">第 {{ page }} / {{ totalPages }} 页（共 {{ total }} 单）</span>
        <button class="btn btn-mini" :disabled="page >= totalPages" @click="page++; load()">下一页</button>
      </div>
    </section>
  </div>
</template>

<style scoped>
.admin-orders {
  max-width: 1180px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}

h2 {
  margin: 0 0 20px;
}

h3 {
  margin: 0;
  font-size: 1.05rem;
}

.muted {
  color: var(--text-3);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
}

/* ---------- 统计卡 ---------- */
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 14px 16px;
}

.stat-label {
  color: var(--text-3);
  font-size: 0.82rem;
}

.stat-value {
  font-size: 1.35rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.stat-value.revenue {
  color: var(--c-amber);
}

.stat-value.warn {
  color: var(--c-orange);
}

.stat-value.muted {
  color: var(--text-2);
  font-size: 1.05rem;
}

.stat-sub {
  color: var(--text-3);
  font-size: 0.78rem;
}

.chart-card {
  grid-column: span 2;
  min-width: 0;
}

.bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 92px;
  margin-top: 6px;
}

.bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.bar {
  width: 100%;
  max-width: 34px;
  border-radius: 4px 4px 0 0;
  background: linear-gradient(180deg, var(--brand-400), var(--brand-600));
}

.bar-day {
  font-size: 0.68rem;
  color: var(--text-3);
}

/* ---------- 面板 / 表格 ---------- */
.panel {
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.filters {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.filter-input {
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  color: var(--text-1);
  border-radius: 8px;
  padding: 7px 10px;
  font-size: 0.88rem;
  min-width: 140px;
}

.filter-input:focus {
  outline: none;
  border-color: var(--brand-500);
}

.order-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-1);
  border-radius: 10px;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  min-width: 860px;
}

.order-table th,
.order-table td {
  padding: 9px 12px;
  text-align: left;
  border-bottom: 1px solid var(--border-1);
}

.order-table thead th {
  background: var(--surface-muted);
  color: var(--text-2);
  font-weight: 600;
  white-space: nowrap;
}

.order-table tbody tr:hover {
  background: var(--surface-muted);
}

.order-table .num {
  text-align: right;
  font-variant-numeric: tabular-nums;
}

.ops {
  display: flex;
  gap: 6px;
  white-space: nowrap;
}

.st {
  display: inline-block;
  padding: 2px 9px;
  border-radius: 999px;
  font-size: 0.78rem;
  white-space: nowrap;
}

.st-pending { background: var(--tint-amber); color: var(--c-amber); }
.st-paid { background: var(--tint-green); color: var(--c-green); }
.st-cancelled { background: var(--surface-2); color: var(--text-3); }
.st-expired { background: var(--surface-2); color: var(--text-3); }
.st-refunded { background: var(--tint-red); color: var(--c-red); }

/* ---------- 套餐行内编辑 ---------- */
.cell-input {
  width: 100%;
  min-width: 90px;
  background: var(--surface-2);
  border: 1px solid var(--border-1);
  color: var(--text-1);
  border-radius: 8px;
  padding: 6px 9px;
  font-size: 0.86rem;
}

.cell-input:focus {
  outline: none;
  border-color: var(--brand-500);
}

.num-input {
  min-width: 80px;
  text-align: right;
}

.switch {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  color: var(--text-2);
  font-size: 0.85rem;
  white-space: nowrap;
}

.switch input {
  accent-color: var(--brand-500);
}

/* ---------- 按钮 / 分页 ---------- */
.btn {
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-1);
  border-radius: 8px;
  padding: 7px 14px;
  cursor: pointer;
  font-size: 0.88rem;
  transition: background 0.15s, opacity 0.15s;
}

.btn:hover {
  background: var(--surface-3);
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

.btn-primary:hover {
  background: var(--brand-600);
}

.btn-danger {
  background: var(--tint-red);
  border-color: var(--tint-red-border);
  color: var(--c-red);
}

.btn-mini {
  padding: 4px 10px;
  font-size: 0.8rem;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  margin-top: 14px;
  font-size: 0.88rem;
}

/* ---------- 提示 ---------- */
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

@media (max-width: 720px) {
  .chart-card {
    grid-column: span 1;
  }
}
</style>
