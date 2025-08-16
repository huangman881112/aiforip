<script setup>
import { ref, defineEmits, nextTick, onMounted, onUnmounted, watch } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 控制标签页切换
const activeTab = ref('basic')

// 算法参数
// 确保array正确初始化为响应式对象
const array = ref([5, 2, 9, 1, 7, 6, 3])
const target = ref(7)
const result = ref(-1)
const isSearching = ref(false)
const steps = ref([])
const currentStep = ref(0)
const animationSpeed = ref(1000)
const isAnimating = ref(false)
const searchStatus = ref('就绪')
const comparisonCount = ref(0)
const totalSteps = ref(0)
const isCompleted = ref(false)
const pointerPosition = ref(0)  // 声明指针位置为响应式对象
console.log('array初始化:', array.value)

// 计算指针位置
const updatePointerPosition = () => {
  if (isAnimating.value && currentStep.value > 0 && currentStep.value <= array.value.length) {
    const index = currentStep.value - 1;
    // 假设每个元素宽度为60px，间距为10px
    pointerPosition.value = index * (60 + 10) + 30; // 30是元素宽度的一半
  }
};

// 监听currentStep变化，更新指针位置
watch(currentStep, updatePointerPosition);
watch(isAnimating, updatePointerPosition);

// 初始化数组数据
const initializeArray = () => {
  console.log('[DEBUG] 初始化数组数据')
  try {
    array.value = [5, 2, 9, 1, 7, 6, 3]
    console.log('[DEBUG] 初始化的数组:', array.value)
    addDebugLog(`初始化后的数组长度: ${array.value.length}`, 'info')
  } catch (error) {
    console.error('[ERROR] 初始化数组失败:', error)
    addDebugLog(`初始化数组失败: ${error.message}`, 'error')
  }
}

// 组件挂载时初始化数组
onMounted(() => {
  try {
    initializeArray()
    addDebugLog('组件已挂载，数组已初始化', 'info')
  } catch (error) {
    console.error('[ERROR] 挂载时初始化数组失败:', error)
    addDebugLog(`挂载时初始化数组失败: ${error.message}`, 'error')
  }
})

