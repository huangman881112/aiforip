<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
const activeTab = ref('basic')

// BFS搜索可视化相关状态
// 图结构控制
const numNodes = ref(5)
const minNodes = ref(3)
const maxNodes = ref(10)

// 错误信息
const errorMessage = ref('')

// 搜索步骤记录
const searchSteps = ref([])
const currentStepDetails = ref('')
const isSearching = ref(false)
const isButtonClicked = ref(false)
const searchStatus = ref('就绪')
const animationSpeed = ref(500)
const currentStep = ref(0)
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)

// 搜索参数
const startNode = ref('A')
const targetNode = ref('C')

// 确保numNodes始终是数字类型
watch(numNodes, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 节点数量不是有效数字，已重置为默认值');
    numNodes.value = 5;
  } else {
    // 确保值在有效范围内
    numNodes.value = Math.max(minNodes.value, Math.min(maxNodes.value, Math.round(newValue)));
  }
})

// 生成随机有向无环图(DAG)
const generateRandomDAG = (size) => {
  try {
    console.log('生成随机DAG - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边 (确保是DAG)
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    });
    
    // 为每个节点添加指向后面节点的边 (确保无环)
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到后面的1到3个节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      for (let j = 1; j <= numEdges && i + j < nodes.length; j++) {
        graph[node].push(nodes[i + j]);
      }
    }
    
    // 随机添加一些反向边，但确保仍然是DAG
    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      // 50%的概率添加反向边
      if (Math.random() > 0.5) {
        const numBackEdges = Math.floor(Math.random() * 2) + 1;
        for (let j = 1; j <= numBackEdges && i - j >= 0; j--) {
          const backNode = nodes[i - j];
          // 确保backNode存在于graph中，并检查是否已有边
          if (graph[backNode] && !graph[backNode].includes(node)) {
            graph[node].push(backNode);
          }
        }
      }
    }
    
    console.log('生成随机DAG - 完成，结果:', graph);
    return graph;
  } catch (error) {
    console.error('生成随机DAG失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// BFS搜索算法实现
const bfsSearch = (graph, start, target) => {
  try {
    console.log('开始BFS搜索:', { graph, start, target });
    if (!graph || !graph[start]) {
      throw new Error('起始节点不存在于图中');
    }

    // 重置搜索状态
    searchSteps.value = [];
    visitedNodes.value = [];
    path.value = [];
    found.value = false;
    currentStep.value = 0;
    searchStatus.value = '搜索中';
    isSearching.value = true;
    isButtonClicked.value = true;

    // BFS算法核心
    const queue = [start];
    const parent = {};
    visitedNodes.value.push(start);
    searchSteps.value.push({
      type: 'visit',
      node: start,
      message: `开始搜索，访问起始节点 ${start}`
    });

    while (queue.length > 0 && !found.value) {
      const current = queue.shift();

      if (current === target) {
        found.value = true;
        searchStatus.value = '找到目标';
        searchSteps.value.push({
          type: 'found',
          node: current,
          message: `找到目标节点 ${target}`
        });
        // 构建路径
        let node = current;
        while (node) {
          path.value.unshift(node);
          node = parent[node];
        }
        break;
      }

      if (graph[current]) {
        for (const neighbor of graph[current]) {
          if (!visitedNodes.value.includes(neighbor)) {
            visitedNodes.value.push(neighbor);
            parent[neighbor] = current;
            queue.push(neighbor);
            searchSteps.value.push({
              type: 'neighbor',
              node: neighbor,
              current: current,
              message: `从节点 ${current} 访问邻居节点 ${neighbor}`
            });
          } else {
            searchSteps.value.push({
              type: 'info',
              node: neighbor,
              current: current,
              message: `节点 ${neighbor} 已访问过`
            });
          }
        }
      }

      if (queue.length === 0 && !found.value) {
        searchStatus.value = '未找到目标';
        searchSteps.value.push({
          type: 'error',
          message: `搜索完成，未找到从 ${start} 到 ${target} 的路径`
        });
      }
    }

    isSearching.value = false;
    console.log('BFS搜索完成:', { found: found.value, path: path.value });
  } catch (error) {
    console.error('BFS搜索失败:', error.message);
    errorMessage.value = '搜索失败: ' + error.message;
    searchStatus.value = '搜索失败';
    isSearching.value = false;
  }
}

// 执行BFS搜索
const executeBFS = () => {
  try {
    errorMessage.value = '';
    isButtonClicked.value = true;
    const graph = generateRandomDAG(numNodes.value);
    bfsSearch(graph, startNode.value, targetNode.value);
  } catch (error) {
    console.error('执行BFS搜索失败:', error.message);
    errorMessage.value = '执行搜索失败: ' + error.message;
  }
}

// 重置搜索
const resetSearch = () => {
  searchSteps.value = [];
  currentStepDetails.value = '';
  isSearching.value = false;
  isButtonClicked.value = false;
  searchStatus.value = '就绪';
  currentStep.value = 0;
  visitedNodes.value = [];
  path.value = [];
  found.value = false;
  errorMessage.value = '';
}

// 初始化
onMounted(() => {
  console.log('BFSDetail组件已挂载');
})
</script>

<template>
  <div class="algorithm-detail">
    <div class="detail-header">
      <h2>广度优先搜索 (BFS) 算法详情</h2>
      <button class="close-btn" @click="closeDetail">关闭</button>
    </div>

    <div class="tab-container">
      <div class="tabs">
        <button :class="{ 'active': activeTab === 'basic' }" @click="activeTab = 'basic'">基本介绍</button>
        <button :class="{ 'active': activeTab === 'visualization' }" @click="activeTab = 'visualization'">算法可视化</button>
        <button :class="{ 'active': activeTab === 'code' }" @click="activeTab = 'code'">代码实现</button>
      </div>

      <div class="tab-content">
        <!-- 基本介绍 -->
        <div v-if="activeTab === 'basic'" class="basic-info">
          <h3>广度优先搜索 (BFS) 简介</h3>
          <p>广度优先搜索是一种图遍历算法，它从起始节点开始，先访问其所有邻居节点，然后再访问这些邻居的邻居，以此类推。</p>
          <p>BFS通常用于寻找图中两点之间的最短路径，或者用于判断图的连通性。</p>

          <h4>算法特点:</h4>
          <ul>
            <li>按层次遍历图</li>
            <li>使用队列存储待访问节点</li>
            <li>找到的路径是最短路径(边权重相等时)</li>
            <li>时间复杂度: O(V + E)，其中V是节点数，E是边数</li>
          </ul>

          <h4>应用场景:</h4>
          <ul>
            <li>最短路径问题</li>
            <li>图的连通性检测</li>
            <li>拓扑排序</li>
            <li>网络爬虫</li>
            <li>游戏开发中的寻路算法</li>
          </ul>
        </div>

        <!-- 算法可视化 -->
        <div v-if="activeTab === 'visualization'" class="visualization">
          <div class="controls">
            <div class="control-group">
              <label for="numNodes">节点数量:</label>
              <input type="number" id="numNodes" v-model.number="numNodes" :min="minNodes" :max="maxNodes">
            </div>

            <div class="control-group">
              <label for="startNode">起始节点:</label>
              <select id="startNode" v-model="startNode">
                <option v-for="i in numNodes" :key="i" :value="String.fromCharCode(64 + i)">{{ String.fromCharCode(64 + i) }}</option>
              </select>
            </div>

            <div class="control-group">
              <label for="targetNode">目标节点:</label>
              <select id="targetNode" v-model="targetNode">
                <option v-for="i in numNodes" :key="i" :value="String.fromCharCode(64 + i)">{{ String.fromCharCode(64 + i) }}</option>
              </select>
            </div>

            <div class="control-group">
              <label for="animationSpeed">动画速度 (ms):</label>
              <input type="range" id="animationSpeed" v-model.number="animationSpeed" min="100" max="2000" step="100">
            </div>
          </div>

          <div class="button-group">
            <button :disabled="isSearching" @click="executeBFS" :class="{ 'clicked': isButtonClicked }">执行BFS搜索</button>
            <button :disabled="isSearching" @click="resetSearch">重置</button>
          </div>

          <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

          <div class="search-status">搜索状态: {{ searchStatus }}</div>

          <div class="graph-container">
            <div class="graph-visualization">
              <!-- 图可视化将通过JavaScript动态生成 -->
              <p v-if="!isButtonClicked">点击"执行BFS搜索"按钮开始可视化</p>
              <p v-if="isButtonClicked && searchSteps.length === 0">正在准备搜索...</p>
            </div>
          </div>

          <div class="step-details">{{ currentStepDetails }}</div>

          <div class="steps-history">
            <h4>搜索步骤历史:</h4>
            <div class="steps-container">
              <div v-for="(step, index) in searchSteps" :key="index" :class="['step-item', step.type]">
                <span class="step-number">{{ index + 1 }}.</span>
                <span>{{ step.message }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 代码实现 -->
        <div v-if="activeTab === 'code'" class="code-section">
          <pre><code class="language-javascript">
// BFS搜索算法实现
function bfsSearch(graph, start, target) {
  // 初始化队列和访问记录
  const queue = [start];
  const visited = new Set([start]);
  const parent = new Map();
  let found = false;
  let path = [];

  while (queue.length > 0 && !found) {
    const current = queue.shift();

    if (current === target) {
      found = true;
      // 构建路径
      let node = current;
      while (node) {
        path.unshift(node);
        node = parent.get(node);
      }
      break;
    }

    if (graph[current]) {
      for (const neighbor of graph[current]) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parent.set(neighbor, current);
          queue.push(neighbor);
        }
      }
    }
  }

  return { found, path };
}
          </code></pre>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped src="./bfs-styles.css"></style>