<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  cancelMembershipOrder,
  createMembershipOrder,
  fetchMembershipPlans,
  fetchMembershipStatus,
  fetchMyOrders,
  fetchOrder,
  fmtCents,
  mockPayOrder,
} from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'

/**
 * 会员中心：价格表 / 权益介绍 / 下单收银台（演示收款码 + 轮询支付状态）/ 我的订单。
 *
 * 支付为「演示 / 沙箱」实现：未接真实微信/支付宝网关 ——
 * - 「模拟支付」渠道：点一下立即支付成功（后端 sandbox 模式）；
 * - 「支付宝 / 微信支付」：渲染演示收款码（收银台占位链接生成），实际确认靠
 *   沙箱模拟支付按钮 / 网关回调 / 管理员手工确认。
 */
const router = useRouter()
const userStore = useUserStore()

const plans = ref([])
const sandbox = ref(true)
const status = ref(null) // { active, expireAt, daysLeft, rateMultiplier }
const orders = ref([])
const loading = ref(true)
const loadError = ref('')
const toast = reactive({ type: '', text: '' })

// ---------- 收银台弹窗 ----------
const checkout = reactive({
  visible: false,
  plan: null,
  channel: 'alipay',
  order: null,       // OrderView
  expiresInSeconds: 0,
  paying: false,
  error: '',
})
const qrCanvas = ref(null)
let pollTimer = null
let tickTimer = null
let remainSeconds = 0

const channels = computed(() => {
  const list = [
    { id: 'alipay', label: '支付宝', desc: '演示环境', icon: '🅰' },
    { id: 'wechat', label: '微信支付', desc: '演示环境', icon: '💬' },
  ]
  if (sandbox.value) {
    list.unshift({ id: 'mock', label: '模拟支付', desc: '沙箱：点击即支付成功', icon: '⚡' })
  }
  return list
})

const statusText = {
  pending: '待支付',
  paid: '已支付',
  cancelled: '已取消',
  expired: '已过期',
  refunded: '已退款',
}
const statusClass = {
  pending: 'st-pending',
  paid: 'st-paid',
  cancelled: 'st-cancelled',
  expired: 'st-expired',
  refunded: 'st-refunded',
}

const orderStatusText = (s) => statusText[s] || s
const money = (c) => fmtCents(c)
const fmtTime = (t) => (t ? String(t).replace('T', ' ').slice(0, 16) : '—')
const isPending = (o) => o?.status === 'pending'

onMounted(async () => {
  await userStore.init()
  await load()
})

onBeforeUnmount(() => stopTimers())

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

async function load() {
  loading.value = true
  loadError.value = ''
  try {
    const res = await fetchMembershipPlans()
    plans.value = res.plans || []
    sandbox.value = !!res.sandbox
    if (userStore.isLoggedIn) {
      status.value = await fetchMembershipStatus().catch(() => null)
      const mine = await fetchMyOrders().catch(() => null)
      orders.value = mine?.orders || []
    }
  } catch (err) {
    loadError.value = err.message || '会员服务加载失败'
  } finally {
    loading.value = false
  }
}

// ---------- 下单 / 收银台 ----------

async function buy(plan) {
  if (!userStore.isLoggedIn) {
    router.push({ name: 'Login', query: { redirect: '/membership' } })
    return
  }
  checkout.plan = plan
  checkout.channel = sandbox.value ? 'mock' : 'alipay'
  checkout.order = null
  checkout.error = ''
  checkout.visible = true
}

async function submitOrder() {
  if (!checkout.plan || checkout.paying) return
  checkout.paying = true
  checkout.error = ''
  try {
    const res = await createMembershipOrder(checkout.plan.id, checkout.channel)
    checkout.order = res.order
    checkout.expiresInSeconds = res.expiresInSeconds || 1800
    remainSeconds = remainOf(res.order, checkout.expiresInSeconds)
    startTimers()
  } catch (err) {
    checkout.error = err.message || '下单失败'
  } finally {
    checkout.paying = false
  }
}

function remainOf(order, fallback) {
  if (!order?.expiresAt) return fallback
  const t = new Date(String(order.expiresAt).replace(' ', 'T') + 'Z').getTime()
  return Math.max(0, Math.floor((t - Date.now()) / 1000))
}

