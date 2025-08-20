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

// Floyd-Warshall搜索可视化相关状态
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
const distances = ref({})
const hasNegativeCycle = ref(false)

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

// 生成随机有向图
const generateRandomGraph = (size) => {
  try {
    console.log('生成随机图 - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 初始化邻接矩阵
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    });
    
    // 为每个节点添加随机边
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到0到3个其他节点
      const numEdges = Math.floor(Math.random() * 4);
      for (let j = 0; j < numEdges; j++) {
        // 随机选择一个不同于当前节点的目标节点
        let targetIndex = Math.floor(Math.random() * nodes.length);
        while (targetIndex === i) {
          targetIndex = Math.floor(Math.random() * nodes.length);
        }
        const targetNode = nodes[targetIndex];
        // 随机权重 (-10到10之间)
        const weight = Math.floor(Math.random() * 21) - 10;
        // 避免重复边
        if (!graph[node].some(edge => edge.node === targetNode)) {
          graph[node].push({ node: targetNode, weight });
        }
      }
    }
    
    console.log('生成随机图 - 完成，结果:', graph);
    return graph;
  } catch (error) {
    console.error('生成随机图失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟图数据
const graph = ref(generateRandomGraph(numNodes.value))
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
    console.log('[DEBUG] 开始生成随机图');
    const newGraph = generateRandomGraph(numNodes.value);
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
  return {
    edgePath: `M ${startX} ${startY} L ${adjustedEndX} ${adjustedEndY}`,
    arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`
  };
};

// 获取边的权重
const getEdgeWeight = (from, to) => {
  const edges = currentGraph.value[from] || [];
  for (const edge of edges) {
    if (edge.node === to) {
      return edge.weight;
    }
  }
  return Infinity; // 无边
};

// Floyd-Warshall算法实现
const floydWarshallSearch = async () => {
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
  hasNegativeCycle.value = false
  searchSteps.value = []
  currentStepDetails.value = ''
  distances.value = {}
  console.log('搜索开始前的图:', currentGraph.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，计算所有节点对之间的最短路径` })

  // 获取所有节点
  const nodes = Object.keys(currentGraph.value);
  visitedNodes.value = [...nodes];

  // 初始化距离矩阵
  const dist = {};
  nodes.forEach(i => {
    dist[i] = {};
    nodes.forEach(j => {
      if (i === j) {
        dist[i][j] = 0;
      } else {
        dist[i][j] = getEdgeWeight(i, j);
      }
    });
  });

  distances.value = JSON.parse(JSON.stringify(dist));

  currentStep.value++;
  const stepDetails = `第 ${currentStep.value} 步: 初始化距离矩阵`;
  console.log(stepDetails);
  searchSteps.value.push({ step: currentStep.value, type: 'init', details: stepDetails });
  currentStepDetails.value = stepDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    // Floyd-Warshall主算法
    for (const k of nodes) {
      currentStep.value++;
      const kDetails = `第 ${currentStep.value} 步: 以节点 ${k} 作为中间节点`;
      console.log(kDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'info', details: kDetails });
      currentStepDetails.value = kDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      for (const i of nodes) {
        for (const j of nodes) {
          if (dist[i][k] + dist[k][j] < dist[i][j]) {
            dist[i][j] = dist[i][k] + dist[k][j];
            distances.value = JSON.parse(JSON.stringify(dist));

            currentStep.value++;
            const updateDetails = `第 ${currentStep.value} 步: 更新距离 ${i} -> ${j}: ${dist[i][j]}`;
            console.log(updateDetails);
            searchSteps.value.push({ step: currentStep.value, type: 'update', details: updateDetails });
            currentStepDetails.value = updateDetails;
            await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
          }
        }
      }
    }

    // 检查负权环
    for (const i of nodes) {
      if (dist[i][i] < 0) {
        hasNegativeCycle.value = true;
        break;
      }
    }

    isSearching.value = false;
    if (hasNegativeCycle.value) {
      searchStatus.value = '搜索完成，存在负权环';
      currentStep.value++;
      const cycleDetails = `第 ${currentStep.value} 步: 检测到负权环，无法确定最短路径`;
      console.log(cycleDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'warning', details: cycleDetails });
      currentStepDetails.value = cycleDetails;
    } else {
      searchStatus.value = '搜索成功';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，已计算所有节点对之间的最短路径`;
      console.log(finalDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
      currentStepDetails.value = finalDetails;

      // 查找从startNode到targetNode的路径
      if (dist[startNode.value][targetNode.value] !== Infinity) {
        found.value = true;
        // 这里简化处理，仅显示距离，完整实现需要记录路径
        path.value = [startNode.value, targetNode.value];
      }
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
  // 简化版：仅检查直接连接
  return path.value.length >= 2 && path.value[0] === from && path.value[1] === to;
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
    hasNegativeCycle.value = false
    searchSteps.value = []
    currentStepDetails.value = ''
    distances.value = {}
    
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

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="floyd-warshall-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>Floyd-Warshall算法</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'learning' }" @click="activeTab = 'learning'">学习</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>Floyd-Warshall算法是一种用于寻找加权图中所有节点对之间最短路径的动态规划算法。它能够处理包含负权边的图，但不能处理包含负权环的图。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(V³)</li>
                  <li><span>最好情况:</span> O(V³)</li>
                  <li><span>平均情况:</span> O(V³)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(V²)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function FloydWarshall(graph):
  V = 图中节点数量
  dist = V×V的矩阵
  
  // 初始化距离矩阵
  for i from 0 to V-1:
    for j from 0 to V-1:
      if i == j:
        dist[i][j] = 0
      else:
        dist[i][j] = 图中i到j的直接边权重，如果没有边则为无穷大
  
  // Floyd-Warshall主算法
  for k from 0 to V-1:
    for i from 0 to V-1:
      for j from 0 to V-1:
        if dist[i][k] + dist[k][j] < dist[i][j]:
          dist[i][j] = dist[i][k] + dist[k][j]
  
  // 检查负权环
  for i from 0 to V-1:
    if dist[i][i] < 0:
      return "图中存在负权环"
  
  return dist</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def floyd_warshall(graph):
    # 节点列表
    nodes = list(graph.keys())
    n = len(nodes)
    
    # 创建节点到索引的映射
    node_to_idx = {node: i for i, node in enumerate(nodes)}
    
    # 初始化距离矩阵
    INF = float('inf')
    dist = [[INF] * n for _ in range(n)]
    
    # 对角线元素设为0
    for i in range(n):
        dist[i][i] = 0
    
    # 填充直接边的权重
    for u in graph:
        for edge in graph[u]:
            v, w = edge['node'], edge['weight']
            dist[node_to_idx[u]][node_to_idx[v]] = w
    
    # Floyd-Warshall算法主循环
    for k in range(n):
        for i in range(n):
            for j in range(n):
                if dist[i][k] + dist[k][j] < dist[i][j]:
                    dist[i][j] = dist[i][k] + dist[k][j]
    
    # 检查负权环
    for i in range(n):
        if dist[i][i] < 0:
            return None, True  # 存在负权环
    
    # 转换回节点标签
    result = {}
    for i in range(n):
        result[nodes[i]] = {}
        for j in range(n):
            result[nodes[i]][nodes[j]] = dist[i][j]
    
    return result, False

# 示例图
# graph = {
#     'A': [{'node': 'B', 'weight': 4}, {'node': 'C', 'weight': 2}],
#     'B': [{'node': 'C', 'weight': 5}, {'node': 'D', 'weight': 10}],
#     'C': [{'node': 'E', 'weight': 3}],
#     'D': [{'node': 'E', 'weight': 4}],
#     'E': []
# }
# distances, has_negative_cycle = floyd_warshall(graph)</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function floydWarshall(graph) {
    // 节点列表
    const nodes = Object.keys(graph);
    const n = nodes.length;
    
    // 创建节点到索引的映射
    const nodeToIdx = {};
    nodes.forEach((node, idx) => {
        nodeToIdx[node] = idx;
    });
    
    // 初始化距离矩阵
    const INF = Infinity;
    const dist = Array(n).fill().map(() => Array(n).fill(INF));
    
    // 对角线元素设为0
    for (let i = 0; i < n; i++) {
        dist[i][i] = 0;
    }
    
    // 填充直接边的权重
    for (const u in graph) {
        for (const edge of graph[u]) {
            const v = edge.node;
            const w = edge.weight;
            dist[nodeToIdx[u]][nodeToIdx[v]] = w;
        }
    }
    
    // Floyd-Warshall算法主循环
    for (let k = 0; k < n; k++) {
        for (let i = 0; i < n; i++) {
            for (let j = 0; j < n; j++) {
                if (dist[i][k] !== INF && dist[k][j] !== INF && dist[i][k] + dist[k][j] < dist[i][j]) {
                    dist[i][j] = dist[i][k] + dist[k][j];
                }
            }
        }
    }
    
    // 检查负权环
    let hasNegativeCycle = false;
    for (let i = 0; i < n; i++) {
        if (dist[i][i] < 0) {
            hasNegativeCycle = true;
            break;
        }
    }
    
    // 转换回节点标签
    const result = {};
    nodes.forEach((u, i) => {
        result[u] = {};
        nodes.forEach((v, j) => {
            result[u][v] = dist[i][j];
        });
    });
    
    return { distances: result, hasNegativeCycle };
}

// 示例图
// const graph = {
//     'A': [{ node: 'B', weight: 4 }, { node: 'C', weight: 2 }],
//     'B': [{ node: 'C', weight: 5 }, { node: 'D', weight: 10 }],
//     'C': [{ node: 'E', weight: 3 }],
//     'D': [{ node: 'E', weight: 4 }],
//     'E': []
// };
// const result = floydWarshall(graph);</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>Floyd-Warshall搜索可视化</h3>
        <p>Floyd-Warshall算法用于寻找加权图中所有节点对之间的最短路径，能够处理包含负权边的图，但不能处理包含负权环的图。</p>
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
          <div class="stat-item">
            <span class="stat-label">负权环检测:</span>
            <span class="stat-value">{{ hasNegativeCycle ? '存在' : '不存在' }}</span>
          </div>
        </div>

        <div class="graph-container">
          <div class="graph-left">
            <!-- 合并后的SVG容器：边和节点 -->
            <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
              <!-- 边 -->
              <template v-for="(neighbors, node) in currentGraph" :key="node + '-edges'">
                <template v-for="edge in neighbors" :key="node + '-' + edge.node">
                  <template v-if="nodesPositions[node] && nodesPositions[edge.node]">
                    <!-- 边路径 -->
                    <path
                      :d="getEdgePath(nodesPositions[node], nodesPositions[edge.node]).edgePath"
                      stroke="#666"
                      stroke-width="2"
                      fill="none"
                      :class="{ 'path-highlight': isPathEdge(node, edge.node) }"
                    />
                    <!-- 箭头路径 -->
                    <path
                      :d="getEdgePath(nodesPositions[node], nodesPositions[edge.node]).arrowPath"
                      stroke="#ff0000"
                      stroke-width="2"
                      fill="none"
                    />
                    <!-- 边权重标签 -->
                    <text
                      :x="(nodesPositions[node].x + nodesPositions[edge.node].x) / 2 + 35"
                      :y="(nodesPositions[node].y + nodesPositions[edge.node].y) / 2 + 25"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      fill="#333"
                      font-size="12"
                    >
                      {{ edge.weight }}
                    </text>
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
                      'current': path.includes(node),
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
                  <p>{{ node }}: {{ neighbors.map(edge => `${edge.node}(${edge.weight})`).join(', ') }}</p>
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
            <button @click="floydWarshallSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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

      <div v-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>算法变种</h3>
          <p>Floyd-Warshall算法有一些重要的变种和扩展：</p>
          <ol>
            <li><strong>Johnson算法</strong>：结合了Bellman-Ford和Dijkstra算法的思想，用于稀疏图上的所有节点对最短路径问题，时间复杂度为O(VE + V²logV)。</li>
            <li><strong>扩展Floyd-Warshall</strong>：可以用于寻找最长路径，但只适用于有向无环图(DAG)。</li>
            <li><strong>传递闭包算法</strong>：基于Floyd-Warshall的思想，用于判断图中任意两个节点之间是否可达。</li>
          </ol>

          <h3>应用场景</h3>
          <p>Floyd-Warshall算法广泛应用于以下场景：</p>
          <ul>
            <li>网络路由算法</li>
            <li>交通网络规划</li>
            <li>游戏开发中的寻路算法</li>
            <li>机器人路径规划</li>
            <li>电路设计</li>
            <li>物流优化</li>
            <li>地图服务中的路径计算</li>
          </ul>

          <h3>局限性</h3>
          <p>Floyd-Warshall算法的主要局限性：</p>
          <ul>
            <li>时间复杂度为O(V³)，对于大规模图效率较低</li>
            <li>不能处理包含负权环的图</li>
            <li>空间复杂度为O(V²)，需要存储所有节点对之间的距离</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'learning'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          <p>Floyd-Warshall算法是一种基于动态规划的全源最短路径算法，它的核心思想是通过逐步引入中间节点来优化任意两点之间的最短路径估计。</p>
          <p>与Dijkstra算法不同，Floyd-Warshall算法可以处理包含负权边的图，但不能处理包含负权环的图。</p>
          <p>Floyd-Warshall算法的关键在于状态转移方程：dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j])，表示从i到j的最短路径要么是当前已知的直接路径，要么是通过中间节点k的路径。</p>
          <p>算法的时间复杂度为O(V³)，这使得它在节点数量较多的图上效率较低，但对于中等规模的图来说，实现简单且易于理解。</p>
          <p>在实际应用中，如果图是稀疏的（边数远少于V²），通常会选择其他更高效的算法，如Johnson算法。</p>
          <p>检测负权环是Floyd-Warshall算法的一个重要应用，通过检查对角线元素是否为负来判断图中是否存在负权环。</p>
        </div>
      </div>
     </div>
 </div>
</template>