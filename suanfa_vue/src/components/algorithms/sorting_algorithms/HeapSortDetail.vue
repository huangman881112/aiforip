<template>
  <div class="heap-sort-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>堆排序</h2>
    </div>
    
    <!-- 标签页内容 -->
    <div class="tab-content">
      
      <!-- 排序标签页 -->
      <div class="sort-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">排序状态:</span>
            <span class="stat-value">{{ getSortingStatusText() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">堆化次数:</span>
            <span class="stat-value">{{ heapifyCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">交换次数:</span>
            <span class="stat-value">{{ swapCount }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="chart-container">
            <div v-for="(value, index) in list" :key="index"
                 :class="['bar', comparedIndices.includes(index) ? 'compared' : '', swappedIndices.includes(index) ? 'swapped' : '', sortedIndices.includes(index) ? 'sorted' : '']"
                 :style="{ height: `${value * 3}px`, backgroundColor: getBarColor(index) }"
                 :data-value="value">
            </div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" min="5" max="100" v-model.number="listSize" :disabled="isSorting">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="startSorting" :disabled="isSorting || list.length === 0">开始排序</button>
            <button @click="testSorting" :disabled="isSorting || list.length === 0">测试排序</button>
            <button @click="resetSorting" :disabled="!isSorting && sortingStatus === 'idle'">重置</button>
            <div class="speed-control">
              <label>动画速度:</label>
              <input type="range" min="100" max="2000" step="100" v-model.number="animationSpeed" :disabled="isSorting">
            </div>
          </div>
          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ stepsHistory.length > 0 ? stepsHistory[stepsHistory.length - 1] : '准备就绪' }}</p>
          </div>
          <div class="steps-history">
            <h4>排序步骤历史</h4>
            <div class="steps-container">
              <div v-for="(step, index) in stepsHistory" :key="index" class="step-item">
                <span class="step-number">{{ index + 1 }}.</span>
                <span class="step-details">{{ step }}</span>
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
@import './heap-sort-detail.css';
</style>

<script setup>
import { ref } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 堆排序专属状态（可视化模型与共享 composable 不同：originalList + stepsHistory 字符串 + 枚举状态，保持独立）
const listSize = ref(20)
const list = ref([])
const originalList = ref([])
const isSorting = ref(false)
const sortingStatus = ref('idle') // idle, sorting, completed, failed
const animationSpeed = ref(500)
const comparedIndices = ref([])
const swappedIndices = ref([])
const sortedIndices = ref([])
const heapifyCount = ref(0)
const swapCount = ref(0)
const stepsHistory = ref([])

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 生成新列表
const generateNewList = () => {
  list.value = []
  originalList.value = []
  comparedIndices.value = []
  swappedIndices.value = []
  sortedIndices.value = []
  heapifyCount.value = 0
  swapCount.value = 0
  stepsHistory.value = []
  sortingStatus.value = 'idle'
  isSorting.value = false

  // 生成随机数据
  for (let i = 0; i < listSize.value; i++) {
    const value = Math.floor(Math.random() * 100) + 1
    list.value.push(value)
    originalList.value.push(value)
  }
}

// 初始化数据
generateNewList()

// 开始排序
const startSorting = async () => {
  if (isSorting.value) return

  isSorting.value = true
  sortingStatus.value = 'sorting'
  comparedIndices.value = []
  swappedIndices.value = []
  sortedIndices.value = []
  heapifyCount.value = 0
  swapCount.value = 0
  stepsHistory.value = []
  list.value = [...originalList.value]

  try {
    await heapSort(list.value)
    sortingStatus.value = 'completed'
  } catch (error) {
    console.error('排序出错:', error)
    sortingStatus.value = 'failed'
  } finally {
    isSorting.value = false
  }
}

// 测试排序
const testSorting = () => {
  const testList = [...originalList.value]
  const sortedList = [...testList].sort((a, b) => a - b)
  const result = heapSortSync(testList)

  if (JSON.stringify(result) === JSON.stringify(sortedList)) {
    alert('排序算法正确！')
  } else {
    alert('排序算法错误！')
  }
}

// 重置排序
const resetSorting = () => {
  isSorting.value = false
  sortingStatus.value = 'idle'
  list.value = [...originalList.value]
  comparedIndices.value = []
  swappedIndices.value = []
  sortedIndices.value = []
  stepsHistory.value = []
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// 异步堆排序（可视化）
async function heapSort(arr) {
  const n = arr.length
  stepsHistory.value.push('开始构建最大堆')

  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    await heapify(arr, n, i)
  }

  stepsHistory.value.push('最大堆构建完成，开始排序')

  // 一个个提取堆顶元素
  for (let i = n - 1; i > 0; i--) {
    // 将当前堆顶（最大值）移到数组末尾
    [arr[0], arr[i]] = [arr[i], arr[0]]
    swapCount.value++
    swappedIndices.value = [0, i]
    stepsHistory.value.push(`将最大元素 ${arr[i]} 移到位置 ${i}`)
    sortedIndices.value.push(i)

    await sleep(animationSpeed.value)

    // 在减小的堆中调用heapify
    await heapify(arr, i, 0)
  }

  // 最后一个元素也已排序
  sortedIndices.value.push(0)
  stepsHistory.value.push('排序完成')
}

// 堆化（可视化）
async function heapify(arr, n, i) {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2

  comparedIndices.value = [i]
  stepsHistory.value.push(`堆化节点 ${i}`)

  // 检查左子节点是否大于根节点
  if (left < n) {
    comparedIndices.value.push(left)
    await sleep(animationSpeed.value / 2)

    if (arr[left] > arr[largest]) {
      largest = left
      stepsHistory.value.push(`左子节点 ${left} 大于当前最大值，更新最大值索引为 ${largest}`)
    }
  }

  // 检查右子节点是否大于目前的最大节点
  if (right < n) {
    comparedIndices.value.push(right)
    await sleep(animationSpeed.value / 2)

    if (arr[right] > arr[largest]) {
      largest = right
      stepsHistory.value.push(`右子节点 ${right} 大于当前最大值，更新最大值索引为 ${largest}`)
    }
  }

  // 如果最大节点不是根节点
  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]]
    swapCount.value++
    swappedIndices.value = [i, largest]
    stepsHistory.value.push(`交换节点 ${i} 和节点 ${largest}`)
    heapifyCount.value++

    await sleep(animationSpeed.value)

    // 递归地堆化受影响的子树
    await heapify(arr, n, largest)
  } else {
    heapifyCount.value++
  }
}