function startTimers() {
  stopTimers()
  tickTimer = setInterval(() => {
    if (remainSeconds > 0) remainSeconds -= 1
  }, 1000)
  pollTimer = setInterval(async () => {
    if (!checkout.order || !isPending(checkout.order)) return stopTimers()
    try {
      const fresh = await fetchOrder(checkout.order.orderNo)
      checkout.order = fresh
      if (!isPending(fresh)) {
        stopTimers()
        await onPaid()
      }
    } catch { /* 轮询失败忽略下一轮再试 */ }
  }, 3000)
}

function stopTimers() {
  if (pollTimer) clearInterval(pollTimer)
  if (tickTimer) clearInterval(tickTimer)
  pollTimer = null
  tickTimer = null
}

const remainText = computed(() => {
  const s = Math.max(0, remainSeconds)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})

async function payNow() {
  if (!checkout.order || checkout.paying) return
  checkout.paying = true
  checkout.error = ''
  try {
    const fresh = await mockPayOrder(checkout.order.orderNo)
    checkout.order = fresh
    stopTimers()
    await onPaid()
  } catch (err) {
    checkout.error = err.message || '支付失败'
  } finally {
    checkout.paying = false
  }
}

async function cancelOrder() {
  if (!checkout.order) return
  try {
    await cancelMembershipOrder(checkout.order.orderNo)
    checkout.order = { ...checkout.order, status: 'cancelled' }
    stopTimers()
    say('ok', '订单已取消')
    await load()
  } catch (err) {
    checkout.error = err.message || '取消失败'
  }
}

async function onPaid() {
  say('ok', '支付成功，会员已开通/顺延 🎉')
  await userStore.reload()
  await load()
}

function closeCheckout() {
  stopTimers()
  checkout.visible = false
}

function goPayExisting(order) {
  // 从「我的订单」继续支付：复用收银台
  const plan = plans.value.find((p) => p.id === order.planId) || {
    id: order.planId, name: order.planName, priceCents: order.amountCents,
  }
  checkout.plan = plan
  checkout.channel = order.payChannel
  checkout.order = order
  checkout.error = ''
  checkout.visible = true
  remainSeconds = remainOf(order, 30 * 60)
  startTimers()
}

async function cancelExisting(order) {
  try {
    await cancelMembershipOrder(order.orderNo)
    say('ok', `订单 ${order.orderNo} 已取消`)
    await load()
  } catch (err) {
    say('err', err.message || '取消失败')
  }
}

/** 演示收款码：以订单号为种子画一个「长得像二维码」的确定性图案（非真实支付码）。 */
function drawQr(canvas) {
  if (!canvas || !checkout.order) return
  const n = 25
  const scale = 8
  canvas.width = canvas.height = n * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#161616'
  let h = 2166136261
  const seed = checkout.order.orderNo + '|' + checkout.order.payChannel
  for (const c of seed) {
    h ^= c.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  let s = h >>> 0
  const rand = () => {
    s ^= s << 13; s >>>= 0
    s ^= s >>> 17
    s ^= s << 5; s >>>= 0
    return s / 4294967296
  }
  const inFinder = (x, y) => (x < 8 && y < 8) || (x >= n - 8 && y < 8) || (x < 8 && y >= n - 8)
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!inFinder(x, y) && rand() < 0.45) {
        ctx.fillRect(x * scale, y * scale, scale, scale)
      }
    }
  }
  const finder = (fx, fy) => {
    ctx.fillRect(fx * scale, fy * scale, 7 * scale, 7 * scale)
    ctx.fillStyle = '#ffffff'
    ctx.fillRect((fx + 1) * scale, (fy + 1) * scale, 5 * scale, 5 * scale)
    ctx.fillStyle = '#161616'
    ctx.fillRect((fx + 2) * scale, (fy + 2) * scale, 3 * scale, 3 * scale)
  }
  finder(0, 0)
  finder(n - 7, 0)
  finder(0, n - 7)
}

/** 订单变化（进入待支付 / 轮询更新）后重画演示收款码。 */
watch(
  () => (checkout.order ? checkout.order.orderNo + '|' + checkout.order.status : ''),
  async () => {
    await nextTick()
    if (qrCanvas.value && checkout.order && isPending(checkout.order)) {
      drawQr(qrCanvas.value)
    }
  }
)
</script>

