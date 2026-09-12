<style scoped>
 .max-flow-edge { color: #1E88E5 !important; stroke-width: 3 !important; }
 .augmenting-path { stroke: #43A047 !important; stroke-width: 3 !important; stroke-dasharray: 5,5; }
 .edge-weight { font-size: 1.2em; font-weight: bold; fill: #666; }
 .max-flow-edge-weight { fill: #1E88E5 !important; font-size: 1.5em !important; font-weight: bold !important; }
</style>

<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// Edmonds-Karp算法可视化相关状态
// 图结构控制
const numNodes = ref(5)
const minNodes = ref(3)
const maxNodes = ref(10)
const minCapacity = ref(1)
const maxCapacity = ref(10)

// 错误信息
const errorMessage = ref('')

// 搜索步骤记录
const algorithmSteps = ref([])
const currentStepDetails = ref('')
const isRunning = ref(false)
const isButtonClicked = ref(false)
const algorithmStatus = ref('就绪')
const animationSpeed = ref(500)
const currentStep = ref(0)
const maxFlow = ref(0)
const processedEdges = ref(0)
const flowNetwork = ref({})
const residualGraph = ref({})
const augmentingPaths = ref([])
const sourceNode = ref('A')
const sinkNode = ref('E')

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

// 确保minCapacity始终是数字类型
watch(minCapacity, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue) || newValue < 1) {
    console.warn('[WARNING] 最小容量不是有效数字，已重置为默认值');
    minCapacity.value = 1;
  } else {
    // 确保minCapacity不大于maxCapacity
    if (newValue > maxCapacity.value) {
      minCapacity.value = maxCapacity.value - 1;
      console.warn('[WARNING] 最小容量大于最大容量，已调整');
    }
  }
})

// 确保maxCapacity始终是数字类型
watch(maxCapacity, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue) || newValue < 1) {
    console.warn('[WARNING] 最大容量不是有效数字，已重置为默认值');
    maxCapacity.value = 10;
  } else {
    // 确保maxCapacity不小于minCapacity
    if (newValue < minCapacity.value) {
      maxCapacity.value = minCapacity.value + 1;
      console.warn('[WARNING] 最大容量小于最小容量，已调整');
    }
  }
})

