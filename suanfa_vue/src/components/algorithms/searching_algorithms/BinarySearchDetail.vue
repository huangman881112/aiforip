<script setup>
import { ref, defineEmits, nextTick, watch } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 列表大小控制
const listSize = ref(7)
const minSize = ref(3)
const maxSize = ref(20)

// 目标值控制
const targetValue = ref(35)
const minTarget = ref(1)
const maxTarget = ref(100)

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

// 确保targetValue始终是数字类型
watch(targetValue, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 目标值不是有效数字，已重置为默认值');
    targetValue.value = 35;
  } else {
    // 确保值在有效范围内
    targetValue.value = Math.max(minTarget.value, Math.min(maxTarget.value, Math.round(newValue)));
  }
})

// 错误信息
const errorMessage = ref('')

// 搜索步骤记录
const searchSteps = ref([])
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
    // 二分查找需要数组有序，所以这里排序
    result.sort((a, b) => a - b);
    console.log('生成随机数据 - 完成，结果:', result);
    return result;
  } catch (error) {
    console.error('生成随机数据失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟搜索数据
const data = ref(generateRandomData(listSize.value))
const searchData = ref([...data.value])
const left = ref(0)
const right = ref(searchData.value.length - 1)
const mid = ref(0)

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
    
    // 等待DOM更新后再重置搜索
    console.log('[DEBUG] 等待DOM更新');
    await nextTick();
    console.log('[DEBUG] 重置搜索');
    try {
      resetSearch();
      console.log('[DEBUG] 重置搜索完成');
    } catch (resetError) {
      console.error('[ERROR] 重置搜索失败:', resetError);
      throw new Error(`重置搜索时出错: ${resetError.message}`);
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
const isSearching = ref(false)
const isButtonClicked = ref(false)
const searchStatus = ref('就绪')
const animationSpeed = ref(500)
const comparisonCount = ref(0)
const currentStep = ref(0)
const foundIndex = ref(-1)
const currentLeft = ref(-1)
const currentRight = ref(-1)
const currentMid = ref(-1)

// 二分查找算法实现
const binarySearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  comparisonCount.value = 0
  currentStep.value = 0
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  currentLeft.value = 0
  currentRight.value = searchData.value.length - 1
  currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
  console.log('搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  // 二分查找实现
  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  while (currentLeft.value <= currentRight.value && !found) {
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查中点索引 ${currentMid.value} (值: ${arr[currentMid.value]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[currentMid.value] === target) {
      found = true
      foundIndex.value = currentMid.value
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${currentMid.value} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    } else if (arr[currentMid.value] < target) {
      const moveRightDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 小于目标值 ${target}，将左边界移动到 ${currentMid.value + 1}`
      console.log(moveRightDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveRightDetails })
      currentStepDetails.value = moveRightDetails
      currentLeft.value = currentMid.value + 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      const moveLeftDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 大于目标值 ${target}，将右边界移动到 ${currentMid.value - 1}`
      console.log(moveLeftDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveLeftDetails })
      currentStepDetails.value = moveLeftDetails
      currentRight.value = currentMid.value - 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
  }

  isSearching.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 左边界 ${currentLeft.value} > 右边界 ${currentRight.value}，未找到目标值 ${target}`
    searchSteps.value.push({ step: currentStep.value + 1, type: 'notFound', details: notFoundDetails })
    currentStepDetails.value = notFoundDetails
  }
  const finishDetails = `搜索完成，${foundIndex.value !== -1 ? `在索引 ${foundIndex.value} 找到目标值` : '未找到目标值'}，共进行了 ${comparisonCount.value} 次比较`
  console.log(finishDetails);
}

// 测试搜索 - 忽略isSearching状态
const testSearch = async () => {
  console.log('测试搜索按钮被点击');
  isButtonClicked.value = true;
  searchStatus.value = '测试搜索中...'
  comparisonCount.value = 0
  currentStep.value = 0
  foundIndex.value = -1
  searchSteps.value = []
  currentStepDetails.value = ''
  currentLeft.value = 0
  currentRight.value = searchData.value.length - 1
  currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
  console.log('测试搜索开始前的数据:', searchData.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `测试搜索开始，初始数据: [${searchData.value.join(', ')}]，目标值: ${targetValue.value}` })

  const arr = [...searchData.value]
  const target = targetValue.value
  let found = false

  while (currentLeft.value <= currentRight.value && !found) {
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
    comparisonCount.value++
    currentStep.value++
    const stepDetails = `第 ${currentStep.value} 步: 检查中点索引 ${currentMid.value} (值: ${arr[currentMid.value]})`
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: stepDetails })
    currentStepDetails.value = stepDetails
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

    if (arr[currentMid.value] === target) {
      found = true
      foundIndex.value = currentMid.value
      const foundDetails = `第 ${currentStep.value} 步: 在索引 ${currentMid.value} 找到目标值 ${target}`
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails })
      currentStepDetails.value = foundDetails
    } else if (arr[currentMid.value] < target) {
      const moveRightDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 小于目标值 ${target}，将左边界移动到 ${currentMid.value + 1}`
      console.log(moveRightDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveRightDetails })
      currentStepDetails.value = moveRightDetails
      currentLeft.value = currentMid.value + 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    } else {
      const moveLeftDetails = `第 ${currentStep.value} 步: 中点值 ${arr[currentMid.value]} 大于目标值 ${target}，将右边界移动到 ${currentMid.value - 1}`
      console.log(moveLeftDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'move', details: moveLeftDetails })
      currentStepDetails.value = moveLeftDetails
      currentRight.value = currentMid.value - 1
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value / 2))
    }
  }

  isButtonClicked.value = false
  if (foundIndex.value !== -1) {
    searchStatus.value = '测试搜索完成 - 找到目标值'
  } else {
    searchStatus.value = '测试搜索完成 - 未找到目标值'
    const notFoundDetails = `第 ${currentStep.value + 1} 步: 左边界 ${currentLeft.value} > 右边界 ${currentRight.value}，未找到目标值 ${target}`
    searchSteps.value.push({ step: currentStep.value + 1, type: 'notFound', details: notFoundDetails })
    currentStepDetails.value = notFoundDetails
  }
}