// 生成随机数组
const generateRandomArray = async () => {
  try {
    addDebugLog('进入generateRandomArray函数')
    // 检查array是否定义
    if (!array) {
      addDebugLog('array未定义!', 'error')
      console.error('array未定义!')
      return
    }
    // 检查array是否为响应式对象
    if (typeof array !== 'object' || !('value' in array)) {
      addDebugLog('array不是有效的响应式对象!', 'error')
      console.error('array不是有效的响应式对象!')
      return
    }
    // 检查array.value是否存在
    if (array.value === undefined) {
      addDebugLog('array.value未定义!', 'error')
      console.error('array.value未定义!')
      array.value = []
      addDebugLog('已初始化array.value为空数组', 'info')
    }
    // 增强检查：确保array.value是有效的对象且有length属性
    if (array.value === null) {
      addDebugLog('array.value为null!', 'error')
      console.error('array.value为null!')
      array.value = []
      addDebugLog('已初始化array.value为空数组', 'info')
    } else if (typeof array.value !== 'object') {
      addDebugLog('array.value不是有效的对象!', 'error')
      console.error('array.value不是有效的对象!')
      array.value = []
      addDebugLog('已初始化array.value为空数组', 'info')
    } else if (!('length' in array.value)) {
      addDebugLog('array.value没有length属性!', 'error')
      console.error('array.value没有length属性!')
      array.value = []
      addDebugLog('已初始化array.value为空数组', 'info')
    }
    // 安全地记录array.value信息
    try {
      addDebugLog(`array.value当前值: ${JSON.stringify(array.value)}`)
      addDebugLog(`array.value长度: ${array.value.length}`)
    } catch (jsonError) {
      addDebugLog(`无法序列化array.value: ${jsonError.message}`, 'warn')
      addDebugLog(`array.value类型: ${typeof array.value}`, 'info')
      addDebugLog(`array.value长度: ${array.value.length}`, 'info')
    }
    if (array.value) {
      addDebugLog(`array.value长度: ${array.value.length}`)
    } else {
      addDebugLog('array.value仍未定义!', 'error')
      console.error('array.value仍未定义!')
      return
    }

    if (isSearching.value || isAnimating.value) {
      addDebugLog('正在搜索或动画中，无法生成新数组', 'warn')
      return
    }

    addDebugLog('开始生成随机数组')
    const length = Math.floor(Math.random() * 5) + 5 // 5-10个元素
    addDebugLog(`生成的数组长度: ${length}`)
    // 确保生成有效的数组
    let newArray = []
    try {
      newArray = Array.from({ length }, () => Math.floor(Math.random() * 100) + 1)
      addDebugLog(`新数组内容: ${JSON.stringify(newArray)}`)
      if (newArray) {
        addDebugLog(`新数组长度: ${newArray.length}`)
      } else {
        addDebugLog('生成的newArray未定义!', 'error')
        console.error('生成的newArray未定义!')
        return
      }
      // 额外检查newArray是否为有效数组
      if (!Array.isArray(newArray)) {
        addDebugLog('生成的newArray不是有效数组!', 'error')
        console.error('生成的newArray不是有效数组!')
        newArray = []
      } else if (newArray.length !== length) {
        addDebugLog(`生成的newArray长度(${newArray.length})与预期(${length})不符!`, 'warn')
      }
    } catch (err) {
      addDebugLog(`生成新数组失败: ${err.message}`, 'error')
      console.error('生成新数组失败:', err)
      return
    }

    array.value = newArray
    // 再次检查array.value是否被正确设置
    if (array.value === undefined || array.value === null || typeof array.value !== 'object' || !('length' in array.value)) {
      addDebugLog('设置后array.value无效!', 'error')
      console.error('设置后array.value无效!')
      array.value = []
    } else {
      addDebugLog(`设置后的array.value: ${JSON.stringify(array.value)}`)
      addDebugLog(`设置后的array.value长度: ${array.value.length}`)
    }

    // 添加生成成功的视觉反馈
    // 确保只有在activeTab为search时才尝试查找元素
    if (activeTab.value === 'search') {
      await nextTick() // 确保DOM已更新
      const dataSetElement = document.querySelector('.data-set-display');
      if (dataSetElement) {
        dataSetElement.classList.add('array-generated');
        setTimeout(() => {
          dataSetElement.classList.remove('array-generated');
        }, 1000);
      } else {
        addDebugLog('未找到.data-set-display元素', 'warn')
      }
    }


  } catch (error) {
    addDebugLog(`生成随机数组失败: ${error.message}`, 'error')
    addDebugLog(`错误类型: ${error.name}`, 'error')
    addDebugLog(`错误堆栈: ${error.stack}`, 'error')
    console.error('生成随机数组失败:', error)
  }
}

// 确保组件卸载时清理资源
onUnmounted(() => {
  addDebugLog('组件已卸载', 'info')
})

// 添加到步骤历史
const addStep = (details, type = 'info') => {
  // 为不同类型的步骤添加对应的图标
  let icon = 'ℹ️'; // 默认信息图标
  if (type === 'comparison') icon = '🔍'; // 比较步骤
  if (type === 'success') icon = '✅'; // 成功找到
  if (type === 'warning') icon = '⚠️'; // 未找到

  steps.value.push({
    step: steps.value.length + 1,
    details,
    type,
    icon
  })
  totalSteps.value = steps.value.length
}

// 添加按钮点击处理函数，确保事件正确绑定并添加调试日志
const handleSearchClick = () => {
  console.log('开始查找按钮被点击');
  // alert('开始查找按钮被点击，即将执行线性查找');
  linearSearch();
};

