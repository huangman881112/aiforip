<script setup>import { ref, nextTick, watch, computed } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 列表大小控制
const listSize = ref(10)
const minSize = ref(3)
const maxSize = ref(20)

// 目标值控制
const targetValue = ref(50)
const minTarget = ref(1)
const maxTarget = ref(100)

// 动画速度控制
const animationSpeed = ref(500)

// 确保listSize始终是数字类型
watch(listSize, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 列表大小不是有效数字，已重置为默认值');
    listSize.value = 10;
  } else {
    // 确保值在有效范围内
    listSize.value = Math.max(minSize.value, Math.min(maxSize.value, Math.round(newValue)));
  }
})

// 确保targetValue始终是数字类型
watch(targetValue, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 目标值不是有效数字，已重置为默认值');
    targetValue.value = 50;
  } else {
    // 确保值在有效范围内
    targetValue.value = Math.max(minTarget.value, Math.min(maxTarget.value, Math.round(newValue)));
  }
})

// 错误信息
const errorMessage = ref('')
const successMessage = ref('')

// 搜索步骤记录
const searchSteps = ref([])
const currentStepDetails = ref('')
const comparisonCount = ref(0)
const currentStep = ref(0)
const currentIndex = ref(-1)
const foundIndex = ref(-1)
const isSearching = ref(false)
const isButtonClicked = ref(false)
const searchStatus = ref('就绪')
const isArraySorted = ref(true)

// 二分搜索相关状态
const binarySearchSteps = ref([])
const binaryCurrentStep = ref(0)
const binaryLeft = ref(0)
const binaryRight = ref(0)
const binaryMiddle = ref(0)
const isBinarySearching = ref(false)
const binaryFound = ref(false)
const binarySearchIndex = ref(-1)



// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

