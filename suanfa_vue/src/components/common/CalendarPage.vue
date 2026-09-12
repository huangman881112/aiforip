<script setup>
// 学习日历：按月展示学习活跃（进度标记/笔记/评论/刷题行为派生），并统计连续学习天数
import { computed, onMounted, ref, watch } from 'vue'
import { fetchActivity } from '../../api/client.js'
import { useUserStore } from '../../stores/user.js'

const userStore = useUserStore()

const now = new Date()
const year = ref(now.getFullYear())
const month = ref(now.getMonth()) // 0-11
const activities = ref([])
const loading = ref(true)
const error = ref('')

const WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六']
const MONTH_LABEL = computed(() => `${year.value} 年 ${month.value + 1} 月`)

/** 'YYYY-MM-DD' -> 活跃次数 */
const activityMap = computed(() => {
  const map = {}
  for (const a of activities.value) map[a.date] = a.count
  return map
})

function dateKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
}

/** 当月日历格子：前置空格 + 每日数据 */
const cells = computed(() => {
  const first = new Date(year.value, month.value, 1)
  const days = new Date(year.value, month.value + 1, 0).getDate()
  const list = Array.from({ length: first.getDay() }, () => null)
  const todayStr = dateKey(now.getFullYear(), now.getMonth(), now.getDate())
  for (let d = 1; d <= days; d++) {
    const key = dateKey(year.value, month.value, d)
    list.push({
      day: d,
      key,
      count: activityMap.value[key] || 0,
      isToday: key === todayStr,
    })
  }
  return list
})

/** 活跃度分档样式（1-2 次 light，3-5 次 mid，>5 强） */
function levelClass(count) {
  if (count <= 0) return ''
  if (count <= 2) return 'cell-light'
  if (count <= 5) return 'cell-mid'
  return 'cell-strong'
}

const monthActiveDays = computed(
  () => cells.value.filter((c) => c && c.count > 0).length
)

const totalActiveDays = computed(() => Object.keys(activityMap.value).length)

/** 连续学习天数：从今天（或昨天）往前数 */
const streak = computed(() => {
  const map = activityMap.value
  let d = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (!map[dateKey(d.getFullYear(), d.getMonth(), d.getDate())]) {
    d = new Date(d.getTime() - 86400000)
    if (!map[dateKey(d.getFullYear(), d.getMonth(), d.getDate())]) return 0
  }
  let n = 0
  for (;;) {
    const key = dateKey(d.getFullYear(), d.getMonth(), d.getDate())
    if (!map[key]) break
    n++
    d = new Date(d.getTime() - 86400000)
  }
  return n
})

async function load() {
  if (!userStore.isLoggedIn) return
  loading.value = true
  error.value = ''
  try {
    activities.value = (await fetchActivity(userStore.user.id)) || []
  } catch (err) {
    error.value = `日历数据加载失败：${err.message}`
  } finally {
    loading.value = false
  }
}

onMounted(load)
watch(() => userStore.isLoggedIn, load)

function prevMonth() {
  if (month.value === 0) { month.value = 11; year.value-- }
  else month.value--
}

function nextMonth() {
  if (month.value === 11) { month.value = 0; year.value++ }
  else month.value++
}

function goToday() {
  year.value = now.getFullYear()
  month.value = now.getMonth()
}
</script>