// 线性查找算法实现
const linearSearch = async () => {
  console.log('linearSearch函数被调用');
  console.log('isSearching:', isSearching.value);
  console.log('isAnimating:', isAnimating.value);
  if (isSearching.value || isAnimating.value) {
    console.log('函数提前返回，因为isSearching或isAnimating为true');
    return;
  }

  resetSearch();
  console.log('搜索已重置');

  // 检查array.value是否有效
  if (!array || !array.value || !Array.isArray(array.value) || array.value.length === 0) {
    addDebugLog('数组无效，无法执行查找', 'error');
    searchStatus.value = '数组无效';
    console.log('数组无效，无法执行查找');
    return;
  }

  // 检查target是否有效
  if (target.value === undefined || target.value === null) {
    addDebugLog('目标值无效，无法执行查找', 'error');
    searchStatus.value = '目标值无效';
    console.log('目标值无效，无法执行查找');
    return;
  }

  isSearching.value = true;
  isAnimating.value = true;
  searchStatus.value = '查找中...';
  console.log('开始查找目标值:', target.value);
  addDebugLog(`开始查找目标值: ${target.value}`);

  // 重置比较计数
  comparisonCount.value = 0

  try {
    // 实现线性查找
    for (let i = 0; i < array.value.length; i++) {
      // 增加比较计数
      comparisonCount.value++

      // 更新当前步骤
      currentStep.value = i + 1

      // 添加步骤
      addStep(`比较索引 ${i} 的元素: ${array.value[i]} 与目标值: ${target.value}`, 'comparison')

      // 等待动画时间
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))

      // 如果找到目标值
      if (array.value[i] === target.value) {
        result.value = i
        addStep(`在索引 ${i} 处找到目标值: ${target.value}`, 'success')
        searchStatus.value = '查找完成'
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
        break
      }
    }

    // 如果未找到目标值
    if (result.value === -1) {
      addStep(`未找到目标值: ${target.value}`, 'warning')
      searchStatus.value = '未找到目标'
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value))
    }

    // 标记查找完成
    isSearching.value = false
    isAnimating.value = false
    isCompleted.value = true
    addDebugLog(`查找完成，比较次数: ${comparisonCount.value}`)
  } catch (error) {
    addDebugLog(`查找过程中出错: ${error.message}`, 'error')
    console.error('查找过程中出错:', error)
    isSearching.value = false
    isAnimating.value = false
    searchStatus.value = '查找出错'
  }
}

// 修改animateSteps函数，确保在动画过程中更新指针位置
const animateSteps = async () => {
  isAnimating.value = true;
  currentStep.value = 0;
  
  for (let i = 0; i < steps.value.length; i++) {
    if (!isSearching.value) break;
    
    currentStep.value = i + 1;
    // 等待动画完成
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
  }
  
  isAnimating.value = false;
  isSearching.value = false;
};

// 重置搜索
const resetSearch = () => {
  result.value = -1
  steps.value = []
  currentStep.value = 0
  isSearching.value = false
  isAnimating.value = false
  searchStatus.value = '就绪'
  comparisonCount.value = 0
  totalSteps.value = 0
  isCompleted.value = false
  addDebugLog('搜索已重置')
}

// 导航到指定步骤
const goToStep = (stepIndex) => {
  if (!isCompleted.value || isAnimating.value) return
  currentStep.value = stepIndex + 1
  // 滚动到当前步骤
  nextTick(() => {
    const stepElement = document.querySelector(`.step-item:nth-child(${stepIndex + 1})`);
    if (stepElement) {
      stepElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // 添加高亮效果
      stepElement.classList.add('highlight');
      setTimeout(() => {
        stepElement.classList.remove('highlight');
      }, 1000);
    }
  });
}

// 调试日志
const debugLogs = ref([])
const addDebugLog = (message, type = 'info') => {
  const timestamp = new Date().toLocaleTimeString()
  debugLogs.value.push({
    timestamp,
    message,
    type
  })
  // 保持日志最新
  debugLogs.value = debugLogs.value.slice(-50)
}
</script>

