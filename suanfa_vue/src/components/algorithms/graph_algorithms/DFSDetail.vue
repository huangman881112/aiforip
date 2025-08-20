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

// DFS搜索可视化相关状态
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
    console.log('生成随机DAG - 节点:', nodes);
    // 为每个节点添加指向后面节点的边 (确保无环)
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到后面的1到3个节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      for (let j = 1; j <= numEdges && i + j < nodes.length; j++) {
        graph[node].push(nodes[i + j]);
      }
    }
    console.log('生成随机DAG - 边:', graph);

    // 随机添加一些反向边，但确保仍然是DAG
    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      // 50%的概率添加反向边
      if (Math.random() > 0.5) {
        const numBackEdges = Math.floor(Math.random() * 2) + 1;
        for (let j = 1; j <= numBackEdges && i - j >= 0; j++) {
          const backNode = nodes[i - j];
          console.log('生成随机DAG - 尝试添加反向边:', node, '->', backNode);
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

// 模拟图数据
const graph = ref(generateRandomDAG(numNodes.value))
const currentGraph = ref({...graph.value})
const nodesPositions = ref({})

// 生成节点位置
const generateNodesPositions = () => {
  const positions = {};
  const nodes = Object.keys(currentGraph.value);
  // 根据SVG viewBox(800x600)和节点数量动态计算半径
  const maxWidth = 700; // 留出边距
  const maxHeight = 500; // 留出边距
  const diameter = Math.min(maxWidth, maxHeight) * 0.8; // 直径为较小维度的80%
  const radius = diameter / 2;
  // 中心点设置为viewBox中心
  const centerX = 400;
  const centerY = 300;
  console.log('生成节点位置 - 开始，nodes:', nodes);
  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    positions[node] = {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle)
    };
  });
  console.log('生成节点位置 - 完成，positions:', positions);

  return positions;
}

// 生成新图
const generateNewGraph = async () => {
  try {
    errorMessage.value = ''; // 清除之前的错误
    console.log('[DEBUG] 生成新图按钮被点击');
    
    // 强制转换numNodes为数字
    const size = Number(numNodes.value);
    console.log('[DEBUG] 当前numNodes:', size, '类型:', typeof size);
    
    // 验证numNodes
    if (typeof size !== 'number' || isNaN(size)) {
      const err = new Error('节点数量必须是数字类型');
      console.error('[ERROR]', err);
      throw err;
    }
    const clampedSize = Math.max(minNodes.value, Math.min(maxNodes.value, Math.round(size)));
    if (clampedSize !== size) {
      console.warn(`[WARNING] 节点数量${size}超出范围，已调整为${clampedSize}`);
      numNodes.value = clampedSize;
    }
    
    // 更新节点选择
    const nodes = Array.from({ length: clampedSize }, (_, i) => String.fromCharCode(65 + i));
    if (!nodes.includes(startNode.value)) {
      startNode.value = nodes[0];
    }
    if (!nodes.includes(targetNode.value) || targetNode.value === startNode.value) {
      targetNode.value = nodes.length > 1 ? nodes[1] : nodes[0];
    }
    
    // 生成新图
    console.log('[DEBUG] 开始生成随机DAG');
    const newGraph = generateRandomDAG(numNodes.value);
    console.log('[DEBUG] 生成的新图:', newGraph);
    
    // 更新图
    graph.value = newGraph;
    console.log('[DEBUG] 图已更新:', graph.value);
    
    // 等待DOM更新后再重置搜索
    console.log('[DEBUG] 等待DOM更新');
    await nextTick();
    console.log('[DEBUG] 重置搜索');
    try {
      resetSearch();
      // 生成节点位置
      nodesPositions.value = generateNodesPositions();
      console.log('[DEBUG] 重置搜索完成');
    } catch (resetError) {
      console.error('[ERROR] 重置搜索失败:', resetError);
      throw new Error(`重置搜索时出错: ${resetError.message}`);
    }
    console.log('[DEBUG] 生成新图 - 完成');
  } catch (error) {
    console.error('[ERROR] 生成新图失败:', error);
    console.error('[ERROR] 错误堆栈:', error.stack);
    errorMessage.value = `生成新图失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    // 强制显示错误信息
    alert(errorMessage.value);
  }
}

// 生成带箭头的边路径
const getEdgePath = (start, end) => {
  // 起点和终点坐标（节点中心）
  const startX = start.x + 25;
  const startY = start.y + 25;
  const endX = end.x + 25;
  const endY = end.y + 25;

  // 计算边的方向
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitDx = dx / length;
  const unitDy = dy / length;

  // 调整终点位置，使其位于节点边缘
  const nodeRadius = 25;
  const adjustedEndX = endX - nodeRadius * unitDx;
  const adjustedEndY = endY - nodeRadius * unitDy;

  // 箭头的长度和宽度
  const arrowLength = 10;
  const arrowWidth = 5;

  // 计算箭头的两个点
  const arrow1X = adjustedEndX - arrowLength * unitDx + arrowWidth * unitDy;
  const arrow1Y = adjustedEndY - arrowLength * unitDy - arrowWidth * unitDx;
  const arrow2X = adjustedEndX - arrowLength * unitDx - arrowWidth * unitDy;
  const arrow2Y = adjustedEndY - arrowLength * unitDy + arrowWidth * unitDx;

  // 生成路径数据 - 边和箭头分开
  // 边路径（黑色）
  // 箭头路径（红色）
  return {
    edgePath: `M ${startX} ${startY} L ${adjustedEndX} ${adjustedEndY}`,
    arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`
  };
};

