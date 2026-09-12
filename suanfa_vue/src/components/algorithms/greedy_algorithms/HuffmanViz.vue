<script setup>
// 哈夫曼编码可视化：最小堆合并过程 + 完成后的哈夫曼树与编码表。
import { computed, h, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { greedyProblems } from '../../../data/greedyProblems.js'

defineEmits(['close'])
const route = useRoute()

const problem = computed(() => greedyProblems[route.params.id] || null)
const form = ref({ freqText: problem.value?.defaults?.freqText || '' })

const validation = computed(() => {
  const list = String(form.value.freqText)
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map((s) => {
      const [ch, freq] = s.split(/[:：]/)
      return { ch, freq: Number.parseInt(freq, 10) }
    })
  if (!list.length || list.some((x) => !x.ch || !Number.isFinite(x.freq) || x.freq <= 0)) {
    return { inputs: null, error: '格式形如 a:45, b:13（字符:次数），至少 2 项' }
  }
  if (list.length < 2) return { inputs: null, error: '至少给 2 个字符才能合并' }
  if (new Set(list.map((x) => x.ch)).size !== list.length) {
    return { inputs: null, error: '字符不能重复' }
  }
  return { inputs: list, error: '' }
})

const formError = computed(() => validation.value.error)

const model = computed(() => {
  if (!problem.value || !validation.value.inputs) return null
  try {
    return problem.value.solve({ freqText: form.value.freqText })
  } catch (e) {
    return null
  }
})

const frames = computed(() => model.value?.frames || [])
const total = computed(() => frames.value.length)
const step = ref(0)
const speed = ref(900)
const playing = ref(false)
let timer = null

const current = computed(() => (step.value > 0 ? frames.value[step.value - 1] : null))
const view = computed(() => current.value || frames.value[0] || null)
const finished = computed(() => total.value > 0 && step.value >= total.value)

function next() {
  if (step.value < total.value) step.value++
}
function prev() {
  if (step.value > 0) step.value--
}
function pause() {
  playing.value = false
  if (timer) {
    clearInterval(timer)
    timer = null
  }
}
function play() {
  if (playing.value) return pause()
  if (!total.value) return
  if (finished.value) step.value = 0
  playing.value = true
  timer = setInterval(() => {
    if (step.value >= total.value) {
      pause()
      return
    }
    step.value++
  }, speed.value)
}
function restart() {
  pause()
  step.value = 0
}
watch(speed, () => {
  if (playing.value) {
    pause()
    play()
  }
})
watch(model, restart)
onBeforeUnmount(pause)

function randomize() {
  if (!problem.value?.makeRandom) return
  form.value = { freqText: problem.value.makeRandom({}).freqText }
  restart()
}

/** 递归渲染哈夫曼树（函数式组件：叶子是字符，内部节点是字符集合） */
function renderNode(nd) {
  if (!nd) return null
  const kids = []
  if (nd.left || nd.right) {
    kids.push(
      h('div', { class: 'hf-kids' }, [
        nd.left ? h('div', { class: 'hf-edge' }, [h('span', { class: 'hf-branch b0' }, '0'), renderNode(nd.left)]) : null,
        nd.right ? h('div', { class: 'hf-edge' }, [h('span', { class: 'hf-branch b1' }, '1'), renderNode(nd.right)]) : null,
      ])
    )
  }
  return h('div', { class: ['hf-node', nd.type === 'leaf' ? 'is-leaf' : 'is-inner'] }, [
    h('div', { class: 'hf-bubble' }, [
      h('span', { class: 'hf-char' }, nd.chars || nd.label),
      h('span', { class: 'hf-weight' }, String(nd.weight)),
    ]),
    ...kids,
  ])
}

const HuffmanTree = (props) => renderNode(props.node)
HuffmanTree.props = ['node']
</script>

<template>
  <div class="huffman-viz">
    <template v-if="model">
      <section class="viz-section">
        <span class="viz-recurrence">贪心策略：{{ problem.strategy }}</span>
        <p class="viz-hint">{{ problem.brief }}</p>
        <div class="viz-inputs">
          <div class="viz-field viz-field-wide">
            <label for="hf-freq">字符频次（逗号分隔）</label>
            <input id="hf-freq" v-model="form.freqText" type="text" :disabled="playing" />
          </div>
        </div>
        <p v-if="formError" class="viz-error">{{ formError }}</p>
      </section>

      <section class="viz-section">
        <div class="viz-controls">
          <button class="primary" :disabled="!total" @click="play">{{ playing ? '⏸ 暂停' : '▶ 播放' }}</button>
          <button :disabled="!step || playing" @click="prev">上一步</button>
          <button :disabled="!total || finished" @click="next">下一步</button>
          <button :disabled="!step" @click="restart">回到开头</button>
          <button @click="randomize">随机数据</button>
          <div class="viz-speed">
            <label for="hf-speed">速度</label>
            <input id="hf-speed" v-model.number="speed" type="range" min="300" max="2500" step="100" />
            <span>{{ speed }}ms</span>
          </div>
          <span class="viz-progress">步骤 {{ step }} / {{ total }}</span>
        </div>
      </section>

      <section class="viz-section">
        <h3>最小堆（按权值升序）</h3>
        <div class="hf-pool">
          <span v-for="nd in view.pool" :key="nd.label" class="hf-chip" :class="nd.state">
            <b>{{ nd.label }}</b>
            <i>{{ nd.weight }}</i>
          </span>
        </div>
        <div class="viz-current">{{ current ? current.text : '点「播放」或「下一步」开始合并' }}</div>
      </section>

      <section v-if="finished" class="viz-section">
        <h3>生成的哈夫曼树</h3>
        <div class="hf-tree">
          <HuffmanTree :node="model.tree" />
        </div>
      </section>

      <section v-if="finished" class="viz-section">
        <h3>编码表</h3>
        <table class="hf-table">
          <thead>
            <tr>
              <th>字符</th>
              <th>频次</th>
              <th>编码</th>
              <th>码长</th>
              <th>占用位</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in model.table" :key="row.ch">
              <td>{{ row.ch }}</td>
              <td>{{ row.freq }}</td>
              <td class="code">{{ row.code }}</td>
              <td>{{ row.bits }}</td>
              <td>{{ row.bits * row.freq }}</td>
            </tr>
          </tbody>
        </table>
        <div class="viz-answer">✅ {{ model.answer }}</div>
        <p class="viz-note">💡 {{ model.note }}</p>
      </section>

      <section class="viz-section">
        <h3>合并历史</h3>
        <div class="viz-steps">
          <div
            v-for="(f, i) in frames.slice(0, step)"
            :key="i"
            class="viz-step"
            :class="[f.kind, { active: i === step - 1 }]"
          >
            <span class="idx">{{ i + 1 }}</span>
            <i class="tag-dot"></i>
            <span>{{ f.text }}</span>
          </div>
          <p v-if="!step" class="viz-hint">还没有步骤。</p>
        </div>
      </section>
    </template>

    <div v-else class="viz-section">
      <p class="viz-error">{{ formError || '这份频次数据还建不出哈夫曼树，调整一下输入。' }}</p>
    </div>
  </div>
</template>

<style scoped>
@import '../algo-viz-common.css';

.viz-note {
  margin: 12px 0 0;
  font-size: 0.85rem;
  color: var(--text-2);
}

.hf-pool {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 14px;
  min-height: 42px;
}

.hf-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-2);
  background-color: var(--surface-muted);
  font-size: 0.85rem;
  color: var(--text-1);
}

