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

// 插值查找算法
const interpolationSearch = async () => {
  console.log('开始查找按钮被点击');
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

  console.log('查找开始前的数组:', arr);
  steps.value.push({ step: 0, type: 'info', details: `查找开始，初始数组: [${arr.join(', ')}]，目标值: ${tar}` })

  // 记录每一步的状态
  while (left <= right && tar >= arr[left] && tar <= arr[right]) {
    comparisonCount.value++
    currentStep.value++

    // 避免除以零的情况
    if (arr[left] === arr[right]) {
      const stepDetails = `第 ${currentStep.value} 步: 左边界 ${left} 和右边界 ${right} 的值相等 (${arr[left]})`
      console.log(stepDetails);
      steps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })

      if (arr[left] === tar) {
        foundIndex = left
        const foundDetails = `第 ${currentStep.value} 步: 在索引 ${left} 找到目标值 ${tar}`
        console.log(foundDetails);
        steps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      } else {
        const notFoundDetails = `第 ${currentStep.value} 步: 索引 ${left} (值: ${arr[left]}) 不是目标值 ${tar}`
        console.log(notFoundDetails);
        steps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails })
      }
      break
    }

    // 计算插值位置
    const pos = left + Math.floor(((tar - arr[left]) * (right - left)) / (arr[right] - arr[left]))
    const stepDetails = `第 ${currentStep.value} 步: 计算插值位置 = ${left} + (((${tar} - ${arr[left]}) * (${right} - ${left})) / (${arr[right]} - ${arr[left]})) = ${pos}`
    console.log(stepDetails);
    steps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })

    if (arr[pos] === tar) {
      foundIndex = pos
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${pos} 找到目标值 ${tar}`
      console.log(foundDetails);
      steps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      break
    } else if (arr[pos] < tar) {
      const tooSmallDetails = `第 ${currentStep.value} 步: 索引 ${pos} (值: ${arr[pos]}) 小于目标值 ${tar}，向右查找`
      console.log(tooSmallDetails);
      steps.value.push({ step: currentStep.value, type: 'tooSmall', details: tooSmallDetails })
      left = pos + 1
    } else {
      const tooBigDetails = `第 ${currentStep.value} 步: 索引 ${pos} (值: ${arr[pos]}) 大于目标值 ${tar}，向左查找`
      console.log(tooBigDetails);
      steps.value.push({ step: currentStep.value, type: 'tooBig', details: tooBigDetails })
      right = pos - 1
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
  <div class="interpolation-search-detail detail-container search-detail">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>插值查找 (Interpolation Search)</h2>
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
          <p>插值查找是二分查找的改进版本，它根据目标值与数组边界值的关系，估计目标值可能的位置，从而加速查找过程。对于均匀分布的数据集，插值查找通常比二分查找更快。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最佳情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(log log n) - 对于均匀分布的数据</li>
                  <li><span>最坏情况:</span> O(n) - 对于非均匀分布的数据</li>
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
            <pre><code>function interpolationSearch(arr, target):
  left = 0
  right = arr.length - 1

  while left <= right and target >= arr[left] and target <= arr[right]:
    if arr[left] == arr[right]:
      if arr[left] == target:
        return left
      return -1

    // 计算插值位置
    pos = left + floor(((target - arr[left]) * (right - left)) / (arr[right] - arr[left]))

    if arr[pos] == target:
      return pos
    else if arr[pos] < target:
      left = pos + 1
    else:
      right = pos - 1

  return -1</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def interpolation_search(arr, target):
    left = 0
    right = len(arr) - 1

    while left <= right and target >= arr[left] and target <= arr[right]:
        if arr[left] == arr[right]:
            if arr[left] == target:
                return left
            return -1

        # 计算插值位置
        pos = left + ((target - arr[left]) * (right - left)) // (arr[right] - arr[left])

        if arr[pos] == target:
            return pos
        elif arr[pos] < target:
            left = pos + 1
        else:
            right = pos - 1

    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function interpolationSearch(arr, target) {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right && target >= arr[left] && target <= arr[right]) {
    // 避免除以零
    if (arr[left] === arr[right]) {
      if (arr[left] === target) return left;
      return -1;
    }

    // 计算插值位置
    const pos = left + Math.floor(((target - arr[left]) * (right - left)) / (arr[right] - arr[left]));

    if (arr[pos] === target) {
      return pos; // 找到目标
    } else if (arr[pos] < target) {
      left = pos + 1; // 目标在右侧
    } else {
      right = pos - 1; // 目标在左侧
    }
  }

  return -1; // 未找到目标
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
            <button @click="interpolationSearch" :disabled="isSearching || isAnimating">开始查找</button>
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
              'in-range': currentStepInfo && index >= currentStepInfo.left && index <= currentStepInfo.right,
              'pos': currentStepInfo && index === currentStepInfo.pos,
              'found': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'found',
              'too-small': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'tooSmall',
              'too-big': currentStepInfo && index === currentStepInfo.pos && currentStepInfo.type === 'tooBig'
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
          <p>插值查找可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>边界检查优化</strong>：对于边界条件的快速处理可以减少不必要的计算。</li>
            <li><strong>递归实现</strong>：对于某些场景，递归实现可能比迭代实现更简洁。</li>
            <li><strong>混合策略</strong>：在数据分布不均匀的情况下，可以结合二分查找和插值查找的优点。</li>
          </ol>

          <h3>适用场景</h3>
          <p>插值查找特别适用于以下场景：</p>
          <ul style="text-align: left;">
            <li>数据分布均匀的有序数组</li>
            <li>大型数据集，且查找频率高的情况</li>
            <li>当数据值范围较大，但实际数据量较小的情况</li>
          </ul>

          <h3>与二分查找的比较</h3>
          <p>插值查找与二分查找的主要区别在于：</p>
          <ul style="text-align: left;">
            <li>二分查找总是检查中间元素，而插值查找根据目标值估算可能的位置</li>
            <li>对于均匀分布的数据，插值查找通常比二分查找更快</li>
            <li>对于非均匀分布的数据，插值查找可能不如二分查找稳定</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>插值查找是二分查找的一个有趣变体，它试图通过估计目标值的位置来加速查找过程。</p>
          <p>插值查找的核心思想是：如果数据是均匀分布的，那么目标值很可能位于与它和数组边界值的比例相对应的位置。</p>
          <p>例如，如果目标值接近数组的最大值，那么它很可能位于数组的右侧；如果目标值接近数组的最小值，那么它很可能位于数组的左侧。</p>
          <p>插值查找的关键公式是：</p>
          <pre><code>pos = left + ((target - arr[left]) * (right - left)) / (arr[right] - arr[left])</code></pre>
          <p>这个公式基于线性插值的思想，假设数据在[left, right]区间内均匀分布。</p>
          <p>尽管插值查找在均匀分布的数据上表现出色，但在最坏情况下（数据分布极不均匀），它的时间复杂度会退化为O(n)，因此在实际应用中需要根据数据特性选择合适的算法。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './linear-search-detail.css';

/* 插值查找特有样式 */
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

.array-element.in-range {
  background-color: #e3f2fd;
}

.array-element.pos {
  background-color: #ffeb3b;
  transform: scale(1.2);
}

.array-element.found {
  background-color: #4caf50;
  color: white;
  transform: scale(1.2);
}

.array-element.too-small {
  background-color: #2196f3;
  color: white;
}

.array-element.too-big {
  background-color: #ff9800;
  color: white;
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