// DFS搜索算法实现
const dfsSearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  currentStep.value = 0
  visitedNodes.value = []
  path.value = []
  found.value = false
  searchSteps.value = []
  currentStepDetails.value = ''
  console.log('搜索开始前的图:', currentGraph.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，从节点 ${startNode.value} 到节点 ${targetNode.value}` })

  // DFS搜索实现
  const visited = new Set();
  const currentPath = [];

  const dfs = async (node) => {
    // 如果找到目标节点，终止搜索
    if (found.value) {
      return true;
    }

    // 如果节点已访问，直接返回
    if (visited.has(node)) {
      return false;
    }

    // 标记为已访问
    visited.add(node);
    visitedNodes.value.push(node);
    currentPath.push(node);
    path.value = [...currentPath];

    currentStep.value++;
    const stepDetails = `第 ${currentStep.value} 步: 访问节点 ${node}`;
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'visit', details: stepDetails });
    currentStepDetails.value = stepDetails;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    // 如果找到目标节点
    if (node === targetNode.value) {
      found.value = true;
      currentStep.value++;
      const foundDetails = `第 ${currentStep.value} 步: 找到目标节点 ${node}`;
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails });
      currentStepDetails.value = foundDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      return true;
    }

    // 访问所有邻居
    for (const neighbor of currentGraph.value[node] || []) {
      if (found.value) break;
      
      currentStep.value++;
      const neighborDetails = `第 ${currentStep.value} 步: 从节点 ${node} 移动到邻居 ${neighbor}`;
      console.log(neighborDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'neighbor', details: neighborDetails });
      currentStepDetails.value = neighborDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      if (await dfs(neighbor)) {
        return true;
      }
    }

    // 回溯
    if (!found.value) {
      currentPath.pop();
      path.value = [...currentPath];
      currentStep.value++;
      const backtrackDetails = `第 ${currentStep.value} 步: 从节点 ${node} 回溯`;
      console.log(backtrackDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'backtrack', details: backtrackDetails });
      currentStepDetails.value = backtrackDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    }

    return found.value;
  };

  try {
    // 开始搜索
    const result = await dfs(startNode.value);

    isSearching.value = false;
    if (result) {
      searchStatus.value = '搜索成功';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，找到路径: [${path.value.join(' -> ')}]`;
      console.log(finalDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
      currentStepDetails.value = finalDetails;
    } else {
      searchStatus.value = '搜索失败';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，未找到从 ${startNode.value} 到 ${targetNode.value} 的路径`;
      console.log(finalDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'error', details: finalDetails });
      currentStepDetails.value = finalDetails;
    }
  } catch (error) {
    console.error('[ERROR] 搜索失败:', error);
    isSearching.value = false;
    searchStatus.value = '搜索失败';
    errorMessage.value = `搜索失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    searchSteps.value.push({ step: currentStep.value + 1, type: 'error', details: errorMessage.value });
  }
}