// 同步堆排序（测试用）
function heapSortSync(arr) {
  const n = arr.length

  // 构建最大堆
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    heapifySync(arr, n, i)
  }

  // 一个个提取堆顶元素
  for (let i = n - 1; i > 0; i--) {
    [arr[0], arr[i]] = [arr[i], arr[0]]
    heapifySync(arr, i, 0)
  }

  return arr
}

function heapifySync(arr, n, i) {
  let largest = i
  const left = 2 * i + 1
  const right = 2 * i + 2

  if (left < n && arr[left] > arr[largest]) {
    largest = left
  }

  if (right < n && arr[right] > arr[largest]) {
    largest = right
  }

  if (largest !== i) {
    [arr[i], arr[largest]] = [arr[largest], arr[i]]
    heapifySync(arr, n, largest)
  }
}

// 排序状态文本
const getSortingStatusText = () => {
  switch (sortingStatus.value) {
    case 'idle':
      return '就绪'
    case 'sorting':
      return '排序中...'
    case 'completed':
      return '排序完成'
    case 'failed':
      return '排序失败'
    default:
      return '未知状态'
  }
}

// 柱子颜色
const getBarColor = (index) => {
  if (sortedIndices.value.includes(index)) {
    return '#4CAF50' // 绿色表示已排序
  } else if (swappedIndices.value.includes(index)) {
    return '#FF5722' // 橙色表示刚交换
  } else if (comparedIndices.value.includes(index)) {
    return '#2196F3' // 蓝色表示正在比较
  } else {
    return '#9E9E9E' // 灰色表示未处理
  }
}
</script>