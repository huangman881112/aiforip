<script setup>
import { ref, defineEmits, nextTick, computed } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 控制标签页切换
const activeTab = ref('basic')

// 算法参数
const array = ref([1, 3, 5, 7, 9, 11, 13, 15, 17, 19])
const target = ref(13)
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
  try {
    if (isSearching.value || isAnimating.value) {
      console.warn('[WARNING] 正在搜索或动画中，无法生成新数组')
      return
    }

    console.log('[DEBUG] 生成随机数组')
    const length = Math.floor(Math.random() * 5) + 5 // 5-10个元素
    const newArray = []
    let current = Math.floor(Math.random() * 10)
    newArray.push(current)
    for (let i = 1; i < length; i++) {
      current += Math.floor(Math.random() * 5) + 1
      newArray.push(current)
    }
    array.value = newArray
    console.log('[DEBUG] 生成的随机数组:', newArray)

    // 等待DOM更新后再重置搜索
    await nextTick()
    resetSearch()
  } catch (error) {
    console.error('[ERROR] 生成随机数组失败:', error)
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
    console.log('[DEBUG] 搜索已重置')
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
  }
}

// 二分查找辅助函数
const binarySearch = (arr, left, right, tar) => {
  while (left <= right) {
    comparisonCount.value++
    const mid = Math.floor((left + right) / 2)
    steps.value.push({
      left,
      mid,
      right,
      value: arr[mid],
      status: 'binaryChecking',
      stepType: 'binary'
    })

    if (arr[mid] === tar) {
      steps.value[steps.value.length - 1].status = 'binaryFound'
      return mid
    } else if (arr[mid] < tar) {
      steps.value[steps.value.length - 1].status = 'binaryTooSmall'
      left = mid + 1
    } else {
      steps.value[steps.value.length - 1].status = 'binaryTooBig'
      right = mid - 1
    }
  }
  return -1
}

