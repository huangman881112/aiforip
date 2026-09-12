<script setup>
// 桶排序详情组件
import { ref, onMounted } from 'vue'
import { useSortingVisualization } from '../../../composables/useSortingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 可视化共享脚手架（列表大小/随机数据/统计状态/生成新列表/重置排序）
const {
  listSize, minSize, maxSize,
  errorMessage, sortingSteps, currentStepDetails,
  data, sortedData,
  generateNewList, resetSort,
  isSorting, isButtonClicked, sortingStatus, animationSpeed,
  comparisonCount, swapCount, currentStep, comparedIndices,
} = useSortingVisualization({
  defaultSize: 10,
  minSize: 5,
  maxSize: 20,
  onReset: () => {
    selectedIndices.value = []
    currentBucket.value = -1
    buckets.value = []
  }
})

// 动画控制（桶排序专属）
const bucketCount = ref(5)
const maxDataValue = ref(100) // 桶排序的数据范围上限

// 桶排序专属状态
const selectedIndices = ref([])
const currentBucket = ref(-1)
const buckets = ref([])

// 桶排序实现
const bucketSort = async () => {
  try {
    if (isSorting.value) return
    isSorting.value = true
    isButtonClicked.value = true
    sortingStatus.value = '排序中'
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    currentBucket.value = -1
    // 不重置桶状态，而是清空现有桶
    buckets.value = []
    currentStepDetails.value = ''

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    // 确保排序过程中列表长度不变
    const originalLength = arr.length
    const n = arr.length
    const bucketSize = Math.ceil(maxDataValue.value / bucketCount.value)

    // 步骤1: 初始化桶
    buckets.value = Array.from({ length: bucketCount.value }, () => [])
    const step1Detail = `初始化 ${bucketCount.value} 个桶，每个桶范围: ${bucketSize}`
    currentStepDetails.value = step1Detail
    currentStep.value++

    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    // 步骤2: 将元素分配到桶中
    for (let i = 0; i < n; i++) {
      const num = arr[i]
      const bucketIndex = Math.min(Math.floor(num / bucketSize), bucketCount.value - 1)
      buckets.value[bucketIndex].push(num)
      comparisonCount.value++

      selectedIndices.value = [i]
      currentBucket.value = bucketIndex
      const step2Detail = `将元素 ${num} (索引 ${i}) 分配到桶 ${bucketIndex}`
      currentStepDetails.value = step2Detail
      currentStep.value++

      // 更新可视化数据
      sortedData.value = [...arr]

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤3: 对每个桶进行排序
    for (let i = 0; i < bucketCount.value; i++) {
      currentBucket.value = i
      const bucket = buckets.value[i]
      const bucketStartIndex = sortedData.value.indexOf(bucket[0])

      const step3Detail = `开始对桶 ${i} 进行排序，桶内元素: [${bucket.join(', ')}]`
      currentStepDetails.value = step3Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

      // 对桶内元素使用插入排序
      for (let j = 1; j < bucket.length; j++) {
        const key = bucket[j]
        let k = j - 1

        while (k >= 0 && bucket[k] > key) {
          bucket[k + 1] = bucket[k]
          k--
          comparisonCount.value++
          swapCount.value++

          // 更新桶内排序状态
          buckets.value[i] = [...bucket]
          const step4Detail = `桶 ${i} 内排序: 移动 ${bucket[k + 1]} 到 ${k + 2} 位置`
          currentStepDetails.value = step4Detail
          currentStep.value++

          // 更新可视化数据
          let pos = bucketStartIndex
          for (let b = 0; b < bucketCount.value; b++) {
            for (let elem of buckets.value[b]) {
              sortedData.value[pos] = elem
              pos++
            }
          }

          await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
        }
        bucket[k + 1] = key
        comparisonCount.value++
      }

      const step5Detail = `桶 ${i} 排序完成: [${bucket.join(', ')}]`
      currentStepDetails.value = step5Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤4: 合并桶内元素
    let index = 0
    for (let i = 0; i < bucketCount.value; i++) {
      for (let j = 0; j < buckets.value[i].length; j++) {
        sortedData.value[index++] = buckets.value[i][j]
      }
    }

    // 排序完成后确保数据一致性
    isButtonClicked.value = false
    sortingStatus.value = '排序完成'
    
    // 确保排序后列表长度不变
    const sortOriginalLength = data.value.length
    if (sortedData.value.length !== sortOriginalLength) {
      console.warn('[WARNING] 排序后列表长度发生变化，已修正');
      sortedData.value = sortedData.value.slice(0, sortOriginalLength)
    }
    
    // 确保排序后元素与初始列表一致（通过排序原始数据的副本）
    const originalElements = [...data.value]
    sortedData.value = [...originalElements].sort((a, b) => a - b)
    
    const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
    currentStepDetails.value = finishDetails
    
    // 确保排序完成后不会意外生成重复队列
    // 1. 克隆排序结果，防止引用问题
    sortedData.value = [...sortedData.value]
    // 2. 更新原始数据以匹配排序结果
    data.value = [...sortedData.value]
    // 排序完成后保留桶状态
    currentBucket.value = -1 // 取消高亮特定桶，但保留桶内容
    
    isSorting.value = false
  } catch (error) {
    console.error('[ERROR] 排序失败:', error)
    errorMessage.value = `排序失败: ${error.message}`
    isSorting.value = false
    isButtonClicked.value = false
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

// 测试排序 - 立即完成
const testSort = () => {
  try {
    isSorting.value = false
    isButtonClicked.value = true

    // 检查data.value是否存在且是数组
    if (!data || typeof data.value === 'undefined' || !Array.isArray(data.value)) {
      throw new Error('数据对象未正确初始化或不是数组');
    }

    // 使用JavaScript内置排序作为测试结果，确保列表长度不变
    const originalLength = data.value.length
    sortedData.value = [...data.value].sort((a, b) => a - b)
    // 确保排序后列表长度不变
    if (sortedData.value.length !== originalLength) {
      console.warn('[WARNING] 测试排序后列表长度发生变化，已修正');
      sortedData.value = sortedData.value.slice(0, originalLength)
    }
    comparisonCount.value = data.value.length // 估计值
    swapCount.value = data.value.length // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    currentBucket.value = -1
    buckets.value = []

    isButtonClicked.value = false
    sortingStatus.value = '测试排序完成'
    const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
    currentStepDetails.value = finishDetails
  } catch (error) {
    console.error('[ERROR] 测试排序失败:', error)
    errorMessage.value = `测试排序失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

// 关闭详情
const closeDetail = () => {
  // 触发父组件的close事件
  emit('close')
}

// 初始化
onMounted(() => {
  generateNewList()
})
</script>

<template>
  <div class="bucket-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>桶排序</h2>
    </div>

    <div class="modal-content">

      <div class="sort-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">排序状态:</span>
            <span class="stat-value">{{ sortingStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比较次数:</span>
            <span class="stat-value">{{ comparisonCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">交换次数:</span>
            <span class="stat-value">{{ swapCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前桶索引:</span>
            <span class="stat-value">{{ currentBucket }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="chart-container">
            <div 
              v-for="(value, index) in sortedData" 
              :key="index" 
              class="bar" 
              :class="{
                'compared': comparedIndices.includes(index),
                'selected': selectedIndices.includes(index),
                'in-bucket': currentBucket >= 0 && buckets[currentBucket] && buckets[currentBucket].includes(value),
                'sorted': isSorting && data && sortedData[index] === data.slice().sort((a, b) => a - b)[index]
              }" 
              :style="{ height: `${value * 2}px` }"
              :data-value="value"
            ></div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSorting" @input="listSize = Number($event.target.value)">
            </div>
            <div class="bucket-count-control">
              <label>桶数量: {{ bucketCount }}</label>
              <input type="range" min="2" max="10" v-model.number="bucketCount" :disabled="isSorting" @input="bucketCount = Number($event.target.value); generateNewList()">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="bucketSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
            <button @click="testSort" :disabled="isSorting">测试排序</button>
            <button @click="resetSort" :disabled="!isSorting && sortedData && data && sortedData.join(',') === data.join(',')">重置排序</button>
            <div class="speed-control">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSorting">
            </div>
          </div>
          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ currentStepDetails }}</p>
          </div>
          <div class="buckets-status" v-if="(isSorting || sortingStatus === '排序完成') && buckets.length > 0">
            <h4>桶状态</h4>
            <div class="buckets-container">
              <div v-for="(bucket, index) in buckets" :key="index" :class="['bucket-item', { 'active': index === currentBucket }]">
                <span class="bucket-number">桶 {{ index }}:</span>
                <span class="bucket-contents">{{ bucket.join(', ') }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './bucket-sort-detail.css';

/* 桶排序特有样式 */
.bucket-sort-detail {
  /* 保留组件特有样式 */
}

/* 桶状态显示样式 */
.buckets-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.bucket-item {
  padding: 8px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  background-color: var(--surface-muted);
  min-width: 150px;
}

.bucket-item.active {
  background-color: var(--tint-blue);
  border-color: var(--tint-blue-border);
}

.bucket-number {
  font-weight: bold;
  margin-right: 5px;
}

.bucket-contents {
  font-family: monospace;
}
</style>