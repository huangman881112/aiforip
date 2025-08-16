<script setup>
import { ref, computed } from 'vue'

// 定义关闭事件
const emit = defineEmits(['close'])

// 算法参数
const array = ref([1, 3, 5, 7, 9, 11, 13, 15, 17, 19])
const target = ref(13)
const result = ref(-1)
const isSearching = ref(false)
const steps = ref([])
const currentStep = ref(0)
const animationSpeed = ref(1000)
const isAnimating = ref(false)
const hashTableSize = ref(11)
const hashTable = ref(Array(hashTableSize.value).fill(null).map(() => []))
const collisionHandling = ref('chaining') // 'chaining' or 'linearProbing'

// 生成随机数组
const generateRandomArray = () => {
  const newArray = []
  const length = Math.floor(Math.random() * 5) + 5 // 5-10个元素
  const usedNumbers = new Set()

  while (newArray.length < length) {
    const num = Math.floor(Math.random() * 100)
    if (!usedNumbers.has(num)) {
      usedNumbers.add(num)
      newArray.push(num)
    }
  }

  array.value = newArray
  resetSearch()
  buildHashTable()
}

// 重置搜索
const resetSearch = () => {
  result.value = -1
  isSearching.value = false
  steps.value = []
  currentStep.value = 0
  isAnimating.value = false
}

// 哈希函数
const hashFunction = (key) => {
  return key % hashTableSize.value
}

