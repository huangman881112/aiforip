<script setup>
import { ref } from 'vue'
import { useSearchingVisualization } from '../../../composables/useSearchingVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 可视化共享脚手架（列表大小/目标值/随机数据/统计状态/生成新列表/重置搜索）
const {
  listSize, minSize, maxSize,
  targetValue, minTarget, maxTarget,
  errorMessage, searchSteps, currentStepDetails,
  data, searchData,
  generateRandomData,
  generateNewList: sharedGenerateNewList,
  resetSearch,
  isSearching, isButtonClicked, searchStatus, animationSpeed,
  currentStep, foundIndex,
} = useSearchingVisualization({
  defaultSize: 10,
  minSize: 5,
  defaultTarget: 13,
  // 哈希查找需要互不重复的数据
  generateRandomData: (size) => {
    const result = []
    const usedNumbers = new Set()
    while (result.length < size) {
      const num = Math.floor(Math.random() * 100) + 1
      if (!usedNumbers.has(num)) {
        usedNumbers.add(num)
        result.push(num)
      }
    }
    return result
  },
  // 重置搜索时清除算法专属状态（哈希动画标记）
  onReset: () => {
    isAnimating.value = false
  },
})

// 哈希表参数（算法专属）
const hashTableSize = ref(11)
const collisionHandling = ref('chaining') // 'chaining' or 'linearProbing'

// 哈希动画状态（算法专属）
const isAnimating = ref(false)

// 数据和哈希表
const hashTable = ref(Array(hashTableSize.value).fill(null).map(() => []))

// 生成随机数据由 useSearchingVisualization 提供（generateRandomData 覆盖：互不重复数据）

// 哈希函数
const hashFunction = (key) => {
  return key % hashTableSize.value
}

// 构建哈希表
const buildHashTable = () => {
  hashTable.value = Array(hashTableSize.value).fill(null).map(() => [])
  searchSteps.value = []
  isAnimating.value = true
  currentStep.value = 0

  // 延迟执行以确保DOM更新
  setTimeout(() => {
    for (const item of searchData.value) {
      let index = hashFunction(item)
      let step = { item, index, status: 'inserting', collision: false }

      if (collisionHandling.value === 'linearProbing') {
        // 线性探测法
        let originalIndex = index
        let i = 1
        while (hashTable.value[index].length > 0) {
          step.collision = true
          index = (originalIndex + i) % hashTableSize.value
          i++
        }
        hashTable.value[index].push(item)
      } else {
        // 链地址法
        if (hashTable.value[index].length > 0) {
          step.collision = true
        }
        hashTable.value[index].push(item)
      }

      searchSteps.value.push(step)
    }

    // 触发动画
    const interval = setInterval(() => {
      currentStep.value++
      if (currentStep.value >= searchSteps.value.length) {
        clearInterval(interval)
        isAnimating.value = false
        searchStatus.value = '哈希表构建完成'
        currentStepDetails.value = '哈希表构建完成，共插入 ' + searchData.value.length + ' 个元素'
      } else {
        const step = searchSteps.value[currentStep.value - 1]
        currentStepDetails.value = `插入元素 ${step.item} 到位置 ${step.index}${step.collision ? ' (发生碰撞)' : ''}`
      }
    }, animationSpeed.value / 2)
  }, 100)
}

// 生成新列表：复用共享脚手架（数据生成/校验/重置搜索），随后重建哈希表
const generateNewList = async () => {
  isButtonClicked.value = true;
  searchStatus.value = '生成新列表中...'
  await sharedGenerateNewList();
  buildHashTable();

  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
}

