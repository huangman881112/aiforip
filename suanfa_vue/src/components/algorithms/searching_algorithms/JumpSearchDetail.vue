<script setup>
import { ref, defineEmits, nextTick, computed, watch } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 控制标签页切换
const activeTab = ref('basic')

// 列表大小控制
const listSize = ref(7)
const minSize = ref(3)
const maxSize = ref(20)

// 目标值控制
const targetValue = ref(13)
const minTarget = ref(1)
const maxTarget = ref(100)

// 确保listSize始终是数字类型
watch(listSize, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 列表大小不是有效数字，已重置为默认值');
    listSize.value = 7;
  } else {
    // 确保值在有效范围内
    listSize.value = Math.max(minSize.value, Math.min(maxSize.value, Math.round(newValue)));
  }
})

// 确保targetValue始终是数字类型
watch(targetValue, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 目标值不是有效数字，已重置为默认值');
    targetValue.value = 13;
  } else {
    // 确保值在有效范围内
    targetValue.value = Math.max(minTarget.value, Math.min(maxTarget.value, Math.round(newValue)));
  }
})

// 算法参数
const array = ref([1, 3, 5, 7, 9, 11, 13, 15, 17, 19])
const searchArray = ref([...array.value])
const result = ref(-1)
const isSearching = ref(false)
const steps = ref([])
const currentStep = ref(0)
const animationSpeed = ref(1000)
const isAnimating = ref(false)
const searchStatus = ref('就绪')
const comparisonCount = ref(0)
const errorMessage = ref('')
const isButtonClicked = ref(false)
const currentIndex = ref(-1)
const isArraySorted = ref(true)

// 生成随机有序数组
const generateRandomArray = async () => {
  try {
    if (isSearching.value || isAnimating.value) {
      errorMessage.value = '正在搜索或动画中，无法生成新数组'
      setTimeout(() => errorMessage.value = '', 3000)
      return
    }

    console.log('[DEBUG] 生成随机数组')
    const length = listSize.value
    const newArray = []
    let current = Math.floor(Math.random() * 10)
    newArray.push(current)
    for (let i = 1; i < length; i++) {
      current += Math.floor(Math.random() * 5) + 1
      newArray.push(current)
    }
    array.value = newArray
    searchArray.value = [...array.value]
    console.log('[DEBUG] 生成的随机数组:', newArray)

    // 等待DOM更新后再重置搜索
    await nextTick()
    resetSearch()
    errorMessage.value = ''
  } catch (error) {
    console.error('[ERROR] 生成随机数组失败:', error)
    errorMessage.value = `生成随机数组失败: ${error.message}`
  }
}

// 重置搜索
const resetSearch = () => {
  try {
    isSearching.value = false
    isAnimating.value = false
    result.value = -1
    steps.value = []
    currentStep.value = 0
    comparisonCount.value = 0
    searchStatus.value = '就绪'
    currentIndex.value = -1
    searchArray.value = [...array.value]
    console.log('[DEBUG] 搜索已重置')
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
    errorMessage.value = `重置搜索失败: ${error.message}`
  }
}

