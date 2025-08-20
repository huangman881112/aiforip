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

// Bellman-Ford搜索可视化相关状态
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
const hasNegativeCycle = ref(false)
const distances = ref({})
const predecessors = ref({})

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

// 生成随机有向图(可能包含负权边)
const generateRandomGraph = (size) => {
  try {
    console.log('生成随机图 - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边 (包含权重)
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    });
    console.log('生成随机图 - 节点:', nodes);
    
    // 为每个节点添加边
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到1到3个其他节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      for (let j = 0; j < numEdges; j++) {
        // 随机选择一个其他节点
        let targetIndex = Math.floor(Math.random() * nodes.length);
        // 确保不连接到自身
        while (targetIndex === i) {
          targetIndex = Math.floor(Math.random() * nodes.length);
        }
        const targetNode = nodes[targetIndex];
        // 生成-5到10之间的随机权重
        const weight = Math.floor(Math.random() * 16) - 5;
        graph[node].push({ node: targetNode, weight });
      }
    }
    console.log('生成随机图 - 边:', graph);
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

// Bellman-Ford算法实现
const bellmanFordSearch = async () => {
  console.log('开始搜索按钮被点击');
  isButtonClicked.value = true;
  isSearching.value = true;
  searchStatus.value = '搜索中...'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  currentStep.value = 0;
  visitedNodes.value = [];
  path.value = [];
  found.value = false;
  hasNegativeCycle.value = false;
  searchSteps.value = [];
  currentStepDetails.value = '';
  distances.value = {};
  predecessors.value = {};

  const nodes = Object.keys(currentGraph.value);

  // 初始化距离和前驱节点
  nodes.forEach(node => {
    distances.value[node] = Infinity;
    predecessors.value[node] = null;
  });
  distances.value[startNode.value] = 0;

  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，从节点 ${startNode.value} 到节点 ${targetNode.value}` });

  currentStep.value++;
  const initDetails = `第 ${currentStep.value} 步: 初始化距离，${startNode.value} 到自身的距离为 0，到其他节点的距离为无穷大`;
  console.log(initDetails);
  searchSteps.value.push({ step: currentStep.value, type: 'init', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    // 进行V-1轮松弛
    for (let i = 1; i < nodes.length; i++) {
      currentStep.value++;
      const roundDetails = `第 ${currentStep.value} 步: 开始第 ${i} 轮松弛操作`;
      console.log(roundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'round', details: roundDetails });
      currentStepDetails.value = roundDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      let updated = false;

      // 遍历所有边
      for (const u of nodes) {
        for (const edge of currentGraph.value[u]) {
          const v = edge.node;
          const weight = edge.weight;

          if (distances.value[u] !== Infinity && distances.value[u] + weight < distances.value[v]) {
            distances.value[v] = distances.value[u] + weight;
            predecessors.value[v] = u;
            updated = true;

            currentStep.value++;
            const relaxDetails = `第 ${currentStep.value} 步: 松弛边 ${u} -> ${v} (权重: ${weight})，更新 ${v} 的距离为 ${distances.value[v]}`;
            console.log(relaxDetails);
            searchSteps.value.push({ step: currentStep.value, type: 'relax', details: relaxDetails });
            currentStepDetails.value = relaxDetails;
            await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
          }
        }
      }

      // 如果没有更新，可以提前结束
      if (!updated) {
        currentStep.value++;
        const earlyExitDetails = `第 ${currentStep.value} 步: 第 ${i} 轮松弛没有更新任何距离，可以提前结束`;
        console.log(earlyExitDetails);
        searchSteps.value.push({ step: currentStep.value, type: 'info', details: earlyExitDetails });
        currentStepDetails.value = earlyExitDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        break;
      }
    }

    // 检查是否存在负权环
    currentStep.value++;
    const checkCycleDetails = `第 ${currentStep.value} 步: 检查是否存在负权环`;
    console.log(checkCycleDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'check', details: checkCycleDetails });
    currentStepDetails.value = checkCycleDetails;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    let hasCycle = false;
    for (const u of nodes) {
      for (const edge of currentGraph.value[u]) {
        const v = edge.node;
        const weight = edge.weight;

        if (distances.value[u] !== Infinity && distances.value[u] + weight < distances.value[v]) {
          hasCycle = true;
          hasNegativeCycle.value = true;
          break;
        }
      }
      if (hasCycle) break;
    }

    if (hasCycle) {
      currentStep.value++;
      const cycleDetails = `第 ${currentStep.value} 步: 检测到负权环，无法找到最短路径`;
      console.log(cycleDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'error', details: cycleDetails });
      currentStepDetails.value = cycleDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    } else {
      // 重建路径
      if (distances.value[targetNode.value] !== Infinity) {
        found.value = true;
        const resultPath = [];
        let current = targetNode.value;
        while (current) {
          resultPath.unshift(current);
          current = predecessors.value[current];
        }
        path.value = resultPath;

        currentStep.value++;
        const foundDetails = `第 ${currentStep.value} 步: 找到目标节点 ${targetNode.value}，最短距离为 ${distances.value[targetNode.value]}`;
        console.log(foundDetails);
        searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails });
        currentStepDetails.value = foundDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

        currentStep.value++;
        const pathDetails = `第 ${currentStep.value} 步: 最短路径: [${path.value.join(' -> ')}]`;
        console.log(pathDetails);
        searchSteps.value.push({ step: currentStep.value, type: 'complete', details: pathDetails });
        currentStepDetails.value = pathDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      } else {
        currentStep.value++;
        const notFoundDetails = `第 ${currentStep.value} 步: 未找到从 ${startNode.value} 到 ${targetNode.value} 的路径`;
        console.log(notFoundDetails);
        searchSteps.value.push({ step: currentStep.value, type: 'error', details: notFoundDetails });
        currentStepDetails.value = notFoundDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      }
    }

    isSearching.value = false;
    if (hasCycle) {
      searchStatus.value = '找到负权环';
    } else if (found.value) {
      searchStatus.value = '搜索成功';
    } else {
      searchStatus.value = '搜索失败';
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

// 获取边的权重
const getEdgeWeight = (from, to) => {
  for (const edge of currentGraph.value[from]) {
    if (edge.node === to) {
      return edge.weight;
    }
  }
  return null;
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
    predecessors.value = {}
    
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
  <div class="bellman-ford-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>Bellman-Ford算法</h2>
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
          <p>Bellman-Ford算法是一种用于寻找带权图中单源最短路径的算法。它能够处理包含负权边的图，但不能处理包含负权环的图。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(V * E)</li>
                  <li><span>最好情况:</span> O(E) (当图是无环且在第一轮松弛后不再更新)</li>
                  <li><span>平均情况:</span> O(V * E)</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(V)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function BellmanFord(graph, start):
  // 初始化距离和前驱节点
  for each node v in graph:
    distance[v] = infinity
    predecessor[v] = null
  distance[start] = 0

  // 进行V-1轮松弛
  for i from 1 to V-1:
    for each edge (u, v) with weight w in graph:
      if distance[u] + w < distance[v]:
        distance[v] = distance[u] + w
        predecessor[v] = u

  // 检查负权环
  for each edge (u, v) with weight w in graph:
    if distance[u] + w < distance[v]:
      return "图中存在负权环"

  return distance, predecessor</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def bellman_ford(graph, start):
    # 初始化距离和前驱节点
    distance = {node: float('inf') for node in graph}
    predecessor = {node: None for node in graph}
    distance[start] = 0
    
    # 进行V-1轮松弛
    nodes = list(graph.keys())
    for _ in range(len(nodes) - 1):
        for u in nodes:
            for edge in graph[u]:
                v, w = edge['node'], edge['weight']
                if distance[u] != float('inf') and distance[u] + w < distance[v]:
                    distance[v] = distance[u] + w
                    predecessor[v] = u
    
    # 检查负权环
    for u in nodes:
        for edge in graph[u]:
            v, w = edge['node'], edge['weight']
            if distance[u] != float('inf') and distance[u] + w < distance[v]:
                return None, None, True  # 存在负权环
    
    return distance, predecessor, False

# 示例图
# graph = {
#     'A': [{'node': 'B', 'weight': 4}, {'node': 'C', 'weight': 2}],
#     'B': [{'node': 'C', 'weight': 5}, {'node': 'D', 'weight': 10}],
#     'C': [{'node': 'E', 'weight': 3}],
#     'D': [{'node': 'E', 'weight': 4}],
#     'E': []
# }
# distance, predecessor, has_negative_cycle = bellman_ford(graph, 'A')</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function bellmanFord(graph, start) {
    // 初始化距离和前驱节点
    const distance = {};
    const predecessor = {};
    for (const node in graph) {
        distance[node] = Infinity;
        predecessor[node] = null;
    }
    distance[start] = 0;
    
    // 进行V-1轮松弛
    const nodes = Object.keys(graph);
    for (let i = 0; i < nodes.length - 1; i++) {
        for (const u of nodes) {
            for (const edge of graph[u]) {
                const v = edge.node;
                const w = edge.weight;
                if (distance[u] !== Infinity && distance[u] + w < distance[v]) {
                    distance[v] = distance[u] + w;
                    predecessor[v] = u;
                }
            }
        }
    }
    
    // 检查负权环
    let hasNegativeCycle = false;
    for (const u of nodes) {
        for (const edge of graph[u]) {
            const v = edge.node;
            const w = edge.weight;
            if (distance[u] !== Infinity && distance[u] + w < distance[v]) {
                hasNegativeCycle = true;
                break;
            }
        }
        if (hasNegativeCycle) break;
    }
    
    return { distance, predecessor, hasNegativeCycle };
}

// 示例图
// const graph = {
//     'A': [{ node: 'B', weight: 4 }, { node: 'C', weight: 2 }],
//     'B': [{ node: 'C', weight: 5 }, { node: 'D', weight: 10 }],
//     'C': [{ node: 'E', weight: 3 }],
//     'D': [{ node: 'E', weight: 4 }],
//     'E': []
// };
// const result = bellmanFord(graph, 'A');</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>Bellman-Ford搜索可视化</h3>
        <p>Bellman-Ford算法用于寻找带权图中单源最短路径，能够处理包含负权边的图，但不能处理包含负权环的图。</p>
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
                    <!-- 权重标签 -->
                    <text
                      :x="(nodesPositions[node].x + nodesPositions[edge.node].x) / 2 + 25 + 10 * (nodesPositions[edge.node].y > nodesPositions[node].y ? 1 : -1)"
                      :y="(nodesPositions[node].y + nodesPositions[edge.node].y) / 2 + 25 + 10 * (nodesPositions[edge.node].x < nodesPositions[node].x ? 1 : -1)"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="edge-weight"
                      :fill="edge.weight < 0 ? 'red' : 'black'"
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
                      'visited': distances[node] !== Infinity && distances[node] !== undefined,
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
                  <text
                    v-if="distances[node] !== Infinity && distances[node] !== undefined"
                    :x="nodesPositions[node].x + 25"
                    :y="nodesPositions[node].y + 90"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="node-distance"
                  >
                    距离: {{ distances[node] }}
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
            <button @click="bellmanFordSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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
        <div class="markdown-content" style="text-align: left;">
          <h3>算法变种</h3>
          <p>Bellman-Ford算法有一些重要的变种：</p>
          <ol>
            <li><strong>SPFA算法</strong>（Shortest Path Faster Algorithm）：使用队列优化的Bellman-Ford算法，只处理可能更新距离的节点，平均时间复杂度更低。</li>
            <li><strong>改进的Bellman-Ford算法</strong>：当在某一轮松弛中没有节点的距离被更新时，可以提前结束算法。</li>
            <li><strong>双向Bellman-Ford算法</strong>：从起点和终点同时开始搜索，当两边相遇时找到路径，可以减少搜索空间。</li>
          </ol>

          <h3>应用场景</h3>
          <p>Bellman-Ford算法广泛应用于以下场景：</p>
          <ul>
            <li>寻找带权图中的单源最短路径，特别是当图中存在负权边时</li>
            <li>检测图中是否存在负权环</li>
            <li>路由算法，如RIP（Routing Information Protocol）</li>
            <li>网络流量分析</li>
            <li>航空路线规划</li>
          </ul>

          <h3>局限性</h3>
          <p>Bellman-Ford算法的主要局限性：</p>
          <ul>
            <li>时间复杂度较高，为O(V*E)，在稠密图中性能较差</li>
            <li>不能处理包含负权环的图</li>
            <li>对于没有负权边的图，Dijkstra算法通常更高效</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'learning'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>核心思想</h3>
          <p>Bellman-Ford算法的核心思想是通过松弛操作逐步逼近最短路径。它的基本步骤是：</p>
          <ol>
            <li>初始化起点到所有其他节点的距离为无穷大，起点到自身的距离为0</li>
            <li>进行V-1轮松弛操作，每轮遍历所有边，尝试更新节点的距离</li>
            <li>进行第V轮松弛，如果还能更新距离，说明图中存在负权环</li>
          </ol>

          <h3>与其他算法的对比</h3>
          <table border="1">
            <tr>
              <th>算法</th>
              <th>适用场景</th>
              <th>时间复杂度</th>
              <th>特点</th>
            </tr>
            <tr>
              <td>Bellman-Ford</td>
              <td>带权图（可含负权边）</td>
              <td>O(V*E)</td>
              <td>可检测负权环</td>
            </tr>
            <tr>
              <td>Dijkstra</td>
              <td>带权图（非负权边）</td>
              <td>O((V+E)logV)</td>
              <td>效率高，不能处理负权边</td>
            </tr>
            <tr>
              <td>Floyd-Warshall</td>
              <td>带权图（所有节点对）</td>
              <td>O(V³)</td>
              <td>可处理负权边，不能检测负权环</td>
            </tr>
          </table>

          <h3>实现注意事项</h3>
          <p>在实现Bellman-Ford算法时，需要注意以下几点：</p>
          <ul>
            <li>确保正确处理无穷大的表示和比较</li>
            <li>注意负权边的处理，特别是负权环的检测</li>
            <li>可以通过提前终止优化算法（当某一轮没有更新时）</li>
            <li>对于大型图，考虑使用SPFA等优化版本</li>
          </ul>
        </div>
      </div>
    </div>
</template>