<template>
  <div class="algorithm-detail linear-search-detail">
    <button class="close-btn" @click="emit('close')">×</button>
    <div class="modal-header">
      <h2>线性查找 (Linear Search)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="() => { activeTab = 'search'; nextTick(() => generateRandomArray()) }">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>线性查找是一种最简单的搜索算法，它按顺序检查数组中的每个元素，直到找到目标值或遍历完整个数组。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(n)</li>
                  <li><span>最好情况:</span> O(1)</li>
                  <li><span>平均情况:</span> O(n)</li>
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
            <pre><code>function linearSearch(arr, target):
  for i from 0 to len(arr)-1:
    if arr[i] == target:
      return i
  return -1</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def linear_search(arr, target):
    for i in range(len(arr)):
        if arr[i] == target:
            return i
    return -1</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function linearSearch(arr, target) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === target) {
      return i; // 找到目标，返回索引
    }
  }
  return -1; // 未找到目标
}</code></pre>
          </div>
        </div>
        <!-- 其他基础信息内容 -->
      </div>

      <div v-if="activeTab === 'search'" class="search-tab">
        <div class="search-controls">
          <div class="input-group">
            <label for="target">目标值:</label>
            <input type="number" id="target" v-model.number="target.value" min="1" max="100">
          </div>
          <button @click="generateRandomArray">生成随机数组</button>
          <button @click="handleSearchClick" :disabled="isSearching.value || isAnimating.value">开始查找</button>
          <button @click="resetSearch" :disabled="!isSearching.value && !isCompleted.value">重置</button>
        </div>

        <div class="search-results">
          <div class="stats-container">
            <div class="stat-item">
              <span class="stat-label">查找状态:</span>
              <span class="stat-value">{{ searchStatus.value }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">比较次数:</span>
              <span class="stat-value">{{ comparisonCount.value }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总步骤:</span>
              <span class="stat-value">{{ totalSteps.value }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">当前步骤:</span>
              <span class="stat-value">{{ currentStep }}<span v-if="totalSteps > 0">{{ ' / ' + totalSteps }}</span></span>
            </div>
          </div>
          
          <!-- 添加步骤进度条 -->
          <div class="progress-container" v-if="totalSteps > 0">
            <div class="progress-bar" :style="{ width: (currentStep / totalSteps) * 100 + '%' }"></div>
          </div>

          <div class="visualization-container">
            <div class="data-set-display">
              <span>要查找的数据集：</span>
              <div class="data-items">
                 <div v-if="!array || !array.value" class="no-data">
                  无数据，请点击"生成随机数组"按钮
                </div>
                <div v-else-if="array.value.length === 0" class="no-data">
                  数组为空，请点击"生成随机数组"按钮
                </div>
                <div v-else class="array-container">
                  <div v-for="(item, index) in array.value" :key="index" class="array-element"
                       :class="{ 'current': currentStep.value - 1 === index && isAnimating.value,
                                 'found': result.value === index }">
                    {{ item }}
                  </div>
                  <!-- 搜索指针 -->
                  <div class="search-pointer" :style="{ left: pointerPosition + 'px' }"
                       v-if="isAnimating.value && currentStep.value > 0 && array && array.value && currentStep.value <= array.value.length"></div>
                </div>
              </div>
            </div>

            <div class="search-result" v-if="result.value !== -1 && !isAnimating.value">
              <p>找到目标值 <span class="target-value">{{ target.value }}</span>，索引位置: <span class="index-value">{{ result.value }}</span></p>
            </div>
            <div class="search-result not-found" v-if="result.value === -1 && !isAnimating.value && isCompleted.value">
              <p>未找到目标值 <span class="target-value">{{ target.value }}</span></p>
            </div>
          </div>

          <div class="steps-history" v-if="steps.value.length > 0">
            <h3>步骤历史</h3>
            <div class="steps-container">
              <div v-for="(step, index) in steps.value" :key="index" class="step-item" :class="step.type"
                   @click="goToStep(index)">
                <span class="step-icon">{{ step.icon }}</span>
                <span class="step-number">{{ step.step }}.</span>
                <span class="step-details">{{ step.details }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'advanced'" class="advanced-tab">
        <div class="markdown-content" style="text-align: left;">
          <h3>线性查找的进阶内容</h3>
          
          <div class="optimization-techniques">
            <h4>优化技术</h4>
            <div class="technique-item">
              <h5>哨兵查找</h5>
              <p>哨兵查找是线性查找的一种优化版本，通过在数组末尾添加目标值作为哨兵，可以避免在循环中每次都检查索引是否越界。</p>
              <pre><code>function sentinelSearch(arr, target) {
  const n = arr.length;
  // 保存最后一个元素并设置哨兵
  const last = arr[n - 1];
  arr[n - 1] = target;
  
  let i = 0;
  while (arr[i] !== target) {
    i++;
  }
  
  // 恢复最后一个元素
  arr[n - 1] = last;
  
  // 检查是否找到
  if (i < n - 1 || arr[n - 1] === target) {
    return i;
  } else {
    return -1;
  }
}</code></pre>
            </div>
          </div>
          
          <div class="application-scenarios">
            <h4>应用场景</h4>
            <ul>
              <li>当数组规模较小且无序时</li>
              <li>当数据结构不支持随机访问时（如链表）</li>
              <li>当需要查找多个目标值且每次查找前数组可能被修改时</li>
              <li>在调试和测试中，简单的线性查找可以快速验证数据</li>
              <li>当数组元素动态变化（频繁插入/删除）且查找操作不频繁时</li>
              <li>当需要查找满足特定条件的元素（而非精确值）时</li>
              <li>当内存资源有限，无法使用更复杂的数据结构时</li>
              <li>在教育环境中，用于演示基本搜索概念</li>
              <li>当数据分布不均匀，且目标值可能集中在数组开头时</li>
            </ul>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-tab">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          
          <div class="note-item">
            <h4>关键概念</h4>
            <p>线性查找是最基本的查找算法，其核心思想是按顺序检查每个元素，直到找到目标或遍历完所有元素。</p>
          </div>
          
          <div class="note-item">
            <h4>常见错误</h4>
            <ul>
              <li>忘记处理数组为空的情况</li>
              <li>在循环中错误地使用了索引</li>
              <li>忽略了数据类型的比较（如字符串和数字的比较）</li>
              <li>在多线程环境中没有考虑并发问题</li>
            </ul>
          </div>
          
          <div class="note-item">
            <h4>扩展思考</h4>
            <p>虽然线性查找的时间复杂度较高，但在某些情况下它是最佳选择：</p>
            <ul>
              <li>当数组元素数量很少时，线性查找的常数因子优势可能超过更复杂算法的渐近优势</li>
              <li>当数据结构不支持更高效的查找算法时</li>
              <li>当数组几乎有序，且目标值很可能出现在数组开头时</li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div class="modal-footer">
      <button class="close-btn" @click="emit('close')">关闭</button>
    </div>
  </div>
</template>

<style scoped>
/* 基础样式 */
.algorithm-detail {
  /* 原有样式保持不变 */
}

/* 数组可视化样式 */
.array-container {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  margin: 20px 0;
  padding: 20px;
  background-color: white;  /* 白色背景框 */
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  min-height: 100px;
}

.array-element {
  width: 60px;
  height: 60px;
  margin: 0 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #3b82f6;  /* 蓝色小方块 */
  color: white;
  font-weight: bold;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.array-element.current {
  background-color: #f1c40f;
  transform: scale(1.1);
}

.array-element.found {
  background-color: #10b981;
  transform: scale(1.1);
  box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
}

.array-element.checking {
  background-color: #f59e0b;  /* 黄色 */
  transform: scale(1.1);
}

.array-element.not-found {
  background-color: #94a3b8;
  opacity: 0.7;
}

.search-pointer {
  position: absolute;
  bottom: 20px;
  transition: left 0.5s ease;
  transform: translateX(-50%);
}

.pointer-line {
  width: 2px;
  height: 30px;
  background-color: #ef4444;
  margin: 0 auto;
}

.pointer-head {
  width: 10px;
  height: 10px;
  background-color: #ef4444;
  border-radius: 50%;
  margin: 0 auto;
}

/* 其他样式 */
.data-set-display {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 6px;
  transition: all 0.3s;
}

.data-set-display.array-generated {
  background-color: #dcfce7;
  border-left-color: #10b981;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.data-item {
  padding: 8px 12px;
  background-color: #e0f2fe;
  border-radius: 4px;
  white-space: nowrap;
  transition: all 0.3s;
  margin-right: 8px;
}

.no-data {
  padding: 8px 12px;
  color: #64748b;
  font-style: italic;
}

/* 调试日志样式 */
.debug-logs {
  margin-top: 20px;
  padding: 15px;
  background-color: #f8fafc;
  border-radius: 6px;
  max-height: 300px;
  overflow-y: auto;
}

.logs-container {
  margin-top: 10px;
}

.log-item {
  padding: 5px 10px;
  margin-bottom: 5px;
  border-radius: 4px;
  font-family: monospace;
  font-size: 14px;
  display: flex;
}

.log-time {
  color: #64748b;
  margin-right: 10px;
  min-width: 80px;
}

.log-message {
  flex: 1;
}

.log-item.info {
  background-color: #e0f2fe;
}

.log-item.warn {
  background-color: #fef3c7;
}

.log-item.error {
  background-color: #fee2e2;
  color: #dc2626;
}

.data-set-display.array-generated .data-item {
  background-color: #bbf7d0;
  border-left-color: #22c55e;
  transform: translateY(-2px);
}

/* 优化按钮样式 */
.visualization-controls button {
  padding: 10px 20px !important;
  border: none;
  background-color: #3b82f6 !important;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  margin-right: 10px;
}

.visualization-controls button:hover {
  background-color: #2563eb !important;
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.visualization-controls button:active {
  transform: translateY(0);
}

.visualization-controls button:disabled {
  background-color: #94a3b8 !important;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}
</style>