// 指数搜索算法
const exponentialSearch = async () => {
  console.log('开始查找按钮被点击');
  if (isSearching.value || isAnimating.value) return

  resetSearch()
  isSearching.value = true
  searchStatus.value = '查找中...'
  comparisonCount.value = 0

  const arr = [...array.value].sort((a, b) => a - b) // 确保数组有序
  const tar = target.value
  const n = arr.length

  console.log('查找开始前的数组:', arr);
  steps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}` })

  // 检查第一个元素
  comparisonCount.value++
  if (arr[0] === tar) {
    currentStep.value++
    const foundDetails = `第 ${currentStep.value} 步: 在位置 0 找到目标值 ${tar}`
    console.log(foundDetails);
    steps.value.push({ step: currentStep.value, type: 'found', details: foundDetails, pos: 0, value: arr[0], stepType: 'exponential' })
    result.value = 0
    isSearching.value = false
    searchStatus.value = '查找完成'
    steps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，在索引 0 找到目标值 ${tar}` })
    animateSteps()
    return
  } else {
    currentStep.value++
    const notFoundDetails = `第 ${currentStep.value} 步: 检查位置 0，值: ${arr[0]}，不是目标值 ${tar}`
    console.log(notFoundDetails);
    steps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails, pos: 0, value: arr[0], stepType: 'exponential' })
  }

  // 找到合适的搜索范围
  let i = 1
  while (i < n && arr[i] <= tar) {
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 指数跳跃到位置 ${i}，值: ${arr[i]}，小于等于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'exponential', details: stepDetails, pos: i, value: arr[i], stepType: 'exponential' })
    i = i * 2
  }

  // 记录超出范围的步骤
  if (i < n) {
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 指数跳跃到位置 ${i}，值: ${arr[i]}，大于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'exponentialOver', details: stepDetails, pos: i, value: arr[i], stepType: 'exponential' })
  } else {
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 指数跳跃超出数组范围，设置上界为 ${n-1}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'exponentialOver', details: stepDetails, pos: n-1, value: arr[n-1], stepType: 'exponential' })
  }

  // 在找到的范围内进行二分查找
  currentStep.value++
  const binaryStartDetails = `第 ${currentStep.value} 步: 在范围 [${Math.floor(i/2)}, ${Math.min(i, n - 1)}] 内开始二分查找`
  console.log(binaryStartDetails);
  steps.value.push({ step: currentStep.value, type: 'binaryStart', details: binaryStartDetails, left: Math.floor(i/2), right: Math.min(i, n - 1), stepType: 'binary' })

  const foundIndex = binarySearch(arr, Math.floor(i/2), Math.min(i, n - 1), tar)
  result.value = foundIndex
  isSearching.value = false
  if (foundIndex !== -1) {
    searchStatus.value = '查找完成'
    steps.value.push({ step: currentStep.value + steps.value.filter(s => s.stepType === 'binary').length, type: 'finish', details: `查找完成，在索引 ${foundIndex} 找到目标值 ${tar}` })
  } else {
    searchStatus.value = '未找到目标'
    steps.value.push({ step: currentStep.value + steps.value.filter(s => s.stepType === 'binary').length, type: 'finish', details: `查找完成，未找到目标值 ${tar}` })
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
    console.log(`[动画] 执行步骤 ${currentStep.value}: ${steps.value[currentStep.value - 1].details}`)

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
  <div class="exponential-search-detail detail-container search-detail">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>指数搜索 (Exponential Search)</h2>
      <div class="tabs">
        <button :class="{ 'active': activeTab === 'basic' }" @click="activeTab = 'basic'" class="tab-btn">基础</button>
        <button :class="{ 'active': activeTab === 'demo' }" @click="activeTab = 'demo'" class="tab-btn">演示</button>
        <button :class="{ 'active': activeTab === 'advanced' }" @click="activeTab = 'advanced'" class="tab-btn">进阶</button>
        <button :class="{ 'active': activeTab === 'notes' }" @click="activeTab = 'notes'" class="tab-btn">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="tab-content markdown-content" style="text-align: left;">
        <div class="algorithm-principle">
          <h3>算法原理</h3>
          <p>指数搜索，也称为加倍搜索，它通过指数增长的步长快速找到目标值可能存在的范围，然后在该范围内使用二分搜索。这种算法特别适用于大型数组或无限序列。</p>
          <p>指数搜索的基本步骤：</p>
          <ol>
            <li>检查第一个元素是否为目标值</li>
            <li>如果不是，通过指数增长（i = i * 2）找到目标值可能存在的范围</li>
            <li>在找到的范围内使用二分搜索</li>
          </ol>
        </div>

        <div class="complexity-analysis">
          <h3>复杂度分析</h3>
          <div class="complexity-item">
            <span class="complexity-title">时间复杂度：</span>
            <ul>
              <li><span>最佳情况：</span>O(1) - 目标值在数组的第一个位置</li>
              <li><span>平均情况：</span>O(log n) - 与二分搜索相同</li>
              <li><span>最坏情况：</span>O(log n) - 与二分搜索相同</li>
            </ul>
          </div>
          <div class="complexity-item">
            <span class="complexity-title">空间复杂度：</span>O(1) - 不需要额外空间
          </div>
          <div class="complexity-item">
            <span class="complexity-title">优势：</span> 对于大型数组，通常比二分搜索更快找到合适的搜索范围
          </div>
        </div>

        <div class="code-examples">
          <h3>伪代码</h3>
          <pre><code>function exponentialSearch(arr, target):
  n = arr.length

  // 检查第一个元素
  if arr[0] == target:
    return 0

  // 找到合适的搜索范围
  i = 1
  while i < n and arr[i] <= target:
    i = i * 2

  // 在找到的范围内进行二分搜索
  return binarySearch(arr, i/2, min(i, n-1), target)

function binarySearch(arr, left, right, target):
  while left <= right:
    mid = floor((left + right) / 2)

    if arr[mid] == target:
      return mid
    elif arr[mid] < target:
      left = mid + 1
    else:
      right = mid - 1

  return -1</code></pre>

          <h3>Python 实现</h3>
          <pre><code>def exponential_search(arr, target):
    n = len(arr)

    # 检查第一个元素
    if arr[0] == target:
        return 0

    # 找到合适的搜索范围
    i = 1
    while i < n and arr[i] <= target:
        i = i * 2

    # 在找到的范围内进行二分搜索
    left = i // 2
    right = min(i, n - 1)
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
          <pre><code>function exponentialSearch(arr, target) {
  const n = arr.length;

  // 检查第一个元素
  if (arr[0] === target) return 0;

  // 找到合适的搜索范围
  let i = 1;
  while (i < n && arr[i] <= target) {
    i = i * 2;
  }

  // 在找到的范围内进行二分搜索
  return binarySearch(arr, i / 2, Math.min(i, n - 1), target);
}

function binarySearch(arr, left, right, target) {
  while (left <= right) {
    const mid = Math.floor((left + right) / 2);

    if (arr[mid] === target) {
      return mid;
    } else if (arr[mid] < target) {
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }
  return -1;
}</code></pre>
        </div>
      </div>

      <div v-if="activeTab === 'demo'" class="tab-content demo-content">
        <div class="demo-controls">
          <div class="search-stats">
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

          <div class="control-buttons">
            <button @click="exponentialSearch" :disabled="isSearching || isAnimating">开始查找</button>
            <button @click="resetSearch" :disabled="!isSearching && steps.length === 0">重置</button>
            <button @click="generateRandomArray" :disabled="isSearching || isAnimating">生成随机数组</button>
            <input type="number" v-model="target" placeholder="目标值" :disabled="isSearching || isAnimating">
            <input type="range" min="500" max="2000" v-model="animationSpeed" :disabled="isSearching || isAnimating">
            <span>动画速度: {{ animationSpeed }}ms</span>
          </div>
        </div>

        <div class="array-container">
          <div v-for="(item, index) in array.value" :key="index" class="array-element" :class="{
            'exponential': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'exponential',
            'exponentialOver': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'exponentialOver',
            'found': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'found',
            'notFound': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'notFound',
            'binary-checking': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.stepType === 'binary',
            'binary-found': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.status === 'binaryFound',
            'binary-too-small': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.status === 'binaryTooSmall',
            'binary-too-big': currentStepInfo && index === currentStepInfo.mid && currentStepInfo.status === 'binaryTooBig',
            'in-range': currentStepInfo && currentStepInfo.stepType === 'binary' && index >= currentStepInfo.left && index <= currentStepInfo.right
          }">
            {{ item }}
          </div>
        </div>

        <div class="step-history">
          <div class="data-set-display">
            <span class="data-label">要找的数据集：</span>
            <div class="data-items">
              <div v-for="(item, index) in array.value" :key="index" class="data-item">
                {{ item }}
              </div>
            </div>
          </div>
          <div class="control-buttons top-buttons">
            <button @click="generateRandomArray" :disabled="isSearching || isAnimating">生成随机数组</button>
          </div>
          <h4>当前步骤详情</h4>
          <div class="step-list">
            <div v-for="(step, idx) in steps.value" :key="idx" class="step-item" :class="{
              'current': idx === currentStep.value - 1
            }">
              <span class="step-number">{{ step.step }}.</span>
              <span class="step-details">{{ step.details }}</span>
            </div>
          </div>
        </div>

        <div class="search-result" v-if="!isSearching && !isAnimating && steps.length > 0">
          <p v-if="result !== -1">找到目标值 {{ target }}，索引为 {{ result }}</p>
          <p v-else>未找到目标值 {{ target }}</p>
        </div>
      </div>

      <div v-if="activeTab === 'advanced'" class="tab-content markdown-content" style="text-align: left;">
        <h3>算法进阶</h3>
        <p>指数搜索是一种结合了线性搜索和二分搜索特点的算法。它的核心思想是先通过指数增长的步长快速定位到目标值可能存在的大致范围，然后在该范围内使用二分搜索进行精确查找。</p>

        <h4>指数搜索 vs 二分搜索</h4>
        <p>对于大型数组，指数搜索通常比二分搜索更有效，因为它可以快速跳过大量不可能包含目标值的元素。特别是当目标值接近数组开头时，指数搜索的性能优势更加明显。</p>

        <h4>适用场景</h4>
        <ul>
          <li>大型有序数组</li>
          <li>无限或未知长度的序列</li>
          <li>目标值可能接近数组开头的情况</li>
        </ul>
      </div>

      <div v-if="activeTab === 'notes'" class="tab-content markdown-content" style="text-align: left;">
        <h3>学习笔记</h3>
        <p>指数搜索是一种有趣的算法，它通过指数增长的步长来快速定位搜索范围。这种方法在某些情况下比二分搜索更高效，特别是当目标值靠近数组开头时。</p>
        <p>指数搜索的关键点在于：</p>
        <ol>
          <li>使用指数增长确定搜索上界</li>
          <li>在确定的范围内使用二分搜索</li>
          <li>时间复杂度仍然是 O(log n)，但常数因子通常更小</li>
        </ol>
        <p>这种算法在处理无限序列或流式数据时特别有用，因为它不需要预先知道数据的总长度。</p>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../../common/button-styles.css';

