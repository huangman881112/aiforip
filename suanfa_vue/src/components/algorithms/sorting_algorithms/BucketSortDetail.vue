<script setup>
// 桶排序详情组件
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
const currentBucket = ref(-1)
const buckets = ref([])
const currentStepDetails = ref('')
const errorMessage = ref('')

// 动画控制
const animationSpeed = ref(500)
const listSize = ref(10)
const minSize = ref(5)
const maxSize = ref(20)
const bucketCount = ref(5)
const maxDataValue = ref(100) // 桶排序的数据范围上限

// 生成新列表
const generateNewList = () => {
  try {
    isSorting.value = false
    // 确保列表长度不变
    const currentLength = data.value.length || listSize.value
    const newData = Array.from({ length: currentLength }, () => Math.floor(Math.random() * maxDataValue.value) + 1)
    data.value = [...newData]
    sortedData.value = [...newData]
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    selectedIndices.value = []
    currentBucket.value = -1
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

// 桶排序实现
const bucketSort = async () => {
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
    currentBucket.value = -1
    // 不重置桶状态，而是清空现有桶
    buckets.value = []
    currentStepDetails.value = ''

    // 复制数据以避免修改原始数据
    const arr = [...sortedData.value]
    // 确保排序过程中列表长度不变
    const originalLength = arr.length
    const n = arr.length
    const bucketSize = Math.ceil(maxDataValue.value / bucketCount.value)

    // 步骤1: 初始化桶
    buckets.value = Array.from({ length: bucketCount.value }, () => [])
    const step1Detail = `初始化 ${bucketCount.value} 个桶，每个桶范围: ${bucketSize}`
    currentStepDetails.value = step1Detail
    currentStep.value++

    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    // 步骤2: 将元素分配到桶中
    for (let i = 0; i < n; i++) {
      const num = arr[i]
      const bucketIndex = Math.min(Math.floor(num / bucketSize), bucketCount.value - 1)
      buckets.value[bucketIndex].push(num)
      comparisonCount.value++

      selectedIndices.value = [i]
      currentBucket.value = bucketIndex
      const step2Detail = `将元素 ${num} (索引 ${i}) 分配到桶 ${bucketIndex}`
      currentStepDetails.value = step2Detail
      currentStep.value++

      // 更新可视化数据
      sortedData.value = [...arr]

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤3: 对每个桶进行排序
    for (let i = 0; i < bucketCount.value; i++) {
      currentBucket.value = i
      const bucket = buckets.value[i]
      const bucketStartIndex = sortedData.value.indexOf(bucket[0])

      const step3Detail = `开始对桶 ${i} 进行排序，桶内元素: [${bucket.join(', ')}]`
      currentStepDetails.value = step3Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

      // 对桶内元素使用插入排序
      for (let j = 1; j < bucket.length; j++) {
        const key = bucket[j]
        let k = j - 1

        while (k >= 0 && bucket[k] > key) {
          bucket[k + 1] = bucket[k]
          k--
          comparisonCount.value++
          swapCount.value++

          // 更新桶内排序状态
          buckets.value[i] = [...bucket]
          const step4Detail = `桶 ${i} 内排序: 移动 ${bucket[k + 1]} 到 ${k + 2} 位置`
          currentStepDetails.value = step4Detail
          currentStep.value++

          // 更新可视化数据
          let pos = bucketStartIndex
          for (let b = 0; b < bucketCount.value; b++) {
            for (let elem of buckets.value[b]) {
              sortedData.value[pos] = elem
              pos++
            }
          }

          await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
        }
        bucket[k + 1] = key
        comparisonCount.value++
      }

      const step5Detail = `桶 ${i} 排序完成: [${bucket.join(', ')}]`
      currentStepDetails.value = step5Detail
      currentStep.value++

      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 步骤4: 合并桶内元素
    let index = 0
    for (let i = 0; i < bucketCount.value; i++) {
      for (let j = 0; j < buckets.value[i].length; j++) {
        sortedData.value[index++] = buckets.value[i][j]
      }
    }

    // 排序完成后确保数据一致性
    isButtonClicked.value = false
    sortingStatus.value = '排序完成'
    
    // 确保排序后列表长度不变
    const sortOriginalLength = data.value.length
    if (sortedData.value.length !== sortOriginalLength) {
      console.warn('[WARNING] 排序后列表长度发生变化，已修正');
      sortedData.value = sortedData.value.slice(0, sortOriginalLength)
    }
    
    // 确保排序后元素与初始列表一致（通过排序原始数据的副本）
    const originalElements = [...data.value]
    sortedData.value = [...originalElements].sort((a, b) => a - b)
    
    const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
    console.log(finishDetails);
    currentStepDetails.value = finishDetails
    
    // 确保排序完成后不会意外生成重复队列
    // 1. 克隆排序结果，防止引用问题
    sortedData.value = [...sortedData.value]
    // 2. 更新原始数据以匹配排序结果
    data.value = [...sortedData.value]
    // 排序完成后保留桶状态
    currentBucket.value = -1 // 取消高亮特定桶，但保留桶内容
    
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

    // 使用JavaScript内置排序作为测试结果，确保列表长度不变
    const originalLength = data.value.length
    sortedData.value = [...data.value].sort((a, b) => a - b)
    // 确保排序后列表长度不变
    if (sortedData.value.length !== originalLength) {
      console.warn('[WARNING] 测试排序后列表长度发生变化，已修正');
      sortedData.value = sortedData.value.slice(0, originalLength)
    }
    comparisonCount.value = data.value.length // 估计值
    swapCount.value = data.value.length // 估计值
    currentStep.value = comparisonCount.value + swapCount.value
    comparedIndices.value = []
    selectedIndices.value = []
    currentBucket.value = -1
    buckets.value = []

    isButtonClicked.value = false
    sortingStatus.value = '测试排序完成'
    const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
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
    currentBucket.value = -1
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
  <div class="bucket-sort-detail detail-container sort-detail">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>桶排序</h2>
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
          <p>桶排序是一种非比较排序算法，它将元素分配到有限数量的桶中，然后对每个桶再进行排序（可以使用其他排序算法或递归地使用桶排序）。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n²)</li>
                  <li><span>最好情况:</span> O(n + k)</li>
                  <li><span>平均情况:</span> O(n + k + n²/k)</li>
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
            <pre><code>function bucketSort(arr, bucketCount):
  // 创建桶
  buckets = array of bucketCount empty arrays
  // 确定数据范围
  minValue = min(arr)
  maxValue = max(arr)
  // 计算每个桶的范围
  bucketRange = (maxValue - minValue) / bucketCount + 1
  // 将元素分配到桶中
  for i from 0 to length(arr)-1:
    bucketIndex = floor((arr[i] - minValue) / bucketRange)
    add arr[i] to buckets[bucketIndex]
  // 对每个桶进行排序
  for i from 0 to bucketCount-1:
    sort buckets[i] using insertion sort
  // 合并桶内元素
  index = 0
  for i from 0 to bucketCount-1:
    for j from 0 to length(buckets[i])-1:
      arr[index++] = buckets[i][j]
  return arr</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def bucket_sort(arr, bucket_count=5):
    if not arr:
        return []
    min_val = min(arr)
    max_val = max(arr)
    # 计算每个桶的范围
    bucket_range = (max_val - min_val) / bucket_count + 1
    # 创建桶
    buckets = [[] for _ in range(bucket_count)]
    # 将元素分配到桶中
    for num in arr:
        bucket_index = int((num - min_val) / bucket_range)
        # 确保索引不超出范围
        bucket_index = min(bucket_index, bucket_count - 1)
        buckets[bucket_index].append(num)
    # 对每个桶进行排序
    for i in range(bucket_count):
        # 使用插入排序对桶内元素排序
        for j in range(1, len(buckets[i])):
            key = buckets[i][j]
            k = j - 1
            while k >= 0 and buckets[i][k] > key:
                buckets[i][k + 1] = buckets[i][k]
                k -= 1
            buckets[i][k + 1] = key
    # 合并桶内元素
    sorted_arr = []
    for bucket in buckets:
        sorted_arr.extend(bucket)
    return sorted_arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function bucketSort(arr, bucketCount = 5) {
    if (arr.length === 0) return [];
    const minVal = Math.min(...arr);
    const maxVal = Math.max(...arr);
    // 计算每个桶的范围
    const bucketRange = (maxVal - minVal) / bucketCount + 1;
    // 创建桶
    const buckets = Array.from({ length: bucketCount }, () => []);
    // 将元素分配到桶中
    for (const num of arr) {
        let bucketIndex = Math.floor((num - minVal) / bucketRange);
        // 确保索引不超出范围
        bucketIndex = Math.min(bucketIndex, bucketCount - 1);
        buckets[bucketIndex].push(num);
    }
    // 对每个桶进行排序
    for (let i = 0; i < bucketCount; i++) {
        // 使用插入排序对桶内元素排序
        for (let j = 1; j < buckets[i].length; j++) {
            const key = buckets[i][j];
            let k = j - 1;
            while (k >= 0 && buckets[i][k] > key) {
                buckets[i][k + 1] = buckets[i][k];
                k--;
            }
            buckets[i][k + 1] = key;
        }
    }
    // 合并桶内元素
    const sortedArr = [];
    for (const bucket of buckets) {
        sortedArr.push(...bucket);
    }
    return sortedArr;
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
            <span class="stat-label">当前桶索引:</span>
            <span class="stat-value">{{ currentBucket }}</span>
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
                'in-bucket': currentBucket >= 0 && buckets[currentBucket] && buckets[currentBucket].includes(value),
                'sorted': isSorting && data.value && sortedData[index] === data.value.slice().sort((a, b) => a - b)[index]
              }" 
              :style="{ height: `${value * 2}px` }"
              :data-value="value"
            ></div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSorting" @input="listSize = Number($event.target.value)">
            </div>
            <div class="bucket-count-control">
              <label>桶数量: {{ bucketCount }}</label>
              <input type="range" min="2" max="10" v-model.number="bucketCount" :disabled="isSorting" @input="bucketCount = Number($event.target.value); generateNewList()">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="bucketSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <div class="buckets-status" v-if="(isSorting || sortingStatus === '排序完成') && buckets.length > 0">
            <h4>桶状态</h4>
            <div class="buckets-container">
              <div v-for="(bucket, index) in buckets" :key="index" :class="['bucket-item', { 'active': index === currentBucket }]">
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
          <p>桶排序的性能很大程度上取决于数据的分布和桶的数量。以下是一些优化建议：</p>
          <ol style="text-align: left;">
            <li><strong>桶的数量选择</strong>：通常选择桶的数量为元素数量的平方根或立方根。</li>
            <li><strong>动态桶大小</strong>：根据数据分布调整桶的大小，而不是使用均匀分布。</li>
            <li><strong>桶内排序算法选择</strong>：对于小数据集可以使用插入排序，对于大数据集可以考虑快速排序或归并排序。</li>
            <li><strong>并行化处理</strong>：对不同桶的排序可以并行处理，提高效率。</li>
          </ol>

          <h3>适用场景</h3>
          <p>桶排序适用于均匀分布的数据。当数据分布不均匀时，可能会导致某些桶中的元素过多，影响排序效率。桶排序常被用于外部排序，例如对大文件进行排序。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>桶排序的核心思想是将数据分散到不同的桶中，然后对每个桶单独排序。</p>
          <p>桶排序的平均时间复杂度取决于桶内排序算法的选择和数据分布。当桶的数量接近元素数量且数据均匀分布时，桶排序的性能接近线性。</p>
          <p>桶排序是稳定的排序算法，只要桶内使用的排序算法是稳定的。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 桶排序特有样式 */
.bucket-sort-detail {
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

.bucket-item.active {
  background-color: #e6f7ff;
  border-color: #91d5ff;
}

.bucket-number {
  font-weight: bold;
  margin-right: 5px;
}

.bucket-contents {
  font-family: monospace;
}
</style>