// 哈希查找算法
const hashingSearch = async () => {
  if (isSearching.value || isAnimating.value) return

  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  foundIndex.value = -1
  searchSteps.value = []
  currentStep.value = 0
  currentStepDetails.value = ''

  const tar = targetValue.value
  let index = hashFunction(tar)
  let stepCount = 0

  searchSteps.value.push({
    target: tar,
    index,
    status: 'searching',
    collision: false,
    stepCount: stepCount++
  })

  if (collisionHandling.value === 'linearProbing') {
    // 线性探测法查找
    let originalIndex = index
    let i = 0
    let found = false

    while (i < hashTableSize.value && !found) {
      const currentIndex = (originalIndex + i) % hashTableSize.value

      if (hashTable.value[currentIndex].length === 0) {
        // 空槽，未找到
        searchSteps.value.push({
          target: tar,
          index: currentIndex,
          status: 'notFound',
          collision: false,
          stepCount: stepCount++
        })
        break
      } else if (hashTable.value[currentIndex][0] === tar) {
        // 找到目标
        searchSteps.value.push({
          target: tar,
          index: currentIndex,
          status: 'found',
          collision: false,
          stepCount: stepCount++
        })
        foundIndex.value = currentIndex
        found = true
      } else {
        // 继续探测
        searchSteps.value.push({
          target: tar,
          index: currentIndex,
          status: 'probing',
          collision: true,
          stepCount: stepCount++
        })
      }
      i++
    }
  } else {
    // 链地址法查找
    if (hashTable.value[index].length === 0) {
      // 槽为空，未找到
      searchSteps.value.push({
        target: tar,
        index,
        status: 'notFound',
        collision: false,
        stepCount: stepCount++
      })
    } else {
      // 搜索链表
      let found = false
      for (let i = 0; i < hashTable.value[index].length && !found; i++) {
        const status = i === 0 ? 'searching' : 'collisionSearch'
        searchSteps.value.push({
          target: tar,
          index,
          listIndex: i,
          status,
          collision: hashTable.value[index].length > 1,
          stepCount: stepCount++
        })

        if (hashTable.value[index][i] === tar) {
          found = true
          searchSteps.value[searchSteps.value.length - 1].status = 'found'
          foundIndex.value = index
        }
      }

      if (!found) {
        searchSteps.value.push({
          target: tar,
          index,
          status: 'notFound',
          collision: hashTable.value[index].length > 1,
          stepCount: stepCount++
        })
      }
    }
  }

  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);

  // 触发动画
  isAnimating.value = true
  currentStep.value = 0

  const interval = setInterval(() => {
    currentStep.value++

    if (currentStep.value >= searchSteps.value.length) {
      clearInterval(interval)
      isAnimating.value = false
      isSearching.value = false

      if (foundIndex.value !== -1) {
        searchStatus.value = '搜索完成 - 找到目标值'
        currentStepDetails.value = `在位置 ${foundIndex.value} 找到目标值 ${tar}`
      } else {
        searchStatus.value = '搜索完成 - 未找到目标值'
        currentStepDetails.value = `未找到目标值 ${tar}`
      }
    } else {
      const step = searchSteps.value[currentStep.value - 1]
      if (step.status === 'searching') {
        currentStepDetails.value = `查找目标 ${step.target}，哈希位置 ${step.index}`
      } else if (step.status === 'probing') {
        currentStepDetails.value = `发生碰撞，继续探测位置 ${step.index}`
      } else if (step.status === 'collisionSearch') {
        currentStepDetails.value = `搜索碰撞链中的元素 ${step.index}[${step.listIndex}]`
      } else if (step.status === 'found') {
        currentStepDetails.value = `在位置 ${step.index}${step.listIndex !== undefined ? '[' + step.listIndex + ']' : ''} 找到目标值 ${step.target}`
      } else if (step.status === 'notFound') {
        currentStepDetails.value = `未找到目标值 ${step.target}`
      }
    }
  }, animationSpeed.value)
}

// 重置搜索由 useSearchingVisualization 提供（公共状态清零 + 通过 onReset 清除哈希动画标记）
// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 初始化数据由 useSearchingVisualization 完成（generateRandomData 覆盖）
// 初始化哈希表
buildHashTable()
</script>

<style scoped>
@import './common-searching-page.css';
</style>