// 生成随机流网络
const generateRandomFlowNetwork = (size, minCapacity, maxCapacity) => {
  try {
    console.log('生成随机流网络 - 开始，size:', size, 'minCapacity:', minCapacity, 'maxCapacity:', maxCapacity);
    if (typeof size !== 'number' || size < 3) {
      throw new Error('无效的节点数量: 至少需要3个节点');
    }
    if (typeof minCapacity !== 'number' || minCapacity < 1) {
      throw new Error('无效的最小容量: ' + minCapacity);
    }
    if (typeof maxCapacity !== 'number' || maxCapacity < minCapacity) {
      throw new Error('无效的最大容量: ' + maxCapacity);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    sourceNode.value = nodes[0];
    sinkNode.value = nodes[nodes.length - 1];
    
    // 生成有向边
    const graph = {};
    const edges = [];
    nodes.forEach(node => {
      graph[node] = [];
    });
    console.log('生成随机流网络 - 节点:', nodes);
    
    // 确保源节点和汇节点有路径
    // 生成从源节点到汇节点的基本路径
    for (let i = 0; i < nodes.length - 1; i++) {
      const weight = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
      graph[nodes[i]].push({ node: nodes[i+1], capacity: weight, flow: 0 });
      edges.push({ from: nodes[i], to: nodes[i+1], capacity: weight, flow: 0 });
    }
    
    // 随机添加其他边
    const maxAdditionalEdges = size * (size - 1); // 最大可能的边数
    const numAdditionalEdges = Math.floor(Math.random() * maxAdditionalEdges);
    for (let i = 0; i < numAdditionalEdges; i++) {
      const fromIndex = Math.floor(Math.random() * size);
      const toIndex = Math.floor(Math.random() * size);
      if (fromIndex !== toIndex && Math.abs(fromIndex - toIndex) > 1) { // 避免自环和已有的连续边
        const from = nodes[fromIndex];
        const to = nodes[toIndex];
        // 检查边是否已存在
        const edgeExists = graph[from].some(e => e.node === to);
        if (!edgeExists) {
          const capacity = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
          graph[from].push({ node: to, capacity, flow: 0 });
          edges.push({ from, to, capacity, flow: 0 });
        }
      }
    }
    
    console.log('生成随机流网络 - 边:', graph);
    console.log('生成随机流网络 - 边列表:', edges);
    return { graph, edges };
  } catch (error) {
    console.error('生成随机流网络失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟图数据
const graphData = ref(generateRandomFlowNetwork(numNodes.value, minCapacity.value, maxCapacity.value))
const currentGraph = ref({...graphData.value.graph})
const currentEdges = ref([...graphData.value.edges])
const nodesPositions = ref({})

// 生成节点位置 - 优化版
// 使用力导向布局算法，使节点分布更加均匀美观
const generateNodesPositions = () => {
  const positions = {};
  const nodes = Object.keys(currentGraph.value);
  const numNodes = nodes.length;
  
  console.log('生成节点位置 - 开始，nodes:', nodes);
  
  // 使用圆形布局，使节点均匀分布在一个圆上
  const centerX = 400;
  const centerY = 300;
  const radius = Math.min(300, 200 + numNodes * 5); // 根据节点数量调整半径
  
  // 源节点和汇节点特殊处理
  // 源节点放在左边
  positions[nodes[0]] = {
    x: centerX - 300 - 25,
    y: centerY - 25
  };
  
  // 汇节点放在右边
  positions[nodes[numNodes - 1]] = {
    x: centerX + 300 - 25,
    y: centerY - 25
  };
  
  // 其他节点均匀分布在中间的圆上
  const otherNodes = nodes.slice(1, numNodes - 1);
  const numOtherNodes = otherNodes.length;
  
  otherNodes.forEach((node, index) => {
    const angle = (index / numOtherNodes) * Math.PI * 2; // 0 到 360度
    const x = centerX + radius * Math.cos(angle) - 25;
    const y = centerY + radius * Math.sin(angle) - 25;
    positions[node] = { x, y };
  });
  
  console.log('生成节点位置 - 完成，positions:', positions);
  return positions;
}

// 生成新图
const generateNewGraph = async () => {
  isButtonClicked.value = true;
  setTimeout(() => { isButtonClicked.value = false; }, 300);

  try {
    errorMessage.value = ''; // 清除之前的错误
    resetAlgorithm();
    const newGraphData = generateRandomFlowNetwork(numNodes.value, minCapacity.value, maxCapacity.value);
    console.log('[DEBUG] 生成的新图:', newGraphData);

    // 更新图
    graphData.value = newGraphData;
    currentGraph.value = {...graphData.value.graph};
    currentEdges.value = [...graphData.value.edges];
    console.log('[DEBUG] 图已更新:', currentGraph.value);

    // 初始化流网络
    flowNetwork.value = {};
    Object.keys(currentGraph.value).forEach(node => {
      flowNetwork.value[node] = [...currentGraph.value[node]];
    });
    
    // 生成残量网络
    updateResidualGraph();

    // 生成节点位置
    nodesPositions.value = generateNodesPositions();
    console.log('[DEBUG] 生成新图 - 完成');
  } catch (error) {
    console.error('[ERROR] 生成新图失败:', error);
    errorMessage.value = `生成新图失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
  }
}

// 更新残量网络
const updateResidualGraph = () => {
  residualGraph.value = {};
  Object.keys(flowNetwork.value).forEach(node => {
    residualGraph.value[node] = [];
    // 正向边
    flowNetwork.value[node].forEach(edge => {
      if (edge.flow < edge.capacity) {
        residualGraph.value[node].push({
          node: edge.node,
          capacity: edge.capacity - edge.flow,
          type: 'forward',
          originalEdge: edge
        });
      }
      // 反向边
      residualGraph.value[edge.node] = residualGraph.value[edge.node] || [];
      residualGraph.value[edge.node].push({
        node: node,
        capacity: edge.flow,
        type: 'backward',
        originalEdge: edge
      });
    });
  });
};

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
  return {
    edgePath: `M ${startX} ${startY} L ${adjustedEndX} ${adjustedEndY}`,
    arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`
  };
};

// 检查边是否是增广路径的一部分
const isAugmentingPathEdge = (from, to) => {
  return augmentingPaths.value.some(path => {
    for (let i = 0; i < path.length - 1; i++) {
      if (path[i] === from && path[i+1] === to) {
        return true;
      }
    }
    return false;
  });
};

// BFS寻找增广路径 - 优化版
// 添加了可视化支持和性能优化
const findAugmentingPath = async () => {
  // 清除之前的BFS状态
  bfsVisitedNodes.value = [];
  bfsQueue.value = [];
  bfsStep.value = 0;

  const visited = {};
  const parent = {};
  const queue = [sourceNode.value];
  visited[sourceNode.value] = true;
  bfsVisitedNodes.value.push(sourceNode.value);
  bfsQueue.value.push(sourceNode.value);

  while (queue.length > 0) {
    bfsStep.value++;
    const current = queue.shift();
    bfsQueue.value.shift();
    currentBFSNode.value = current;

    if (current === sinkNode.value) {
      // 找到增广路径
      const path = [];
      let node = sinkNode.value;
      while (node) {
        path.unshift(node);
        node = parent[node];
      }
      currentBFSNode.value = null;
      return path;
    }

    if (residualGraph.value[current]) {
      // 按容量降序排序边，优先探索容量大的边
      const sortedEdges = [...residualGraph.value[current]].sort((a, b) => b.capacity - a.capacity);
      for (const edge of sortedEdges) {
        if (edge.capacity > 0 && !visited[edge.node]) {
          visited[edge.node] = true;
          parent[edge.node] = current;
          queue.push(edge.node);
          bfsQueue.value.push(edge.node);
          bfsVisitedNodes.value.push(edge.node);
          // 添加短暂延迟以可视化BFS过程
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
  }

  currentBFSNode.value = null;
  return null; // 没有找到增广路径
};

// BFS可视化相关状态
const bfsVisitedNodes = ref([]);
const bfsQueue = ref([]);
const bfsStep = ref(0);
const currentBFSNode = ref(null);

// Edmonds-Karp算法实现
const runAlgorithm = async () => {
  console.log('开始算法按钮被点击');
  isButtonClicked.value = true;
  isRunning.value = true;
  algorithmStatus.value = '执行中'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  currentStep.value = 0;
  maxFlow.value = 0;
  processedEdges.value = 0;
  algorithmSteps.value = [];
  currentStepDetails.value = '';
  augmentingPaths.value = [];

  // 初始化流网络
  flowNetwork.value = {};
  Object.keys(currentGraph.value).forEach(node => {
    flowNetwork.value[node] = [...currentGraph.value[node]];
  });

  // 生成残量网络
  updateResidualGraph();

  algorithmSteps.value.push({ step: 0, type: 'info', details: `Edmonds-Karp算法开始，计算从节点 ${sourceNode.value} 到节点 ${sinkNode.value} 的最大流` });

  try {
    let augmentingPath = await findAugmentingPath();
    while (augmentingPath) {
      currentStep.value++;
      const pathDetails = `第 ${currentStep.value} 步: 找到增广路径: ${augmentingPath.join(' -> ')}`;
      console.log(pathDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: pathDetails });
      currentStepDetails.value = pathDetails;
      augmentingPaths.value.push(augmentingPath);
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 计算路径上的最小残量容量
      let minResidualCapacity = Infinity;
      for (let i = 0; i < augmentingPath.length - 1; i++) {
        const from = augmentingPath[i];
        const to = augmentingPath[i+1];
        
        // 找到对应的边
        const edge = residualGraph.value[from].find(e => e.node === to);
        if (edge && edge.capacity < minResidualCapacity) {
          minResidualCapacity = edge.capacity;
        }
      }

      currentStep.value++;
      const minCapacityDetails = `第 ${currentStep.value} 步: 路径上的最小残量容量为: ${minResidualCapacity}`;
      console.log(minCapacityDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: minCapacityDetails });
      currentStepDetails.value = minCapacityDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 更新路径上的流
      for (let i = 0; i < augmentingPath.length - 1; i++) {
        const from = augmentingPath[i];
        const to = augmentingPath[i+1];
        
        // 找到对应的边
        const edge = residualGraph.value[from].find(e => e.node === to);
        if (edge) {
          if (edge.type === 'forward') {
            // 正向边，增加流
            edge.originalEdge.flow += minResidualCapacity;
          } else if (edge.type === 'backward') {
            // 反向边，减少流
            edge.originalEdge.flow -= minResidualCapacity;
          }
          processedEdges.value++;
        }
      }

      currentStep.value++;
      const updateDetails = `第 ${currentStep.value} 步: 沿路径增加 ${minResidualCapacity} 单位流量`;
      console.log(updateDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'add', details: updateDetails });
      currentStepDetails.value = updateDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 更新最大流
      maxFlow.value += minResidualCapacity;

      // 更新残量网络
      updateResidualGraph();

      // 清除当前增广路径，准备下一次迭代
      augmentingPaths.value = [];

      // 寻找下一条增广路径
      augmentingPath = await findAugmentingPath();
    }

    isRunning.value = false;
    algorithmStatus.value = '算法完成';
    currentStep.value++;
    const finalDetails = `第 ${currentStep.value} 步: 最大流计算完成，最大流量为: ${maxFlow.value}`;
    console.log(finalDetails);
    algorithmSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
    currentStepDetails.value = finalDetails;
  } catch (error) {
    console.error('[ERROR] 算法执行失败:', error);
    isRunning.value = false;
    algorithmStatus.value = '算法失败';
    errorMessage.value = `算法执行失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    algorithmSteps.value.push({ step: currentStep.value + 1, type: 'error', details: errorMessage.value });
  }
}

// 重置算法
const resetAlgorithm = () => {
  try {
    isRunning.value = false;
    
    // 重置算法状态
    algorithmStatus.value = '就绪';
    currentStep.value = 0;
    maxFlow.value = 0;
    processedEdges.value = 0;
    algorithmSteps.value = [];
    currentStepDetails.value = '';
    errorMessage.value = '';
    augmentingPaths.value = [];
    
    // 重新复制原始图
    currentGraph.value = {...graphData.value.graph};
    currentEdges.value = [...graphData.value.edges];
    
    // 重置流网络
    flowNetwork.value = {};
    Object.keys(currentGraph.value).forEach(node => {
      flowNetwork.value[node] = [...currentGraph.value[node]];
    });
    
    // 更新残量网络
    updateResidualGraph();
    console.log('[DEBUG] 重置算法 - 图已重置:', currentGraph.value);
  } catch (error) {
    console.error('[ERROR] 重置算法失败:', error);
    throw error;
  }
}

// 组件挂载时生成节点位置和初始化网络
onMounted(() => {
  nodesPositions.value = generateNodesPositions();
  
  // 初始化流网络
  flowNetwork.value = {};
  Object.keys(currentGraph.value).forEach(node => {
    flowNetwork.value[node] = [...currentGraph.value[node]];
  });
  
  // 生成残量网络
  updateResidualGraph();
});
</script>

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="edmonds-karp-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>埃德蒙兹-卡普算法(Edmonds-Karp)</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
        <h3>Edmonds-Karp算法可视化</h3>
        <p>Edmonds-Karp算法是Ford-Fulkerson算法的一个特例，它使用广度优先搜索来寻找增广路径，从而计算网络中的最大流。</p>
      <div class="visualization-container">
        <div class="stats-container">
          <div class="stat-item">
            <span class="stat-label">算法状态:</span>
            <span class="stat-value">{{ algorithmStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">当前步骤:</span>
            <span class="stat-value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">最大流量:</span>
            <span class="stat-value max-flow-value">{{ maxFlow }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已处理边数:</span>
            <span class="stat-value">{{ processedEdges }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">源节点:</span>
            <span class="stat-value">{{ sourceNode }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">汇节点:</span>
            <span class="stat-value">{{ sinkNode }}</span>
          </div>
        </div>

        <div class="graph-container">
          <div class="graph-left">
            <!-- SVG容器：边和节点 -->
            <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
              <!-- 边 -->
              <template v-for="(neighbors, node) in flowNetwork" :key="node + '-edges'">
                <template v-for="edge in neighbors" :key="node + '-' + edge.node">
                  <template v-if="nodesPositions[node] && nodesPositions[edge.node]">
                    <!-- 边路径 -->
                    <path
                      :d="getEdgePath(nodesPositions[node], nodesPositions[edge.node]).edgePath"
                      :stroke="edge.flow > 0 ? '#1E88E5' : '#666'"
                      :stroke-width="edge.flow > 0 ? 3 : 2"
                      fill="none"
                      :class="{ 'max-flow-edge': edge.flow > 0, 'augmenting-path': isAugmentingPathEdge(node, edge.node) }"
                    />
                    <!-- 箭头 -->
                    <path
                      :d="getEdgePath(nodesPositions[node], nodesPositions[edge.node]).arrowPath"
                      :stroke="edge.flow > 0 ? '#1E88E5' : '#666'"
                      stroke-width="2"
                      fill="none"
                    />
                    <!-- 边容量和流量 -->
                    <text
                      :x="(nodesPositions[node].x + nodesPositions[edge.node].x) / 2"
                      :y="(nodesPositions[node].y + nodesPositions[edge.node].y) / 2 - 10"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      :class="{'edge-weight': true, 'max-flow-edge-weight': edge.flow > 0}"
                    >
                      {{ edge.flow }}/{{ edge.capacity }}
                    </text>
                  </template>
                </template>
              </template>

              <!-- 节点 (绘制在边上方) -->
              <template v-for="node in Object.keys(flowNetwork)" :key="node">
                <g v-if="nodesPositions[node]">
                  <!-- 节点光晕效果 - 用于BFS可视化 -->
                  <circle
                    :cx="nodesPositions[node].x + 25"
                    :cy="nodesPositions[node].y + 25"
                    :r="bfsVisitedNodes.includes(node) ? 35 : 25"
                    :fill="bfsVisitedNodes.includes(node) ? 'rgba(255, 193, 7, 0.3)' : 'transparent'"
                    v-if="bfsVisitedNodes.length > 0"
                  />
                  <!-- 节点 -->
                  <circle
                    :cx="nodesPositions[node].x + 25"
                    :cy="nodesPositions[node].y + 25"
                    r="25"
                    class="node"
                    :fill="node === sourceNode ? '#43A047' : (node === sinkNode ? '#E53935' : (currentBFSNode === node ? '#FF9800' : '#2196F3'))"
                    :stroke="bfsQueue.includes(node) ? '#FFD700' : 'none'"
                    :stroke-width="bfsQueue.includes(node) ? 3 : 0"
                  />
                  <!-- 节点标签 -->
                  <text
                    :x="nodesPositions[node].x + 25"
                    :y="nodesPositions[node].y + 25"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="node-text"
                    fill="white"
                  >
                    {{ node }}
                  </text>
                  <!-- BFS访问顺序编号 -->
                  <text
                    :x="nodesPositions[node].x + 45"
                    :y="nodesPositions[node].y + 15"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    fill="#FF5722"
                    font-weight="bold"
                    v-if="bfsVisitedNodes.includes(node)"
                  >
                    {{ bfsVisitedNodes.indexOf(node) + 1 }}
                  </text>
                </g>
              </template>
              <!-- BFS信息显示 -->
              <g v-if="bfsStep > 0">
                <text x="10" y="30" fill="#e9eff8" font-size="16" font-weight="bold">BFS步骤: {{ bfsStep }}</text>
                <text x="10" y="55" fill="#e9eff8" font-size="14">当前节点: {{ currentBFSNode || '无' }}</text>
                <text x="10" y="80" fill="#e9eff8" font-size="14">队列: {{ bfsQueue.join(', ') }}</text>
              </g>
            </svg>
          </div>
          <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
              <div class="graph-info">
                <h4>流网络信息</h4>
                <div v-for="(neighbors, node) in flowNetwork" :key="node" class="graph-node-info" style="text-align: left;">
                  <p>{{ node }}: {{ neighbors.map(n => `${n.node}(${n.flow}/${n.capacity})`).join(', ') }}</p>
                </div>
              </div>
          </div>
        </div>

        <div class="slider-controls">
          <div class="slider-group">
            <label>节点数量: {{ numNodes }}</label>
            <input type="text" :min="minNodes" :max="maxNodes" v-model.number="numNodes" :disabled="isRunning" @input="numNodes = Number($event.target.value)" class="short-input">
            <span class="range-info">({{ minNodes }}-{{ maxNodes }})</span>
          </div>
          <div class="slider-group">
            <label>边容量范围: {{ minCapacity }}-{{ maxCapacity }}</label>
            <input type="range" min="1" max="20" v-model.number="minCapacity" :disabled="isRunning">
            <input type="range" min="1" max="20" v-model.number="maxCapacity" :disabled="isRunning">
          </div>
          <div class="slider-group">
            <label>动画速度:</label>
            <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isRunning">
          </div>
        </div>

        <div class="button-group">
          <button @click="generateNewGraph" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">生成新图</button>
          <button @click="runAlgorithm" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">运行算法</button>
          <button @click="resetAlgorithm" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">重置算法</button>
        </div>

        <div class="error-message" v-if="errorMessage">
          <p>{{ errorMessage }}</p>
        </div>

        <div class="step-details">
          <h4>当前步骤详情</h4>
          <p>{{ currentStepDetails }}</p>
        </div>

        <div class="steps-history">
          <h4>算法步骤历史</h4>
          <div class="steps-container">
            <div v-for="step in algorithmSteps" :key="step.step" :class="'step-item ' + step.type">
              <span class="step-number">{{ step.step }}.</span>
              <span class="step-details">{{ step.details }}</span>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </div>
</template>