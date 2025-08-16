<template>
  <div class="heap-sort-detail detail-container">
    <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>堆排序</h2>
      <div class="tabs">
        <button :class="{ 'active': activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ 'active': activeTab === 'sorting' }" @click="activeTab = 'sorting'">排序</button>
        <button :class="{ 'active': activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ 'active': activeTab === 'notes' }" @click="activeTab = 'notes'">笔记</button>
      </div>
    </div>
    
    <!-- 标签页内容 -->
    <div class="tab-content">
      <!-- 基础标签页 -->
      <div v-if="activeTab === 'basic'" class="basic-section">
        <p>堆排序是一种基于比较的排序算法，它利用堆这种数据结构来进行排序。堆是一个近似完全二叉树的结构，并同时满足堆的性质：即子节点的键值或索引总是小于（或者大于）它的父节点。</p>

        <div class="complexity-analysis">
          <h3>复杂度分析</h3>
          <div class="complexity-item merged-complexity">
            <div class="complexity-row">
              <p class="complexity-title" style="text-align: left;">时间复杂度</p>
              <ul class="complexity-subitems">
                <li><span>最坏情况:</span> O(n log n)</li>
                <li><span>最好情况:</span> O(n log n)</li>
                <li><span>平均情况:</span> O(n log n)</li>
              </ul>
            </div>
            <div class="complexity-row">
              <p><span class="complexity-title">空间复杂度:</span> O(1)</p>
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
            <pre><code>function heapify(arr, n, i):
  最大 = i
  左子节点 = 2*i + 1
  右子节点 = 2*i + 2

  如果 左子节点 < n 且 arr[左子节点] > arr[最大]:
    最大 = 左子节点

  如果 右子节点 < n 且 arr[右子节点] > arr[最大]:
    最大 = 右子节点

  如果 最大 != i:
    交换 arr[i] 和 arr[最大]
    heapify(arr, n, 最大)

function heapSort(arr):
  n = arr的长度

  # 构建最大堆
  对于 i 从 n//2 - 1 到 0:
    heapify(arr, n, i)

  # 一个个交换元素
  对于 i 从 n-1 到 0:
    交换 arr[0] 和 arr[i]
    heapify(arr, i, 0)</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def heapify(arr, n, i):
    largest = i  # 初始化最大元素为根节点
    left = 2 * i + 1
    right = 2 * i + 2

    # 检查左子节点是否大于根节点
    if left < n and arr[left] > arr[largest]:
        largest = left

    # 检查右子节点是否大于目前的最大节点
    if right < n and arr[right] > arr[largest]:
        largest = right

    # 如果最大节点不是根节点，则交换并继续堆化
    if largest != i:
        arr[i], arr[largest] = arr[largest], arr[i]
        heapify(arr, n, largest)


def heapSort(arr):
    n = len(arr)

    # 构建最大堆（重新排列数组）
    for i in range(n // 2 - 1, -1, -1):
        heapify(arr, n, i)

    # 一个个提取堆顶元素
    for i in range(n - 1, 0, -1):
        arr[i], arr[0] = arr[0], arr[i]  # 交换
        heapify(arr, i, 0)

    return arr</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function heapify(arr, n, i) {
    let largest = i;
    let left = 2 * i + 1;
    let right = 2 * i + 2;

    // 检查左子节点是否大于根节点
    if (left < n && arr[left] > arr[largest]) {
        largest = left;
    }

    // 检查右子节点是否大于目前的最大节点
    if (right < n && arr[right] > arr[largest]) {
        largest = right;
    }

    // 如果最大节点不是根节点
    if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]]; // 交换

        // 递归地堆化受影响的子树
        heapify(arr, n, largest);
    }
}