<template>
  <div class="hashing-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>哈希查找</h2>
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
              :data-value="value"
            >
              {{ value }}
            </div>
          </div>
          <div class="hash-table-container">
            <div v-for="(bucket, index) in hashTable" :key="index" class="hash-bucket"
                 :class="{
                   'current': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index,
                   'found': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index && searchSteps[currentStep - 1].status === 'found',
                   'not-found': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index && searchSteps[currentStep - 1].status === 'notFound',
                   'collision': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index && searchSteps[currentStep - 1].collision
                 }">
              <div class="bucket-index">{{ index }}</div>
              <div class="bucket-items">
                <div v-for="(item, i) in bucket" :key="i" class="bucket-item"
                     :class="{
                       'current-item': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index && i === searchSteps[currentStep - 1].listIndex,
                       'found-item': isAnimating && searchSteps.length > 0 && currentStep <= searchSteps.length && searchSteps[currentStep - 1] && index === searchSteps[currentStep - 1].index && i === searchSteps[currentStep - 1].listIndex && searchSteps[currentStep - 1].status === 'found'
                     }">
                  {{ item }}
                </div>
              </div>
            </div>
          </div>
          <div class="slider-controls">
            <div class="slider-group">
              <label>列表大小: {{ listSize }}</label>
              <input type="text" :min="minSize" :max="maxSize" v-model.number="listSize" :disabled="isSearching || isAnimating" @input="listSize = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minSize }}-{{ maxSize }})</span>
            </div>
            <div class="slider-group">
              <label>目标值: {{ targetValue }}</label>
              <input type="text" :min="minTarget" :max="maxTarget" v-model.number="targetValue" :disabled="isSearching || isAnimating" @input="targetValue = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minTarget }}-{{ maxTarget }})</span>
            </div>
            <div class="slider-group">
              <label>哈希表大小: {{ hashTableSize }}</label>
              <input type="text" :min="5" :max="20" v-model.number="hashTableSize" :disabled="isSearching || isAnimating" @input="hashTableSize = Number($event.target.value)" class="short-input">
              <span class="range-info">(5-20)</span>
            </div>
            <div class="slider-group">
              <label>碰撞处理:</label>
              <select v-model="collisionHandling" :disabled="isSearching || isAnimating">
                <option value="chaining">链地址法</option>
                <option value="linearProbing">线性探测法</option>
              </select>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSearching || isAnimating">
            </div>
          </div>
          <div class="button-group">
            <button @click="generateNewList" :disabled="isSearching || isAnimating" :class="{ 'clicked': isButtonClicked }">生成新列表</button>
            <button @click="buildHashTable" :disabled="isSearching || isAnimating" :class="{ 'clicked': isButtonClicked }">重建哈希表</button>
            <button @click="hashingSearch" :disabled="isSearching || isAnimating" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
            <button @click="resetSearch" :disabled="isSearching || isAnimating" :class="{ 'clicked': isButtonClicked }">重置搜索</button>
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
              <div v-for="step in searchSteps" :key="step.stepCount" :class="'step-item ' + step.status">
                <span class="step-number">{{ step.stepCount }}.</span>
                <span class="step-details" v-if="step.status === 'inserting'">插入元素 {{ step.item }} 到位置 {{ step.index }}{{ step.collision ? ' (发生碰撞)' : '' }}</span>
                <span class="step-details" v-else-if="step.status === 'searching'">查找目标 {{ step.target }}，哈希位置 {{ step.index }}</span>
                <span class="step-details" v-else-if="step.status === 'probing'">发生碰撞，继续探测位置 {{ step.index }}</span>
                <span class="step-details" v-else-if="step.status === 'collisionSearch'">搜索碰撞链中的元素 {{ step.index }}[{{ step.listIndex }}]</span>
                <span class="step-details" v-else-if="step.status === 'found'">在位置 {{ step.index }}{{ step.listIndex !== undefined ? '[' + step.listIndex + ']' : '' }} 找到目标值 {{ step.target }}</span>
                <span class="step-details" v-else-if="step.status === 'notFound'">未找到目标值 {{ step.target }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './binary-search-detail.css';

.hashing-search-detail{
    /* 与线性查找保持一致的容器样式 */
  background-color: var(--surface);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.5);
  margin-top: 32px;
  padding: 24px;
  position: relative;
}

/* 哈希查找特有样式 */
.hash-table-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
  justify-content: center;
}

.hash-bucket {
  width: 80px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  padding: 5px;
  background-color: var(--surface-2);
  transition: all 0.3s;
}

.hash-bucket.current {
  background-color: #ffeb3b;
  color: var(--text-on-bright);
  transform: scale(1.05);
}

.hash-bucket.found {
  background-color: #4caf50;
  color: white;
  transform: scale(1.05);
}

.hash-bucket.not-found {
  background-color: #f44336;
  color: white;
  transform: scale(1.05);
}

.hash-bucket.collision {
  border: 2px solid #ff9800;
}

.bucket-index {
  font-weight: bold;
  text-align: center;
  border-bottom: 1px solid var(--border-1);
  margin-bottom: 5px;
}

.bucket-items {
  min-height: 30px;
}

.bucket-item {
  padding: 3px;
  margin: 2px 0;
  background-color: var(--surface);
  border-radius: 2px;
  text-align: center;
}

.bucket-item.current-item {
  background-color: #2196f3;
  color: white;
}

.bucket-item.found-item {
  background-color: #4caf50;
  color: white;
}

.collision-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin: 20px 0;
}

.method-item {
  flex: 1;
  min-width: 300px;
  padding: 15px;
  border: 1px solid var(--border-1);
  border-radius: 4px;
  background-color: var(--surface-muted);
}
</style>