// 跳跃搜索算法
const jumpSearch = async () => {
  console.log('开始查找按钮被点击');
  if (isSearching.value || isAnimating.value) {
    errorMessage.value = '正在搜索中，请等待完成或重置后再试'
    setTimeout(() => errorMessage.value = '', 3000)
    return
  }

  isButtonClicked.value = true
  resetSearch()
  isSearching.value = true
  searchStatus.value = '查找中...'
  comparisonCount.value = 0
  errorMessage.value = ''

  const arr = [...searchArray.value]
  // 确保数组有序
  if (!isArraySorted.value) {
    arr.sort((a, b) => a - b)
    steps.value.push({ step: 0, type: 'info', details: `数组已自动排序: [${arr.join(', ')}]` })
  }
  const tar = targetValue.value
  const n = arr.length
  const step = Math.floor(Math.sqrt(n)) // 跳跃步长
  let prev = 0
  let foundIndex = -1
  let found = false

  console.log('查找开始前的数组:', arr);
  steps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}，跳跃步长: ${step}` })

  // 记录跳跃步骤
  while (arr[Math.min(prev + step, n) - 1] < tar) {
    comparisonCount.value++
    currentStep.value++
    const curr = Math.min(prev + step, n) - 1
    const stepDetails = `第 ${currentStep.value} 步: 跳跃到位置 ${curr}，值: ${arr[curr]}，小于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'jumping', details: stepDetails, prev, curr })
    currentIndex.value = curr
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    prev += step
    if (prev >= n) {
      break
    }
  }

  // 记录线性搜索步骤
  while (prev < n && arr[prev] < tar && !found) {
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查位置 ${prev}，值: ${arr[prev]}，小于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'checking', details: stepDetails, prev, curr: prev })
    currentIndex.value = prev
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    prev++
    if (prev === Math.min(prev + step, n)) {
      break
    }
  }

  // 检查目标值
  if (prev < n && !found) {
    comparisonCount.value++
    currentStep.value++
    currentIndex.value = prev
    if (arr[prev] === tar) {
      foundIndex = prev
      found = true
      const foundDetails = `第 ${currentStep.value} 步: 在位置 ${prev} 找到目标值 ${tar}`
      console.log(foundDetails);
      steps.value.push({ step: currentStep.value, type: 'found', details: foundDetails, prev, curr: prev })
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    } else {
      const notFoundDetails = `第 ${currentStep.value} 步: 位置 ${prev} 的值 ${arr[prev]} 不是目标值 ${tar}`
      console.log(notFoundDetails);
      steps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails, prev, curr: prev })
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }
  }

  result.value = foundIndex
  currentIndex.value = -1
  isSearching.value = false
  isButtonClicked.value = false
  if (foundIndex !== -1) {
    searchStatus.value = '查找完成 - 找到目标值'
    steps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，在索引 ${foundIndex} 找到目标值 ${tar}` })
  } else {
    searchStatus.value = '查找完成 - 未找到目标'
    steps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，未找到目标值 ${tar}` })
  }
}

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 计算当前动画步骤的信息
const currentStepInfo = computed(() => {
  if (currentStep.value === 0 || currentStep.value > steps.value.length) {
    return null
  }
  return steps.value[currentStep.value - 1]
})

// 检查数组是否有序
const checkArraySorted = () => {
  for (let i = 1; i < array.value.length; i++) {
    if (array.value[i] < array.value[i - 1]) {
      return false
    }
  }
  return true
}

// 监听数组变化，检查是否有序
watch(array, () => {
  isArraySorted.value = checkArraySorted()
})
</script>

<template>
  <div class="jump-search-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>跳跃搜索 (Jump Search)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>跳跃搜索是一种改进的线性搜索算法，它通过跳过一定数量的元素来加速查找过程。算法首先以固定步长跳跃，直到找到一个大于或等于目标值的元素，然后在该区域内进行线性搜索。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最佳情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(√n) - 优于线性搜索</li>
                  <li><span>最坏情况:</span> O(√n)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">稳定性:</span> 不稳定</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">步长选择:</span> 通常选择√n作为步长，这是时间复杂度的最优解</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function jumpSearch(arr, target):
  n = arr.length
  step = floor(sqrt(n)) // 跳跃步长
  prev = 0

  // 跳跃查找块
  while arr[min(step, n) - 1] < target:
    prev = step
    step += floor(sqrt(n))
    if prev >= n:
      return -1

  // 在找到的块中进行线性查找
  while arr[prev] < target:
    prev += 1
    if prev == min(step, n):
      return -1

  // 检查是否找到
  if arr[prev] == target:
    return prev

  return -1</code></pre>

            <h3>Python 实现</h3>
            <pre><code>import math