<template>
  <div class="member-page">
    <!-- 顶部：状态 / 权益 -->
    <section class="member-hero">
      <div class="hero-text">
        <h2>会员中心</h2>
        <p class="hero-sub">
          开通会员解锁更强学习体验：AI 助教提问额度翻倍、专属标识、新功能优先体验。
          <span v-if="status?.active" class="vip-chip">会员生效中 · 剩余 {{ status.daysLeft }} 天</span>
        </p>
        <p v-if="status?.active" class="hero-expire">到期时间：{{ fmtTime(status.expireAt) }}（续费自动顺延，不清零）</p>
        <p v-if="userStore.isLoggedIn && status && !status.active" class="hero-expire">当前为免费账户，开通会员立享全部权益</p>
        <p v-if="!userStore.isLoggedIn" class="hero-expire">
          你尚未登录，
          <router-link :to="{ name: 'Login', query: { redirect: '/membership' } }" class="link">登录</router-link>
          后即可开通
        </p>
      </div>
      <div class="hero-perks">
        <div class="perk"><span class="perk-icon">🤖</span><b>AI 提问 ×3</b><small>每分钟提问上限 3 倍</small></div>
        <div class="perk"><span class="perk-icon">📺</span><b>可视化无限回放</b><small>动画演示随时重看</small></div>
        <div class="perk"><span class="perk-icon">🎖️</span><b>专属会员标识</b><small>顶栏 VIP 徽章</small></div>
        <div class="perk"><span class="perk-icon">🚀</span><b>新功能优先</b><small>抢先体验新玩法</small></div>
      </div>
    </section>

    <div v-if="toast.text" class="toast" :class="toast.type === 'ok' ? 'toast-ok' : 'toast-err'">{{ toast.text }}</div>
    <div v-if="loadError" class="page-error">{{ loadError }}</div>

    <!-- 套餐 -->
    <section class="plans">
      <h3 class="section-title">选择套餐</h3>
      <div v-if="loading" class="muted">加载中…</div>
      <div v-else class="plan-grid">
        <div
          v-for="p in plans"
          :key="p.id"
          class="plan-card"
          :class="{ hot: p.id === 'quarterly' }"
        >
          <div v-if="p.id === 'quarterly'" class="hot-badge">最受欢迎</div>
          <h4 class="plan-name">{{ p.name }}</h4>
          <div class="plan-price">
            <span class="price">{{ money(p.priceCents) }}</span>
            <span v-if="p.originalPriceCents" class="original">{{ money(p.originalPriceCents) }}</span>
          </div>
          <div class="plan-meta">
            {{ p.durationDays }} 天
            <template v-if="p.monthlyAvgCents"> · 折合 {{ money(p.monthlyAvgCents) }}/月</template>
          </div>
          <p class="plan-desc">{{ p.description }}</p>
          <ul class="plan-features">
            <li v-for="f in p.features || []" :key="f">✓ {{ f }}</li>
          </ul>
          <button class="btn btn-primary" @click="buy(p)">
            {{ status?.active ? '续费' : '立即开通' }}
          </button>
        </div>
      </div>
      <p class="demo-note">
        当前为<b>演示 / 沙箱</b>支付环境：不会产生真实扣款；接入真实微信 / 支付宝网关后，
        渠道回调由后端验签确认（HMAC-SHA256），退款不回收已生效会员。
      </p>
    </section>

    <!-- 我的订单 -->
    <section v-if="userStore.isLoggedIn" class="orders">
      <h3 class="section-title">我的订单</h3>
      <div v-if="!orders.length" class="muted">还没有订单，选个套餐开通吧～</div>
      <div v-else class="order-table-wrap">
        <table class="order-table">
          <thead>
            <tr>
              <th>订单号</th><th>套餐</th><th class="num">金额</th><th>状态</th><th>渠道</th>
              <th>创建时间</th><th>支付时间</th><th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="o in orders" :key="o.orderNo">
              <td class="mono">{{ o.orderNo }}</td>
              <td>{{ o.planName }}</td>
              <td class="num">{{ money(o.amountCents) }}</td>
              <td><span class="st" :class="statusClass[o.status]">{{ orderStatusText(o.status) }}</span></td>
              <td>{{ { mock: '模拟', alipay: '支付宝', wechat: '微信' }[o.payChannel] || o.payChannel }}</td>
              <td>{{ fmtTime(o.createdAt) }}</td>
              <td>{{ fmtTime(o.paidAt) }}</td>
              <td class="ops">
                <button v-if="isPending(o)" class="btn btn-mini btn-primary" @click="goPayExisting(o)">去支付</button>
                <button v-if="isPending(o)" class="btn btn-mini" @click="cancelExisting(o)">取消</button>
                <span v-if="o.status === 'refunded'" class="muted">款项原路退回</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 收银台弹窗 -->
    <div v-if="checkout.visible" class="modal-mask" @click.self="closeCheckout">
      <div class="modal">
        <header class="modal-head">
          <h4>收银台</h4>
          <button class="modal-close" @click="closeCheckout">×</button>
        </header>

        <div v-if="checkout.plan" class="pay-plan">
          <span class="pay-plan-name">{{ checkout.plan.name }}</span>
          <span class="pay-plan-price">{{ money(checkout.plan.priceCents) }}</span>
        </div>

        <!-- 第一步：选渠道 -->
        <div v-if="!checkout.order" class="channel-list">
          <label
            v-for="c in channels"
            :key="c.id"
            class="channel"
            :class="{ picked: checkout.channel === c.id }"
          >
            <input v-model="checkout.channel" type="radio" :value="c.id" name="channel" />
            <span class="ch-icon">{{ c.icon }}</span>
            <span class="ch-text"><b>{{ c.label }}</b><small>{{ c.desc }}</small></span>
          </label>
        </div>
        <button v-if="!checkout.order" class="btn btn-primary btn-block" :disabled="checkout.paying" @click="submitOrder">
          {{ checkout.paying ? '下单中…' : `确认支付 ${checkout.plan ? money(checkout.plan.priceCents) : ''}` }}
        </button>

        <!-- 第二步：支付 -->
        <template v-else>
          <div class="pay-status-line">
            <span>订单号 <b class="mono">{{ checkout.order.orderNo }}</b></span>
            <span v-if="isPending(checkout.order)" class="countdown">剩余支付时间 <b>{{ remainText }}</b></span>
          </div>

          <div v-if="isPending(checkout.order)" class="qr-wrap">
            <canvas ref="qrCanvas" class="qr-canvas"></canvas>
            <p class="qr-note">请使用{{ { alipay: '支付宝', wechat: '微信', mock: '' }[checkout.order.payChannel] || '' }}扫码支付</p>
            <p class="qr-demo">（演示环境示意码，非真实收款码）</p>
          </div>

          <div v-if="checkout.order.status === 'paid'" class="pay-done">
            ✅ 支付成功！会员已{{ status?.active ? '顺延' : '开通' }}
          </div>
          <div v-else-if="checkout.order.status === 'cancelled'" class="pay-done muted">订单已取消</div>
          <div v-else-if="checkout.order.status === 'expired'" class="pay-done muted">订单已超时，请重新下单</div>

          <p v-if="checkout.error" class="form-error">{{ checkout.error }}</p>

          <div class="modal-ops">
            <button
              v-if="isPending(checkout.order) && sandbox"
              class="btn btn-primary"
              :disabled="checkout.paying"
              @click="payNow"
            >{{ checkout.paying ? '支付中…' : '模拟支付成功（沙箱）' }}</button>
            <button v-if="isPending(checkout.order)" class="btn" @click="cancelOrder">取消订单</button>
            <button v-if="!isPending(checkout.order)" class="btn btn-primary" @click="closeCheckout">完成</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.member-page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 28px 20px 48px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1.15rem;
}

