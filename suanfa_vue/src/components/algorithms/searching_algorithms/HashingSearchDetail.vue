<script setup>
import { ref, computed, nextTick, watch } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 列表大小控制
const listSize = ref(10)
const minSize = ref(5)
const maxSize = ref(20)

// 目标值控制
const targetValue = ref(13)
const minTarget = ref(1)
const maxTarget = ref(100)

// 哈希表参数
const hashTableSize = ref(11)
const collisionHandling = ref('chaining') // 'chaining' or 'linearProbing'

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
    targetValue.value = 13;
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

// 控制标签页切换
const activeTab = ref('basic')

// 搜索状态
const isSearching = ref(false)
const isButtonClicked = ref(false)
const searchStatus = ref('就绪')
const animationSpeed = ref(500)
const currentStep = ref(0)
const foundIndex = ref(-1)
const isAnimating = ref(false)

// 数据和哈希表
const data = ref([])
const searchData = ref([])
const hashTable = ref(Array(hashTableSize.value).fill(null).map(() => []))

// 生成随机数据函数
const generateRandomData = (size) => {
  try {
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的数组大小: ' + size);
    }
    const result = []
    const usedNumbers = new Set()

    while (result.length < size) {
      const num = Math.floor(Math.random() * 100) + 1
      if (!usedNumbers.has(num)) {
        usedNumbers.add(num)
        result.push(num)
      }
    }
    return result;
  } catch (error) {
    console.error('生成随机数据失败:', error.message);
    throw error;
  }
}

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

