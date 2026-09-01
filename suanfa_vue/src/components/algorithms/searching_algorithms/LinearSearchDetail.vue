<script setup>
import { ref } from 'vue'
import AlgorithmComplexity from '../../common/AlgorithmComplexity.vue'
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
  comparisonCount, currentStep, currentIndex, foundIndex,
} = useSearchingVisualization()

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

// 线性查找算法实现
const linearSearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  comparisonCount.value = 0
  currentStep.value = 0
  currentIndex.value = -1
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  console.log('搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  // 线性查找实现
  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  for (let i = 0; i < arr.length && !found; i++) {
    currentIndex.value = i
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查索引 ${i} (值: ${arr[i]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[i] === target) {
      found = true
      foundIndex.value = i
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${i} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    }
  }

  currentIndex.value = -1
  isSearching.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 未找到目标值 ${target}`
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
  currentIndex.value = -1
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  console.log('测试搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `测试搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  for (let i = 0; i < arr.length && !found; i++) {
    currentIndex.value = i
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查索引 ${i} (值: ${arr[i]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[i] === target) {
      found = true
      foundIndex.value = i
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${i} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    }
  }

  currentIndex.value = -1
  isButtonClicked.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '测试搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '测试搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 未找到目标值 ${target}`
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
  <div class="linear-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>线性查找</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>线性查找是一种简单的搜索算法，它按顺序检查数组中的每个元素，直到找到目标值或遍历完整个数组。</p>

          <AlgorithmComplexity algorithm-id="linear-search" />

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function linearSearch(arr, target):
  for i from 0 to len(arr)-1:
    if arr[i] == target:
      return i  // 找到目标，返回索引
  return -1  // 未找到目标</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function linearSearch(arr, target) {
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i;
        }
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
                'checking': currentIndex === index,
                'found': foundIndex === index,
                'not-found': !isSearching && foundIndex === -1 && searchSteps.length > 0
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
            <button @click="linearSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>算法优化</h3>
          <p>线性查找的标准实现简单但效率较低，可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>哨兵查找</strong>：在数组末尾放置目标值作为哨兵，可以减少循环中的条件判断。</li>
            <li><strong>分块查找</strong>：对于大规模数据，可以先进行分块，再在块内进行线性查找。</li>
            <li><strong>插值查找</strong>：对于均匀分布的数据，可以使用插值查找提高效率。</li>
          </ol>

          <h3>适用场景</h3>
          <p>线性查找适用于小规模数据或无序数据。对于大规模有序数据，建议使用二分查找、插值查找等更高效的算法。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>线性查找是最基本的搜索算法之一，理解它对于学习更复杂的搜索算法很有帮助。</p>
          <p>线性查找的核心思想是按顺序检查数组中的每个元素，直到找到目标值或遍历完整个数组。</p>
          <p>虽然线性查找效率不高，但它实现简单，易于理解，并且不需要数据有序。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './linear-search-detail.css';
</style>