.muted {
  color: var(--text-3);
}

.link {
  color: var(--c-blue);
}

.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: 0.85em;
}

/* ---------- 顶部 ---------- */
.member-hero {
  display: flex;
  gap: 28px;
  align-items: stretch;
  justify-content: space-between;
  flex-wrap: wrap;
  background:
    radial-gradient(600px 200px at 12% 0%, var(--tint-purple), transparent 70%),
    radial-gradient(500px 220px at 95% 20%, var(--tint-amber), transparent 70%),
    var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 16px;
  padding: 28px;
  margin-bottom: 28px;
}

.hero-text h2 {
  margin: 0 0 10px;
  font-size: 1.6rem;
}

.hero-sub {
  margin: 0 0 6px;
  color: var(--text-2);
  max-width: 560px;
  line-height: 1.7;
}

.hero-expire {
  margin: 4px 0 0;
  color: var(--text-3);
  font-size: 0.9rem;
}

.vip-chip {
  display: inline-block;
  margin-left: 6px;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--tint-amber);
  color: var(--c-amber);
  font-size: 0.82rem;
  font-weight: 600;
}

.hero-perks {
  display: grid;
  grid-template-columns: repeat(2, minmax(130px, 1fr));
  gap: 10px;
  align-content: center;
}

.perk {
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  padding: 12px 14px;
}

.perk-icon {
  font-size: 1.2rem;
}

.perk b {
  font-size: 0.92rem;
}

.perk small {
  color: var(--text-3);
}