// 重置搜索
const resetSearch = () => {
  try {
    isSearching.value = false
    
    // 重置搜索状态
    searchStatus.value = '就绪'
    comparisonCount.value = 0
    currentStep.value = 0
    foundIndex.value = -1
    searchSteps.value = []
    currentStepDetails.value = ''
    currentLeft.value = 0
    currentRight.value = searchData.value.length - 1
    currentMid.value = Math.floor((currentLeft.value + currentRight.value) / 2)
    
    // 重新复制原始数据
    searchData.value = [...data.value]
    console.log('[DEBUG] 重置搜索 - 数据已重置:', searchData.value)
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
    console.error('[ERROR] 错误堆栈:', error.stack)
    throw error
  }
}
</script>

<style scoped>
@import './common-algorithm-page.css';
</style>

<template>
  <div class="binary-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>二分查找</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>二分查找是一种高效的搜索算法，它通过反复将搜索区间划分为两半来查找目标值。它要求数组必须是有序的。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(log n)</li>
                  <li><span>最好情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(log n)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function binarySearch(arr, target):
  left = 0
  right = arr.length - 1
  
  while left <= right:
    mid = floor((left + right) / 2)
    if arr[mid] == target:
      return mid  // 找到目标，返回索引
    else if arr[mid] < target:
      left = mid + 1  // 在右半部分继续查找
    else:
      right = mid - 1  // 在左半部分继续查找
  
  return -1  // 未找到目标</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def binary_search(arr, target):
    left = 0
    right = len(arr) - 1
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function binarySearch(arr, target) {
    let left = 0;
    let right = arr.length - 1;
    
    while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        if (arr[mid] === target) {
            return mid;
        } else if (arr[mid] < target) {
            left = mid + 1;
        } else {
            right = mid - 1;
        }
    }
    
    return -1;
}</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">搜索状态:</span>
            <span class="stat-value">{{ searchStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">比较次数:</span>
            <span class="stat-value">{{ comparisonCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">找到索引:</span>
            <span class="stat-value">{{ foundIndex !== -1 ? foundIndex : '未找到' }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="array-container">
            <div 
              v-for="(value, index) in searchData"
              :key="index"
              class="array-element"
              :class="{
                'checking': currentMid === index,
                'found': foundIndex === index,
                'not-found': !isSearching && foundIndex === -1 && searchSteps.length > 0,
                'left-boundary': currentLeft === index,
                'right-boundary': currentRight === index
              }"
              :data-value="value"
            >
              {{ value }}
            </div>
          </div>
          <div class="slider-controls">
            <div class="slider-group">
              <label>列表大小: {{ listSize }}</label>
              <input type="text" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSearching" @input="listSize = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minSize }}-{{ maxSize }})</span>
            </div>
            <div class="slider-group">
              <label>目标值: {{ targetValue }}</label>
              <input type="text" :min="minTarget" :max="maxTarget" v-model.number="targetValue" :disabled="isSearching" @input="targetValue = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minTarget }}-{{ maxTarget }})</span>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSearching">
            </div>
          </div>
          <div class="button-group">
            <button @click="generateNewList" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
            <button @click="binarySearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
            <button @click="testSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">测试搜索</button>
            <button @click="resetSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">重置搜索</button>
          </div>
          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ currentStepDetails }}</p>
          </div>
          <div class="steps-history">
            <h4>搜索步骤历史</h4>
            <div class="steps-container">
              <div v-for="step in searchSteps" :key="step.step" :class="'step-item ' + step.type">
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
          <p>二分查找的标准实现已经很高效，但在特定情况下可以进一步优化：</p>
          <ol style="text-align: left;">
            <li><strong>插值查找</strong>：对于均匀分布的数据，可以使用插值公式估算目标值可能的位置。</li>
            <li><strong>斐波那契查找</strong>：使用斐波那契数列来划分搜索区间，可以避免除法运算。</li>
            <li><strong>平衡二叉搜索树</strong>：对于频繁插入和删除操作的场景，可以考虑使用平衡二叉搜索树。</li>
          </ol>

          <h3>适用场景</h3>
          <p>二分查找适用于大规模有序数据。对于无序数据，需要先排序再使用二分查找，或者直接使用线性查找。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>二分查找是一种分治算法，它的核心思想是将问题规模减半。</p>
          <p>二分查找要求数组必须是有序的，这是它的前提条件。</p>
          <p>与线性查找相比，二分查找的效率要高得多，特别是对于大规模数据。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './binary-search-detail.css';
</style>