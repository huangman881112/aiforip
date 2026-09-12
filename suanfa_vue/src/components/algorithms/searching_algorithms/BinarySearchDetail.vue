<script setup>
import { ref } from 'vue'
import { useSearchingVisualization } from '../../../composables/useSearchingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 可视化共享脚手架（列表大小/目标值/随机数据/统计状态/生成新列表/重置搜索）
const {
  listSize, minSize, maxSize,
  targetValue, minTarget, maxTarget,
  errorMessage, searchSteps, currentStepDetails,
  data, searchData,
  generateNewList, resetSearch,
  isSearching, isButtonClicked, searchStatus, animationSpeed,
  comparisonCount, currentStep, foundIndex,
} = useSearchingVisualization({
  generateRandomData: (size) => {
    const result = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1)
    result.sort((a, b) => a - b)
    return result
  },
  onReset: () => {
    currentLeft.value = 0
    currentRight.value = searchData.value.length - 1
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
  },
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 二分查找专属状态
const left = ref(0)
const right = ref(searchData.value.length - 1)
const mid = ref(0)
const currentLeft = ref(-1)
const currentRight = ref(-1)
const currentMid = ref(-1)

// 二分查找算法实现
const binarySearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  // 100ms后重置按钮状态
  // setTimeout(() => {
  //   isButtonClicked.value = false;
  // }, 100);
  comparisonCount.value = 0
  currentStep.value = 0
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  currentLeft.value = 0
  currentRight.value = searchData.value.length - 1
  currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
  console.log('搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  // 二分查找实现
  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  while (currentLeft.value <= currentRight.value && !found) {
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查中点索引 ${currentMid.value} (值: ${arr[currentMid.value]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[currentMid.value] === target) {
      found = true
      foundIndex.value = currentMid.value
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${currentMid.value} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    } else if (arr[currentMid.value] < target) {
      const moveRightDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 小于目标值 ${target}，将左边界移动到 ${currentMid.value + 1}`
      console.log(moveRightDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveRightDetails })
      currentStepDetails.value = moveRightDetails
      currentLeft.value = currentMid.value + 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      const moveLeftDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 大于目标值 ${target}，将右边界移动到 ${currentMid.value - 1}`
      console.log(moveLeftDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveLeftDetails })
      currentStepDetails.value = moveLeftDetails
      currentRight.value = currentMid.value - 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
  }

  isSearching.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 左边界 ${currentLeft.value} > 右边界 ${currentRight.value}，未找到目标值 ${target}`
    searchSteps.value.push({ step: currentStep.value + 1, type: 'notFound', details: notFoundDetails })
    currentStepDetails.value = notFoundDetails
  }
  const finishDetails = `搜索完成，${foundIndex.value !== -1 ? `在索引 ${foundIndex.value} 找到目标值` : '未找到目标值'}，共进行了 ${comparisonCount.value} 次比较`
  console.log(finishDetails);
}

// 测试搜索 - 忽略isSearching状态
const testSearch = async () => {
  console.log('测试搜索按钮被点击');
  isButtonClicked.value = true;
  searchStatus.value = '测试搜索中...'
  comparisonCount.value = 0
  currentStep.value = 0
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  currentLeft.value = 0
  currentRight.value = searchData.value.length - 1
  currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
  console.log('测试搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `测试搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  while (currentLeft.value <= currentRight.value && !found) {
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查中点索引 ${currentMid.value} (值: ${arr[currentMid.value]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[currentMid.value] === target) {
      found = true
      foundIndex.value = currentMid.value
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${currentMid.value} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    } else if (arr[currentMid.value] < target) {
      const moveRightDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 小于目标值 ${target}，将左边界移动到 ${currentMid.value + 1}`
      console.log(moveRightDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveRightDetails })
      currentStepDetails.value = moveRightDetails
      currentLeft.value = currentMid.value + 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      const moveLeftDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 大于目标值 ${target}，将右边界移动到 ${currentMid.value - 1}`
      console.log(moveLeftDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveLeftDetails })
      currentStepDetails.value = moveLeftDetails
      currentRight.value = currentMid.value - 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
  }

  isButtonClicked.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '测试搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '测试搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 左边界 ${currentLeft.value} > 右边界 ${currentRight.value}，未找到目标值 ${target}`
    searchSteps.value.push({ step: currentStep.value + 1, type: 'notFound', details: notFoundDetails })
    currentStepDetails.value = notFoundDetails
  }
}

// 重置搜索由 useSearchingVisualization 提供（公共状态清零 + 重新复制原始数据）
</script>

<style scoped>
@import './common-searching-page.css';
</style>

<template>
  <div class="binary-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>二分查找</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">搜索状态:</span>
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
          <div class="stat-item">
            <span class="stat-label">找到索引:</span>
            <span class="stat-value">{{ foundIndex !== -1 ? foundIndex : '未找到' }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="array-container">
            <div 
              v-for="(value, index) in searchData"
              :key="index"
              class="array-element"
              :class="{
                'checking': currentMid === index,
                'found': foundIndex === index,
                'not-found': !isSearching && foundIndex === -1 && searchSteps.length > 0,
                'left-boundary': currentLeft === index,
                'right-boundary': currentRight === index
              }"
              :data-value="value"
            >
              {{ value }}
            </div>
          </div>
          <div class="slider-controls">
            <div class="slider-group">
              <label>列表大小: {{ listSize }}</label>
              <input type="text" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSearching" @input="listSize = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minSize }}-{{ maxSize }})</span>
            </div>
            <div class="slider-group">
              <label>目标值: {{ targetValue }}</label>
              <input type="text" :min="minTarget" :max="maxTarget" v-model.number="targetValue" :disabled="isSearching" @input="targetValue = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minTarget }}-{{ maxTarget }})</span>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSearching">
            </div>
          </div>
          <div class="button-group">
            <button @click="generateNewList" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
            <button @click="binarySearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
            <button @click="testSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">测试搜索</button>
            <button @click="resetSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">重置搜索</button>
          </div>
          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ currentStepDetails }}</p>
          </div>
          <div class="steps-history">
            <h4>搜索步骤历史</h4>
            <div class="steps-container">
              <div v-for="step in searchSteps" :key="step.step" :class="'step-item ' + step.type">
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
@import './binary-search-detail.css';
</style>