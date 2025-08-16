<script setup>import { ref, computed, defineEmits, nextTick } from 'vue'

// 导入样式文件
import './binary-search-detail.css'

// 定义关闭事件
const emit = defineEmits(['close'])

// 标签切换状态
const activeTab = ref('basic')

// 算法参数
const array = ref([1, 2, 3, 5, 7, 8, 9, 10, 12, 15])
const target = ref(7)
const result = ref(-1)
const isSearching = ref(false)
const steps = ref([])
const currentStep = ref(0)
const animationSpeed = ref(1000)
const isAnimating = ref(false)
const searchStatus = ref('就绪')
const comparisonCount = ref(0)

// 生成随机有序数组
const generateRandomArray = async () => {
  if (isSearching.value || isAnimating.value) return

  const newArray = []
  const length = Math.floor(Math.random() * 5) + 5 // 5-10个元素
  let current = Math.floor(Math.random() * 10)
  newArray.push(current)
  for (let i = 1; i < length; i++) {
    current += Math.floor(Math.random() * 5) + 1
    newArray.push(current)
  }
  array.value = newArray

  // 等待DOM更新后再重置搜索
  await nextTick()
  resetSearch()
}

// 重置搜索
const resetSearch = () => {
  result.value = -1
  isSearching.value = false
  steps.value = []
  currentStep.value = 0
  isAnimating.value = false
  comparisonCount.value = 0
  searchStatus.value = '就绪'
}

