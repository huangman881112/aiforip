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
} = useSortingVisualization()

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 冒泡排序算法实现
const bubbleSort = async () => {
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
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 简化的冒泡排序实现
  const arr = [...data.value]
  const n = arr.length
  let sorted = false

  for (let i = 0; i < n - 1 && !sorted; i++) {
    sorted = true
    console.log(`第 ${i+1} 轮排序开始`);
    for (let j = 0; j < n - i - 1; j++) {
      comparisonCount.value++
      comparedIndices.value = [j, j + 1]
      currentStep.value++
      const stepDetails = `第 ${currentStep.value} 步: 比较索引 ${j} (值: ${arr[j]}) 和索引 ${j+1} (值: ${arr[j+1]})`
      console.log(stepDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: stepDetails })
      currentStepDetails.value = stepDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      if (arr[j] > arr[j + 1]) {
        // 交换元素
        const temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
        sorted = false
        swapCount.value++
        swappedIndices.value = [j, j + 1]
        const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${j} (值: ${temp}) 和索引 ${j+1} (值: ${arr[j+1]})`
        console.log(swapDetails);
        sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
        currentStepDetails.value = swapDetails

        // 更新排序数据以触发重新渲染
        sortedData.value = [...arr]
        console.log('排序中 - 更新数据:', sortedData.value)
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
      }
      swappedIndices.value = []
    }
    console.log(`第 ${i+1} 轮排序结束`);
  }

  comparedIndices.value = []
  isSorting.value = false
  sortingStatus.value = '排序完成'
  const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
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
  const n = arr.length
  let sorted = false

  for (let i = 0; i < n - 1 && !sorted; i++) {
    sorted = true
    console.log(`第 ${i+1} 轮测试排序开始`);
    for (let j = 0; j < n - i - 1; j++) {
      comparisonCount.value++
      comparedIndices.value = [j, j + 1]
      currentStep.value++
      const stepDetails = `第 ${currentStep.value} 步: 比较索引 ${j} (值: ${arr[j]}) 和索引 ${j+1} (值: ${arr[j+1]})`
      console.log(stepDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: stepDetails })
      currentStepDetails.value = stepDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      if (arr[j] > arr[j + 1]) {
        // 交换元素
        const temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
        sorted = false
        swapCount.value++
        swappedIndices.value = [j, j + 1]
        const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${j} (值: ${temp}) 和索引 ${j+1} (值: ${arr[j+1]})`
        console.log(swapDetails);
        sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
        currentStepDetails.value = swapDetails

        // 更新排序数据以触发重新渲染
        sortedData.value = [...arr]
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
      }
      swappedIndices.value = []
    }
    console.log(`第 ${i+1} 轮测试排序结束`);
  }

  comparedIndices.value = []
  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

// 重置排序由 useSortingVisualization 提供（Fisher-Yates 打乱 + 公共统计清零）
</script>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './bubble-sort-detail.css';
</style>

<template>
  <div class="bubble-sort-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>冒泡排序</h2>
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
            <button @click="bubbleSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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