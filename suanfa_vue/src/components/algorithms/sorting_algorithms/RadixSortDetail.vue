<script setup>
// 基数排序详情组件
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
const currentDigit = ref(0)
const buckets = ref([])
const bucketsHistory = ref([])  // 存储每轮排序的桶状态
const maxDigits = ref(0)
const currentStepDetails = ref('')
const errorMessage = ref('')
const activeHistoryDigit = ref(-1)  // 当前查看的历史位数

// 动画控制
const animationSpeed = ref(500)
const listSize = ref(10)
const minSize = ref(5)
const maxSize = ref(20)
const maxDataValue = ref(1000) // 基数排序的数据范围上限

// 生成新列表
const generateNewList = () => {
  try {
    isSorting.value = false
    const newData = Array.from({ length: listSize.value }, () => Math.floor(Math.random() * maxDataValue.value))
    data.value = [...newData]
    sortedData.value = [...newData]
    // 计算最大位数
    maxDigits.value = Math.max(...data.value.map(num => num.toString().length))
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    currentDigit.value = 0
    buckets.value = []
    sortingStatus.value = '就绪'
    currentStepDetails.value = ''
    console.log('[DEBUG] 生成新列表:', sortedData.value)
  } catch (error) {
    console.error('[ERROR] 生成新列表失败:', error)
    errorMessage.value = `生成新列表失败: ${error.message}`
    setTimeout(() => { errorMessage.value = '' }, 3000)
  }
}

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
    console.log(finishDetails);
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
    console.log(finishDetails);
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
    currentDigit.value = 0
    buckets.value = []
    sortingStatus.value = '就绪'
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
  <div class="radix-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>基数排序</h2>
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
          <p>基数排序是一种非比较排序算法，它通过按位排序来对数字进行排序。基数排序通常从最低有效位（个位）开始，依次对每一位进行排序。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(nk)</li>
                  <li><span>最好情况:</span> O(nk)</li>
                  <li><span>平均情况:</span> O(nk)</li>
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
            <pre><code>function radixSort(arr):
  // 找出最大数的位数
  maxNum = max(arr)
  maxDigits = number of digits in maxNum
  // 对每一位进行计数排序
  for digit from 0 to maxDigits-1:
    // 创建10个桶(0-9)
    buckets = array of 10 empty arrays
    // 将元素分配到对应的桶中
    for i from 0 to length(arr)-1:
      // 获取当前位的值
      digitValue = getDigit(arr[i], digit)
      add arr[i] to buckets[digitValue]
    // 从桶中收集元素
    index = 0
    for i from 0 to 9:
      for j from 0 to length(buckets[i])-1:
        arr[index++] = buckets[i][j]
  return arr

function getDigit(num, digit):
  return floor(abs(num) / 10^digit) % 10</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def radix_sort(arr):
    if not arr:
        return []
    # 找出最大数的位数
    max_num = max(arr)
    max_digits = len(str(max_num))
    # 对每一位进行计数排序
    for digit in range(max_digits):
        # 创建10个桶(0-9)
        buckets = [[] for _ in range(10)]
        # 将元素分配到对应的桶中
        for num in arr:
            # 获取当前位的值
            digit_value = (num // (10 ** digit)) % 10
            buckets[digit_value].append(num)
        # 从桶中收集元素
        arr = []
        for bucket in buckets:
            arr.extend(bucket)
    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function radixSort(arr) {
    if (arr.length === 0) return [];
    // 找出最大数的位数
    const maxNum = Math.max(...arr);
    const maxDigits = maxNum.toString().length;
    // 对每一位进行计数排序
    for (let digit = 0; digit < maxDigits; digit++) {
        // 创建10个桶(0-9)
        const buckets = Array.from({ length: 10 }, () => []);
        // 将元素分配到对应的桶中
        for (const num of arr) {
            // 获取当前位的值
            const digitValue = Math.floor(Math.abs(num) / Math.pow(10, digit)) % 10;
            buckets[digitValue].push(num);
        }
        // 从桶中收集元素
        arr = [];
        for (const bucket of buckets) {
            arr.push(...bucket);
        }
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
                'sorted': isSorting && data.value && sortedData[index] === data.value.slice().sort((a, b) => a - b)[index]
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

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>算法优化</h3>
          <p>基数排序的性能可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>从最高有效位开始排序 (MSD)</strong>：有些实现从最高有效位开始排序，可以提前得到部分排序结果。</li>
            <li><strong>使用计数排序作为子过程</strong>：对于每一位的排序，可以使用计数排序来提高效率。</li>
            <li><strong>处理负数</strong>：可以将数据分为正数和负数两部分分别排序，然后合并结果。</li>
            <li><strong>并行化处理</strong>：对不同位的排序可以并行处理，提高效率。</li>
          </ol>

          <h3>适用场景</h3>
          <p>基数排序适用于整数排序，特别是当数据范围较大但位数较小时。基数排序常被用于字符串排序和卡片排序等场景。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>基数排序的核心思想是按位排序，它将复杂的排序问题分解为多个简单的计数排序问题。</p>
          <p>基数排序的时间复杂度是O(nk)，其中n是数组长度，k是最大数的位数。当k远小于n时，基数排序的效率很高。</p>
          <p>基数排序是稳定的排序算法，因为它保持了相等元素的相对顺序。</p>
          <p>基数排序的实现可以从最低有效位(LSD)开始，也可以从最高有效位(MSD)开始。本实现使用的是LSD方法。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

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
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f9f9f9;
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
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #f0f0f0;
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
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>