<template>
  <div class="calendar-page">
    <div class="calendar-container">
      <header class="calendar-header">
        <h2>📅 学习日历</h2>
        <p class="calendar-sub">标记进度、写笔记、发评论、刷题都会记录为当日学习活跃</p>
      </header>

      <div class="calendar-stats">
        <div class="stat-card">
          <span class="stat-value">{{ monthActiveDays }}</span>
          <span class="stat-label">本月学习天数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">🔥 {{ streak }}</span>
          <span class="stat-label">连续学习天数</span>
        </div>
        <div class="stat-card">
          <span class="stat-value">{{ totalActiveDays }}</span>
          <span class="stat-label">累计活跃天数</span>
        </div>
      </div>

      <div class="calendar-board">
        <div class="calendar-toolbar">
          <button class="cal-nav-btn" @click="prevMonth">‹ 上月</button>
          <span class="cal-month">{{ MONTH_LABEL }}</span>
          <button class="cal-nav-btn" @click="nextMonth">下月 ›</button>
          <button class="cal-nav-btn cal-nav-today" @click="goToday">回到本月</button>
        </div>

        <p v-if="loading" class="cal-tip">加载中…</p>
        <p v-else-if="error" class="cal-tip cal-tip-err">{{ error }}</p>

        <div class="cal-weekdays">
          <span v-for="w in WEEK_LABELS" :key="w">{{ w }}</span>
        </div>
        <div class="cal-grid">
          <div
            v-for="(cell, i) in cells"
            :key="i"
            class="cal-cell"
            :class="[cell && levelClass(cell.count), cell && cell.isToday ? 'cell-today' : '']"
          >
            <template v-if="cell">
              <span class="cal-day">{{ cell.day }}</span>
              <span v-if="cell.count" class="cal-badge">{{ cell.count }}</span>
            </template>
          </div>
        </div>

        <div class="calendar-legend">
          <span><i class="lg lg-none"></i>未学习</span>
          <span><i class="lg lg-light"></i>1-2 次</span>
          <span><i class="lg lg-mid"></i>3-5 次</span>
          <span><i class="lg lg-strong"></i>6 次以上</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calendar-page {
  width: 100%;
  padding: 30px 24px 60px;
  background: var(--surface-muted);
}

.calendar-container {
  max-width: 860px;
  margin: 0 auto;
}

.calendar-header h2 {
  margin: 0 0 6px;
  color: var(--text-1);
}

.calendar-sub {
  margin: 0 0 20px;
  color: var(--text-2);
  font-size: 0.92em;
}

.calendar-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 14px;
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 18px 10px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
}

.stat-value {
  font-size: 1.6em;
  font-weight: 700;
  color: var(--c-blue);
}

.stat-label {
  font-size: 0.85em;
  color: var(--text-2);
}

.calendar-board {
  padding: 20px;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
}

.calendar-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 14px;
}

.cal-month {
  min-width: 120px;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--text-1);
  text-align: center;
}

.cal-nav-btn {
  padding: 6px 14px;
  font-size: 0.9em;
  color: var(--text-2);
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 6px;
  cursor: pointer;
}

.cal-nav-btn:hover {
  color: var(--c-blue);
  border-color: #1e88e5;
}

.cal-nav-today {
  margin-left: auto;
}

.cal-tip {
  color: var(--text-2);
  text-align: center;
}

.cal-tip-err {
  color: var(--c-red);
}

.cal-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  margin-bottom: 6px;
}

.cal-weekdays span {
  padding: 6px 0;
  font-size: 0.85em;
  font-weight: 600;
  color: var(--text-2);
  text-align: center;
}

.cal-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.cal-cell {
  position: relative;
  aspect-ratio: 1.4;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-1);
  border-radius: 8px;
  background: var(--surface-muted);
}

.cal-day {
  font-size: 0.95em;
  color: var(--text-2);
}

.cal-badge {
  position: absolute;
  top: 4px;
  right: 6px;
  min-width: 16px;
  padding: 0 4px;
  font-size: 0.68em;
  color: #fff;
  background: #1e88e5;
  border-radius: 999px;
}

.cell-light { background: var(--tint-blue); }
.cell-mid { background: var(--tint-blue); }
.cell-strong { background: #1e88e5; }
.cell-strong .cal-day { color: #fff; font-weight: 600; }
.cell-mid .cal-day { color: var(--text-1); }

.cell-today {
  outline: 2px solid #ff8f00;
  outline-offset: -2px;
}

.calendar-legend {
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  margin-top: 14px;
  font-size: 0.8em;
  color: var(--text-2);
}

.calendar-legend span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.lg {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  display: inline-block;
}

.lg-none { background: var(--surface-muted); border: 1px solid var(--border-1); }
.lg-light { background: var(--tint-blue); }
.lg-mid { background: var(--tint-blue); }
.lg-strong { background: #1e88e5; }
</style>
