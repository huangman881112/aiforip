<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';
@import './quick-sort-detail.css';
</style>

<script setup>
import { ref, defineEmits, nextTick, watch } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 列表大小控制
const listSize = ref(7)
const minSize = ref(3)
const maxSize = ref(20)

// 确保listSize始终是数字类型
watch(listSize, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 列表大小不是有效数字，已重置为默认值');
    listSize.value = 7;
  } else {
    // 确保值在有效范围内
    listSize.value = Math.max(minSize.value, Math.min(maxSize.value, Math.round(newValue)));
  }
})

// 错误信息
const errorMessage = ref('')

// 排序步骤记录
const sortingSteps = ref([])
const currentStepDetails = ref('')

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

// 生成随机数据函数
const generateRandomData = (size) => {
  try {
    console.log('生成随机数据 - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的数组大小: ' + size);
    }
    const result = Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1);
    console.log('生成随机数据 - 完成，结果:', result);
    return result;
  } catch (error) {
    console.error('生成随机数据失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟排序数据
const data = ref(generateRandomData(listSize.value))
const sortedData = ref([...data.value])

// 生成新列表
const generateNewList = async () => {
  try {
    errorMessage.value = ''; // 清除之前的错误
    console.log('[DEBUG] 生成新列表按钮被点击');
    
    // 强制转换listSize为数字
    const size = Number(listSize.value);
    console.log('[DEBUG] 当前listSize:', size, '类型:', typeof size);
    
    // 验证listSize
    if (typeof size !== 'number' || isNaN(size)) {
      const err = new Error('列表大小必须是数字类型');
      console.error('[ERROR]', err);
      throw err;
    }
    const clampedSize = Math.max(minSize.value, Math.min(maxSize.value, Math.round(size)));
    if (clampedSize !== size) {
      console.warn(`[WARNING] 列表大小${size}超出范围，已调整为${clampedSize}`);
      listSize.value = clampedSize;
    }
    
    // 生成新数据
    console.log('[DEBUG] 开始生成随机数据');
    const newData = generateRandomData(listSize.value);
    console.log('[DEBUG] 生成的新数据:', newData);
    
    // 检查data是否存在
    if (!data || typeof data.value === 'undefined') {
      const err = new Error('数据对象未正确初始化');
      console.error('[ERROR]', err);
      throw err;
    }
    
    // 更新数据
    data.value = newData;
    console.log('[DEBUG] 数据已更新:', data.value);
    
    // 等待DOM更新后再重置排序
    console.log('[DEBUG] 等待DOM更新');
    await nextTick();
    console.log('[DEBUG] 重置排序');
    try {
      resetSort();
      console.log('[DEBUG] 重置排序完成');
    } catch (resetError) {
      console.error('[ERROR] 重置排序失败:', resetError);
      throw new Error(`重置排序时出错: ${resetError.message}`);
    }
    console.log('[DEBUG] 生成新列表 - 完成');
  } catch (error) {
    console.error('[ERROR] 生成新列表失败:', error);
    console.error('[ERROR] 错误堆栈:', error.stack);
    errorMessage.value = `生成新列表失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    // 强制显示错误信息
    alert(errorMessage.value);
  }
}
const isSorting = ref(false)
const isButtonClicked = ref(false)
const sortingStatus = ref('就绪')
const animationSpeed = ref(500)
const comparisonCount = ref(0)
const swapCount = ref(0)
const currentStep = ref(0)
const comparedIndices = ref([])
const swappedIndices = ref([])
const pivotIndex = ref(-1)
const leftPartitionIndices = ref([])
const rightPartitionIndices = ref([])

// 快速排序算法实现
const quickSort = async () => {
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
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 复制数据以便排序
  const arr = [...data.value]
  sortedData.value = [...arr]

  // 开始快速排序
  await quickSortHelper(arr, 0, arr.length - 1)

  comparedIndices.value = []
  swappedIndices.value = []
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1
  isSorting.value = false
  sortingStatus.value = '排序完成'
  const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
}

// 快速排序辅助函数
const quickSortHelper = async (arr, low, high) => {
  if (low < high) {
    // 进行分区并获取基准元素的位置
    const pi = await partition(arr, low, high)
    console.log(`分区完成，基准元素位置: ${pi}`)

    // 递归排序左半部分
    await quickSortHelper(arr, low, pi - 1)

    // 递归排序右半部分
    await quickSortHelper(arr, pi + 1, high)
  }
}

// 分区函数
const partition = async (arr, low, high) => {
  // 选择最右边的元素作为基准
  const pivot = arr[high]
  pivotIndex.value = high
  currentStep.value++
  const pivotDetails = `第 ${currentStep.value} 步: 选择基准元素: ${pivot} (索引 ${high})`
  console.log(pivotDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'pivot', details: pivotDetails })
  currentStepDetails.value = pivotDetails
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  let i = low - 1  // 小于基准区域的指针

  for (let j = low; j < high; j++) {
    comparisonCount.value++
    comparedIndices.value = [j, high]
    currentStep.value++
    const compareDetails = `第 ${currentStep.value} 步: 比较元素 ${arr[j]} (索引 ${j}) 和基准元素 ${pivot} (索引 ${high})`
    console.log(compareDetails)
    sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
    currentStepDetails.value = compareDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    // 如果当前元素小于基准元素
    if (arr[j] < pivot) {
      i++
      // 交换元素
      const temp = arr[i]
      arr[i] = arr[j]
      arr[j] = temp
      swapCount.value++
      swappedIndices.value = [i, j]
      currentStep.value++
      const swapDetails = `第 ${currentStep.value} 步: 交换索引 ${i} (值: ${temp}) 和索引 ${j} (值: ${arr[j]})`
      console.log(swapDetails)
      sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: swapDetails })
      currentStepDetails.value = swapDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
    swappedIndices.value = []
  }

  // 将基准元素放到正确的位置
  i++
  const temp = arr[i]
  arr[i] = arr[high]
  arr[high] = temp
  swapCount.value++
  swappedIndices.value = [i, high]
  currentStep.value++
  const pivotSwapDetails = `第 ${currentStep.value} 步: 将基准元素 ${pivot} (索引 ${high}) 放到正确位置 (索引 ${i})`
  console.log(pivotSwapDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'swap', details: pivotSwapDetails })
  currentStepDetails.value = pivotSwapDetails

  // 更新排序数据以触发重新渲染
  sortedData.value = [...arr]
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  // 高亮显示分区结果
  leftPartitionIndices.value = Array.from({length: i}, (_, idx) => low + idx)
  rightPartitionIndices.value = Array.from({length: high - i}, (_, idx) => i + 1 + idx)
  currentStep.value++
  const partitionDetails = `第 ${currentStep.value} 步: 分区完成，左分区: [${arr.slice(low, i).join(', ')}]，右分区: [${arr.slice(i+1, high+1).join(', ')}]`
  console.log(partitionDetails)
  sortingSteps.value.push({ step: currentStep.value, type: 'partition', details: partitionDetails })
  currentStepDetails.value = partitionDetails
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

  // 清除高亮
  leftPartitionIndices.value = []
  rightPartitionIndices.value = []
  pivotIndex.value = -1

  return i
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
  sortedData.value = [...arr]

  // 开始快速排序
  await quickSortHelper(arr, 0, arr.length - 1)

  comparedIndices.value = []
  swappedIndices.value = []
  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${swapCount.value} 次交换`
  console.log(finishDetails);
  sortingSteps.value.push({ step: currentStep.value + 1, type: 'finish', details: finishDetails })
  currentStepDetails.value = finishDetails
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
    swappedIndices.value = []
    leftPartitionIndices.value = []
    rightPartitionIndices.value = []
    pivotIndex.value = -1
    sortingStatus.value = '就绪'
    sortingSteps.value = []
    currentStepDetails.value = ''
    console.log('[DEBUG] 重置排序 - 数组已打乱:', sortedData.value)
  } catch (error) {
    console.error('[ERROR] 重置排序失败:', error)
    console.error('[ERROR] 错误堆栈:', error.stack)
    throw error
  }
}
</script>

<!-- 已在顶部导入common-sort-styles.css，此处移除重复导入 -->
<!-- <style scoped>
@import './common-sort-styles.css';
</style> -->

<template>
  <div class="quick-sort-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>快速排序</h2>
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
          <p>快速排序是一种高效的排序算法，采用了分治的思想。它选择一个基准元素，将数组分为两个子数组，小于基准的元素放在左边，大于基准的元素放在右边。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n²)</li>
                  <li><span>最好情况:</span> O(n log n)</li>
                  <li><span>平均情况:</span> O(n log n)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(log n)</p>
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
            <pre><code>function quickSort(arr, low, high):
  if low < high:
    pi = partition(arr, low, high)
    quickSort(arr, low, pi - 1)
    quickSort(arr, pi + 1, high)

function partition(arr, low, high):
  pivot = arr[high]
  i = low - 1
  for j = low to high - 1:
    if arr[j] < pivot:
      i++
      swap arr[i] and arr[j]
  swap arr[i + 1] and arr[high]
  return i + 1</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def quick_sort(arr, low, high):
    if low < high:
        pi = partition(arr, low, high)
        quick_sort(arr, low, pi-1)
        quick_sort(arr, pi+1, high)

def partition(arr, low, high):
    pivot = arr[high]
    i = low - 1
    for j in range(low, high):
        if arr[j] <= pivot:
            i += 1
            arr[i], arr[j] = arr[j], arr[i]
    arr[i+1], arr[high] = arr[high], arr[i+1]
    return i+1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function quickSort(arr, low, high) {
    if (low < high) {
        let pi = partition(arr, low, high);
        quickSort(arr, low, pi - 1);
        quickSort(arr, pi + 1, high);
    }
}

function partition(arr, low, high) {
    let pivot = arr[high];
    let i = low - 1;
    for (let j = low; j < high; j++) {
        if (arr[j] < pivot) {
            i++;
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }
    [arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
    return i + 1;
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
                'pivot': index === pivotIndex,
                'left-partition': leftPartitionIndices.includes(index),
                'right-partition': rightPartitionIndices.includes(index),
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
            <button @click="quickSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <p>快速排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>选择合适的基准元素</strong>：可以使用三数取中法（median-of-three）来选择基准元素，避免在有序或接近有序的数据上出现最坏情况。</li>
            <li><strong>小规模数组使用插入排序</strong>：对于小规模数组（通常小于10个元素），插入排序比快速排序更高效。</li>
            <li><strong>避免递归栈溢出</strong>：可以先处理较小的分区，将较大的分区放到后面处理，减少递归栈的深度。</li>
            <li><strong>三路快速排序</strong>：将数组分成小于、等于和大于基准元素的三部分，适用于有大量重复元素的情况。</li>
          </ol>

          <h3>适用场景</h3>
          <p>快速排序是一种通用的排序算法，适用于大多数场景，尤其是大规模数据集。它在实践中通常比其他O(n log n)排序算法更快，因为它的内部循环可以高效地利用缓存。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>快速排序是一种分治算法，它的核心思想是将一个大问题分解成小问题来解决。</p>
          <p>快速排序的平均时间复杂度是O(n log n)，但在最坏情况下可能退化为O(n²)，例如当数组已经有序或接近有序时。</p>
          <p>尽管快速排序是不稳定的排序算法，但它在实践中非常高效，是许多编程语言标准库中排序函数的实现选择。</p>
        </div>
      </div>
    </div>
  </div>

</template>