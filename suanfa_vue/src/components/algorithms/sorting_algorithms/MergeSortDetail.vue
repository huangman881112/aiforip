<script setup>
import { ref } from 'vue'
import { useSortingVisualization } from '../../../composables/useSortingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 可视化共享脚手架（列表大小/随机数据/统计状态/生成新列表/重置排序）
const {
  listSize, minSize, maxSize,
  errorMessage, sortingSteps, currentStepDetails,
  data, sortedData,
  generateNewList, resetSort,
  isSorting, isButtonClicked, sortingStatus, animationSpeed,
  comparisonCount, currentStep,
} = useSortingVisualization({
  onReset: () => {
    mergeCount.value = 0
    mergedIndices.value = []
    currentMergeRange.value = { start: 0, end: 0 }
  }
})

// 归并排序专属状态
const mergeCount = ref(0)
const mergedIndices = ref([])
const currentMergeRange = ref({ start: 0, end: 0 })

// 归并排序算法实现
const mergeSort = async () => {
  console.log('开始排序按钮被点击');
  isButtonClicked.value = true;
  isSorting.value = true;
  sortingStatus.value = '排序中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  comparisonCount.value = 0
  mergeCount.value = 0
  currentStep.value = 0
  mergedIndices.value = []
  currentMergeRange.value = { start: 0, end: 0 }
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 归并排序实现
  const arr = [...data.value]
  await performMergeSort(arr, 0, arr.length - 1)

  mergedIndices.value = []
  isSorting.value = false
  sortingStatus.value = '排序完成'
  const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${mergeCount.value} 次合并`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

// 归并排序递归函数
const performMergeSort = async (arr, left, right) => {
  if (left < right) {
    const mid = Math.floor((left + right) / 2)
    currentStepDetails.value = `将数组从索引 ${left} 到 ${right} 分成两部分: [${left}~${mid}] 和 [${mid+1}~${right}]`
    sortingSteps.value.push({ step: currentStep.value++, type: 'split', details: currentStepDetails.value })
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    await performMergeSort(arr, left, mid)
    await performMergeSort(arr, mid + 1, right)
    await merge(arr, left, mid, right)
  }
}

// 合并函数
const merge = async (arr, left, mid, right) => {
  currentMergeRange.value = { start: left, end: right }
  const leftArr = arr.slice(left, mid + 1)
  const rightArr = arr.slice(mid + 1, right + 1)

  let i = 0, j = 0, k = left
  mergeCount.value++
  currentStepDetails.value = `合并子数组 [${left}~${mid}] 和 [${mid+1}~${right}]`
  sortingSteps.value.push({ step: currentStep.value++, type: 'merge', details: currentStepDetails.value })
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

  while (i < leftArr.length && j < rightArr.length) {
    comparisonCount.value++
    const compareDetails = `比较 ${leftArr[i]} 和 ${rightArr[j]}`
    sortingSteps.value.push({ step: currentStep.value++, type: 'compare', details: compareDetails })
    currentStepDetails.value = compareDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    if (leftArr[i] <= rightArr[j]) {
      arr[k] = leftArr[i]
      mergedIndices.value = [k]
      i++
    } else {
      arr[k] = rightArr[j]
      mergedIndices.value = [k]
      j++
    }
    k++
    sortedData.value = [...arr]
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
  }

  // 处理剩余元素
  while (i < leftArr.length) {
    arr[k] = leftArr[i]
    mergedIndices.value = [k]
    i++
    k++
    sortedData.value = [...arr]
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
  }

  while (j < rightArr.length) {
    arr[k] = rightArr[j]
    mergedIndices.value = [k]
    j++
    k++
    sortedData.value = [...arr]
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
  }
}

// 测试排序 - 忽略isSorting状态
const testSort = async () => {
  console.log('测试排序按钮被点击');
  isButtonClicked.value = true;
  sortingStatus.value = '测试排序中...'
  comparisonCount.value = 0
  mergeCount.value = 0
  currentStep.value = 0
  mergedIndices.value = []
  currentMergeRange.value = { start: 0, end: 0 }
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('测试排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `测试排序开始，初始数据: [${data.value.join(', ')}]` })

  const arr = [...data.value]
  await performMergeSort(arr, 0, arr.length - 1)

  mergedIndices.value = []
  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${mergeCount.value} 次合并`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

</script>

<template>
  <div class="merge-sort-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>归并排序</h2>
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
            <span class="stat-label">合并次数:</span>
            <span class="stat-value">{{ mergeCount }}</span>
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
                'merged': mergedIndices.includes(index),
                'merge-range': index >= currentMergeRange.start && index <= currentMergeRange.end,
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
            <button @click="mergeSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './merge-sort-detail.css';
</style>