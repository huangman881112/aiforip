<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './quick-sort-detail.css';
</style>

<script setup>
import { ref } from 'vue'
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
  comparisonCount, swapCount, currentStep, comparedIndices, swappedIndices,
} = useSortingVisualization({
  onReset: () => {
    leftPartitionIndices.value = []
    rightPartitionIndices.value = []
    pivotIndex.value = -1
  }
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 快速排序专属状态
const pivotIndex = ref(-1)
const leftPartitionIndices = ref([])
const rightPartitionIndices = ref([])

// 快速排序算法实现
const quickSort = async () => {
  console.log('开始排序按钮被点击');
  isButtonClicked.value = true;
  isSorting.value = true;
  sortingStatus.value = '排序中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  comparisonCount.value = 0
  swapCount.value = 0
  currentStep.value = 0
  comparedIndices.value = []
  swappedIndices.value = []
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 复制数据以便排序
  const arr = [...data.value]
  sortedData.value = [...arr]

  // 开始快速排序
  await quickSortHelper(arr, 0, arr.length - 1)

  comparedIndices.value = []
  swappedIndices.value = []
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1
  isSorting.value = false
  sortingStatus.value = '排序完成'
  const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

// 快速排序辅助函数
const quickSortHelper = async (arr, low, high) => {
  if (low < high) {
    // 进行分区并获取基准元素的位置
    const pi = await partition(arr, low, high)
    console.log(`分区完成，基准元素位置: ${pi}`)

    // 递归排序左半部分
    await quickSortHelper(arr, low, pi - 1)

    // 递归排序右半部分
    await quickSortHelper(arr, pi + 1, high)
  }
}

// 分区函数
const partition = async (arr, low, high) => {
  // 选择最右边的元素作为基准
  const pivot = arr[high]
  pivotIndex.value = high
  currentStep.value++
  const pivotDetails = `第 ${currentStep.value} 步: 选择基准元素: ${pivot} (索引 ${high})`
  console.log(pivotDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'pivot', details: pivotDetails })
  currentStepDetails.value = pivotDetails
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  let i = low - 1  // 小于基准区域的指针

  for (let j = low; j < high; j++) {
    comparisonCount.value++
    comparedIndices.value = [j, high]
    currentStep.value++
    const compareDetails = `第 ${currentStep.value} 步: 比较元素 ${arr[j]} (索引 ${j}) 和基准元素 ${pivot} (索引 ${high})`
    console.log(compareDetails)
    sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
    currentStepDetails.value = compareDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    // 如果当前元素小于基准元素
    if (arr[j] < pivot) {
      i++
      // 交换元素
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
      swapCount.value++
      swappedIndices.value = [i, j]
      currentStep.value++
      const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${i} (值: ${temp}) 和索引 ${j} (值: ${arr[j]})`
      console.log(swapDetails)
      sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
      currentStepDetails.value = swapDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
    swappedIndices.value = []
  }

  // 将基准元素放到正确的位置
  i++
  const temp = arr[i]
  arr[i] = arr[high]
  arr[high] = temp
  swapCount.value++
  swappedIndices.value = [i, high]
  currentStep.value++
  const pivotSwapDetails = `第 ${currentStep.value} 步: 将基准元素 ${pivot} (索引 ${high}) 放到正确位置 (索引 ${i})`
  console.log(pivotSwapDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: pivotSwapDetails })
  currentStepDetails.value = pivotSwapDetails

  // 更新排序数据以触发重新渲染
  sortedData.value = [...arr]
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  // 高亮显示分区结果
  leftPartitionIndices.value = Array.from({length: i}, (_, idx) => low + idx)
  rightPartitionIndices.value = Array.from({length: high - i}, (_, idx) => i + 1 + idx)
  currentStep.value++
  const partitionDetails = `第 ${currentStep.value} 步: 分区完成，左分区: [${arr.slice(low, i).join(', ')}]，右分区: [${arr.slice(i+1, high+1).join(', ')}]`
  console.log(partitionDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'partition', details: partitionDetails })
  currentStepDetails.value = partitionDetails
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  // 清除高亮
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1

  return i
}

// 测试排序 - 忽略isSorting状态
const testSort = async () => {
  console.log('测试排序按钮被点击');
  isButtonClicked.value = true;
  sortingStatus.value = '测试排序中...'
  comparisonCount.value = 0
  swapCount.value = 0
  currentStep.value = 0
  comparedIndices.value = []
  swappedIndices.value = []
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('测试排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `测试排序开始，初始数据: [${data.value.join(', ')}]` })

  const arr = [...data.value]
  sortedData.value = [...arr]

  // 开始快速排序
  await quickSortHelper(arr, 0, arr.length - 1)

  comparedIndices.value = []
  swappedIndices.value = []
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1
  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

</script>

<template>
  <div class="quick-sort-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>快速排序</h2>
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
                'swapped': swappedIndices.includes(index),
                'pivot': index === pivotIndex,
                'left-partition': leftPartitionIndices.includes(index),
                'right-partition': rightPartitionIndices.includes(index),
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
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="quickSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
              <div v-for="step in sortingSteps" :key="step.step" :class="'step-item ' + step.type">
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