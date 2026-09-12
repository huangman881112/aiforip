<script setup>
// 基数排序详情组件
import { ref, onMounted } from 'vue'
import { useSortingVisualization } from '../../../composables/useSortingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 基数排序专属状态（数据生成器闭包引用，须在脚手架之前声明）
const maxDataValue = ref(1000) // 基数排序的数据范围上限

// 可视化共享脚手架（列表大小/随机数据/统计状态/生成新列表/重置排序）
const {
  listSize, minSize, maxSize,
  errorMessage, currentStepDetails,
  data, sortedData,
  generateNewList, resetSort,
  isSorting, isButtonClicked, sortingStatus, animationSpeed,
  comparisonCount, swapCount, currentStep, comparedIndices,
} = useSortingVisualization({
  defaultSize: 10, minSize: 5, maxSize: 20,
  generateRandomData: (size) => Array.from({ length: size }, () => Math.floor(Math.random() * maxDataValue.value)),
  onReset: () => {
    selectedIndices.value = []
    currentDigit.value = 0
    buckets.value = []
    maxDigits.value = Math.max(...data.value.map(num => num.toString().length), 0)
  },
})

// 基数排序专属状态
const selectedIndices = ref([])
const currentDigit = ref(0)
const buckets = ref([])
const bucketsHistory = ref([])  // 存储每轮排序的桶状态
const maxDigits = ref(0)
const activeHistoryDigit = ref(-1)  // 当前查看的历史位数

// 获取指定位数的数字
const getDigit = (num, digit) => {
  return Math.floor(Math.abs(num) / Math.pow(10, digit)) % 10
}

// 基数排序实现
const radixSort = async () => {
  try {
    if (isSorting.value) return
    isSorting.value = true
    isButtonClicked.value = true
    sortingStatus.value = '排序中'
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    currentDigit.value = 0
    buckets.value = []
    currentStepDetails.value = ''

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    const n = arr.length
    maxDigits.value = Math.max(...arr.map(num => num.toString().length))

    // 步骤1: 对每一位进行计数排序
    for (let digit = 0; digit < maxDigits.value; digit++) {
      currentDigit.value = digit

      const step1Detail = `开始对第 ${digit} 位进行排序 (从0开始，0表示最低位)`
      currentStepDetails.value = step1Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

      // 步骤2: 初始化桶 (0-9共10个桶)
      buckets.value = Array.from({ length: 10 }, () => [])
      const step2Detail = `初始化 10 个桶 (0-9)`
      currentStepDetails.value = step2Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

      // 步骤3: 将元素分配到对应的桶中
      for (let i = 0; i < n; i++) {
        const num = arr[i]
        const bucketIndex = getDigit(num, digit)
        buckets.value[bucketIndex].push(num)
        comparisonCount.value++

        selectedIndices.value = [i]
        const step3Detail = `将元素 ${num} (索引 ${i}) 分配到桶 ${bucketIndex} (第 ${digit} 位值: ${bucketIndex})`
        currentStepDetails.value = step3Detail
        currentStep.value++

        await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
      }

      // 步骤4: 从桶中收集元素
      let index = 0
      for (let i = 0; i < 10; i++) {
        for (let j = 0; j < buckets.value[i].length; j++) {
          arr[index++] = buckets.value[i][j]
          swapCount.value++

          // 更新可视化数据
          sortedData.value = [...arr]
          selectedIndices.value = [index - 1]
          const step4Detail = `从桶 ${i} 中取出元素 ${buckets.value[i][j]}，放置到位置 ${index - 1}`
          currentStepDetails.value = step4Detail
          currentStep.value++

          await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
        }
      }

      // 保存当前轮次的桶状态
      bucketsHistory.value[digit] = JSON.parse(JSON.stringify(buckets.value))

      const step5Detail = `第 ${digit} 位排序完成，结果: [${arr.slice(0, 10).join(', ')}${arr.length > 10 ? ', ...' : ''}]`
      currentStepDetails.value = step5Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 排序完成后，默认显示最后一轮的桶状态
    activeHistoryDigit.value = maxDigits.value - 1

    isButtonClicked.value = false
    sortingStatus.value = '排序完成'
    const finishDetails = `排序完成，最终结果: [${sortedData.value.slice(0, 10).join(', ')}${sortedData.value.length > 10 ? ', ...' : ''}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
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
    comparisonCount.value = data.value.length * maxDigits.value // 估计值
    swapCount.value = data.value.length * maxDigits.value // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    currentDigit.value = 0
    buckets.value = []

    isButtonClicked.value = false
    sortingStatus.value = '测试排序完成'
    const finishDetails = `测试排序完成，最终结果: [${sortedData.value.slice(0, 10).join(', ')}${sortedData.value.length > 10 ? ', ...' : ''}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
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
  <div class="radix-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>基数排序</h2>
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
          <div class="stat-item">
            <span class="stat-label">当前位数:</span>
            <span class="stat-value">{{ currentDigit }}</span> (0表示最低位)
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
                'sorted': isSorting && data && sortedData[index] === data.slice().sort((a, b) => a - b)[index]
              }" 
              :style="{ height: `${value * 0.5}px` }"
              :data-value="value"
            ></div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSorting" @input="listSize = Number($event.target.value)">
            </div>
            <div class="max-value-control">
              <label>最大数值: {{ maxDataValue }}</label>
              <input type="range" min="100" max="10000" v-model.number="maxDataValue" :disabled="isSorting" @input="maxDataValue = Number($event.target.value); generateNewList()">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="radixSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <div class="buckets-status" v-if="isSorting && buckets.length > 0">
            <h4>当前桶状态 (第 {{ currentDigit }} 位)</h4>
            <div class="buckets-container">
              <div v-for="(bucket, index) in buckets" :key="index" class="bucket-item">
                <span class="bucket-number">桶 {{ index }}:</span>
                <span class="bucket-contents">{{ bucket.join(', ') }}</span>
              </div>
            </div>
          </div>

          <div class="history-buckets-status" v-if="!isSorting && bucketsHistory.length > 0">
            <h4>历史桶状态</h4>
            <div class="history-controls">
              <button v-for="digit in Array(maxDigits).keys()" :key="digit" @click="activeHistoryDigit = digit" :class="{ 'active': activeHistoryDigit === digit }">{{ digit }}位</button>
            </div>
            <div class="buckets-container">
              <div v-for="(bucket, index) in bucketsHistory[activeHistoryDigit]" :key="index" class="bucket-item">
                <span class="bucket-number">桶 {{ index }}:</span>
                <span class="bucket-contents">{{ bucket.join(', ') }}</span>
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
@import './radix-sort-detail.css';

/* 基数排序特有样式 */
.radix-sort-detail {
  /* 保留组件特有样式 */
}

/* 桶状态显示样式 */
.buckets-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.bucket-item {
  padding: 8px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  background-color: var(--surface-muted);
  min-width: 150px;
}

.bucket-number {
  font-weight: bold;
  margin-right: 5px;
}

.bucket-contents {
  font-family: monospace;
}

.history-controls {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.history-controls button {
  padding: 5px 10px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  background-color: var(--surface-2);
  cursor: pointer;
}

.history-controls button.active {
  background-color: #42b983;
  color: white;
  border-color: #42b983;
}

.history-buckets-status {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  background-color: var(--surface-muted);
}
</style>