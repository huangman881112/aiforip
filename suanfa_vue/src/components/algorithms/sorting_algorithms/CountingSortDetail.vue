<script setup>
// 计数排序详情组件
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
const counts = ref([])
const maxValue = ref(0)

// 动画控制
const animationSpeed = ref(500)
const listSize = ref(10)
const minSize = ref(5)
const maxSize = ref(20)
const maxDataValue = ref(20) // 计数排序的数据范围上限

// 生成新列表
const generateNewList = () => {
  try {
    isSorting.value = false
    const newData = Array.from({ length: listSize.value }, () => Math.floor(Math.random() * maxDataValue.value) + 1)
    data.value = [...newData]
    sortedData.value = [...newData]
    maxValue.value = Math.max(...newData)
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    counts.value = []
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

// 计数排序实现
const countingSort = async () => {
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
    counts.value = []

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    const n = arr.length
    maxValue.value = Math.max(...arr)

    // 步骤1: 初始化计数数组
    counts.value = new Array(maxValue.value + 1).fill(0)
    const step1Detail = `初始化计数数组，大小: ${maxValue.value + 1}`
    sortingSteps.value.push({ step: currentStep.value + 1, type: 'info', details: step1Detail })
    currentStepDetails.value = step1Detail
    currentStep.value++

    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    // 步骤2: 统计每个元素出现的次数
    for (let i = 0; i < n; i++) {
      const num = arr[i]
      counts.value[num]++
      comparisonCount.value++

      selectedIndices.value = [i]
      const step2Detail = `统计元素 ${num} (索引 ${i})，计数: ${counts.value[num]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'count', details: step2Detail })
      currentStepDetails.value = step2Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤3: 计算累计计数
    for (let i = 1; i <= maxValue.value; i++) {
      counts.value[i] += counts.value[i - 1]
      const step3Detail = `计算累计计数，索引 ${i}: ${counts.value[i]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'count', details: step3Detail })
      currentStepDetails.value = step3Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤4: 从后向前遍历原数组，放置元素到正确位置
    const output = new Array(n)
    for (let i = n - 1; i >= 0; i--) {
      const num = arr[i]
      output[counts.value[num] - 1] = num
      counts.value[num]--
      swapCount.value++

      selectedIndices.value = [i]
      const step4Detail = `放置元素 ${num} (索引 ${i}) 到位置 ${counts.value[num]}`
      sortingSteps.value.push({ step: currentStep.value + 1, type: 'swap', details: step4Detail })
      currentStepDetails.value = step4Detail
      currentStep.value++

      // 更新排序后的数据
      sortedData.value = [...output]

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
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
    comparisonCount.value = data.value.length // 计数排序的比较次数等于数组长度
    swapCount.value = data.value.length // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    minIndex.value = -1
    counts.value = []

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
    counts.value = []
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
  <div class="counting-sort-detail detail-container sort-detail">
  <button class="btn-secondary btn-sm" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>计数排序</h2>
      <div class="tabs">
        <button :class="['tab-btn', { 'active': activeTab === 'basic' }]" @click="activeTab = 'basic'">基础</button>
        <button :class="['tab-btn', { 'active': activeTab === 'sort' }]" @click="activeTab = 'sort'">排序</button>
        <button :class="['tab-btn', { 'active': activeTab === 'advanced' }]" @click="activeTab = 'advanced'">进阶</button>
        <button :class="['tab-btn', { 'active': activeTab === 'notes' }]" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>计数排序是一种非比较排序算法，它通过计算每个元素出现的次数来进行排序。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n + k)</li>
                  <li><span>最好情况:</span> O(n + k)</li>
                  <li><span>平均情况:</span> O(n + k)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(n + k)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">稳定性:</span> 稳定</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function countingSort(arr, maxValue):
  // 创建计数数组
  counts = array of zeros with size maxValue + 1
  // 统计每个元素出现的次数
  for i from 0 to length(arr)-1:
    counts[arr[i]]++
  // 计算累计计数
  for i from 1 to maxValue:
    counts[i] += counts[i-1]
  // 创建输出数组
  output = array of zeros with size length(arr)
  // 从后向前遍历原数组，放置元素
  for i from length(arr)-1 down to 0:
    output[counts[arr[i]]-1] = arr[i]
    counts[arr[i]]--
  return output</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def counting_sort(arr):
    if not arr:
        return []
    max_val = max(arr)
    # 创建计数数组
    counts = [0] * (max_val + 1)
    # 统计每个元素出现的次数
    for num in arr:
        counts[num] += 1
    # 计算累计计数
    for i in range(1, len(counts)):
        counts[i] += counts[i-1]
    # 创建输出数组
    output = [0] * len(arr)
    # 从后向前遍历原数组，放置元素
    for i in range(len(arr)-1, -1, -1):
        num = arr[i]
        output[counts[num]-1] = num
        counts[num] -= 1
    return output</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function countingSort(arr) {
    if (arr.length === 0) return [];
    const maxVal = Math.max(...arr);
    // 创建计数数组
    const counts = new Array(maxVal + 1).fill(0);
    // 统计每个元素出现的次数
    for (const num of arr) {
        counts[num]++;
    }
    // 计算累计计数
    for (let i = 1; i <= maxVal; i++) {
        counts[i] += counts[i - 1];
    }
    // 创建输出数组
    const output = new Array(arr.length);
    // 从后向前遍历原数组，放置元素
    for (let i = arr.length - 1; i >= 0; i--) {
        const num = arr[i];
        output[counts[num] - 1] = num;
        counts[num]--;
    }
    return output;
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
            <div class="max-value-control">
              <label>数据范围: 1-{{ maxDataValue }}</label>
              <input type="range" min="10" max="100" v-model.number="maxDataValue" :disabled="isSorting" @input="maxDataValue = Number($event.target.value); generateNewList()">
            </div>
            <button @click="generateNewList" :disabled="isSorting" class="btn btn-secondary">生成新列表</button>
            <button @click="countingSort" :disabled="isSorting" :class="['btn', 'btn-primary', { 'clicked': isButtonClicked }]" ref="sortButton">开始排序</button>
            <button @click="testSort" :disabled="isSorting" class="btn btn-success">测试排序</button>
            <button @click="resetSort" :disabled="!isSorting && sortedData && data.value && sortedData.join(',') === data.value.join(',')" class="btn btn-warning">重置排序</button>
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
          <p>计数排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>处理负整数</strong>：通过偏移量将负整数映射到非负索引。</li>
            <li><strong>内存优化</strong>：只创建实际需要大小的计数数组，而不是从0到最大值。</li>
            <li><strong>原地计数排序</strong>：在某些情况下，可以实现原地计数排序以减少内存使用。</li>
          </ol>

          <h3>适用场景</h3>
          <p>计数排序适用于已知范围的整数排序，且当这个范围不是特别大时效率很高。在实际应用中，计数排序常被用作基数排序的子过程。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>计数排序的核心思想是统计每个元素出现的次数，然后根据这些计数来重建排序后的数组。</p>
          <p>计数排序是稳定的排序算法，因为我们从后向前遍历原数组来放置元素，这样可以保持相等元素的相对顺序。</p>
          <p>计数排序的时间复杂度是O(n + k)，其中n是数组长度，k是数据范围。当k远大于n时，计数排序的效率会降低。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import '../../common/button-styles.css';
@import './common-sort-styles.css';

/* 计数排序特有样式 */
.counting-sort-detail {
  /* 保留组件特有样式 */
}

/* 覆盖标签页样式以使用新的按钮样式 */
.tabs button {
  @extend .tab-btn;
}

.tabs button.active {
  @extend .tab-btn.active;
}

/* 覆盖控件按钮样式 */
.controls button {
  @extend .btn;
  @extend .btn-primary;
}

.controls button.clicked {
  @extend .btn-primary:active;
}

.controls button:disabled {
  @extend .btn:disabled;
}

/* 关闭按钮样式 */
.close-btn {
  @extend .btn-secondary;
  font-size: 24px;
  padding: 4px 10px;
}
</style>