.hf-chip b {
  font-family: 'JetBrains Mono', Consolas, monospace;
}

.hf-chip i {
  font-style: normal;
  color: var(--c-amber);
}

.hf-chip.new {
  border-color: var(--c-purple);
  background-color: var(--tint-purple);
}

.hf-tree {
  overflow-x: auto;
  padding: 8px 0;
}

.hf-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.hf-bubble {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid var(--border-2);
  background-color: var(--surface-2);
  font-size: 0.8rem;
  color: var(--text-1);
}

.hf-node.is-leaf .hf-bubble {
  border-color: var(--c-green);
  background-color: var(--tint-green);
}

.hf-char {
  font-family: 'JetBrains Mono', Consolas, monospace;
  font-weight: 700;
}

.hf-weight {
  color: var(--c-amber);
}

.hf-kids {
  display: flex;
  gap: 18px;
  align-items: flex-start;
}

.hf-edge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding-left: 10px;
  border-left: 1px dashed var(--border-2);
}

.hf-branch {
  font-size: 0.72rem;
  font-weight: 700;
  padding: 1px 7px;
  border-radius: 999px;
}

.hf-branch.b0 {
  color: var(--c-blue);
  background-color: var(--tint-blue);
}

.hf-branch.b1 {
  color: var(--c-pink);
  background-color: var(--tint-pink);
}

.hf-table {
  border-collapse: collapse;
  width: 100%;
  max-width: 520px;
  font-size: 0.86rem;
  color: var(--text-1);
}

.hf-table th,
.hf-table td {
  padding: 7px 12px;
  border-bottom: 1px solid var(--border-1);
  text-align: left;
}

.hf-table th {
  background-color: var(--surface-muted);
  color: var(--text-2);
  font-weight: 600;
}

.hf-table td.code {
  font-family: 'JetBrains Mono', Consolas, monospace;
  color: var(--c-cyan);
}
</style>
