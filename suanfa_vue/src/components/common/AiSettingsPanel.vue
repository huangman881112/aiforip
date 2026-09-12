<script setup>
// AI 中转站配置面板（仅管理员可见）：第三方 OpenAI 兼容端点的地址 / token / 模型选择，
// 以及每个模型「是否对普通用户开放」（userVisible）—— 管理员才能看到全量模型清单。
// 支持「测试连接」（拉模型清单 + 小预算对话），保存后由后端热加载，无需重启。
// 语义与 backend/.env 的 AI_PROVIDERS_JSON 完全一致，两边可互拷排查。
import { computed, reactive, ref, watch } from 'vue'
import {
  aiResetSettings,
  aiSaveSettings,
  aiSettings,
  aiTestConnection,
} from '../../api/client.js'

const props = defineProps({ visible: Boolean })
const emit = defineEmits(['close', 'saved'])

const loading = ref(false)
const saving = ref(false)
const errorMsg = ref('')
const infoMsg = ref('')
const providers = ref([]) // 可编辑：origin === 'runtime'
const envProviders = ref([]) // 只读：yml / 环境变量（含旧写法合成的那条）
const env = ref(null)
const effective = ref([])
/** 数据库 app_settings 里是否存在页面配置（比 providers 数组更可靠：读取失败/全非法时为 true 但列表为空）。 */
const hasRuntime = ref(false)
const showEnv = ref(false)
const testResults = reactive({}) // provider.id -> 测试结果
const testing = reactive({})

const EFFORTS = [
  { value: '', label: '不传（默认）' },
  { value: 'minimal', label: 'minimal' },
  { value: 'low', label: 'low' },
  { value: 'medium', label: 'medium' },
  { value: 'high', label: 'high' },
]

const REASONING_HINT =
  '本地/自建的思考型模型（如 llama.cpp、Ollama）常把 max_tokens 全花在 reasoning 上，' +
  '需要更大的 max_tokens 并把 reasoning_effort 设为 low'

function blankModel() {
  return {
    name: '',
    label: '',
    enabled: true,
    userVisible: true,
    primary: false,
    maxTokens: null,
    timeoutSeconds: null,
    reasoningEffort: '',
    note: '',
  }
}

function blankProvider() {
  const n = providers.value.length + 1
  return {
    id: `relay-${n}`,
    label: `中转站 ${n}`,
    baseUrl: '',
    apiKey: '',
    apiKeySet: false,
    apiKeyMasked: '',
    enabled: true,
    requireKey: true,
    headers: {},
    maxTokens: null,
    timeoutSeconds: null,
    models: [blankModel()],
    origin: 'runtime',
  }
}

function fromDto(p) {
  return {
    id: p.id,
    label: p.label || p.id,
    baseUrl: p.baseUrl || '',
    apiKey: '', // 永不回填真实 token，留空表示沿用
    apiKeySet: !!p.apiKeySet,
    apiKeyMasked: p.apiKeyMasked || '',
    enabled: p.enabled !== false,
    requireKey: p.requireKey !== false,
    headers: { ...(p.headers || {}) },
    maxTokens: p.maxTokens ?? null,
    timeoutSeconds: p.timeoutSeconds ?? null,
    models: (p.models || []).map((m) => ({
      name: m.name,
      label: m.label || m.name,
      enabled: m.enabled !== false,
      // 存量配置没有这个字段 → 默认开放（保持旧行为）
      userVisible: m.userVisible !== false,
      primary: !!m.primary,
      maxTokens: m.maxTokens ?? null,
      timeoutSeconds: m.timeoutSeconds ?? null,
      reasoningEffort: m.reasoningEffort || '',
      note: m.note || '',
    })),
    origin: p.origin,
  }
}

