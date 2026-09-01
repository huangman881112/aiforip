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
  comparisonCount, swapCount, currentStep, comparedIndices,
} = useSortingVisualization({
  onReset: () => {
    selectedIndices.value = []
    minIndex.value = -1
  }
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

// 选择排序专属状态
const selectedIndices = ref([])
const minIndex = ref(-1)

// 选择排序算法实现
const selectionSort = async () => {
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
  selectedIndices.value = []
  minIndex.value = -1
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 选择排序实现
  const arr = [...data.value]
  const n = arr.length

  for (let i = 0; i < n - 1; i++) {
    console.log(`第 ${i+1} 轮排序开始`);
    selectedIndices.value = [i]
    minIndex.value = i
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 开始第 ${i+1} 轮，选择索引 ${i} 作为当前最小值`
    console.log(stepDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'select', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    for (let j = i + 1; j < n; j++) {
      comparisonCount.value++
      comparedIndices.value = [j]
      currentStep.value++
      const compareDetails = `第 ${currentStep.value} 步: 比较当前最小值 ${arr[minIndex.value]} (索引 ${minIndex.value}) 和元素 ${arr[j]} (索引 ${j})`
      console.log(compareDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
      currentStepDetails.value = compareDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      if (arr[j] < arr[minIndex.value]) {
        minIndex.value = j
        selectedIndices.value = [i, j]
        currentStep.value++
        const updateDetails = `第 ${currentStep.value} 步: 更新最小值为 ${arr[j]} (索引 ${j})`
        console.log(updateDetails);
        sortingSteps.value.push({ step: currentStep.value, type: 'update', details: updateDetails })
        currentStepDetails.value = updateDetails
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
      }
    }

    if (minIndex.value !== i) {
      // 交换元素
      const temp = arr[i]
      arr[i] = arr[minIndex.value]
      arr[minIndex.value] = temp
      swapCount.value++
      currentStep.value++
      const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${i} (值: ${temp}) 和索引 ${minIndex.value} (值: ${arr[i]})`
      console.log(swapDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
      currentStepDetails.value = swapDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      console.log('排序中 - 更新数据:', sortedData.value)
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      currentStep.value++
      const noSwapDetails = `第 ${currentStep.value} 步: 索引 ${i} 已是当前最小值，无需交换`
      console.log(noSwapDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'info', details: noSwapDetails })
      currentStepDetails.value = noSwapDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }

    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
  }

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
  selectedIndices.value = []
  minIndex.value = -1
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('测试排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `测试排序开始，初始数据: [${data.value.join(', ')}]` })

  const arr = [...data.value]
  const n = arr.length

  for (let i = 0; i < n - 1; i++) {
    console.log(`第 ${i+1} 轮测试排序开始`);
    selectedIndices.value = [i]
    minIndex.value = i
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 开始第 ${i+1} 轮，选择索引 ${i} 作为当前最小值`
    console.log(stepDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'select', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    for (let j = i + 1; j < n; j++) {
      comparisonCount.value++
      comparedIndices.value = [j]
      currentStep.value++
      const compareDetails = `第 ${currentStep.value} 步: 比较当前最小值 ${arr[minIndex.value]} (索引 ${minIndex.value}) 和元素 ${arr[j]} (索引 ${j})`
      console.log(compareDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
      currentStepDetails.value = compareDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      if (arr[j] < arr[minIndex.value]) {
        minIndex.value = j
        selectedIndices.value = [i, j]
        currentStep.value++
        const updateDetails = `第 ${currentStep.value} 步: 更新最小值为 ${arr[j]} (索引 ${j})`
        console.log(updateDetails);
        sortingSteps.value.push({ step: currentStep.value, type: 'update', details: updateDetails })
        currentStepDetails.value = updateDetails
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
      }
    }

    if (minIndex.value !== i) {
      // 交换元素
      const temp = arr[i]
      arr[i] = arr[minIndex.value]
      arr[minIndex.value] = temp
      swapCount.value++
      currentStep.value++
      const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${i} (值: ${temp}) 和索引 ${minIndex.value} (值: ${arr[i]})`
      console.log(swapDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
      currentStepDetails.value = swapDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      currentStep.value++
      const noSwapDetails = `第 ${currentStep.value} 步: 索引 ${i} 已是当前最小值，无需交换`
      console.log(noSwapDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'info', details: noSwapDetails })
      currentStepDetails.value = noSwapDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }

    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
  }

  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

</script>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 选择排序特有样式 */
.selection-sort-detail {
  /* 保留组件特有样式 */
}
</style>

<template>
  <div class="selection-sort-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>选择排序</h2>
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
          <p>选择排序是一种简单直观的排序算法。</p>

          <AlgorithmComplexity algorithm-id="selection-sort" />

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function selectionSort(arr):
  n = length(arr)
  for i from 0 to n-1:
    minIndex = i
    for j from i+1 to n-1:
      if arr[j] < arr[minIndex]:
        minIndex = j
    swap arr[i] and arr[minIndex]
  return arr</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def selection_sort(arr):
    n = len(arr)
    for i in range(n):
        min_idx = i
        for j in range(i+1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        arr[i], arr[min_idx] = arr[min_idx], arr[i]
    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function selectionSort(arr) {
    const n = arr.length;
    for (let i = 0; i < n; i++) {
        let minIndex = i;
        for (let j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIndex]) {
                minIndex = j;
            }
        }
        [arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
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
                'selected': selectedIndices.includes(index),
                'min': index === minIndex.value,
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
            <button @click="selectionSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <p>选择排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>双向选择排序</strong>：同时找到最大值和最小值，减少循环次数。</li>
            <li><strong>减少交换次数</strong>：如我们的实现中所示，每轮只交换一次。</li>
            <li><strong>对于已排序部分使用插入排序</strong>：在大规模数据上，可以结合插入排序提高效率。</li>
          </ol>

          <h3>适用场景</h3>
          <p>选择排序适用于小规模数据或需要最小化写入操作的场景。由于选择排序的交换次数较少，在某些对写入操作成本较高的环境中（如写入到Flash存储器），选择排序可能比其他O(n²)排序算法更有优势。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>选择排序的核心思想是每次从未排序部分选出最小元素，放到已排序部分的末尾。</p>
          <p>选择排序是不稳定的排序算法，因为相等元素的相对顺序可能会改变。</p>
          <p>与冒泡排序相比，选择排序通常更高效，因为它的交换次数更少（最多n-1次交换），但比较次数相同（都是O(n²)）。</p>
        </div>
      </div>
    </div>
  </div>
</template>
