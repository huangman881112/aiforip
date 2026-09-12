<script setup>
// 计数排序详情组件
import { ref, onMounted } from 'vue'
import { useSortingVisualization } from '../../../composables/useSortingVisualization.js'

const emit = defineEmits(['close'])

// 计数排序专属状态（数据生成器闭包引用，须在脚手架之前声明）
const maxDataValue = ref(20) // 计数排序的数据范围上限

// 可视化共享脚手架（列表大小/随机数据/统计状态/生成新列表/重置排序）
const {
  listSize, minSize, maxSize,
  errorMessage, sortingSteps, currentStepDetails,
  data, sortedData,
  generateNewList, resetSort,
  isSorting, isButtonClicked, sortingStatus, animationSpeed,
  comparisonCount, swapCount, currentStep, comparedIndices,
} = useSortingVisualization({
  defaultSize: 10, minSize: 5, maxSize: 20,
  generateRandomData: (size) => Array.from({ length: size }, () => Math.floor(Math.random() * maxDataValue.value) + 1),
  onReset: () => {
    selectedIndices.value = []
    minIndex.value = -1
    counts.value = []
    maxValue.value = Math.max(...data.value)
  },
})

// 计数排序专属状态
const selectedIndices = ref([])
const minIndex = ref(-1)
const counts = ref([])
const maxValue = ref(0)

// 初始化
onMounted(() => {
  generateNewList()
})

// 计数排序实现
const countingSort = async () => {
  try {
    if (isSorting.value) return
    isSorting.value = true
    isButtonClicked.value = true
    sortingStatus.value = '排序中'
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    sortingSteps.value = []
    currentStepDetails.value = ''
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    counts.value = []

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    const n = arr.length
    maxValue.value = Math.max(...arr)

    // 步骤1: 初始化计数数组
    counts.value = new Array(maxValue.value + 1).fill(0)
    const step1Detail = `初始化计数数组，大小: ${maxValue.value + 1}`
    sortingSteps.value.push({ step: currentStep.value + 1, type: 'info', details: step1Detail })
    currentStepDetails.value = step1Detail
    currentStep.value++

    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    // 步骤2: 统计每个元素出现的次数
    for (let i = 0; i < n; i++) {
      const num = arr[i]
      counts.value[num]++
      comparisonCount.value++

      selectedIndices.value = [i]
      const step2Detail = `统计元素 ${num} (索引 ${i})，计数: ${counts.value[num]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'count', details: step2Detail })
      currentStepDetails.value = step2Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤3: 计算累计计数
    for (let i = 1; i <= maxValue.value; i++) {
      counts.value[i] += counts.value[i - 1]
      const step3Detail = `计算累计计数，索引 ${i}: ${counts.value[i]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'count', details: step3Detail })
      currentStepDetails.value = step3Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤4: 从后向前遍历原数组，放置元素到正确位置
    const output = new Array(n)
    for (let i = n - 1; i >= 0; i--) {
      const num = arr[i]
      output[counts.value[num] - 1] = num
      counts.value[num]--
      swapCount.value++

      selectedIndices.value = [i]
      const step4Detail = `放置元素 ${num} (索引 ${i}) 到位置 ${counts.value[num]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'swap', details: step4Detail })
      currentStepDetails.value = step4Detail
      currentStep.value++

      // 更新排序后的数据
      sortedData.value = [...output]

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    isButtonClicked.value = false
    sortingStatus.value = '排序完成'
    const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
    sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
    currentStepDetails.value = finishDetails
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

    // 使用JavaScript内置排序作为测试结果
    sortedData.value = [...data.value].sort((a, b) => a - b)
    comparisonCount.value = data.value.length // 计数排序的比较次数等于数组长度
    swapCount.value = data.value.length // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    counts.value = []

    isButtonClicked.value = false
    sortingStatus.value = '测试排序完成'
    const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
    sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
    currentStepDetails.value = finishDetails
  } catch (error) {
    console.error('[ERROR] 测试排序失败:', error)
    errorMessage.value = `测试排序失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

// 重置排序由 useSortingVisualization 提供（Fisher-Yates 打乱 + 公共统计清零）

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
  <div class="counting-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>计数排序</h2>
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
                'min': index === minIndex,
                'sorted': isSorting && data && sortedData[index] === data.slice().sort((a, b) => a - b)[index]
              }" 
              :style="{ height: `${value * 3}px` }"
              :data-value="value"
            ></div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSorting" @input="listSize = Number($event.target.value)">
            </div>
            <div class="max-value-control">
              <label>数据范围: 1-{{ maxDataValue }}</label>
              <input type="range" min="10" max="100" v-model.number="maxDataValue" :disabled="isSorting" @input="maxDataValue = Number($event.target.value); generateNewList()">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="countingSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <div class="steps-history">
            <h4>排序步骤历史</h4>
            <div class="steps-container">
              <div v-for="step in sortingSteps" :key="step.step" :class="['step-item', step.type]">
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
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './counting-sort-detail.css';
</style>
