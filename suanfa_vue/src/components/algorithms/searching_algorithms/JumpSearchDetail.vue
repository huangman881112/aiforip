<script setup>
import { ref, computed, watch } from 'vue'
import { useSearchingVisualization } from '../../../composables/useSearchingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 可视化共享脚手架（列表大小/目标值/随机数据/统计状态/生成新列表/重置搜索）
const {
  listSize, minSize, maxSize,
  targetValue, minTarget, maxTarget,
  errorMessage, searchSteps, currentStep,
  data, searchData,
  generateNewList, resetSearch,
  isSearching, isButtonClicked, searchStatus, animationSpeed,
  comparisonCount, currentIndex, foundIndex,
} = useSearchingVisualization({
  defaultSize: 7,
  defaultTarget: 13,
  // 跳跃搜索需要递增有序数据
  generateRandomData: (size) => {
    const result = []
    let current = Math.floor(Math.random() * 10)
    result.push(current)
    for (let i = 1; i < size; i++) {
      current += Math.floor(Math.random() * 5) + 1
      result.push(current)
    }
    return result
  },
  // 重置搜索时清除算法专属状态（动画标记）
  onReset: () => {
    isAnimating.value = false
  },
})

// 跳跃搜索专属状态
const isAnimating = ref(false)
const isArraySorted = ref(true)

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

  const arr = [...searchData.value]
  // 确保数组有序
  if (!isArraySorted.value) {
    arr.sort((a, b) => a - b)
    searchSteps.value.push({ step: 0, type: 'info', details: `数组已自动排序: [${arr.join(', ')}]` })
  }
  const tar = targetValue.value
  const n = arr.length
  const step = Math.floor(Math.sqrt(n)) // 跳跃步长
  let prev = 0
  let foundIdx = -1
  let found = false

  console.log('查找开始前的数组:', arr);
  searchSteps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}，跳跃步长: ${step}` })

  // 记录跳跃步骤
  while (arr[Math.min(prev + step, n) - 1] < tar) {
    comparisonCount.value++
    currentStep.value++
    const curr = Math.min(prev + step, n) - 1
    const stepDetails = `第 ${currentStep.value} 步: 跳跃到位置 ${curr}，值: ${arr[curr]}，小于目标值 ${tar}`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'jumping', details: stepDetails, prev, curr })
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
    searchSteps.value.push({ step: currentStep.value, type: 'checking', details: stepDetails, prev, curr: prev })
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
      foundIdx = prev
      found = true
      const foundDetails = `第 ${currentStep.value} 步: 在位置 ${prev} 找到目标值 ${tar}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails, prev, curr: prev })
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    } else {
      const notFoundDetails = `第 ${currentStep.value} 步: 位置 ${prev} 的值 ${arr[prev]} 不是目标值 ${tar}`
      console.log(notFoundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails, prev, curr: prev })
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }
  }

  foundIndex.value = foundIdx
  currentIndex.value = -1
  isSearching.value = false
  isButtonClicked.value = false
  if (foundIdx !== -1) {
    searchStatus.value = '查找完成 - 找到目标值'
    searchSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，在索引 ${foundIdx} 找到目标值 ${tar}` })
  } else {
    searchStatus.value = '查找完成 - 未找到目标'
    searchSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，未找到目标值 ${tar}` })
  }
}

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 计算当前动画步骤的信息
const currentStepInfo = computed(() => {
  if (currentStep.value === 0 || currentStep.value > searchSteps.value.length) {
    return null
  }
  return searchSteps.value[currentStep.value - 1]
})

// 检查数组是否有序
const checkArraySorted = () => {
  for (let i = 1; i < data.value.length; i++) {
    if (data.value[i] < data.value[i - 1]) {
      return false
    }
  }
  return true
}

// 监听数组变化，检查是否有序
watch(data, () => {
  isArraySorted.value = checkArraySorted()
})
</script>

<template>
  <div class="jump-search-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>跳跃搜索 (Jump Search)</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">查找状态:</span>
            <span class="stat-value {{ searchStatus.includes('完成') ? (foundIndex !== -1 ? 'success' : 'error') : 'warning' }}">{{ searchStatus }}</span>
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
            <span class="stat-value {{ foundIndex !== -1 ? 'success' : '' }}">{{ foundIndex !== -1 ? foundIndex : '未找到' }}</span>
          </div>
        </div>

        <div class="visualization-container">
          <div class="array-container">
            <div v-for="(item, index) in searchData" :key="index" class="array-element" :class="{
              'jumping': currentIndex === index && searchSteps[currentStep - 1]?.type === 'jumping',
              'checking': currentIndex === index && searchSteps[currentStep - 1]?.type === 'checking',
              'found': currentIndex === index && searchSteps[currentStep - 1]?.type === 'found',
              'not-found': currentIndex === index && searchSteps[currentStep - 1]?.type === 'notFound',
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
              <button @click="generateNewList" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
              <button @click="jumpSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始查找</button>
              <button @click="resetSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">重置查找</button>
            </div>
   

          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>

          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ currentStep > 0 && searchSteps[currentStep - 1] ? searchSteps[currentStep - 1].details : '准备开始' }}</p>
          </div>

          <div class="steps-history">
            <h4>查找步骤历史</h4>
            <div class="steps-container">
              <div v-for="step in searchSteps" :key="step.step" :class="['step-item', step.type]">
                <span class="step-number">{{ step.step }}.</span>
                <span class="step-details">{{ step.details }}</span>
              </div>
            </div>
          </div>
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
  background-color: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
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
  color: var(--text-on-bright);
  transform: scale(1.2);
  border-color: var(--text-on-bright);
}

/* 检查状态 */
.checking {
  background-color: var(--warning-color);
  color: var(--text-on-bright);
  border-color: var(--text-on-bright);
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
  background-color: var(--surface-2);
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
  border: 1px solid var(--border-1);
  border-radius: 4px;
  padding: 10px;
} */

/* .step-item { */
  /* padding: 5px 0;
  border-bottom: 1px solid var(--border-1);
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
  color: var(--text-2);
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
  background-color: var(--surface-muted);
  padding: 15px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
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
  border: 1px solid var(--border-1);
  border-radius: 4px;
}

/* 统计信息样式 */
.stats-container {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  margin-bottom: 15px;
  padding: 10px;
  background-color: var(--surface-2);
  border-radius: 4px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.9em;
  color: var(--text-2);
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