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
const shiftCount = ref(0)
const currentStep = ref(0)
const comparedIndices = ref([])
const insertedIndices = ref([])

// 插入排序算法实现
const insertionSort = async () => {
  console.log('开始排序按钮被点击');
  isButtonClicked.value = true;
  isSorting.value = true;
  sortingStatus.value = '排序中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  comparisonCount.value = 0
  shiftCount.value = 0
  currentStep.value = 0
  comparedIndices.value = []
  insertedIndices.value = []
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `排序开始，初始数据: [${data.value.join(', ')}]` })

  // 插入排序实现
  const arr = [...data.value]
  const n = arr.length

  for (let i = 1; i < n; i++) {
    console.log(`第 ${i} 轮排序开始`);
    let key = arr[i]
    let j = i - 1
    insertedIndices.value = [i]
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 选择元素 ${key} (索引 ${i}) 作为待插入元素`
    console.log(stepDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'select', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    while (j >= 0 && arr[j] > key) {
      comparisonCount.value++
      comparedIndices.value = [j]
      currentStep.value++
      const compareDetails = `第 ${currentStep.value} 步: 比较元素 ${arr[j]} (索引 ${j}) 和待插入元素 ${key}`
      console.log(compareDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
      currentStepDetails.value = compareDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      arr[j + 1] = arr[j]
      shiftCount.value++
      currentStep.value++
      const shiftDetails = `第 ${currentStep.value} 步: 将元素 ${arr[j]} 从索引 ${j} 向后移动到索引 ${j+1}`
      console.log(shiftDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'shift', details: shiftDetails })
      currentStepDetails.value = shiftDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      console.log('排序中 - 更新数据:', sortedData.value)
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      j = j - 1
    }

    arr[j + 1] = key
    shiftCount.value++
    currentStep.value++
    const insertDetails = `第 ${currentStep.value} 步: 将元素 ${key} 插入到索引 ${j+1}`
    console.log(insertDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'insert', details: insertDetails })
    currentStepDetails.value = insertDetails

    // 更新排序数据以触发重新渲染
    sortedData.value = [...arr]
    console.log('排序中 - 更新数据:', sortedData.value)
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    comparedIndices.value = []
    insertedIndices.value = []
  }

  isSorting.value = false
  sortingStatus.value = '排序完成'
  const finishDetails = `排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${shiftCount.value} 次移动`
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
  shiftCount.value = 0
  currentStep.value = 0
  comparedIndices.value = []
  insertedIndices.value = []
  sortingSteps.value = []
  currentStepDetails.value = ''
  console.log('测试排序开始前的数据:', data.value);
  sortingSteps.value.push({ step: 0, type: 'info', details: `测试排序开始，初始数据: [${data.value.join(', ')}]` })

  const arr = [...data.value]
  const n = arr.length

  for (let i = 1; i < n; i++) {
    console.log(`第 ${i} 轮测试排序开始`);
    let key = arr[i]
    let j = i - 1
    insertedIndices.value = [i]
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 选择元素 ${key} (索引 ${i}) 作为待插入元素`
    console.log(stepDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'select', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    while (j >= 0 && arr[j] > key) {
      comparisonCount.value++
      comparedIndices.value = [j]
      currentStep.value++
      const compareDetails = `第 ${currentStep.value} 步: 比较元素 ${arr[j]} (索引 ${j}) 和待插入元素 ${key}`
      console.log(compareDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'compare', details: compareDetails })
      currentStepDetails.value = compareDetails
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      arr[j + 1] = arr[j]
      shiftCount.value++
      currentStep.value++
      const shiftDetails = `第 ${currentStep.value} 步: 将元素 ${arr[j]} 从索引 ${j} 向后移动到索引 ${j+1}`
      console.log(shiftDetails);
      sortingSteps.value.push({ step: currentStep.value, type: 'shift', details: shiftDetails })
      currentStepDetails.value = shiftDetails

      // 更新排序数据以触发重新渲染
      sortedData.value = [...arr]
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

      j = j - 1
    }

    arr[j + 1] = key
    shiftCount.value++
    currentStep.value++
    const insertDetails = `第 ${currentStep.value} 步: 将元素 ${key} 插入到索引 ${j+1}`
    console.log(insertDetails);
    sortingSteps.value.push({ step: currentStep.value, type: 'insert', details: insertDetails })
    currentStepDetails.value = insertDetails

    // 更新排序数据以触发重新渲染
    sortedData.value = [...arr]
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))

    comparedIndices.value = []
    insertedIndices.value = []
  }

  isButtonClicked.value = false
  sortingStatus.value = '测试排序完成'
  const finishDetails = `测试排序完成，最终结果: [${sortedData.value.join(', ')}]，共进行了 ${comparisonCount.value} 次比较和 ${shiftCount.value} 次移动`
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
    shiftCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    insertedIndices.value = []
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

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 插入排序特有样式 */
.insertion-sort-detail {
  /* 保留组件特有样式 */
}
</style>

<template>
  <div class="insertion-sort-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>插入排序</h2>
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
          <p>插入排序是一种简单直观的排序算法。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n²)</li>
                  <li><span>最好情况:</span> O(n)</li>
                  <li><span>平均情况:</span> O(n²)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">稳定性:</span> 稳定</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 简单</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function insertionSort(arr):
  n = length(arr)
  for i from 1 to n-1:
    key = arr[i]
    j = i - 1
    while j >= 0 and arr[j] > key:
      arr[j+1] = arr[j]
      j = j - 1
    arr[j+1] = key
  return arr</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key
    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function insertionSort(arr) {
    const n = arr.length;
    for (let i = 1; i < n; i++) {
        let key = arr[i];
        let j = i - 1;
        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
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
            <span class="stat-label">移动次数:</span>
            <span class="stat-value">{{ shiftCount }}</span>
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
                'inserted': insertedIndices.includes(index),
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
            <button @click="insertionSort" :disabled="isSorting" :class="{ 'clicked': isButtonClicked }" ref="sortButton">开始排序</button>
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
          <p>插入排序的标准实现可以通过以下方式进行优化：</p>
          <ol style="text-align: left;">
            <li><strong>二分查找优化</strong>：使用二分查找来找到插入位置，减少比较次数。</li>
            <li><strong>希尔排序</strong>：先进行宏观调整，再进行微观调整，是插入排序的改进版。</li>
            <li><strong>直接交换改为移动</strong>：如我们的实现中所示，先移动元素，最后再插入，减少交换次数。</li>
          </ol>

          <h3>适用场景</h3>
          <p>插入排序适用于小规模数据或几乎已经有序的数据。在实际应用中，插入排序常被用作快速排序的补充，用于处理小规模的子数组。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>插入排序的核心思想是将数组分为已排序部分和未排序部分，然后从未排序部分取出元素，插入到已排序部分的正确位置。</p>
          <p>插入排序是稳定的排序算法，因为相等元素的相对顺序不会改变。</p>
          <p>与冒泡排序相比，插入排序通常更高效，因为它的比较和移动操作更集中，且对于几乎有序的数据，插入排序可以达到接近线性的性能。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-sort-styles.css';
@import './common-algorithm-page.css';

/* 插入排序特有样式 */
.insertion-sort-detail {
  /* 保留组件特有样式 */
}
</style>