// 检查边是否在路径中
const isPathEdge = (from, to) => {  
  // 检查是否存在从from到to的边在当前路径中
  for (let i = 0; i < path.value.length - 1; i++) {
    if (path.value[i] === from && path.value[i + 1] === to) {
      return true;
    }
  }
  return false;
}

// 重置搜索
const resetSearch = () => {
  try {
    isSearching.value = false;
    
    // 重置搜索状态
    searchStatus.value = '就绪'
    currentStep.value = 0
    visitedNodes.value = []
    path.value = []
    found.value = false
    searchSteps.value = []
    currentStepDetails.value = ''
    
    // 重新复制原始图
    currentGraph.value = {...graph.value}
    console.log('[DEBUG] 重置搜索 - 图已重置:', currentGraph.value)
  } catch (error) {
    console.error('[ERROR] 重置搜索失败:', error)
    console.error('[ERROR] 错误堆栈:', error.stack)
    throw error
  }
}

// 组件挂载时生成节点位置
onMounted(() => {
  nodesPositions.value = generateNodesPositions();
});
</script>

<style scoped src="./dfs-styles.css"></style>

<template>
  <div class="dfs-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>深度优先搜索(DFS)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'sort' }" @click="activeTab = 'sort'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">学习</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>深度优先搜索(DFS)是一种用于遍历或搜索树或图的算法。它尽可能深地搜索树的分支，当节点v的所有边都已被探寻过，搜索将回溯到发现节点v的那条边的起始节点。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(V + E)</li>
                  <li><span>最好情况:</span> O(V + E)</li>
                  <li><span>平均情况:</span> O(V + E)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(V)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 简单</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function DFS(graph, start, visited):
  if start not in visited:
    visited.add(start)
    print(start)
    for neighbor in graph[start]:
      DFS(graph, neighbor, visited)
  return visited</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def dfs(graph, start, visited=None):
    if visited is None:
        visited = set()
    if start not in visited:
        visited.add(start)
        print(start, end=" ")
        for neighbor in graph[start]:
            dfs(graph, neighbor, visited)
    return visited

# 示例图
# graph = {
#     'A': ['B', 'C'],
#     'B': ['A', 'D', 'E'],
#     'C': ['A', 'F'],
#     'D': ['B'],
#     'E': ['B', 'F'],
#     'F': ['C', 'E']
# }
# dfs(graph, 'A')  # 输出: A B D E F C</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function dfs(graph, start, visited = new Set()) {
    if (!visited.has(start)) {
        visited.add(start);
        console.log(start);
        for (const neighbor of graph[start]) {
            dfs(graph, neighbor, visited);
        }
    }
    return visited;
}