/* 确保标签页按钮使用统一的样式 */
.tabs {
  @extend .category-tabs;
}

.tab-btn {
  @extend .tab-btn;
}

.tab-btn.active {
  @extend .tab-btn.active;
}

/* 指数搜索特有样式 */
.array-container {
  display: flex;
  gap: 10px;
  margin: 20px 0;
  flex-wrap: wrap;
}

.array-element {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f0f0f0;
  transition: all 0.3s;
}

.array-element.exponential {
  background-color: #2196f3;
  color: white;
  transform: scale(1.2);
}

.array-element.exponentialOver {
  background-color: #ff9800;
  color: white;
  transform: scale(1.2);
}

.array-element.found {
  background-color: #4caf50;
  color: white;
  transform: scale(1.2);
}

.array-element.notFound {
  background-color: #f44336;
  color: white;
}

.array-element.binary-checking {
  background-color: #ffeb3b;
  transform: scale(1.1);
}

.array-element.binary-found {
  background-color: #4caf50;
  color: white;
  transform: scale(1.2);
}

.array-element.binary-too-small {
  background-color: #2196f3;
  color: white;
}

.array-element.binary-too-big {
  background-color: #ff9800;
  color: white;
}

.array-element.in-range {
  background-color: #e3f2fd;
}

.search-status {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.search-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.data-set-display {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.data-label {
  font-weight: bold;
  margin-right: 10px;
}

.data-items {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  padding: 5px 0;
}

.data-item {
  padding: 6px 10px;
  background-color: #e0e0e0;
  border-radius: 4px;
  white-space: nowrap;
}

.step-history {
  margin-top: 30px;
}

.step-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
}

.step-item {
  padding: 8px 10px;
  border-bottom: 1px solid #eee;
}

.step-item.current {
  background-color: #e3f2fd;
  font-weight: bold;
}

.step-number {
  font-weight: bold;
  margin-right: 10px;
}

.demo-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 20px;
}

