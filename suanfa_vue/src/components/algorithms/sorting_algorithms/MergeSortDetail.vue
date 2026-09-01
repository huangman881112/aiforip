<script setup>
import { ref } from 'vue'
import AlgorithmComplexity from '../../common/AlgorithmComplexity.vue'
import { useSortingVisualization } from '../../../composables/useSortingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

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
          <h2>归并排序</h2>
          <p>归并排序是一种高效、稳定的排序算法，基于分治法的思想。</p>

          <AlgorithmComplexity algorithm-id="merge-sort" />

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function mergeSort(arr):
  if length(arr) <= 1:
    return arr
  mid = length(arr) // 2
  left = mergeSort(arr[0...mid-1])
  right = mergeSort(arr[mid...end])
  return merge(left, right)

function merge(left, right):
  result = []
  i = j = 0
  while i < length(left) and j < length(right):
    if left[i] <= right[j]:
      result.append(left[i])
      i += 1
    else:
      result.append(right[j])
      j += 1
  result.extend(left[i...end])
  result.extend(right[j...end])
  return result</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function mergeSort(arr) {
    if (arr.length <= 1) {
        return arr;
    }
    const mid = Math.floor(arr.length / 2);
    const left = mergeSort(arr.slice(0, mid));
    const right = mergeSort(arr.slice(mid));
    return merge(left, right);
}

function merge(left, right) {
    const result = [];
    let i = 0, j = 0;
    while (i < left.length && j < right.length) {
        if (left[i] <= right[j]) {
            result.push(left[i]);
            i++;
        } else {
            result.push(right[j]);
            j++;
        }
    }
    return result.concat(left.slice(i)).concat(right.slice(j));
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
            <button @click="mergeSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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

      <div v-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>算法优化</h3>
          <p>归并排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>原地归并排序</strong>：传统归并排序需要额外空间，可以优化为原地操作，但实现复杂。</li>
            <li><strong>混合排序</strong>：对于小规模子数组（通常小于10个元素），可以使用插入排序代替归并排序。</li>
            <li><strong>并行化</strong>：归并排序天然适合并行处理，可以利用多线程提高性能。</li>
            <li><strong>避免复制</strong>：通过交替使用两个数组来避免不必要的数据复制。</li>
          </ol>

          <h3>适用场景</h3>
          <p>归并排序适用于大规模数据，尤其是当稳定性很重要时。它在处理链表排序时也表现出色。归并排序常用于需要稳定排序的场景，如数据库索引和外部排序。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          <p>归并排序是分治算法的经典应用，它将一个大问题分解为多个小问题，解决小问题后再合并结果。</p>
          <p>归并排序的核心思想是将数组分成两半，分别排序，然后合并两个有序数组。这个过程递归进行，直到子数组长度为1。</p>
          <p>虽然归并排序需要额外的空间，但它的时间复杂度稳定在O(n log n)，并且是稳定的排序算法（相等元素的相对顺序不会改变）。</p>
          <p>归并排序的合并操作是其核心，需要仔细实现以确保效率和稳定性。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 归并排序特有样式 */
.merge-sort-detail {
  /* 保留组件特有样式 */
}

/* 归并过程中高亮显示 */
.bar.merged {
  background-color: #4CAF50;
}

.bar.merge-range {
  background-color: #FFC107;
  opacity: 0.7;
}
</style>