// 示例图
// const graph = {
//     'A': ['B', 'C'],
//     'B': ['A', 'D', 'E'],
//     'C': ['A', 'F'],
//     'D': ['B'],
//     'E': ['B', 'F'],
//     'F': ['C', 'E']
// };
// dfs(graph, 'A');  // 输出: A B D E F C</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'sort'" class="sort-section">
        <h3>DFS搜索可视化</h3>
        <p>深度优先搜索(DFS)是一种用于遍历或搜索树或图的算法。它尽可能深地搜索图的分支，当节点的所有边都已被探寻过，搜索将回溯到发现该节点的那条边的起始节点。</p>
      <div class="visualization-container">
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
            <span class="stat-label">已访问节点:</span>
            <span class="stat-value">{{ visitedNodes.join(', ') }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前路径:</span>
            <span class="stat-value">{{ path.length > 0 ? path.join(' -> ') : '无' }}</span>
          </div>
        </div>

      
          <div class="graph-container">
            <div class="graph-left">
              <!-- 合并后的SVG容器：边和节点 -->
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                <!-- 移除marker定义，使用CSS实现箭头 -->

                <!-- 边 -->
                <template v-for="(neighbors, node) in currentGraph" :key="node + '-edges'">
                  <template v-for="neighbor in neighbors" :key="node + '-' + neighbor">
                    <template v-if="nodesPositions[node] && nodesPositions[neighbor]">
                      <!-- 边路径 (黑色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).edgePath"
                        stroke="#666"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'path-highlight': isPathEdge(node, neighbor) }"
                      />
                      <!-- 箭头路径 (红色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).arrowPath"
                        stroke="#ff0000"
                        stroke-width="2"
                        fill="none"
                      />
                    </template>
                  </template>
                </template>

                <!-- 节点 (绘制在边上方) -->
                <template v-for="node in Object.keys(currentGraph)" :key="node">
                  <g v-if="nodesPositions[node]">
                    <circle
                      :cx="nodesPositions[node].x + 25"
                      :cy="nodesPositions[node].y + 25"
                      r="25"
                      class="node"
                      :class="{
                        'visited': visitedNodes.includes(node),
                        'current': path.length > 0 && path[path.length - 1] === node,
                        'target': node === targetNode.value,
                        'start': node === startNode.value
                      }"
                    />
                    <text
                      :x="nodesPositions[node].x + 25"
                      :y="nodesPositions[node].y + 25"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-text"
                    >
                      {{ node }}
                    </text>
                    <text
                      v-if="node === startNode.value || node === targetNode.value"
                      :x="nodesPositions[node].x + 25"
                      :y="nodesPositions[node].y + 60"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-label"
                    >
                      {{ node === startNode.value ? '起点' : '终点' }}
                    </text>
                  </g>
                </template>
              </svg>
            </div>
            <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
                <div class="graph-info">
                  <h4>图结构信息</h4>
                  <div v-for="(neighbors, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                    <p>{{ node }}: {{ neighbors.join(', ') }}</p>
                  </div>
                </div>
            </div>
          </div>
       

         <div class="slider-controls">
            <div class="slider-group">
              <label>节点数量: {{ numNodes }}</label>
              <input type="text" :min="minNodes" :max="maxNodes" v-model.number="numNodes" :disabled="isSearching" @input="numNodes = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minNodes }}-{{ maxNodes }})</span>
            </div>
            <div class="slider-group">
              <label>起始节点:</label>
              <select v-model="startNode" :disabled="isSearching">
                <option v-for="node in Object.keys(currentGraph)" :key="node" :value="node">{{ node }}</option>
              </select>
            </div>
            <div class="slider-group">
              <label>目标节点:</label>
              <select v-model="targetNode" :disabled="isSearching">
                <option v-for="node in Object.keys(currentGraph)" :key="node" :value="node" :disabled="node === startNode.value">{{ node }}</option>
              </select>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isSearching">
            </div>
          </div>

          <div class="button-group">
            <button @click="generateNewGraph" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">生成新图</button>
            <button @click="dfsSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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
     
      </div>

      <div v-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content">
          <h3>算法变种</h3>
          <p>深度优先搜索有一些重要的变种：</p>
          <ol>
            <li><strong>迭代深度优先搜索(IDDFS)</strong>：结合了深度优先搜索和广度优先搜索的优点，用于有无限状态空间的情况。</li>
            <li><strong>双向深度优先搜索</strong>：从起始节点和目标节点同时开始搜索，当两边相遇时找到路径。</li>
            <li><strong>深度受限搜索</strong>：对深度优先搜索设置最大深度限制，避免在无限图中陷入死循环。</li>
          </ol>

          <h3>应用场景</h3>
          <p>深度优先搜索广泛应用于以下场景：</p>
          <ul>
            <li>图的遍历和连通性分析</li>
            <li>拓扑排序</li>
            <li>寻找路径和环检测</li>
            <li>解决迷宫问题</li>
            <li>生成树和森林的构建</li>
            <li>强连通分量的查找</li>
            <li>回溯算法（如N皇后问题）</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="notes-section">
        <div class="markdown-content">
          <h3>学习笔记</h3>
          <p>深度优先搜索是一种非常重要的图算法，它的核心思想是尽可能深地探索图的分支，直到无法继续为止，然后回溯。</p>
          <p>DFS可以用递归或栈来实现。递归实现更直观，但对于大规模图可能会导致栈溢出；栈实现则更健壮。</p>
          <p>DFS的一个重要特性是它可以用来检测图中是否存在环。在遍历过程中，如果我们遇到一个已经访问过但尚未完成遍历的节点，那么图中存在环。</p>
          <p>与广度优先搜索(BFS)相比，DFS更适合于寻找路径存在性问题，而BFS更适合于寻找最短路径问题。</p>
        </div>
      </div>
    </div>
</template>