.search-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 10px;
}

.stat-item {
  display: flex;
  align-items: center;
}

.stat-label {
  font-weight: bold;
  margin-right: 5px;
}

.stat-value {
  padding: 2px 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
}

.control-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}

.tabs {
  display: flex;
  margin-top: 15px;
}

.tab-btn {
  padding: 8px 16px;
  margin-right: 5px;
  border: none;
  background-color: #e2e8f0;
  color: #64748b;
  cursor: pointer;
  border-radius: 4px 4px 0 0;
  transition: all 0.3s ease;
  font-size: 14px;
}

.tab-btn:hover {
  background-color: #cbd5e1;
}


.tab-content {
  padding: 20px;
  border: 1px solid #eee;
  border-radius: 0 4px 4px 4px;
  min-height: 400px;
}

.markdown-content h3 {
  margin-top: 20px;
  margin-bottom: 10px;
}

.markdown-content h4 {
  margin-top: 15px;
  margin-bottom: 8px;
}

.markdown-content p {
  margin-bottom: 10px;
}

.markdown-content ul,
.markdown-content ol {
  margin-bottom: 15px;
  padding-left: 25px;
}

.markdown-content li {
  margin-bottom: 5px;
}

pre {
  background-color: #000000;
  color: #ffffff;
  padding: 15px;
  border-radius: 4px;
  overflow-x: auto;
  margin-bottom: 20px;
}

code {
  font-family: 'Courier New', Courier, monospace;
}

.complexity-analysis {
  margin-top: 20px;
  margin-bottom: 20px;
}

.complexity-item {
  margin-bottom: 10px;
}

.complexity-title {
  font-weight: bold;
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.modal-header {
  position: relative;
  padding: 15px;
  border-bottom: 1px solid #eee;
}

.modal-content {
  padding: 15px;
}
</style>