async function reload() {
  loading.value = true
  errorMsg.value = ''
  try {
    const s = await aiSettings()
    hasRuntime.value = !!s.hasRuntimeOverride
    providers.value = (s.providers || []).filter((p) => p.origin === 'runtime').map(fromDto)
    envProviders.value = (s.providers || []).filter((p) => p.origin !== 'runtime')
    env.value = s.env || null
    effective.value = s.effective || []
  } catch (err) {
    errorMsg.value = err.status === 403 ? '仅管理员可配置 AI 中转站' : err.message || '读取配置失败'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.visible,
  (v) => {
    if (v) {
      infoMsg.value = ''
      Object.keys(testResults).forEach((k) => delete testResults[k])
      reload()
    }
  },
)

// ------------------------------------------------------------ providers 编辑

function addProvider() {
  providers.value.push(blankProvider())
}

function removeProvider(i) {
  const removed = providers.value.splice(i, 1)[0]
  if (removed) delete testResults[removed.id]
}

function addModel(p) {
  p.models.push(blankModel())
}

function removeModel(p, i) {
  const wasPrimary = p.models[i]?.primary
  p.models.splice(i, 1)
  if (wasPrimary) setPrimary(p, i === 0 ? 0 : i - 1)
}

/** 主模型全局唯一：前端就保证只勾一个，后端也会兜底只留第一个。 */
function setPrimary(p, i) {
  providers.value.forEach((pp) => pp.models.forEach((m) => { m.primary = false }))
  if (p.models[i]) p.models[i].primary = true
}

function isPrimary(p, i) {
  return !!p.models[i]?.primary
}

// ------------------------------------------------------------ 请求头（高级）

function headerPairs(p) {
  return Object.entries(p.headers || {}).map(([k, v]) => ({ k, v }))
}

function setHeader(p, idx, entry) {
  const old = headerPairs(p)[idx]
  const next = { ...(p.headers || {}) }
  if (old && old.k !== entry.k) delete next[old.k]
  if (entry.k.trim()) next[entry.k.trim()] = entry.v
  p.headers = next
}

function addHeader(p) {
  p.headers = { ...(p.headers || {}), 'X-Title': 'suanfa-ai' }
}

function dropHeader(p, key) {
  const next = { ...(p.headers || {}) }
  delete next[key]
  p.headers = next
}

// ------------------------------------------------------------ 测试连接

function firstTestableModel(p) {
  const en = p.models.filter((m) => m.name && m.enabled !== false)
  return (en.find((m) => m.primary) || en[0] || {}).name || ''
}

async function testOne(p) {
  if (!p.baseUrl?.trim()) {
    errorMsg.value = '请先填写该中转站的 API 地址（通常以 /v1 结尾）'
    return
  }
  errorMsg.value = ''
  testing[p.id] = true
  try {
    // 传「草稿」：token 留空时后端沿用已存的；未保存的新地址也能直接测
    const out = await aiTestConnection({
      providerId: p.id,
      baseUrl: p.baseUrl.trim(),
      apiKey: p.apiKey?.trim() || '',
      model: firstTestableModel(p),
      headers: p.headers || {},
    })
    testResults[p.id] = out
    if (out.error) errorMsg.value = out.error
  } catch (err) {
    testResults[p.id] = { ok: false, error: err.message || '测试失败' }
  } finally {
    testing[p.id] = false
  }
}

/** 把测试拿到的模型名加入配置（中转站路由名常与厂商名不同，先拉再挑最省事）；已存在的跳过。 */
function adoptModels(p, list) {
  const names = (list || []).filter(Boolean)
  if (!names.length) return
  const existing = new Set(p.models.map((m) => m.name))
  const firstBlank = p.models.find((m) => !m.name) || null
  let usedBlank = false
  let added = 0
  names.slice(0, 40).forEach((n) => {
    if (existing.has(n)) return
    existing.add(n)
    added++
    if (!usedBlank && firstBlank) {
      firstBlank.name = n
      firstBlank.label = n
      usedBlank = true
      return
    }
    p.models.push({ ...blankModel(), name: n, label: n })
  })
  if (added) infoMsg.value = `已加入 ${added} 个模型名（中转站真实路由名），记得勾掉不用的`
  else infoMsg.value = '这些模型已经在列表里了'
}

// ------------------------------------------------------------ 保存 / 重置

function payload() {
  return providers.value.map((p) => ({
    id: p.id?.trim() || undefined,
    label: p.label?.trim() || undefined,
    baseUrl: p.baseUrl?.trim() || '',
    // 空串 = 沿用已存 token；用户点「清除」则填 __CLEAR__
    apiKey: p.apiKey?.trim() || '',
    enabled: p.enabled !== false,
    requireKey: p.requireKey !== false,
    headers: p.headers || {},
    maxTokens: numOrNull(p.maxTokens),
    timeoutSeconds: numOrNull(p.timeoutSeconds),
    models: p.models
      .filter((m) => m.name?.trim())
      .map((m) => ({
        name: m.name.trim(),
        label: m.label?.trim() || undefined,
        enabled: m.enabled !== false,
        userVisible: m.userVisible !== false,
        primary: !!m.primary,
        maxTokens: numOrNull(m.maxTokens),
        timeoutSeconds: numOrNull(m.timeoutSeconds),
        reasoningEffort: m.reasoningEffort || undefined,
        note: m.note?.trim() || undefined,
      })),
  }))
}

function numOrNull(v) {
  const n = Number(v)
  return Number.isFinite(n) && v !== '' && v !== null ? Math.trunc(n) : null
}

async function save() {
  saving.value = true
  errorMsg.value = ''
  infoMsg.value = ''
  try {
    const s = await aiSaveSettings(payload())
    hasRuntime.value = !!s.hasRuntimeOverride
    effective.value = s.effective || []
    envProviders.value = (s.providers || []).filter((p) => p.origin !== 'runtime')
    providers.value = (s.providers || []).filter((p) => p.origin === 'runtime').map(fromDto)
    infoMsg.value = '已保存并热生效（无需重启），AI 助教下拉框已更新'
    emit('saved')
  } catch (err) {
    errorMsg.value = err.message || '保存失败'
  } finally {
    saving.value = false
  }
}

async function reset() {
  if (!window.confirm('确定清空页面上配置的中转站，回退到环境变量（.env）配置？')) return
  saving.value = true
  errorMsg.value = ''
  infoMsg.value = ''
  try {
    const s = await aiResetSettings()
    // 后端返回的是重置后的完整视图，直接复用，不额外再发一次 GET
    hasRuntime.value = !!s.hasRuntimeOverride
    providers.value = (s.providers || []).filter((p) => p.origin === 'runtime').map(fromDto)
    envProviders.value = (s.providers || []).filter((p) => p.origin !== 'runtime')
    env.value = s.env || null
    effective.value = s.effective || []
    Object.keys(testResults).forEach((k) => delete testResults[k])
    infoMsg.value = '已清空页面配置，当前使用环境变量配置'
    emit('saved')
  } catch (err) {
    errorMsg.value = err.status === 403 ? '仅管理员可配置 AI 中转站' : err.message || '重置失败'
  } finally {
    saving.value = false
  }
}

const hasDraft = computed(() => providers.value.length > 0)
/** 只要数据库里有页面配置就能清空（即使表单还没渲染出条目）。 */
const canReset = computed(() => hasDraft.value || hasRuntime.value)
</script>

<template>
  <div v-if="visible" class="cfg-mask" @click.self="emit('close')">
    <div class="cfg-modal" role="dialog" aria-label="AI 中转站配置">
      <header class="cfg-head">
        <h3>⚙️ AI 中转站配置</h3>
        <span class="cfg-sub">第三方 OpenAI 兼容端点：地址 / token / 模型；保存后立即生效</span>
        <button class="cfg-x" title="关闭" @click="emit('close')">✕</button>
      </header>

      <div v-if="loading" class="cfg-loading">读取配置中…</div>

      <div v-else class="cfg-body">
        <p v-if="errorMsg" class="cfg-alert cfg-alert-err">{{ errorMsg }}</p>
        <p v-if="infoMsg" class="cfg-alert cfg-alert-ok">{{ infoMsg }}</p>

        <section class="cfg-section">
          <h4>当前生效的模型（调用顺序 = 降级顺序）</h4>
          <table v-if="effective.length" class="cfg-table">
            <thead>
              <tr>
                <th>模型</th><th>中转站</th><th>地址</th><th>来源</th><th>max_tokens</th><th>超时</th><th>状态</th><th>用户可选</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="m in effective" :key="m.token">
                <td><code>{{ m.name }}</code><span v-if="m.primary" class="cfg-star">★默认</span></td>
                <td>{{ m.providerLabel }}</td>
                <td class="cfg-url">{{ m.baseUrl }}</td>
                <td>{{ m.fromRuntime ? '页面配置' : '环境变量' }}</td>
                <td>{{ m.maxTokens }}</td>
                <td>{{ m.timeoutSeconds }}s</td>
                <td :class="m.usable ? (m.cooldownSeconds > 0 ? 'cfg-warn' : 'cfg-ok') : 'cfg-bad'">
                  {{ !m.usable ? '缺 token / 无地址' : (m.cooldownSeconds > 0 ? `熔断中（${m.cooldownSeconds}s）` : '可用') }}
                </td>
                <td :class="m.userVisible === false ? 'cfg-muted' : 'cfg-ok'">
                  {{ m.userVisible === false ? '仅管理员' : '开放' }}
                </td>
              </tr>
            </tbody>
          </table>
          <p v-else class="cfg-empty">还没有任何可用上游模型，下面配一个中转站吧。</p>
        </section>

        <section v-if="env" class="cfg-section cfg-env">
          <button class="cfg-link" @click="showEnv = !showEnv">
            {{ showEnv ? '▾' : '▸' }} 环境变量（.env）出厂配置 —— 页面配置优先级更高
          </button>
          <div v-if="showEnv" class="cfg-env-body">
            <p class="cfg-env-line">
              <code>AI_BASE_URL</code> = {{ env.baseUrl || '（未配置）' }} ·
              <code>AI_API_KEY</code> = {{ env.hasApiKey ? env.apiKeyMasked : '（未配置）' }} ·
              <code>AI_MODEL</code> = {{ env.model || '（未配置）' }} ·
              <code>AI_FALLBACK_MODELS</code> = {{ env.fallbackModels || '（未配置）' }}
            </p>
            <p v-if="env.providersJsonConfigured" class="cfg-env-line">
              另配置了 <code>AI_PROVIDERS_JSON</code>（多中转站）：
            </p>
            <ul v-if="env.providersJsonConfigured" class="cfg-env-list">
              <li v-for="p in envProviders" :key="p.id">
                <code>{{ p.id }}</code> → {{ p.baseUrl }}（{{ (p.models || []).length }} 个模型，token {{ p.apiKeySet ? '已配' : '未配' }}）
              </li>
            </ul>
            <p class="cfg-tip">
              想停掉某个「环境变量里的坏兜底模型」：在页面上新建同名 provider（id 用 <code>default</code>）
              并加一条同名、勾掉 enabled 的模型即可屏蔽它，无需改 .env 重启。
            </p>
          </div>
        </section>

        <section class="cfg-section">
          <h4>页面配置的中转站</h4>
          <p v-if="!hasDraft" class="cfg-empty">
            还没有页面配置。点「添加中转站」开始；不填则继续使用上面的环境变量配置。
          </p>

          <div v-for="(p, pi) in providers" :key="pi" class="cfg-provider">
            <div class="cfg-row cfg-provider-head">
              <input v-model="p.label" class="cfg-input cfg-input-sm" placeholder="展示名，如 中转站 A" />
              <input v-model="p.id" class="cfg-input cfg-input-xs" placeholder="id（字母数字-_）" />
              <label class="cfg-check"><input v-model="p.enabled" type="checkbox" /> 启用</label>
              <label class="cfg-check" title="本地 llama.cpp / Ollama 之类无需 token 的上游可以取消勾选">
                <input v-model="p.requireKey" type="checkbox" /> 需要 token
              </label>
              <button class="cfg-btn cfg-btn-ghost" :disabled="testing[p.id]" @click="testOne(p)">
                {{ testing[p.id] ? '测试中…' : '🔌 测试连接' }}
              </button>
              <button class="cfg-btn cfg-btn-ghost cfg-btn-danger" @click="removeProvider(pi)">删除</button>
            </div>

            <div class="cfg-row">
              <span class="cfg-label">API 地址</span>
              <input v-model="p.baseUrl" class="cfg-input" placeholder="https://api.xxx.com/v1（OpenAI 兼容，通常带 /v1）" />
            </div>

            <div class="cfg-row">
              <span class="cfg-label">API Token</span>
              <input
                v-model="p.apiKey"
                type="password"
                class="cfg-input"
                autocomplete="off"
                :placeholder="p.apiKeySet ? `已配置 ${p.apiKeyMasked}，留空即不改；填 __CLEAR__ 清除` : 'sk-…（可留空，稍后测试也能只测地址）'"
              />
            </div>

            <details class="cfg-adv">
              <summary>高级：默认预算 / 超时 / 自定义请求头</summary>
              <div class="cfg-row">
                <span class="cfg-label">max_tokens</span>
                <input v-model="p.maxTokens" class="cfg-input cfg-input-xs" type="number" min="0" placeholder="继承全局" />
                <span class="cfg-label">超时(s)</span>
                <input v-model="p.timeoutSeconds" class="cfg-input cfg-input-xs" type="number" min="0" placeholder="继承全局" />
              </div>
              <div v-for="(h, hi) in headerPairs(p)" :key="hi" class="cfg-row">
                <input
                  class="cfg-input cfg-input-sm"
                  :value="h.k"
                  placeholder="Header 名"
                  @change="setHeader(p, hi, { k: $event.target.value, v: h.v })"
                />
                <input
                  class="cfg-input"
                  :value="h.v"
                  placeholder="值（部分聚合站要求 X-Title / X-Provider 用于路由计费）"
                  @change="setHeader(p, hi, { k: h.k, v: $event.target.value })"
                />
                <button class="cfg-btn cfg-btn-ghost" @click="dropHeader(p, h.k)">✕</button>
              </div>
              <button class="cfg-link" @click="addHeader(p)">+ 添加请求头</button>
            </details>

            <table class="cfg-table cfg-models">
              <thead>
                <tr>
                  <th>默认</th><th>模型名（中转站路由名）</th><th>展示名</th><th>max_tokens</th>
                  <th>超时(s)</th><th>reasoning</th><th>启用</th><th>对用户开放</th><th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(m, mi) in p.models" :key="mi">
                  <td>
                    <input
                      type="radio"
                      name="primary-model"
                      :checked="isPrimary(p, mi)"
                      :disabled="!m.name"
                      title="设为默认模型（首个调用/降级起点）"
                      @change="setPrimary(p, mi)"
                    />
                  </td>
                  <td><input v-model="m.name" class="cfg-input cfg-input-mono" placeholder="deepseek-chat" /></td>
                  <td><input v-model="m.label" class="cfg-input" placeholder="留空同模型名" /></td>
                  <td><input v-model="m.maxTokens" class="cfg-input cfg-input-xs" type="number" min="0" placeholder="继承" /></td>
                  <td><input v-model="m.timeoutSeconds" class="cfg-input cfg-input-xs" type="number" min="0" placeholder="继承" /></td>
                  <td>
                    <select v-model="m.reasoningEffort" class="cfg-input cfg-input-xs" title="REASONING：不传即按上游默认">
                      <option v-for="e in EFFORTS" :key="e.value" :value="e.value">{{ e.label }}</option>
                    </select>
                  </td>
                  <td><input v-model="m.enabled" type="checkbox" title="勾掉 = 屏蔽该模型（同名环境变量模型也会一并屏蔽）" /></td>
                  <td>
                    <input
                      v-model="m.userVisible"
                      type="checkbox"
                      title="取消勾选 = 仅你自己能选这个模型：不出现在普通用户的模型下拉里，也不参与他们选「自动」时的降级链（内测 / 按量付费的贵模型适用）"
                    />
                  </td>
                  <td><button class="cfg-btn cfg-btn-ghost" @click="removeModel(p, mi)">✕</button></td>
                </tr>
              </tbody>
            </table>
            <div class="cfg-row cfg-row-actions">
              <button class="cfg-link" @click="addModel(p)">+ 添加模型</button>
              <span class="cfg-tip-inline">{{ REASONING_HINT }}</span>
            </div>

            <div v-if="testResults[p.id]" class="cfg-test">
              <p class="cfg-test-head">
                <span :class="testResults[p.id].ok ? 'cfg-ok' : 'cfg-bad'">
                  {{ testResults[p.id].ok ? '✅ 连通' : '❌ 未通过' }}
                </span>
                <code>{{ testResults[p.id].baseUrl || p.baseUrl }}</code>
                <span v-if="testResults[p.id].error" class="cfg-bad">{{ testResults[p.id].error }}</span>
              </p>
              <ul>
                <li v-for="s in testResults[p.id].steps || []" :key="s.name">
                  <span :class="s.ok ? 'cfg-ok' : 'cfg-bad'">{{ s.ok ? '✓' : '✗' }}</span>
                  {{ s.title }}
                  <span v-if="s.latencyMs != null" class="cfg-ms">{{ s.latencyMs }} ms</span>
                  <span v-if="s.name === 'models' && s.ok" class="cfg-muted">（{{ s.count }} 个）</span>
                  <span v-if="s.upstreamModel" class="cfg-muted">上游实际模型 {{ s.upstreamModel }}</span>
                  <span v-if="!s.ok" class="cfg-bad">{{ s.error }}</span>
                  <span v-if="!s.ok && s.note" class="cfg-muted">{{ s.note }}</span>
                  <blockquote v-if="s.reply" class="cfg-reply">{{ s.reply }}</blockquote>
                </li>
              </ul>
              <div v-if="(testResults[p.id].discoveredModels || []).length" class="cfg-chips">
                <span class="cfg-muted">模型清单：</span>
                <button
                  v-for="n in testResults[p.id].discoveredModels"
                  :key="n"
                  class="cfg-chip"
                  :class="{ 'is-picked': p.models.some((m) => m.name === n) }"
                  @click="adoptModels(p, [n])"
                >
                  {{ n }}
                </button>
                <button class="cfg-link" @click="adoptModels(p, testResults[p.id].discoveredModels)">
                  全部加入
                </button>
              </div>
            </div>
          </div>

          <button class="cfg-btn" @click="addProvider">+ 添加中转站</button>
        </section>
      </div>

      <footer class="cfg-foot">
        <span class="cfg-foot-note">
          配置存在数据库 app_settings 表，保存即热生效；页面配置优先于环境变量，两者的模型会合并进下拉框。
          只有管理员能看到全量模型；取消勾选某个模型的「对用户开放」，普通用户的下拉与「自动」降级链里就不会出现它。
        </span>
        <div class="cfg-foot-actions">
          <button
            class="cfg-btn cfg-btn-ghost"
            :disabled="saving || loading || !canReset"
            :title="canReset ? '删除数据库里的页面配置，回到 .env 出厂配置' : '当前没有页面配置可清空'"
            @click="reset"
          >
            清空页面配置
          </button>
          <button class="cfg-btn cfg-btn-primary" :disabled="saving || loading" @click="save">
            {{ saving ? '保存中…' : '保存并生效' }}
          </button>
        </div>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.cfg-mask {
  position: fixed;
  inset: 0;
  z-index: 90;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 40px 16px;
  background: rgba(15, 20, 25, 0.55);
  overflow-y: auto;
}

.cfg-modal {
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: column;
  background: var(--surface);
  border: 1px solid var(--border-1);
  border-radius: 12px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.cfg-head {
  display: flex;
  align-items: baseline;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-1);
}

.cfg-head h3 {
  margin: 0;
  font-size: 1.05rem;
  color: var(--text-1);
}

.cfg-sub {
  flex: 1;
  font-size: 0.8em;
  color: var(--text-3);
}

.cfg-x {
  border: none;
  background: none;
  font-size: 1rem;
  color: var(--text-2);
  cursor: pointer;
}

.cfg-loading {
  padding: 30px;
  text-align: center;
  color: var(--text-2);
}

.cfg-body {
  max-height: 66vh;
  overflow-y: auto;
  padding: 16px 20px 4px;
}

.cfg-alert {
  margin: 0 0 12px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.88em;
}

.cfg-alert-err {
  color: var(--c-red);
  background: var(--tint-red);
  border: 1px solid var(--tint-red-border);
}

.cfg-alert-ok {
  color: var(--c-green);
  background: var(--tint-green);
  border: 1px solid var(--tint-green-border);
}

.cfg-section {
  margin-bottom: 18px;
}

.cfg-section h4 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: var(--text-1);
}