// 二分查找算法
const binarySearch = () => {
  if (isSearching.value || isAnimating.value) return

  resetSearch()
  isSearching.value = true
  searchStatus.value = '查找中...'
  comparisonCount.value = 0

  const arr = [...array.value].sort((a, b) => a - b) // 确保数组有序
  const tar = target.value
  let left = 0
  let right = arr.length - 1
  let foundIndex = -1

  // 记录每一步的状态
  steps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}` })

  while (left <= right) {
    comparisonCount.value++
    const mid = Math.floor((left + right) / 2)
    steps.value.push({
      step: comparisonCount.value,
      type: 'check',
      left,
      mid,
      right,
      value: arr[mid],
      details: `检查索引 ${mid} (值: ${arr[mid]})，左边界: ${left}，右边界: ${right}`
    })

    if (arr[mid] === tar) {
      foundIndex = mid
      steps.value[steps.value.length - 1].type = 'found'
      steps.value[steps.value.length - 1].details = `在索引 ${mid} 找到目标值 ${tar}`
      break
    } else if (arr[mid] < tar) {
      steps.value[steps.value.length - 1].type = 'tooSmall'
      steps.value[steps.value.length - 1].details = `值 ${arr[mid]} 小于目标值 ${tar}，向右查找`
      left = mid + 1
    } else {
      steps.value[steps.value.length - 1].type = 'tooBig'
      steps.value[steps.value.length - 1].details = `值 ${arr[mid]} 大于目标值 ${tar}，向左查找`
      right = mid - 1
    }
  }

  result.value = foundIndex
  isSearching.value = false
  if (foundIndex !== -1) {
    searchStatus.value = '查找完成'
    steps.value.push({ step: comparisonCount.value + 1, type: 'finish', details: `查找完成，在索引 ${foundIndex} 找到目标值 ${tar}` })
  } else {
    searchStatus.value = '未找到目标'
    steps.value.push({ step: comparisonCount.value + 1, type: 'finish', details: `查找完成，未找到目标值 ${tar}` })
  }
  animateSteps()
}

// 动画展示步骤
const animateSteps = () => {
  if (steps.value.length === 0) return

  isAnimating.value = true
  currentStep.value = 0

  const animateNextStep = () => {
    if (currentStep.value >= steps.value.length) {
      isAnimating.value = false
      return
    }

    currentStep.value++

    setTimeout(animateNextStep, animationSpeed.value)
  }

  animateNextStep()
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
</script>

<template>
  <div class="algorithm-detail binary-search-detail detail-container search-detail">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>二分查找 (Binary Search)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'demo' }" @click="activeTab = 'demo'">演示</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>二分查找是一种高效的搜索算法，它要求数组已排序。它不断将搜索范围缩小一半，直到找到目标值或确定目标值不存在。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(log n)</li>
                  <li><span>最好情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(log n)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">稳定性:</span> 不稳定</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function binarySearch(arr, target):
  left = 0
  right = length(arr) - 1

  while left <= right:
    mid = floor((left + right) / 2)
    if arr[mid] == target:
      return mid
    else if arr[mid] < target:
      left = mid + 1
    else:
      right = mid - 1

  return -1</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def binary_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1

    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function binarySearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid; // 找到目标，返回索引
    } else if (arr[mid] < target) {
      left = mid + 1; // 目标在右半部分
    } else {
      right = mid - 1; // 目标在左半部分
    }
  }

  return -1; // 未找到目标
}</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'demo'" class="search-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">查找状态:</span>
            <span class="stat-value">{{ searchStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比较次数:</span>
            <span class="stat-value">{{ comparisonCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }} / {{ steps.length }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="visualization-controls">
            <button @click="binarySearch" :disabled="isSearching || isAnimating">开始查找</button>
            <button @click="resetSearch" :disabled="!isSearching && steps.length === 0">重置</button>
            <button @click="generateRandomArray" :disabled="isSearching || isAnimating">生成随机数组</button>
            <input type="number" v-model="target" placeholder="目标值" :disabled="isSearching || isAnimating">
            <div class="speed-control">
              <label>动画速度:</label>
              <input type="range" min="500" max="2000" v-model="animationSpeed" :disabled="isSearching || isAnimating">
            </div>
          </div>

          <div class="array-container">
            <div v-for="(item, index) in array.value" :key="index" class="array-element" 
                 :class="{
                   'in-range': currentStepInfo && index >= currentStepInfo.left && index <= currentStepInfo.right,
                   'mid': currentStepInfo && index === currentStepInfo.mid,
                   'found': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.type === 'found',
                   'too-small': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.type === 'tooSmall',
                   'too-big': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.type === 'tooBig'
                 }">
              {{ item }}
            </div>
          </div>

          <div class="search-result" v-if="!isSearching && !isAnimating && steps.length > 0">
            <p v-if="result !== -1">找到目标值 {{ target }}，索引为 {{ result }}</p>
            <p v-else>未找到目标值 {{ target }}</p>
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
          <h3>优化变体</h3>
          <p>二分查找有许多优化变体，例如：</p>
          <ol style="text-align: left;">
            <li><strong>插值查找</strong>：根据目标值与数组范围的比例估算中间位置，时间复杂度可达到O(log log n)</li>
            <li><strong>斐波那契查找</strong>：使用斐波那契数列确定分割点，避免了乘法和除法运算</li>
            <li><strong>三分查找</strong>：将区间分成三部分而不是两部分，适用于单峰函数的极值查找</li>
            <li><strong>指数查找</strong>：先通过指数增长确定搜索范围，再进行二分查找</li>
          </ol>

          <h3>算法改进</h3>
          <p>标准二分查找可以通过以下方式进行改进：</p>
          <ul style="text-align: left;">
            <li>处理重复元素的边界情况</li>
            <li>使用位运算优化中间值计算</li>
            <li>针对特定数据集的自适应调整</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>使用注意事项</h3>
          <ul style="text-align: left;">
            <li>二分查找仅适用于已排序的数组</li>
            <li>对于小型数组，线性查找可能比二分查找更高效</li>
            <li>对于频繁插入和删除的数据集，维护排序状态的成本可能超过二分查找的收益</li>
            <li>当数组元素分布不均匀时，插值查找可能比二分查找更高效</li>
          </ul>

          <h3>应用场景</h3>
          <ul style="text-align: left;">
            <li>数据库索引查找</li>
            <li>字典查找</li>
            <li>范围查询</li>
            <li>拼写检查</li>
            <li>编译器符号表查找</li>
          </ul>

          <h3>历史与发展</h3>
          <p>二分查找算法的历史可以追溯到1946年，由John Mauchly提出。它是计算机科学中最基础和最常用的算法之一，也是许多更复杂算法的基础。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './binary-search-detail.css';
</style>