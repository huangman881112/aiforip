<script setup>
// 希尔排序详情组件
import { ref, computed, onMounted } from 'vue'

// 标签页管理
const activeTab = ref('basic')

// 排序状态管理
const isSorting = ref(false)
const isButtonClicked = ref(false)
const sortingStatus = ref('就绪')
const comparisonCount = ref(0)
const swapCount = ref(0)
const currentStep = ref(0)
const sortedData = ref([])
const data = ref([])
const comparedIndices = ref([])
const selectedIndices = ref([])
const minIndex = ref(-1)
const sortingSteps = ref([])
const currentStepDetails = ref('')
const errorMessage = ref('')

// 动画控制
const animationSpeed = ref(500)
const listSize = ref(10)
const minSize = ref(5)
const maxSize = ref(20)

// 生成新列表
const generateNewList = () => {
  try {
    isSorting.value = false
    const newData = Array.from({ length: listSize.value }, () => Math.floor(Math.random() * 100) + 1)
    data.value = [...newData]
    sortedData.value = [...newData]
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    sortingStatus.value = '就绪'
    sortingSteps.value = []
    currentStepDetails.value = ''
    console.log('[DEBUG] 生成新列表:', sortedData.value)
  } catch (error) {
    console.error('[ERROR] 生成新列表失败:', error)
    errorMessage.value = `生成新列表失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

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
    console.log(finishDetails);
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
    console.log(finishDetails);
    sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
    currentStepDetails.value = finishDetails
  } catch (error) {
    console.error('[ERROR] 测试排序失败:', error)
    errorMessage.value = `测试排序失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

// 重置排序 - 打乱数组
const resetSort = () => {
  try {
    isSorting.value = false

    // 检查data.value是否存在且是数组
    if (!data || typeof data.value === 'undefined' || !Array.isArray(data.value)) {
      throw new Error('数据对象未正确初始化或不是数组');
    }

    // 使用Fisher-Yates洗牌算法打乱数组
    const shuffled = [...data.value]

    // 检查shuffled是否是有效数组
    if (!Array.isArray(shuffled)) {
      throw new Error('无法创建数据副本');
    }

    console.log('[DEBUG] 开始打乱数组，长度:', shuffled.length)

    for (let i = shuffled.length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1))

      // 检查索引是否有效
      if (j < 0 || j >= shuffled.length) {
        throw new Error(`无效的随机索引: ${j}，数组长度: ${shuffled.length}`);
      }

      console.log(`[DEBUG] 交换索引 ${i} 和 ${j}`)

      // 安全地交换元素
      const temp = shuffled[i];
      shuffled[i] = shuffled[j];
      shuffled[j] = temp;
    }

    // 检查sortedData是否存在
    if (!sortedData || typeof sortedData.value === 'undefined') {
      throw new Error('排序数据对象未正确初始化');
    }

    sortedData.value = shuffled
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    sortingStatus.value = '就绪'
    sortingSteps.value = []
    currentStepDetails.value = ''
    console.log('[DEBUG] 重置排序 - 数组已打乱:', sortedData.value)
  } catch (error) {
    console.error('[ERROR] 重置排序失败:', error)
    errorMessage.value = `重置排序失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

// 关闭详情
const closeDetail = () => {
  // 触发父组件的close事件
  defineEmits(['close'])()
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
          <p>希尔排序是插入排序的一种改进版本，也称为"缩小增量排序"。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n²)</li>
                  <li><span>最好情况:</span> O(n log² n)</li>
                  <li><span>平均情况:</span> O(n^1.3)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">稳定性:</span> 不稳定</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function shellSort(arr):
  n = length(arr)
  gap = floor(n / 2)
  while gap > 0:
    for i from gap to n-1:
      temp = arr[i]
      j = i
      while j >= gap and arr[j-gap] > temp:
        arr[j] = arr[j-gap]
        j -= gap
      arr[j] = temp
    gap = floor(gap / 2)
  return arr</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def shell_sort(arr):
    n = len(arr)
    gap = n // 2

    while gap > 0:
        for i in range(gap, n):
            temp = arr[i]
            j = i
            while j >= gap and arr[j - gap] > temp:
                arr[j] = arr[j - gap]
                j -= gap
            arr[j] = temp
        gap //= 2
    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function shellSort(arr) {
    const n = arr.length;
    let gap = Math.floor(n / 2);

    while (gap > 0) {
        for (let i = gap; i < n; i++) {
            const temp = arr[i];
            let j = i;
            while (j >= gap && arr[j - gap] > temp) {
                arr[j] = arr[j - gap];
                j -= gap;
            }
            arr[j] = temp;
        }
        gap = Math.floor(gap / 2);
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
            <button @click="shellSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
              <div v-for="step in sortingSteps" :key="step.step" :class="['step-item', step.type]">
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
          <p>希尔排序的性能很大程度上依赖于间隔序列的选择。以下是几种常见的间隔序列：</p>
          <ol style="text-align: left;">
            <li><strong>Shell原始序列</strong>：n/2, n/4, ..., 1</li>
            <li><strong>Hibbard序列</strong>：1, 3, 7, 15, ..., 2^k - 1</li>
            <li><strong>Sedgewick序列</strong>：1, 5, 19, 41, 109, ...</li>
          </ol>

          <h3>适用场景</h3>
          <p>希尔排序适用于中等规模的数据集。它比简单的插入排序更高效，尤其是当数据量较大时。希尔排序也不需要额外的存储空间，因此在内存受限的环境中也很有用。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>希尔排序的核心思想是将数组按照一定的间隔分成多个子数组，然后对每个子数组进行插入排序。随着排序的进行，间隔逐渐减小，直到为1，此时整个数组基本有序，最后进行一次普通的插入排序。</p>
          <p>希尔排序是不稳定的排序算法，因为相同元素的相对顺序可能会因为相隔较远的比较和交换而改变。</p>
          <p>希尔排序的平均时间复杂度取决于间隔序列的选择，一般在O(n^1.3)左右，比插入排序的O(n²)要高效。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 希尔排序特有样式 */
.shell-sort-detail {
  /* 保留组件特有样式 */
}
</style>