function heapSort(arr) {
    const n = arr.length;

    // 构建最大堆
    for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        heapify(arr, n, i);
    }

    // 一个个提取堆顶元素
    for (let i = n - 1; i > 0; i--) {
        // 将当前堆顶（最大值）移到数组末尾
        [arr[0], arr[i]] = [arr[i], arr[0]];

        // 在减小的堆中调用heapify
        heapify(arr, i, 0);
    }

    return arr;
}</code></pre>
          </div>
      </div>
      
      <!-- 排序标签页 -->
      <div v-if="activeTab === 'sorting'" class="sort-section">
        <h3>可视化演示</h3>
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">排序状态:</span>
            <span class="stat-value">{{ getSortingStatusText() }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">堆化次数:</span>
            <span class="stat-value">{{ heapifyCount }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">交换次数:</span>
            <span class="stat-value">{{ swapCount }}</span>
          </div>
        </div>
        <div class="visualization-container">
          <div class="chart-container">
            <div v-for="(value, index) in list" :key="index"
                 :class="['bar', comparedIndices.includes(index) ? 'compared' : '', swappedIndices.includes(index) ? 'swapped' : '', sortedIndices.includes(index) ? 'sorted' : '']"
                 :style="{ height: `${value * 3}px`, backgroundColor: getBarColor(index) }"
                 :data-value="value">
            </div>
          </div>
          <div class="controls">
            <div class="list-size-control">
              <label>列表大小: {{ listSize }}</label>
              <input type="range" min="5" max="100" v-model.number="listSize" :disabled="isSorting">
            </div>
            <button @click="generateNewList" :disabled="isSorting">生成新列表</button>
            <button @click="startSorting" :disabled="isSorting || list.length === 0">开始排序</button>
            <button @click="testSorting" :disabled="isSorting || list.length === 0">测试排序</button>
            <button @click="resetSorting" :disabled="!isSorting && sortingStatus === 'idle'">重置</button>
            <div class="speed-control">
              <label>动画速度:</label>
              <input type="range" min="100" max="2000" step="100" v-model.number="animationSpeed" :disabled="isSorting">
            </div>
          </div>
          <div class="step-details">
            <h4>当前步骤详情</h4>
            <p>{{ stepsHistory.length > 0 ? stepsHistory[stepsHistory.length - 1] : '准备就绪' }}</p>
          </div>
          <div class="steps-history">
            <h4>排序步骤历史</h4>
            <div class="steps-container">
              <div v-for="(step, index) in stepsHistory" :key="index" class="step-item">
                <span class="step-number">{{ index + 1 }}.</span>
                <span class="step-details">{{ step }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 进阶标签页 -->
      <div v-if="activeTab === 'advanced'" class="advanced-section" style="text-align: left;">
        <h3>算法优化</h3>
        <p>堆排序的主要优化方向包括：</p>
        <ol style="text-align: left;">
          <li><strong>自底向上构建堆</strong>：传统方法是从最后一个非叶子节点开始向上构建堆，这已经是最优的方法。</li>
          <li><strong>避免递归</strong>：可以将递归实现的heapify函数改为迭代实现，减少函数调用开销。</li>
          <li><strong>并行化</strong>：在大规模数据排序时，可以考虑并行构建堆。</li>
          <li><strong>混合排序</strong>：对于小规模数据，可以在堆排序的最后阶段切换到插入排序。</li>
        </ol>

        <h3>应用场景</h3>
        <p>堆排序适用于以下场景：</p>
        <ul style="text-align: left;">
          <li>需要稳定的O(n log n)时间复杂度的场景</li>
          <li>不需要稳定排序的场景</li>
          <li>内存受限的环境（原地排序）</li>
          <li>需要构建优先队列的场景</li>
        </ul>

        <h3>与其他排序算法的比较</h3>
        <table class="comparison-table">
          <thead>
            <tr>
              <th>算法</th>
              <th>平均时间复杂度</th>
              <th>最坏时间复杂度</th>
              <th>空间复杂度</th>
              <th>稳定性</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>堆排序</td>
              <td>O(n log n)</td>
              <td>O(n log n)</td>
              <td>O(1)</td>
              <td>不稳定</td>
            </tr>
            <tr>
              <td>快速排序</td>
              <td>O(n log n)</td>
              <td>O(n²)</td>
              <td>O(log n)</td>
              <td>不稳定</td>
            </tr>
            <tr>
              <td>归并排序</td>
              <td>O(n log n)</td>
              <td>O(n log n)</td>
              <td>O(n)</td>
              <td>稳定</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      <!-- 学习标签页 -->
      <div v-if="activeTab === 'notes'" class="notes-section" style="text-align: left;">
        <h3>学习笔记</h3>
        <div class="markdown-content">
          <div class="note-item">
            <h4>堆的性质</h4>
            <p>堆是一个完全二叉树，且满足父节点的值大于或等于（最大堆）或小于或等于（最小堆）其子节点的值。</p>
          </div>
          
          <div class="note-item">
            <h4>堆的存储</h4>
            <p>堆通常使用数组来存储，对于索引为i的节点：</p>
            <ul style="text-align: left;">
              <li>父节点索引：(i-1)/2（整数除法）</li>
              <li>左子节点索引：2*i + 1</li>
              <li>右子节点索引：2*i + 2</li>
            </ul>
          </div>
          
          <div class="note-item">
            <h4>堆排序的两个阶段</h4>
            <ol style="text-align: left;">
              <li><strong>构建最大堆</strong>：将输入数组转化为最大堆结构</li>
              <li><strong>排序</strong>：重复从堆中取出最大元素，并重新调整堆结构</li>
            </ol>
          </div>
          
          <div class="note-item">
            <h4>关键点</h4>
            <p>堆排序的关键在于理解heapify操作，它用于维护堆的性质。在排序过程中，每次将堆顶元素（最大值）与数组末尾元素交换，然后对剩余元素重新heapify。</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import './common-algorithm-page.css';

/* 堆排序特有样式 */
.heap-sort-detail {
  /* 保留组件特有样式 */
}
</style>

<script>
export default {
  name: 'HeapSortDetail',
  emits: ['close'],
  data() {
    return {
      activeTab: 'basic',
      codeTab: 'pseudo',
      listSize: 20,
      list: [],
      originalList: [],
      isSorting: false,
      sortingStatus: 'idle', // idle, sorting, completed, failed
      animationSpeed: 500,
      comparedIndices: [],
      swappedIndices: [],
      sortedIndices: [],
      heapifyCount: 0,
      swapCount: 0,
      stepsHistory: [],
      sortInterval: null
    };
  },
  mounted() {
    this.generateNewList();
  },
  methods: {
    closeDetail() {
      this.$emit('close');
    },
    generateNewList() {
      this.list = [];
      this.originalList = [];
      this.comparedIndices = [];
      this.swappedIndices = [];
      this.sortedIndices = [];
      this.heapifyCount = 0;
      this.swapCount = 0;
      this.stepsHistory = [];
      this.sortingStatus = 'idle';
      this.isSorting = false;
      clearInterval(this.sortInterval);

      // 生成随机数据
      for (let i = 0; i < this.listSize; i++) {
        const value = Math.floor(Math.random() * 100) + 1;
        this.list.push(value);
        this.originalList.push(value);
      }
    },
    async startSorting() {
      if (this.isSorting) return;

      this.isSorting = true;
      this.sortingStatus = 'sorting';
      this.comparedIndices = [];
      this.swappedIndices = [];
      this.sortedIndices = [];
      this.heapifyCount = 0;
      this.swapCount = 0;
      this.stepsHistory = [];
      this.list = [...this.originalList];

      try {
        await this.heapSort(this.list);
        this.sortingStatus = 'completed';
      } catch (error) {
        console.error('排序出错:', error);
        this.sortingStatus = 'failed';
      } finally {
        this.isSorting = false;
      }
    },
    testSorting() {
      const testList = [...this.originalList];
      const sortedList = [...testList].sort((a, b) => a - b);
      const result = this.heapSortSync(testList);

      if (JSON.stringify(result) === JSON.stringify(sortedList)) {
        alert('排序算法正确！');
      } else {
        alert('排序算法错误！');
      }
    },
    resetSorting() {
      clearInterval(this.sortInterval);
      this.isSorting = false;
      this.sortingStatus = 'idle';
      this.list = [...this.originalList];
      this.comparedIndices = [];
      this.swappedIndices = [];
      this.sortedIndices = [];
      this.stepsHistory = [];
    },
    async heapSort(arr) {
      const n = arr.length;
      this.stepsHistory.push('开始构建最大堆');

      // 构建最大堆
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        await this.heapify(arr, n, i);
      }

      this.stepsHistory.push('最大堆构建完成，开始排序');

      // 一个个提取堆顶元素
      for (let i = n - 1; i > 0; i--) {
        // 将当前堆顶（最大值）移到数组末尾
        [arr[0], arr[i]] = [arr[i], arr[0]];
        this.swapCount++;
        this.swappedIndices = [0, i];
        this.stepsHistory.push(`将最大元素 ${arr[i]} 移到位置 ${i}`);
        this.sortedIndices.push(i);

        await this.sleep(this.animationSpeed);

        // 在减小的堆中调用heapify
        await this.heapify(arr, i, 0);
      }

      // 最后一个元素也已排序
      this.sortedIndices.push(0);
      this.stepsHistory.push('排序完成');
    },
    async heapify(arr, n, i) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      this.comparedIndices = [i];
      this.stepsHistory.push(`堆化节点 ${i}`);

      // 检查左子节点是否大于根节点
      if (left < n) {
        this.comparedIndices.push(left);
        await this.sleep(this.animationSpeed / 2);

        if (arr[left] > arr[largest]) {
          largest = left;
          this.stepsHistory.push(`左子节点 ${left} 大于当前最大值，更新最大值索引为 ${largest}`);
        }
      }

      // 检查右子节点是否大于目前的最大节点
      if (right < n) {
        this.comparedIndices.push(right);
        await this.sleep(this.animationSpeed / 2);

        if (arr[right] > arr[largest]) {
          largest = right;
          this.stepsHistory.push(`右子节点 ${right} 大于当前最大值，更新最大值索引为 ${largest}`);
        }
      }

      // 如果最大节点不是根节点
      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        this.swapCount++;
        this.swappedIndices = [i, largest];
        this.stepsHistory.push(`交换节点 ${i} 和节点 ${largest}`);
        this.heapifyCount++;

        await this.sleep(this.animationSpeed);

        // 递归地堆化受影响的子树
        await this.heapify(arr, n, largest);
      } else {
        this.heapifyCount++;
      }
    },
    heapSortSync(arr) {
      const n = arr.length;

      // 构建最大堆
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
        this.heapifySync(arr, n, i);
      }

      // 一个个提取堆顶元素
      for (let i = n - 1; i > 0; i--) {
        [arr[0], arr[i]] = [arr[i], arr[0]];
        this.heapifySync(arr, i, 0);
      }

      return arr;
    },
    heapifySync(arr, n, i) {
      let largest = i;
      const left = 2 * i + 1;
      const right = 2 * i + 2;

      if (left < n && arr[left] > arr[largest]) {
        largest = left;
      }

      if (right < n && arr[right] > arr[largest]) {
        largest = right;
      }

      if (largest !== i) {
        [arr[i], arr[largest]] = [arr[largest], arr[i]];
        this.heapifySync(arr, n, largest);
      }
    },
    sleep(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    getSortingStatusText() {
      switch (this.sortingStatus) {
        case 'idle':
          return '就绪';
        case 'sorting':
          return '排序中...';
        case 'completed':
          return '排序完成';
        case 'failed':
          return '排序失败';
        default:
          return '未知状态';
      }
    },
    getBarColor(index) {
      if (this.sortedIndices.includes(index)) {
        return '#4CAF50'; // 绿色表示已排序
      } else if (this.swappedIndices.includes(index)) {
        return '#FF5722'; // 橙色表示刚交换
      } else if (this.comparedIndices.includes(index)) {
        return '#2196F3'; // 蓝色表示正在比较
      } else {
        return '#9E9E9E'; // 灰色表示未处理
      }
    }
  }
};
</script>

<style scoped>
@import './heap-sort-detail.css';
</style>