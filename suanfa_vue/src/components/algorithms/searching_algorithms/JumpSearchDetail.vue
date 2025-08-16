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

// 跳跃搜索算法
const jumpSearch = async () => {
  console.log('开始查找按钮被点击');
  if (isSearching.value || isAnimating.value) return

  resetSearch()
  isSearching.value = true
  searchStatus.value = '查找中...'
  comparisonCount.value = 0

  const arr = [...array.value].sort((a, b) => a - b) // 确保数组有序
  const tar = target.value
  const n = arr.length
  const step = Math.floor(Math.sqrt(n)) // 跳跃步长
  let prev = 0
  let foundIndex = -1

  console.log('查找开始前的数组:', arr);
  steps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}，跳跃步长: ${step}` })

  // 记录跳跃步骤
  while (arr[Math.min(step, n) - 1] < tar) {
    comparisonCount.value++
    currentStep.value++
    const curr = Math.min(step, n) - 1
    const stepDetails = `第 ${currentStep.value} 步: 跳跃到位置 ${curr}，值: ${arr[curr]}，小于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'jumping', details: stepDetails, prev, curr })
    prev = step
    if (prev >= n) {
      break
    }
  }

  // 记录线性搜索步骤
  while (prev < n && arr[prev] < tar) {
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查位置 ${prev}，值: ${arr[prev]}，小于目标值 ${tar}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'checking', details: stepDetails, prev, curr: prev })
    prev++
    if (prev === Math.min(step, n)) {
      break
    }
  }

  // 检查目标值
  if (prev < n) {
    comparisonCount.value++
    currentStep.value++
    if (arr[prev] === tar) {
      foundIndex = prev
      const foundDetails = `第 ${currentStep.value} 步: 在位置 ${prev} 找到目标值 ${tar}`
      console.log(foundDetails);
      steps.value.push({ step: currentStep.value, type: 'found', details: foundDetails, prev, curr: prev })
    } else {
      const notFoundDetails = `第 ${currentStep.value} 步: 位置 ${prev} 的值 ${arr[prev]} 不是目标值 ${tar}`
      console.log(notFoundDetails);
      steps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails, prev, curr: prev })
    }
  }

  result.value = foundIndex
  isSearching.value = false
  if (foundIndex !== -1) {
    searchStatus.value = '查找完成'
    steps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，在索引 ${foundIndex} 找到目标值 ${tar}` })
  } else {
    searchStatus.value = '未找到目标'
    steps.value.push({ step: currentStep.value + 1, type: 'finish', details: `查找完成，未找到目标值 ${tar}` })
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
  <div class="jump-search-detail detail-container search-detail">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>跳跃搜索 (Jump Search)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">演示</button>
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
            <span class="stat-value">{{ searchStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比较次数:</span>
            <span class="stat-value">{{ comparisonCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="visualization-controls">
            <button @click="jumpSearch" :disabled="isSearching || isAnimating">开始查找</button>
            <button @click="resetSearch" :disabled="!isSearching && steps.length === 0">重置</button>
            <button @click="generateRandomArray" :disabled="isSearching || isAnimating">生成随机数组</button>
            <input type="number" v-model="target" placeholder="目标值" :disabled="isSearching || isAnimating">
            <div class="speed-control">
              <label>动画速度:</label>
              <input type="range" min="500" max="2000" v-model="animationSpeed" :disabled="isSearching || isAnimating">
            </div>
          </div>

          <div class="array-container">
            <div v-for="(item, index) in array.value" :key="index" class="array-element" :class="{
              'jumping': currentStepInfo && index === currentStepInfo.curr && currentStepInfo.type === 'jumping',
              'checking': currentStepInfo && index === currentStepInfo.curr && currentStepInfo.type === 'checking',
              'found': currentStepInfo && index === currentStepInfo.curr && currentStepInfo.type === 'found',
              'not-found': currentStepInfo && index === currentStepInfo.curr && currentStepInfo.type === 'notFound',
              'block': currentStepInfo && index >= currentStepInfo.prev && index < currentStepInfo.curr + 1 && currentStepInfo.type !== 'jumping'
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
@import './linear-search-detail.css';

/* 跳跃搜索特有样式 */
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

.array-element.jumping {
  background-color: #2196f3;
  color: white;
  transform: scale(1.2);
}

.array-element.checking {
  background-color: #ffeb3b;
  transform: scale(1.1);
}

.array-element.found {
  background-color: #4caf50;
  color: white;
  transform: scale(1.2);
}

.array-element.not-found {
  background-color: #f44336;
  color: white;
}

.array-element.block {
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
</style>