// 生成随机数据函数
const generateRandomData = (size) => {
  try {
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的数组大小: ' + size);
    }
    const result = [];
    let current = Math.floor(Math.random() * 10);
    result.push(current);
    for (let i = 1; i < size; i++) {
      current += Math.floor(Math.random() * 5) + 1;
      result.push(current);
    }
    return result;
  } catch (error) {
    console.error('生成随机数据失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟搜索数据
const data = ref(generateRandomData(listSize.value))
const searchData = ref([...data.value])

// 生成新列表
const generateNewList = async () => {
  try {
    errorMessage.value = ''; // 清除之前的错误
    successMessage.value = '';

    // 强制转换listSize为数字
    const size = Number(listSize.value);

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
    const newData = generateRandomData(listSize.value);

    // 更新数据
    data.value = newData;

    // 等待DOM更新后再重置搜索
    await nextTick();
    resetSearch();
  } catch (error) {
    console.error('[ERROR] 生成新列表失败:', error);
    errorMessage.value = `生成新列表失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
  }
}

// 重置搜索
const resetSearch = () => {
  try {
    isSearching.value = false;
    isBinarySearching.value = false;

    // 重置搜索状态
    searchStatus.value = '就绪'
    comparisonCount.value = 0
    currentStep.value = 0
    currentIndex.value = -1
    foundIndex.value = -1
    searchSteps.value = []
    currentStepDetails.value = ''
    binarySearchSteps.value = []
    binaryCurrentStep.value = 0
    binaryLeft.value = 0
    binaryRight.value = 0
    binaryMiddle.value = 0
    binaryFound.value = false
    binarySearchIndex.value = -1
    errorMessage.value = ''
    successMessage.value = ''

    // 重新复制原始数据
    searchData.value = [...data.value]
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
    throw error
  }
}

// 二分搜索算法
const binarySearch = async (arr, target, left, right) => {
  binarySearchSteps.value = [];
  binaryLeft.value = left;
  binaryRight.value = right;
  binaryFound.value = false;
  binarySearchIndex.value = -1;

  const binarySearchHelper = async (left, right) => {
    if (left > right) {
      return { found: false, index: -1 };
    }

    binaryLeft.value = left;
    binaryRight.value = right;
    binaryMiddle.value = Math.floor((left + right) / 2);

    const stepDetails = `二分搜索: 检查索引 ${binaryMiddle.value} (值: ${arr[binaryMiddle.value]})`;
    binarySearchSteps.value.push({ step: binarySearchSteps.value.length + 1, type: 'check', details: stepDetails });
    currentStepDetails.value = stepDetails;
    comparisonCount.value++;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    if (arr[binaryMiddle.value] === target) {
      binaryFound.value = true;
      binarySearchIndex.value = binaryMiddle.value;
      const foundDetails = `二分搜索: 在索引 ${binaryMiddle.value} 找到目标值 ${target}`;
      binarySearchSteps.value.push({ step: binarySearchSteps.value.length + 1, type: 'found', details: foundDetails });
      currentStepDetails.value = foundDetails;
      return { found: true, index: binaryMiddle.value };
    } else if (arr[binaryMiddle.value] < target) {
      const nextDetails = `二分搜索: 目标值更大，搜索右半部分 [${binaryMiddle.value + 1}, ${right}]`;
      binarySearchSteps.value.push({ step: binarySearchSteps.value.length + 1, type: 'info', details: nextDetails });
      currentStepDetails.value = nextDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      return binarySearchHelper(binaryMiddle.value + 1, right);
    } else {
      const nextDetails = `二分搜索: 目标值更小，搜索左半部分 [${left}, ${binaryMiddle.value - 1}]`;
      binarySearchSteps.value.push({ step: binarySearchSteps.value.length + 1, type: 'info', details: nextDetails });
      currentStepDetails.value = nextDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      return binarySearchHelper(left, binaryMiddle.value - 1);
    }
  };

  return binarySearchHelper(left, right);
}

// 指数搜索算法实现
const startSearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...';

  // 100ms后重置按钮状态
  // setTimeout(() => {
  //   isButtonClicked.value = false;
  // }, 100);

  try {
    resetSearch();
    isSearching.value = true;
    searchSteps.value.push({ step: 1, type: 'info', details: `开始指数搜索，目标值: ${targetValue.value}` });
    currentStepDetails.value = `开始指数搜索，目标值: ${targetValue.value}`;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    const arr = [...searchData.value];
    const target = targetValue.value;

    // 检查第一个元素
    currentIndex.value = 0;
    comparisonCount.value++;
    currentStep.value++;
    const firstStepDetails = `第 ${currentStep.value} 步: 检查索引 0 (值: ${arr[0]})`;
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: firstStepDetails });
    currentStepDetails.value = firstStepDetails;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    if (arr[0] === target) {
      foundIndex.value = 0;
      const foundDetails = `第 ${currentStep.value} 步: 在索引 0 找到目标值 ${target}`;
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails });
      currentStepDetails.value = foundDetails;
    } else {
      // 寻找上界
      let bound = 1;
      while (bound < arr.length && arr[bound] < target) {
        currentIndex.value = bound;
        comparisonCount.value++;
        currentStep.value++;
        const boundStepDetails = `第 ${currentStep.value} 步: 指数跳跃到索引 ${bound} (值: ${arr[bound]})`;
        searchSteps.value.push({ step: currentStep.value, type: 'check', details: boundStepDetails });
        currentStepDetails.value = boundStepDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        bound *= 2;
      }

      // 确定二分搜索范围
      const left = Math.floor(bound / 2);
      const right = Math.min(bound, arr.length - 1);
      currentStep.value++;
      const binaryStepDetails = `第 ${currentStep.value} 步: 在范围 [${left}, ${right}] 内进行二分搜索`;
      searchSteps.value.push({ step: currentStep.value, type: 'info', details: binaryStepDetails });
      currentStepDetails.value = binaryStepDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 执行二分搜索
      isBinarySearching.value = true;
      const result = await binarySearch(arr, target, left, right);
      isBinarySearching.value = false;

      if (result.found) {
        foundIndex.value = result.index;
        currentStep.value++;
        const binaryFoundDetails = `第 ${currentStep.value} 步: 在索引 ${result.index} 找到目标值 ${target}`;
        searchSteps.value.push({ step: currentStep.value, type: 'found', details: binaryFoundDetails });
        currentStepDetails.value = binaryFoundDetails;
      } else {
        currentStep.value++;
        const notFoundDetails = `第 ${currentStep.value} 步: 未找到目标值 ${target}`;
        searchSteps.value.push({ step: currentStep.value, type: 'notFound', details: notFoundDetails });
        currentStepDetails.value = notFoundDetails;
      }
    }

    currentIndex.value = -1;
    isSearching.value = false;

    if (foundIndex.value !== -1) {
      searchStatus.value = '搜索完成 - 找到目标值';
      successMessage.value = `找到了目标值 ${targetValue.value}，索引位置：${foundIndex.value}`;
    } else {
      searchStatus.value = '搜索完成 - 未找到目标值';
      errorMessage.value = `未找到目标值 ${targetValue.value}`;
    }

    setTimeout(() => {
      successMessage.value = '';
      errorMessage.value = '';
    }, 3000);
  } catch (error) {
    console.error('[ERROR] 搜索失败:', error);
    errorMessage.value = `搜索失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    isSearching.value = false;
    isBinarySearching.value = false;
  }
}

// 排序数组
const sortArray = () => {
  if (isSearching.value || isBinarySearching.value) {
    errorMessage.value = '正在搜索中，无法排序';
    setTimeout(() => {
      errorMessage.value = '';
    }, 3000);
    return;
  }
  searchData.value = [...searchData.value].sort((a, b) => a - b);
  isArraySorted.value = true;
  successMessage.value = '数组已排序';
  setTimeout(() => {
    successMessage.value = '';
  }, 3000);
}

// 测试搜索 - 忽略isSearching状态
const testSearch = async () => {
  console.log('测试搜索按钮被点击');
  isButtonClicked.value = true;
  searchStatus.value = '测试搜索中...';
  await startSearch();
  isButtonClicked.value = false;
}

const arrayIsEmpty = computed(() => searchData.value.length === 0);
</script>

<style scoped>
@import './binary-search-detail.css';
</style>

<template>
  <div class="exponential-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>指数搜索</h2>
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
          <p>指数搜索是一种结合了线性搜索和二分搜索优点的搜索算法，特别适用于大规模有序数组。</p>

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
            <pre><code>function exponentialSearch(arr, target):
  if arr[0] == target:
    return 0
  
  // 找到指数边界
  bound = 1
  while bound < len(arr) and arr[bound] < target:
    bound *= 2
  
  // 在确定的边界内进行二分搜索
  return binarySearch(arr, target, bound/2, min(bound, len(arr)-1))</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def exponential_search(arr, target):
    if arr[0] == target:
        return 0
    
    # 找到指数边界
    bound = 1
    while bound < len(arr) and arr[bound] < target:
        bound *= 2
    
    # 在确定的边界内进行二分搜索
    left = bound // 2
    right = min(bound, len(arr) - 1)
    
    while left <= right:
        mid = (left + right) // 2
        if arr[mid] == target:
            return mid
        elif arr[mid] < target:
            left = mid + 1
        else:
            right = mid - 1
    
    return -1</code></pre>
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
                'checking': currentIndex === index,
                'found': foundIndex === index,
                'binary-checking': isBinarySearching && index === binaryMiddle,
                'binary-left': isBinarySearching && index >= binaryLeft && index < binaryMiddle,
                'binary-right': isBinarySearching && index > binaryMiddle && index <= binaryRight,
                'not-found': !isSearching && !isBinarySearching && foundIndex === -1 && searchSteps.length > 0
              }"
              :data-value="value"
            >
              {{ value }}
            </div>
          </div>
          <div class="slider-controls">
            <div class="slider-group">
              <label>列表大小: {{ listSize }}</label>
              <input type="text" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSearching || isBinarySearching" @input="listSize = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minSize }}-{{ maxSize }})</span>
            </div>
            <div class="slider-group">
              <label>目标值: {{ targetValue }}</label>
              <input type="text" :min="minTarget" :max="maxTarget" v-model.number="targetValue" :disabled="isSearching || isBinarySearching" @input="targetValue = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minTarget }}-{{ maxTarget }})</span>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSearching || isBinarySearching">
            </div>
          </div>
          <div class="button-group">
            <button @click="generateNewList" :disabled="isSearching || isBinarySearching" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
            <button @click="sortArray" :disabled="isSearching || isBinarySearching" :class="{ 'clicked': isButtonClicked }">排序数组</button>
            <button @click="startSearch" :disabled="isSearching || isBinarySearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
            <button @click="testSearch" :disabled="isSearching || isBinarySearching" :class="{ 'clicked': isButtonClicked }">测试搜索</button>
            <button @click="resetSearch" :disabled="isSearching || isBinarySearching" :class="{ 'clicked': isButtonClicked }">重置搜索</button>
          </div>
          <div class="error-message" v-if="errorMessage">
            <p>{{ errorMessage }}</p>
          </div>
          <div class="success-message" v-if="successMessage">
            <p>{{ successMessage }}</p>
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
              <div v-for="step in binarySearchSteps" :key="'binary-' + step.step" :class="'step-item ' + step.type">
                <span class="step-number">B{{ step.step }}.</span>
                <span class="step-details">{{ step.details }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>算法优化</h3>
          <p>指数搜索的主要优势在于当目标值靠近数组开头时表现优异，以下是一些进一步优化的思路：</p>
          <ol style="text-align: left;">
            <li><strong>自适应边界增长</strong>：根据数据分布调整边界增长速度。</li>
            <li><strong>插值搜索结合</strong>：在确定边界后使用插值搜索代替二分搜索，对于均匀分布的数据更高效。</li>
            <li><strong>并行化处理</strong>：对于超大数组，可以并行执行指数搜索的不同阶段。</li>
          </ol>

          <h3>适用场景</h3>
          <p>指数搜索特别适用于以下场景：</p>
          <ul style="text-align: left;">
            <li>大规模有序数组</li>
            <li>目标值大概率出现在数组前半部分的情况</li>
            <li>内存受限环境，因为它比二分搜索需要更少的比较操作</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>指数搜索，也称为加拉格尔搜索，是一种介于线性搜索和二分搜索之间的算法。</p>
          <p>它的核心思想是先通过指数增长的方式快速找到一个包含目标值的边界，然后在该边界内使用二分搜索。</p>
          <p>指数搜索的主要优点是：</p>
          <ul style="text-align: left;">
            <li>对于大数组，性能优于线性搜索</li>
            <li>当目标值靠近数组开头时，性能甚至优于二分搜索</li>
            <li>不需要预先知道数组大小（在某些实现中）</li>
          </ul>
          <p>在实际应用中，指数搜索常用于数据库查询和大型文件检索等场景。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.exponential-search-detail{
    /* 与线性查找保持一致的容器样式 */
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-top: 32px;
  padding: 24px;
  position: relative;
}
</style>
