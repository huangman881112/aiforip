<script setup>
import { ref } from 'vue'
import AlgorithmComplexity from '../../common/AlgorithmComplexity.vue'
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

// 控制标签页切换
const activeTab = ref('basic')

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

/* 冒泡排序特有样式 */
.bubble-sort-detail {
  /* 保留组件特有样式 */
}
</style>

<template>
  <div class="bubble-sort-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>冒泡排序</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'sort' }" @click="activeTab = 'sort'">排序</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>冒泡排序是一种简单的排序算法。</p>

          <AlgorithmComplexity algorithm-id="bubble-sort" />

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function bubbleSort(arr):
  n = length(arr)
  for i from 0 to n-1:
    swapped = false
    for j from 0 to n-i-1:
      if arr[j] > arr[j+1]:
        swap arr[j] and arr[j+1]
        swapped = true
    if not swapped:
      break
  return arr</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        swapped = False
        for j in range(0, n-i-1):
            if arr[j] > arr[j+1]:
                arr[j], arr[j+1] = arr[j+1], arr[j]
                swapped = True
        if not swapped:
            break
    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function bubbleSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let swapped = false;
        for (let j = 0; j < n - i - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
                swapped = true;
            }
        }
        if (!swapped) break;
    }
    return arr;
}</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'sort'" class="sort-section">
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
                'sorted': isSorting && data.value && sortedData[index] === data.value.slice().sort((a, b) => a - b)[index]
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
            <button @click="resetSort" :disabled="!isSorting && sortedData && data.value && sortedData.join(',') === data.value.join(',')">重置排序</button>
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

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>算法优化</h3>
          <p>冒泡排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>添加标志位</strong>：如我们的实现中所示，当一轮比较没有发生交换时，说明数组已经有序，可以提前退出。</li>
            <li><strong>记录最后一次交换的位置</strong>：可以进一步优化，记录最后一次交换的位置，下次比较只需要到该位置即可。</li>
            <li><strong>鸡尾酒排序</strong>：双向冒泡排序，交替从左到右和从右到左进行排序。</li>
          </ol>

          <h3>适用场景</h3>
          <p>冒泡排序适用于小规模数据或几乎已经有序的数据。对于大规模数据，效率较低，建议使用快速排序、归并排序等更高效的算法。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>冒泡排序是最基本的排序算法之一，理解它对于学习更复杂的排序算法很有帮助。</p>
          <p>冒泡排序的核心思想是重复地访问要排序的数组，一次比较两个元素，如果它们的顺序错误就交换它们，直到没有交换发生为止。</p>
          <p>虽然冒泡排序效率不高，但它实现简单，易于理解，并且是稳定的排序算法（相等元素的相对顺序不会改变）。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './bubble-sort-detail.css';
</style>