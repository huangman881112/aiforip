<script setup>
import { ref, computed } from 'vue'
import { useSearchingVisualization } from '../../../composables/useSearchingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 可视化共享脚手架（列表大小/目标值/随机数据/统计状态/生成新列表/重置搜索）
const {
  listSize, minSize, maxSize,
  targetValue, minTarget, maxTarget,
  errorMessage, searchSteps, currentStepDetails,
  data, searchData,
  generateNewList, resetSearch,
  isSearching, isButtonClicked, searchStatus, animationSpeed,
  comparisonCount, currentStep, currentIndex, foundIndex,
} = useSearchingVisualization({
  defaultSize: 10,
  defaultTarget: 50,
  // 指数搜索需要递增有序数据
  generateRandomData: (size) => {
    const result = []
    let current = Math.floor(Math.random() * 10)
    result.push(current)
    for (let i = 1; i < size; i++) {
      current += Math.floor(Math.random() * 5) + 1
      result.push(current)
    }
    return result
  },
  // 重置搜索时清除算法专属状态（二分搜索子过程 + 消息提示）
  onReset: () => {
    binarySearchSteps.value = []
    binaryCurrentStep.value = 0
    binaryLeft.value = 0
    binaryRight.value = 0
    binaryMiddle.value = 0
    isBinarySearching.value = false
    binaryFound.value = false
    binarySearchIndex.value = -1
    errorMessage.value = ''
    successMessage.value = ''
  },
})

// 成功提示信息（算法专属）
const successMessage = ref('')

// 数组是否已排序标记
const isArraySorted = ref(true)

// 二分搜索相关状态（指数搜索内部调用的子过程）
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

// 生成新列表/重置搜索由 useSearchingVisualization 提供
// （生成新列表调用上方 generateRandomData 覆盖；重置搜索通过 onReset 钩子清除二分搜索子过程状态）

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
    </div>

    <div class="modal-content">

      <div class="search-section">
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
    </div>
  </div>
</template>

<style scoped>
.exponential-search-detail{
    /* 与线性查找保持一致的容器样式 */
  background-color: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  margin-top: 32px;
  padding: 24px;
  position: relative;
}
</style>