def jump_search(arr, target):
    n = len(arr)
    step = math.floor(math.sqrt(n))  # 跳跃步长
    prev = 0

    # 跳跃查找块
    while arr[min(step, n) - 1] < target:
        prev = step
        step += math.floor(math.sqrt(n))
        if prev >= n:
            return -1

    # 在找到的块中进行线性查找
    while arr[prev] < target:
        prev += 1
        if prev == min(step, n):
            return -1

    # 检查是否找到
    if arr[prev] == target:
        return prev

    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function jumpSearch(arr, target) {
  const n = arr.length;
  const step = Math.floor(Math.sqrt(n)); // 跳跃步长
  let prev = 0;

  // 跳跃查找块
  while (arr[Math.min(step, n) - 1] < target) {
    prev = step;
    step += Math.floor(Math.sqrt(n));
    if (prev >= n) {
      return -1;
    }
  }

  // 在找到的块中进行线性查找
  while (arr[prev] < target) {
    prev++;
    if (prev === Math.min(step, n)) {
      return -1;
    }
  }

  // 检查是否找到
  if (arr[prev] === target) {
    return prev;
  }

  return -1;
}</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">查找状态:</span>
            <span class="stat-value {{ searchStatus.includes('完成') ? (result !== -1 ? 'success' : 'error') : 'warning' }}">{{ searchStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比较次数:</span>
            <span class="stat-value">{{ comparisonCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">找到索引:</span>
            <span class="stat-value {{ result !== -1 ? 'success' : '' }}">{{ result !== -1 ? result : '未找到' }}</span>
          </div>
        </div>

        <div class="visualization-container">
          <div class="array-container">
            <div v-for="(item, index) in searchArray" :key="index" class="array-element" :class="{
              'jumping': currentIndex === index && steps[currentStep.value - 1]?.type === 'jumping',
              'checking': currentIndex === index && steps[currentStep.value - 1]?.type === 'checking',
              'found': currentIndex === index && steps[currentStep.value - 1]?.type === 'found',
              'not-found': currentIndex === index && steps[currentStep.value - 1]?.type === 'notFound',
              'block': currentStepInfo && index >= currentStepInfo.prev && index < currentStepInfo.curr + 1 && currentStepInfo.type !== 'jumping'
            }">
              {{ item }}
            </div>
          </div>


            <div class="slider-controls">
              <div class="slider-group">
                <label>列表大小: {{ listSize }}</label>
                <!-- <div class="slider-wrapper"> -->
                  <!-- <input type="range" :min="minSize" :max="maxSize" v-model="listSize" :disabled="isSearching"> -->
                  <input type="number" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSearching" class="short-input">
                <!-- </div> -->
                <span class="range-info">({{ minSize }}-{{ maxSize }})</span>
              </div>

              <div class="slider-group">
                <label>目标值: {{ targetValue }}</label>
                <!-- <div class="slider-wrapper"> -->
                  <!-- <input type="range" :min="minTarget" :max="maxTarget" v-model="targetValue" :disabled="isSearching"> -->
                  <input type="number" :min="minTarget" :max="maxTarget" v-model.number="targetValue" :disabled="isSearching" class="short-input">
                <!-- </div> -->
                <span class="range-info">({{ minTarget }}-{{ maxTarget }})</span>
              </div>

              <div class="slider-group">
                <label>动画速度: {{ animationSpeed }}ms</label>
                <input type="range" min="100" max="2000" v-model="animationSpeed" :disabled="isSearching">
              </div>
            </div>

            <div class="button-group">
              <button @click="generateRandomArray" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
              <button @click="jumpSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始查找</button>
              <button @click="resetSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">重置查找</button>
            </div>
   

          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>

          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ currentStep > 0 && steps[currentStep.value - 1] ? steps[currentStep.value - 1].details : '准备开始' }}</p>
          </div>

          <div class="steps-history">
            <h4>查找步骤历史</h4>
            <div class="steps-container">
              <div v-for="step in steps" :key="step.step" :class="['step-item', step.type]">
                <span class="step-number">{{ step.step }}.</span>
                <span class="step-details">{{ step.details }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>算法优化</h3>
          <p>跳跃搜索可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>自适应步长</strong>：根据数据分布特点调整跳跃步长，可以进一步提高效率。</li>
            <li><strong>插值跳跃搜索</strong>：结合插值查找的思想，根据目标值与边界值的关系动态调整步长。</li>
            <li><strong>并行化</strong>：对于大规模数据集，可以考虑并行化跳跃搜索的不同阶段。</li>
          </ol>

          <h3>适用场景</h3>
          <p>跳跃搜索特别适用于以下场景：</p>
          <ul style="text-align: left;">
            <li>已排序的数组</li>
            <li>数据量较大，但内存有限，无法一次性加载全部数据的情况</li>
            <li>当线性搜索效率过低，而二分查找实现又较为复杂的情况</li>
            <li>磁盘等慢速存储设备上的搜索操作</li>
          </ul>

          <h3>与其他搜索算法的比较</h3>
          <p>跳跃搜索与其他搜索算法的主要区别：</p>
          <ul style="text-align: left;">
            <li>与线性搜索相比：跳跃搜索通过跳过部分元素减少比较次数，时间复杂度更低</li>
            <li>与二分搜索相比：跳跃搜索实现更简单，但平均效率略低</li>
            <li>与插值搜索相比：跳跃搜索对数据分布不敏感，但在均匀分布数据上效率较低</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>跳跃搜索是一种介于线性搜索和二分搜索之间的算法，它通过分块跳跃的方式减少比较次数。</p>
          <p>跳跃搜索的核心思想是：将数组分成大小为√n的块，首先在块之间跳跃，找到可能包含目标值的块，然后在该块内进行线性搜索。</p>
          <p>选择√n作为步长的原因是：这使得块间跳跃和块内搜索的时间复杂度相等，从而达到总体时间复杂度的最优解。</p>
          <p>跳跃搜索的优点包括：</p>
          <ul style="text-align: left;">
            <li>实现简单，易于理解</li>
            <li>对数据访问模式友好，特别是对于磁盘等顺序存储设备</li>
            <li>不需要像二分搜索那样对数组进行随机访问</li>
          </ul>
          <p>在实际应用中，跳跃搜索通常用于以下情况：</p>
          <ul style="text-align: left;">
            <li>当数据量较大，但内存有限时</li>
            <li>当需要减少磁盘I/O操作时</li>
            <li>当实现二分搜索的成本较高时</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 引入公共样式 */
@import './binary-search-detail.css';

/* 跳跃搜索特有样式 */
.jump-search-detail {
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-top: 32px;
  padding: 24px;
  position: relative;
}

/* 数组元素样式 */
.array-element {
  transition: all 0.3s ease;
}

/* 跳跃状态 */
.jumping {
  background-color: var(--accent-color);
  transform: scale(1.2);
  border-color: #e68a00;
}

/* 检查状态 */
.checking {
  background-color: var(--warning-color);
  border-color: #d4a700;
}

/* 找到状态 */
.found {
  background-color: var(--success-color);
  transform: scale(1.2);
  border-color: #3d8b40;
}

/* 未找到状态 */
 .not-found {
  background-color: var(--danger-color);
  border-color: #d32f2f;
}

/* 块高亮 */
.block {
  background-color: rgba(66, 185, 131, 0.2);
}    

/* 按钮样式 */
.button-group {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.button-group button {
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background-color: var(--primary-color);
  color: white;
  transition: all 0.2s ease;
}

.button-group button:hover:not(:disabled) {
  background-color: #3aa876;
}

.button-group button:disabled {
  background-color: #a0a0a0;
  cursor: not-allowed;
}

.button-group button.clicked {
  background-color: #2c9764;
}

/* 步骤历史样式 */
/* .steps-history {
  margin-top: 20px;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
} */

/* .step-item { */
  /* padding: 5px 0;
  border-bottom: 1px solid #eee;
  display: flex;
}

.step-number {
  font-weight: bold;
  margin-right: 10px;
  color: var(--secondary-color);
}

.step-details {
  flex: 1;
} */

/* 步骤类型样式 */
.step-item.info {
  color: #666;
}

.step-item.jumping {
  color: var(--accent-color);
}

.step-item.checking {
  color: var(--warning-color);
}

.step-item.found {
  color: var(--success-color);
}

.step-item.notFound {
  color: var(--danger-color);
}

.step-item.finish {
  font-weight: bold;
  color: var(--primary-color);
}

/* 搜索控制样式 */
.search-controls {
  margin-top: 20px;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 滑块控制样式 */
/* .slider-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.slider-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.slider-wrapper {
  display: flex;
  gap: 10px;
  align-items: center;
} */

.slider-wrapper input[type="range"] {
  flex: 1;
}

.slider-wrapper input[type="number"] {
  width: 60px;
}

.short-input {
  width: 60px;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

/* 统计信息样式 */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9em;
  color: #666;
}

.stat-value {
  font-weight: bold;
  font-size: 1.1em;
}

.stat-value.success {
  color: var(--success-color);
}

.stat-value.error {
  color: var(--danger-color);
}

.stat-value.warning {
  color: var(--warning-color);
}

/* 错误信息样式 */
.error-message {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(244, 67, 54, 0.1);
  color: var(--danger-color);
  border-radius: 4px;
  border-left: 4px solid var(--danger-color);
}

/* 当前步骤详情 */
.step-details {
  margin-top: 15px;
  padding: 10px;
  background-color: rgba(66, 185, 131, 0.1);
  border-radius: 4px;
  border-left: 4px solid var(--primary-color);
}
</style>