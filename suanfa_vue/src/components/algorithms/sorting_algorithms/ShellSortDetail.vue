<script setup>
// 希尔排序详情组件
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
    minIndex.value = -1
  }
})

// 希尔排序专属状态
const selectedIndices = ref([])
const minIndex = ref(-1)

// 希尔排序实现
const shellSort = async () => {
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

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    const n = arr.length
    let gap = Math.floor(n / 2)

    while (gap > 0) {
      for (let i = gap; i < n; i++) {
        const temp = arr[i]
        let j = i

        // 添加步骤信息
        const stepDetail = `当前间隔: ${gap}, 处理元素: ${temp} (索引 ${i})`
        sortingSteps.value.push({ step: currentStep.value + 1, type: 'info', details: stepDetail })
        currentStepDetails.value = stepDetail
        currentStep.value++

        while (j >= gap && arr[j - gap] > temp) {
          comparisonCount.value++
          comparedIndices.value = [j - gap, j]
          selectedIndices.value = [j]

          // 展示比较过程
          await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

          arr[j] = arr[j - gap]
          swapCount.value++
          j -= gap

          // 更新排序后的数据
          sortedData.value = [...arr]

          // 添加交换步骤信息
          const swapDetail = `交换元素: ${arr[j + gap]} (索引 ${j + gap}) 与 ${temp} (索引 ${j + gap + gap})`
          sortingSteps.value.push({ step: currentStep.value + 1, type: 'swap', details: swapDetail })
          currentStepDetails.value = swapDetail
          currentStep.value++

          // 展示交换过程
          await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
        }

        if (j !== i) {
          arr[j] = temp
          sortedData.value = [...arr]
        }

        // 重置索引标记
        comparedIndices.value = []
        selectedIndices.value = []
      }

      gap = Math.floor(gap / 2)
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
    comparisonCount.value = Math.floor(data.value.length * Math.log2(data.value.length)) // 估计值
    swapCount.value = data.value.length // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1

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
  <div class="shell-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>希尔排序</h2>
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
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="shellSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
@import './shell-sort-detail.css';

/* 希尔排序特有样式 */
.shell-sort-detail {
  /* 保留组件特有样式 */
}
</style>