.cfg-empty {
  margin: 0;
  font-size: 0.88em;
  color: var(--text-2);
}

.cfg-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.84em;
}

.cfg-table th,
.cfg-table td {
  padding: 5px 8px;
  text-align: left;
  border-bottom: 1px solid var(--border-1);
  color: var(--text-2);
  vertical-align: middle;
}

.cfg-table th {
  color: var(--text-3);
  font-weight: 600;
  white-space: nowrap;
}

.cfg-url {
  font-family: var(--font-mono, ui-monospace, monospace);
  word-break: break-all;
}

.cfg-star {
  margin-left: 6px;
  font-size: 0.9em;
  color: var(--c-amber, #d97706);
}

.cfg-ok {
  color: var(--c-green);
  font-weight: 600;
}

.cfg-warn {
  color: var(--c-amber, #d97706);
  font-weight: 600;
}

.cfg-bad {
  color: var(--c-red);
  font-weight: 600;
}

.cfg-muted {
  color: var(--text-3);
}

.cfg-ms {
  margin-left: 6px;
  font-family: var(--font-mono, ui-monospace, monospace);
  color: var(--text-3);
}

.cfg-env {
  font-size: 0.86em;
}

.cfg-env-body {
  margin-top: 6px;
  padding: 8px 10px;
  background: var(--surface-muted);
  border-radius: 6px;
}

.cfg-env-line {
  margin: 0 0 6px;
  color: var(--text-2);
  word-break: break-all;
}

.cfg-env-list {
  margin: 0 0 6px;
  padding-left: 18px;
  color: var(--text-2);
}

.cfg-provider {
  margin-bottom: 14px;
  padding: 12px;
  background: var(--surface-muted);
  border: 1px solid var(--border-1);
  border-radius: 8px;
}

.cfg-provider-head {
  margin-bottom: 8px;
}

.cfg-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.cfg-row-actions {
  justify-content: space-between;
}

.cfg-label {
  min-width: 62px;
  font-size: 0.82em;
  color: var(--text-3);
}

.cfg-input {
  flex: 1;
  min-width: 120px;
  padding: 5px 8px;
  font-size: 0.85em;
  color: var(--text-1);
  background: var(--surface);
  border: 1px solid var(--border-2);
  border-radius: 5px;
}

.cfg-input:focus {
  outline: none;
  border-color: var(--brand-400);
}

.cfg-input-xs {
  flex: 0 0 auto;
  width: 96px;
}

.cfg-input-sm {
  flex: 0 0 auto;
  width: 200px;
}

.cfg-input-mono {
  font-family: var(--font-mono, ui-monospace, monospace);
}

.cfg-check {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 0.82em;
  color: var(--text-2);
  white-space: nowrap;
}

.cfg-adv {
  margin: 0 0 10px;
  font-size: 0.88em;
}

.cfg-adv summary {
  cursor: pointer;
  color: var(--text-3);
}

.cfg-models {
  margin-bottom: 6px;
}

.cfg-models .cfg-input {
  min-width: 60px;
}

.cfg-btn {
  padding: 5px 12px;
  font-size: 0.85em;
  color: var(--text-1);
  background: var(--brand-500, var(--brand-400));
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.cfg-btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.cfg-btn-primary {
  color: #fff;
}

.cfg-btn-ghost {
  color: var(--text-2);
  background: var(--surface);
  border-color: var(--border-2);
}

.cfg-btn-ghost:hover:not(:disabled) {
  color: var(--brand-400);
  border-color: var(--brand-400);
}

.cfg-btn-danger:hover:not(:disabled) {
  color: var(--c-red);
  border-color: var(--tint-red-border);
}

.cfg-link {
  padding: 0;
  font-size: 0.85em;
  color: var(--c-blue);
  background: none;
  border: none;
  cursor: pointer;
}

.cfg-test {
  margin-top: 8px;
  padding: 8px 10px;
  font-size: 0.85em;
  background: var(--surface);
  border: 1px dashed var(--border-2);
  border-radius: 6px;
}

.cfg-test-head {
  display: flex;
  gap: 8px;
  align-items: center;
  margin: 0 0 4px;
  flex-wrap: wrap;
}

.cfg-test ul {
  margin: 0;
  padding-left: 18px;
  color: var(--text-2);
}

.cfg-reply {
  margin: 4px 0;
  padding: 4px 8px;
  color: var(--text-2);
  background: var(--surface-muted);
  border-radius: 4px;
  word-break: break-all;
}

.cfg-chips {
  margin-top: 6px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.cfg-chip {
  padding: 2px 8px;
  font-family: var(--font-mono, ui-monospace, monospace);
  font-size: 0.8em;
  color: var(--text-2);
  background: var(--surface-muted);
  border: 1px solid var(--border-2);
  border-radius: 999px;
  cursor: pointer;
}

.cfg-chip.is-picked {
  color: var(--c-green);
  border-color: var(--tint-green-border);
}

.cfg-tip {
  margin: 4px 0 0;
  font-size: 0.86em;
  color: var(--text-3);
}

.cfg-tip-inline {
  font-size: 0.78em;
  color: var(--text-3);
}

.cfg-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--border-1);
}

.cfg-foot-note {
  flex: 1;
  font-size: 0.78em;
  color: var(--text-3);
}

.cfg-foot-actions {
  display: flex;
  gap: 8px;
}
</style>