// 构建哈希表
const buildHashTable = () => {
  hashTable.value = Array(hashTableSize.value).fill(null).map(() => [])
  steps.value = []

  for (const item of array.value) {
    let index = hashFunction(item)
    let step = { item, index, status: 'inserting', collision: false }

    if (collisionHandling.value === 'linearProbing') {
      // 线性探测法
      let originalIndex = index
      let i = 1
      while (hashTable.value[index] !== null && hashTable.value[index].length > 0) {
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

    steps.value.push(step)
  }

  // 触发动画
  isAnimating.value = true
  currentStep.value = 0

  const interval = setInterval(() => {
    currentStep.value++
    if (currentStep.value >= steps.value.length) {
      clearInterval(interval)
      isAnimating.value = false
    }
  }, animationSpeed.value / 2)
}

// 哈希查找算法
const hashingSearch = () => {
  if (isSearching.value || isAnimating.value) return

  resetSearch()
  isSearching.value = true

  const tar = target.value
  let index = hashFunction(tar)
  let foundIndex = -1
  let stepCount = 0

  steps.value.push({
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
    while (i < hashTableSize.value) {
      const currentIndex = (originalIndex + i) % hashTableSize.value

      if (hashTable.value[currentIndex].length === 0) {
        // 空槽，未找到
        steps.value.push({
          target: tar,
          index: currentIndex,
          status: 'notFound',
          collision: false,
          stepCount: stepCount++
        })
        break
      } else if (hashTable.value[currentIndex][0] === tar) {
        // 找到目标
        steps.value.push({
          target: tar,
          index: currentIndex,
          status: 'found',
          collision: false,
          stepCount: stepCount++
        })
        foundIndex = currentIndex
        break
      } else {
        // 继续探测
        steps.value.push({
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
      steps.value.push({
        target: tar,
        index,
        status: 'notFound',
        collision: false,
        stepCount: stepCount++
      })
    } else {
      // 搜索链表
      let found = false
      for (let i = 0; i < hashTable.value[index].length; i++) {
        steps.value.push({
          target: tar,
          index,
          listIndex: i,
          status: i === 0 ? 'searching' : 'collisionSearch',
          collision: hashTable.value[index].length > 1,
          stepCount: stepCount++
        })

        if (hashTable.value[index][i] === tar) {
          found = true
          steps.value[steps.value.length - 1].status = 'found'
          foundIndex = index
          break
        }
      }

      if (!found) {
        steps.value.push({
          target: tar,
          index,
          status: 'notFound',
          collision: hashTable.value[index].length > 1,
          stepCount: stepCount++
        })
      }
    }
  }

  result.value = foundIndex
  isSearching.value = false
  animateSteps()
}

// 动画展示步骤
const animateSteps = () => {
  if (steps.value.length === 0) return

  isAnimating.value = true
  currentStep.value = 0

  const interval = setInterval(() => {
    currentStep.value++

    if (currentStep.value >= steps.value.length) {
      clearInterval(interval)
      isAnimating.value = false
    }
  }, animationSpeed.value)
}

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 计算当前动画步骤的信息
const currentStepInfo = computed(() => {
  if (currentStep.value === 0 || currentStep.value > steps.value.length) {
    return null
  }
  return steps.value[currentStep.value - 1]
})

// 初始化哈希表
buildHashTable()
</script>

<template>
  <div class="algorithm-detail hashing-search-detail">
    <div class="detail-header">
      <h2>哈希查找 (Hashing Search)</h2>
      <button class="close-btn" @click="closeDetail">关闭</button>
    </div>

    <div class="detail-content">
      <div class="detail-section">
        <h3>算法原理</h3>
        <p>哈希查找是一种基于哈希表的高效查找算法。它通过哈希函数将键值映射到表中的特定位置，从而实现O(1)时间复杂度的查找。当多个键值映射到同一位置时，需要通过碰撞处理技术解决冲突。</p>
      </div>

      <div class="detail-section">
        <h3>复杂度分析</h3>
        <ul>
          <li>平均时间复杂度：O(1) - 在理想情况下</li>
          <li>最坏情况时间复杂度：O(n) - 当所有键值都映射到同一位置时</li>
          <li>空间复杂度：O(n) - 需要额外空间存储哈希表</li>
        </ul>
      </div>

      <div class="detail-section">
        <h3>代码实现</h3>
        <pre><code>// 哈希表类
class HashTable {
  constructor(size) {
    this.size = size;
    this.table = new Array(size).fill(null).map(() => []);
  }

  // 哈希函数
  hashFunction(key) {
    return key % this.size;
  }

  // 插入元素
  insert(key) {
    const index = this.hashFunction(key);
    this.table[index].push(key);
  }

  // 查找元素
  search(key) {
    const index = this.hashFunction(key);

    for (let i = 0; i < this.table[index].length; i++) {
      if (this.table[index][i] === key) {
        return index; // 返回哈希表中的索引
      }
    }

    return -1; // 未找到
  }
}

// 使用示例
function hashingSearch(arr, target) {
  const hashTable = new HashTable(arr.length * 2); // 创建哈希表

  // 将所有元素插入哈希表
  for (const item of arr) {
    hashTable.insert(item);
  }

  // 查找目标值
  return hashTable.search(target);
}</code></pre>
      </div>

      <div class="visualization-container">
        <h3>算法可视化</h3>
        <div class="visualization-controls">
          <button @click="hashingSearch" :disabled="isSearching || isAnimating">开始查找</button>
          <button @click="buildHashTable" :disabled="isSearching || isAnimating">重建哈希表</button>
          <button @click="generateRandomArray" :disabled="isSearching || isAnimating">生成随机数组</button>
          <input type="number" v-model="target" placeholder="目标值" :disabled="isSearching || isAnimating">
          <select v-model="collisionHandling" :disabled="isSearching || isAnimating">
            <option value="chaining">链地址法</option>
            <option value="linearProbing">线性探测法</option>
          </select>
          <input type="range" min="500" max="2000" v-model="animationSpeed" :disabled="isSearching || isAnimating">
          <span>动画速度: {{ animationSpeed }}ms</span>
        </div>

        <div class="hash-table-container">
          <div v-for="(bucket, index) in hashTable.value" :key="index" class="hash-bucket"
               :class="{
                 'current': currentStepInfo && index === currentStepInfo.index,
                 'found': currentStepInfo && index === currentStepInfo.index && currentStepInfo.status === 'found',
                 'not-found': currentStepInfo && index === currentStepInfo.index && currentStepInfo.status === 'notFound',
                 'collision': currentStepInfo && index === currentStepInfo.index && currentStepInfo.collision
               }">
            <div class="bucket-index">{{ index }}</div>
            <div class="bucket-items">
              <div v-for="(item, i) in bucket" :key="i" class="bucket-item"
                   :class="{
                     'current-item': currentStepInfo && index === currentStepInfo.index && i === currentStepInfo.listIndex,
                     'found-item': currentStepInfo && index === currentStepInfo.index && i === currentStepInfo.listIndex && currentStepInfo.status === 'found'
                   }">
                {{ item }}
              </div>
            </div>
          </div>
        </div>

        <div class="search-status" v-if="isAnimating">
          <p>当前步骤: {{ currentStep }} / {{ steps.length }}</p>
          <p v-if="currentStepInfo">
            <span v-if="currentStepInfo.status === 'inserting'">插入元素 {{ currentStepInfo.item }} 到位置 {{ currentStepInfo.index }}</span>
            <span v-else-if="currentStepInfo.status === 'searching' ">查找目标 {{ currentStepInfo.target }}，哈希位置 {{ currentStepInfo.index }}</span>
            <span v-else-if="currentStepInfo.status === 'probing' ">发生碰撞，继续探测位置 {{ currentStepInfo.index }}</span>
            <span v-else-if="currentStepInfo.status === 'collisionSearch' ">搜索碰撞链中的元素 {{ currentStepInfo.index }}[{{ currentStepInfo.listIndex }}]</span>
            <span v-else-if="currentStepInfo.status === 'found' ">在位置 {{ currentStepInfo.index }} {{ currentStepInfo.listIndex !== undefined ? '[' + currentStepInfo.listIndex + ']' : '' }} 找到目标值 {{ currentStepInfo.target }}</span>
            <span v-else-if="currentStepInfo.status === 'notFound' ">未找到目标值 {{ currentStepInfo.target }}</span>
            <span v-if="currentStepInfo.collision"> (发生碰撞)</span>
          </p>
        </div>

        <div class="search-result" v-if="!isSearching && !isAnimating && steps.length > 0 && steps[0].target !== undefined">
          <p v-if="result !== -1">找到目标值 {{ target }}，哈希表索引为 {{ result }}</p>
          <p v-else>未找到目标值 {{ target }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-algorithm-page.css';

/* 哈希查找特有样式 */
.hash-table-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 20px 0;
}

.hash-bucket {
  width: 80px;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 5px;
  background-color: #f0f0f0;
  transition: all 0.3s;
}

.hash-bucket.current {
  background-color: #ffeb3b;
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
  border-bottom: 1px solid #ddd;
  margin-bottom: 5px;
}

.bucket-items {
  min-height: 30px;
}

.bucket-item {
  padding: 3px;
  margin: 2px 0;
  background-color: white;
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

.search-status {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}

.search-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
}
</style>