/* ---------- 套餐卡片 ---------- */
.plans {
  margin-bottom: 32px;
}

.plan-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.plan-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 14px;
  padding: 22px 20px;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
}

.plan-card:hover {
  transform: translateY(-3px);
  border-color: var(--border-2);
}

.plan-card.hot {
  border-color: var(--tint-amber-border);
  box-shadow: 0 8px 28px var(--tint-amber);
}

.hot-badge {
  position: absolute;
  top: -10px;
  right: 16px;
  padding: 3px 10px;
  border-radius: 999px;
  background: linear-gradient(120deg, #ffb84d, var(--c-amber));
  color: #3a2a00;
  font-size: 0.75rem;
  font-weight: 700;
}

.plan-name {
  margin: 0 0 8px;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.price {
  font-size: 2rem;
  font-weight: 700;
  color: var(--c-amber);
}

.original {
  color: var(--text-3);
  text-decoration: line-through;
  font-size: 0.95rem;
}

.plan-meta {
  color: var(--text-3);
  font-size: 0.85rem;
  margin-top: 4px;
}

.plan-desc {
  color: var(--text-2);
  font-size: 0.9rem;
  margin: 10px 0 8px;
}

.plan-features {
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  color: var(--text-2);
  font-size: 0.88rem;
  line-height: 1.9;
  flex: 1;
}

.demo-note {
  margin-top: 16px;
  color: var(--text-3);
  font-size: 0.85rem;
  line-height: 1.7;
}

/* ---------- 按钮 ---------- */
.btn {
  border: 1px solid var(--border-2);
  background: var(--surface-2);
  color: var(--text-1);
  border-radius: 10px;
  padding: 9px 16px;
  cursor: pointer;
  font-size: 0.9rem;
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

.btn-block {
  width: 100%;
  margin-top: 14px;
}

.btn-mini {
  padding: 4px 10px;
  font-size: 0.8rem;
  border-radius: 8px;
}

/* ---------- 我的订单 ---------- */
.orders {
  margin-bottom: 24px;
}

.order-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--border-1);
  border-radius: 12px;
}

.order-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88rem;
  min-width: 760px;
}

.order-table th,
.order-table td {
  padding: 10px 12px;
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

/* ---------- 收银台弹窗 ---------- */
.modal-mask {
  position: fixed;
  inset: 0;
  background: var(--overlay-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
  padding: 20px;
}

.modal {
  width: min(420px, 100%);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 14px;
  padding: 18px 20px 20px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
}

.modal-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-head h4 {
  margin: 0;
}

.modal-close {
  border: none;
  background: transparent;
  color: var(--text-3);
  font-size: 1.4rem;
  cursor: pointer;
  line-height: 1;
}

.modal-close:hover {
  color: var(--text-1);
}

.pay-plan {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 10px;
  padding: 10px 14px;
  margin-bottom: 14px;
}

.pay-plan-name {
  font-weight: 600;
}

.pay-plan-price {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--c-amber);
}

.channel-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.channel {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--border-1);
  border-radius: 10px;
  padding: 10px 12px;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.channel:hover {
  background: var(--surface-muted);
}

.channel.picked {
  border-color: var(--brand-500);
  background: var(--brand-50);
}

.channel input {
  accent-color: var(--brand-500);
}

.ch-icon {
  font-size: 1.1rem;
}

.ch-text {
  display: flex;
  flex-direction: column;
  line-height: 1.35;
}

.ch-text small {
  color: var(--text-3);
}

.pay-status-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
  color: var(--text-2);
  font-size: 0.88rem;
  margin-bottom: 12px;
}

.countdown b {
  color: var(--c-orange);
  font-variant-numeric: tabular-nums;
}

.qr-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 10px 0 4px;
}

.qr-canvas {
  border-radius: 10px;
  width: 200px;
  height: 200px;
}

.qr-note {
  margin: 0;
  color: var(--text-2);
  font-size: 0.88rem;
}

.qr-demo {
  margin: 0;
  color: var(--text-3);
  font-size: 0.78rem;
}

.pay-done {
  text-align: center;
  padding: 22px 0;
  font-size: 1.05rem;
  color: var(--c-green);
}

.form-error {
  color: var(--c-red);
  font-size: 0.85rem;
  margin: 8px 0 0;
}

.modal-ops {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ---------- 杂项 ---------- */
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
  .hero-perks {
    grid-template-columns: repeat(2, 1fr);
    width: 100%;
  }
}
</style>