// 生成新列表
const generateNewList = async () => {
  try {
    errorMessage.value = ''; // 清除之前的错误
    isButtonClicked.value = true;
    searchStatus.value = '生成新列表中...'

    // 强制转换listSize为数字
    const size = Number(listSize.value);
    const clampedSize = Math.max(minSize.value, Math.min(maxSize.value, Math.round(size)));
    if (clampedSize !== size) {
      console.warn(`[WARNING] 列表大小${size}超出范围，已调整为${clampedSize}`);
      listSize.value = clampedSize;
    }

    // 生成新数据
    const newData = generateRandomData(listSize.value);
    data.value = newData;
    searchData.value = [...newData];

    // 等待DOM更新后再重置搜索
    await nextTick();
    resetSearch();
    buildHashTable();

    // 100ms后重置按钮状态
    setTimeout(() => {
      isButtonClicked.value = false;
    }, 100);
  } catch (error) {
    console.error('[ERROR] 生成新列表失败:', error);
    errorMessage.value = `生成新列表失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    isButtonClicked.value = false;
  }
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

// 重置搜索
const resetSearch = () => {
  try {
    isSearching.value = false
    isAnimating.value = false

    // 重置搜索状态
    searchStatus.value = '就绪'
    currentStep.value = 0
    foundIndex.value = -1
    searchSteps.value = []
    currentStepDetails.value = ''

    // 重新复制原始数据
    searchData.value = [...data.value]
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
    throw error
  }
}

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 初始化数据
data.value = generateRandomData(listSize.value)
searchData.value = [...data.value]
// 初始化哈希表
buildHashTable()
</script>

<style scoped>
@import './common-algorithm-page.css';
</style>

<template>
  <div class="hashing-search-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>哈希查找</h2>
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
          <p>哈希查找是一种基于哈希表的高效查找算法。它通过哈希函数将键值映射到表中的特定位置，从而实现O(1)时间复杂度的查找。当多个键值映射到同一位置时，需要通过碰撞处理技术解决冲突。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n)</li>
                  <li><span>最好情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(1)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(n)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function hashingSearch(arr, target):
  // 创建哈希表
  hashTable = createHashTable()
  
  // 将所有元素插入哈希表
  for each item in arr:
    index = hashFunction(item)
    insertIntoHashTable(hashTable, index, item)
  
  // 查找目标值
  index = hashFunction(target)
  return searchInHashTable(hashTable, index, target)</code></pre>

            <h3>Python 实现</h3>
            <pre><code>class HashTable:
    def __init__(self, size):
        self.size = size
        self.table = [[] for _ in range(size)]
    
    def hash_function(self, key):
        return key % self.size
    
    def insert(self, key):
        index = self.hash_function(key)
        self.table[index].append(key)
    
    def search(self, key):
        index = self.hash_function(key)
        
        for i, item in enumerate(self.table[index]):
            if item == key:
                return (index, i)  # 返回哈希表中的索引和链表中的位置
        
        return (-1, -1)  # 未找到

def hashing_search(arr, target):
    # 创建哈希表
    hash_table = HashTable(len(arr) * 2)
    
    # 将所有元素插入哈希表
    for item in arr:
        hash_table.insert(item)
    
    # 查找目标值
    return hash_table.search(target)</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>class HashTable {
    constructor(size) {
        this.size = size;
        this.table = new Array(size).fill(null).map(() => []);
    }
    
    hashFunction(key) {
        return key % this.size;
    }
    
    insert(key) {
        const index = this.hashFunction(key);
        this.table[index].push(key);
    }
    
    search(key) {
        const index = this.hashFunction(key);
        
        for (let i = 0; i < this.table[index].length; i++) {
            if (this.table[index][i] === key) {
                return { index, listIndex: i };  # 返回哈希表中的索引和链表中的位置
            }
        }
        
        return { index: -1, listIndex: -1 };  # 未找到
    }
}

function hashingSearch(arr, target) {
    // 创建哈希表
    const hashTable = new HashTable(arr.length * 2);
    
    // 将所有元素插入哈希表
    for (const item of arr) {
        hashTable.insert(item);
    }
    
    // 查找目标值
    return hashTable.search(target);
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

      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>碰撞处理方法</h3>
          <div class="collision-methods">
            <div class="method-item">
              <h4>链地址法 (Chaining)</h4>
              <p>链地址法是一种常用的碰撞处理技术，它将哈希到同一位置的所有元素存储在一个链表中。当查找时，首先通过哈希函数定位到链表，然后在链表中线性查找目标值。</p>
              <p><strong>优点：</strong>实现简单，不会导致聚集现象，哈希表利用率高。</p>
              <p><strong>缺点：</strong>查找时间会随着链表长度增加而增加，需要额外空间存储链表指针。</p>
            </div>
            <div class="method-item">
              <h4>线性探测法 (Linear Probing)</h4>
              <p>线性探测法是一种开放寻址技术，当发生碰撞时，它会按顺序检查下一个可用的哈希表位置。具体来说，如果位置 i 被占用，就尝试位置 i+1，然后是 i+2，依此类推。</p>
              <p><strong>优点：</strong>不需要额外空间存储链表，缓存利用率高。</p>
              <p><strong>缺点：</strong>可能导致聚集现象，降低查找效率。</p>
            </div>
          </div>

          <h3>算法优化</h3>
          <p>哈希查找的性能很大程度上取决于哈希函数的质量和碰撞处理技术的选择。以下是一些优化建议：</p>
          <ol style="text-align: left;">
            <li><strong>选择合适的哈希函数</strong>：一个好的哈希函数应该能够将键值均匀地分布在哈希表中，减少碰撞的发生。</li>
            <li><strong>调整哈希表大小</strong>：当哈希表的负载因子（元素数量/哈希表大小）过高时，碰撞的概率会增加。通常当负载因子超过 0.7 时，考虑扩容哈希表。</li>
            <li><strong>选择合适的碰撞处理技术</strong>：根据具体应用场景选择合适的碰撞处理技术。链地址法适用于插入和删除频繁的场景，而开放寻址技术适用于查找频繁的场景。</li>
            <li><strong>使用再哈希法</strong>：当发生碰撞时，使用另一个哈希函数计算下一个位置，可以减少聚集现象。</li>
          </ol>

          <h3>适用场景</h3>
          <p>哈希查找适用于需要频繁查找的场景，特别是当数据量较大且可以接受额外空间开销时。常见的应用包括：</p>
          <ul style="text-align: left;">
            <li>数据库索引</li>
            <li>缓存实现</li>
            <li>符号表</li>
            <li>集合和映射数据结构</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>哈希查找是一种高效的查找算法，它通过哈希函数将键值映射到表中的特定位置，从而实现快速查找。</p>
          <p>哈希查找的核心思想是将查找转化为直接寻址，理想情况下可以在 O(1) 时间内找到目标值。</p>
          <p>哈希函数的选择是哈希查找的关键。一个好的哈希函数应该具备以下特性：</p>
          <ol style="text-align: left;">
            <li>确定性：相同的输入应该产生相同的输出。</li>
            <li>均匀性：将键值均匀地分布在哈希表中。</li>
            <li>高效性：计算哈希值的时间应该尽可能短。</li>
          </ol>
          <p>碰撞是哈希查找中不可避免的问题，选择合适的碰撞处理技术对于提高哈希查找的性能至关重要。</p>
          <p>在实际应用中，哈希查找通常与其他数据结构和算法结合使用，以提高系统的整体性能。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './binary-search-detail.css';

.hashing-search-detail{
    /* 与线性查找保持一致的容器样式 */
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
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
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: #f9f9f9;
}
</style>