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

// Dijkstra搜索可视化相关状态
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

// 生成随机有向加权图
const generateRandomWeightedGraph = (size) => {
  try {
    console.log('生成随机加权图 - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边和权重 (确保是DAG)
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    });
    console.log('生成随机加权图 - 节点:', nodes);
    // 为每个节点添加指向后面节点的边 (确保无环)
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到后面的1到3个节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      for (let j = 1; j <= numEdges && i + j < nodes.length; j++) {
        const weight = Math.floor(Math.random() * 10) + 1; // 1-10的随机权重
        graph[node].push({ node: nodes[i + j], weight });
      }
    }
    console.log('生成随机加权图 - 边:', graph);

    // 随机添加一些反向边，但确保仍然是DAG
    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      // 50%的概率添加反向边
      if (Math.random() > 0.5) {
        const numBackEdges = Math.floor(Math.random() * 2) + 1;
        for (let j = 1; j <= numBackEdges && i - j >= 0; j++) {
          const backNode = nodes[i - j];
          const weight = Math.floor(Math.random() * 10) + 1;
          console.log('生成随机加权图 - 尝试添加反向边:', node, '->', backNode);
          // 确保backNode存在于graph中，并检查是否已有边
          if (graph[backNode]) {
            graph[node].push({ node: backNode, weight });
          }
        }
      }
    }
    
    console.log('生成随机加权图 - 完成，结果:', graph);
    return graph;
  } catch (error) {
    console.error('生成随机加权图失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟图数据
const graph = ref(generateRandomWeightedGraph(numNodes.value))
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
    console.log('[DEBUG] 开始生成随机加权图');
    const newGraph = generateRandomWeightedGraph(numNodes.value);
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
    arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`,
    weightPosition: `M ${(startX + adjustedEndX) / 2 + 10} ${(startY + adjustedEndY) / 2 - 10}`
  };
};

// Dijkstra算法实现
const dijkstraSearch = async () => {
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
  distances.value = {}
  predecessors.value = {}
  console.log('搜索开始前的图:', currentGraph.value);
  searchSteps.value.push({ step: 0, type: 'info', details: `搜索开始，从节点 ${startNode.value} 到节点 ${targetNode.value}` })

  // Dijkstra算法实现
  const nodes = Object.keys(currentGraph.value);

  // 初始化距离和前驱节点
  nodes.forEach(node => {
    distances.value[node] = Infinity;
    predecessors.value[node] = null;
  });
  distances.value[startNode.value] = 0;
  visitedNodes.value = [];

  currentStep.value++;
  const initDetails = `第 ${currentStep.value} 步: 初始化距离，${startNode.value} 距离为0，其他节点为无穷大`;
  console.log(initDetails);
  searchSteps.value.push({ step: currentStep.value, type: 'visit', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    while (visitedNodes.value.length < nodes.length) {
      // 找到未访问节点中距离最小的节点
      let minDistance = Infinity;
      let currentNode = null;

      nodes.forEach(node => {
        if (!visitedNodes.value.includes(node) && distances.value[node] < minDistance) {
          minDistance = distances.value[node];
          currentNode = node;
        }
      });

      if (currentNode === null) break; // 所有节点都不可达

      // 标记当前节点为已访问
      visitedNodes.value.push(currentNode);

      currentStep.value++;
      const visitDetails = `第 ${currentStep.value} 步: 访问节点 ${currentNode}，距离为 ${minDistance}`;
      console.log(visitDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'visit', details: visitDetails });
      currentStepDetails.value = visitDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 如果找到目标节点
      if (currentNode === targetNode.value) {
        found.value = true;
        currentStep.value++;
        const foundDetails = `第 ${currentStep.value} 步: 找到目标节点 ${currentNode}`;
        console.log(foundDetails);
        searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails });
        currentStepDetails.value = foundDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

        // 重建路径
        const resultPath = [];
        let temp = currentNode;
        while (temp) {
          resultPath.unshift(temp);
          temp = predecessors.value[temp];
        }
        path.value = resultPath;
        break;
      }

      // 更新相邻节点的距离
      for (const neighborInfo of currentGraph.value[currentNode] || []) {
        const neighbor = neighborInfo.node;
        const weight = neighborInfo.weight;
        const newDistance = distances.value[currentNode] + weight;

        if (newDistance < distances.value[neighbor]) {
          distances.value[neighbor] = newDistance;
          predecessors.value[neighbor] = currentNode;

          currentStep.value++;
          const updateDetails = `第 ${currentStep.value} 步: 更新节点 ${neighbor} 距离为 ${newDistance}`;
          console.log(updateDetails);
          searchSteps.value.push({ step: currentStep.value, type: 'neighbor', details: updateDetails });
          currentStepDetails.value = updateDetails;
          await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        }
      }
    }

    isSearching.value = false;
    if (found.value) {
      searchStatus.value = '搜索成功';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，找到最短路径: [${path.value.join(' -> ')}]，总距离: ${distances.value[targetNode.value]}`;
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

<style scoped src="./dfs-styles.css"></style>

<template>
  <div class="dfs-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>狄克斯特拉算法(Dijkstra)</h2>
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
          <p>狄克斯特拉算法(Dijkstra)是一种用于寻找加权图中最短路径的算法。它从起始节点开始，逐步扩展到其他节点，始终保持当前已知的最短路径。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>朴素实现:</span> O(V²)</li>
                  <li><span>优先队列实现:</span> O((V + E) log V)</li>
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
            <pre><code>function Dijkstra(graph, start):
  // 初始化距离和前驱节点
  for each node in graph:
    distance[node] = infinity
    predecessor[node] = null
  distance[start] = 0
  visited = empty set

  while visited does not contain all nodes:
    // 找到未访问节点中距离最小的节点
    current = node with minimum distance not in visited
    add current to visited

    // 更新相邻节点的距离
    for each neighbor of current:
      if neighbor not in visited:
        new_distance = distance[current] + weight(current, neighbor)
        if new_distance < distance[neighbor]:
          distance[neighbor] = new_distance
          predecessor[neighbor] = current

  return distance, predecessor</code></pre>

            <h3>Python 实现</h3>
            <pre><code>import heapq

def dijkstra(graph, start):
    # 初始化距离和前驱节点
    distances = {node: float('infinity') for node in graph}
    predecessors = {node: None for node in graph}
    distances[start] = 0
    
    # 使用优先队列
    priority_queue = [(0, start)]
    visited = set()
    
    while priority_queue:
        current_distance, current_node = heapq.heappop(priority_queue)
        
        # 如果节点已访问或当前距离大于已知距离，则跳过
        if current_node in visited or current_distance > distances[current_node]:
            continue
        
        visited.add(current_node)
        
        # 更新相邻节点的距离
        for neighbor_info in graph[current_node]:
            neighbor = neighbor_info['node']
            weight = neighbor_info['weight']
            
            if neighbor in visited:
                continue
            
            distance = current_distance + weight
            
            if distance < distances[neighbor]:
                distances[neighbor] = distance
                predecessors[neighbor] = current_node
                heapq.heappush(priority_queue, (distance, neighbor))
    
    return distances, predecessors

# 示例图
# graph = {
#     'A': [{'node': 'B', 'weight': 4}, {'node': 'C', 'weight': 2}],
#     'B': [{'node': 'A', 'weight': 4}, {'node': 'C', 'weight': 5}, {'node': 'D', 'weight': 10}],
#     'C': [{'node': 'A', 'weight': 2}, {'node': 'B', 'weight': 5}, {'node': 'D', 'weight': 3}],
#     'D': [{'node': 'B', 'weight': 10}, {'node': 'C', 'weight': 3}]
# }
# distances, predecessors = dijkstra(graph, 'A')
# print(distances)  # {'A': 0, 'B': 4, 'C': 2, 'D': 5}
</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>// 优先队列实现
class PriorityQueue {
    constructor() {
        this.items = [];
    }
    
    enqueue(element, priority) {
        const item = { element, priority };
        let added = false;
        
        for (let i = 0; i < this.items.length; i++) {
            if (item.priority < this.items[i].priority) {
                this.items.splice(i, 0, item);
                added = true;
                break;
            }
        }
        
        if (!added) {
            this.items.push(item);
        }
    }
    
    dequeue() {
        return this.items.shift();
    }
    
    isEmpty() {
        return this.items.length === 0;
    }
}

function dijkstra(graph, start) {
    // 初始化距离和前驱节点
    const distances = {};
    const predecessors = {};
    const priorityQueue = new PriorityQueue();
    const visited = new Set();
    
    // 设置初始距离
    for (const node in graph) {
        distances[node] = Infinity;
        predecessors[node] = null;
    }
    distances[start] = 0;
    priorityQueue.enqueue(start, 0);
    
    while (!priorityQueue.isEmpty()) {
        const { element: currentNode, priority: currentDistance } = priorityQueue.dequeue();
        
        // 如果节点已访问或当前距离大于已知距离，则跳过
        if (visited.has(currentNode) || currentDistance > distances[currentNode]) {
            continue;
        }
        
        visited.add(currentNode);
        
        // 更新相邻节点的距离
        for (const neighborInfo of graph[currentNode] || []) {
            const neighbor = neighborInfo.node;
            const weight = neighborInfo.weight;
            
            if (visited.has(neighbor)) {
                continue;
            }
            
            const distance = currentDistance + weight;
            
            if (distance < distances[neighbor]) {
                distances[neighbor] = distance;
                predecessors[neighbor] = currentNode;
                priorityQueue.enqueue(neighbor, distance);
            }
        }
    }
    
    return { distances, predecessors };
}

// 示例图
// const graph = {
//     'A': [{'node': 'B', 'weight': 4}, {'node': 'C', 'weight': 2}],
//     'B': [{'node': 'A', 'weight': 4}, {'node': 'C', 'weight': 5}, {'node': 'D', 'weight': 10}],
//     'C': [{'node': 'A', 'weight': 2}, {'node': 'B', 'weight': 5}, {'node': 'D', 'weight': 3}],
//     'D': [{'node': 'B', 'weight': 10}, {'node': 'C', 'weight': 3}]
// };
// const result = dijkstra(graph, 'A');
// console.log(result.distances);  // { A: 0, B: 4, C: 2, D: 5 }
</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>Dijkstra算法可视化</h3>
        <p>狄克斯特拉算法(Dijkstra)用于寻找加权图中从起始节点到其他所有节点的最短路径。它通过维护当前已知的最短路径并逐步更新来实现这一目标。</p>
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
          <div v-if="path.length > 0 && found.value" class="stat-item">
            <span class="stat-label">总距离:</span>
            <span class="stat-value">{{ distances[targetNode.value] }}</span>
          </div>
        </div>

        
          <div class="graph-container">
            <div class="graph-left">
              <!-- 合并后的SVG容器：边和节点 -->
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                <!-- 移除marker定义，使用CSS实现箭头 -->

                <!-- 边 -->
                <template v-for="(neighbors, node) in currentGraph" :key="node + '-edges'">
                  <template v-for="neighborInfo in neighbors" :key="node + '-' + neighborInfo.node">
                    <template v-if="nodesPositions[node] && nodesPositions[neighborInfo.node]">
                      <!-- 边路径 (黑色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighborInfo.node]).edgePath"
                        stroke="#666"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'path-highlight': isPathEdge(node, neighborInfo.node) }"
                      />
                      <!-- 箭头路径 (红色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighborInfo.node]).arrowPath"
                        stroke="#ff0000"
                        stroke-width="2"
                        fill="none"
                      />
                      <!-- 权重标签 -->
                      <text
                        :x="getEdgePath(nodesPositions[node], nodesPositions[neighborInfo.node]).weightPosition.split(' ')[1]"
                        :y="getEdgePath(nodesPositions[node], nodesPositions[neighborInfo.node]).weightPosition.split(' ')[2]"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        class="edge-weight"
                      >
                        {{ neighborInfo.weight }}
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
                    <!-- 距离标签 -->
                    <text
                      v-if="distances[node] !== undefined && distances[node] !== Infinity"
                      :x="nodesPositions[node].x + 25"
                      :y="nodesPositions[node].y - 15"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-distance"
                    >
                      {{ distances[node] }}
                    </text>
                  </g>
                </template>
              </svg>
            </div>
            <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
                <div class="graph-info">
                  <h4>图结构信息</h4>
                  <div v-for="(neighbors, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                    <p>{{ node }}: {{ neighbors.map(n => `${n.node}(${n.weight})`).join(', ') }}</p>
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
            <button @click="dijkstraSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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
          <p>狄克斯特拉算法有一些重要的变种和扩展：</p>
          <ol>
            <li><strong>优先队列优化的Dijkstra</strong>：使用优先队列来加速找到距离最小的节点，时间复杂度降为O((V + E) log V)。</li>
            <li><strong>A*算法</strong>：结合了Dijkstra算法和启发式函数，用于有特定目标的最短路径搜索。</li>
            <li><strong>SPFA(Shortest Path Faster Algorithm)</strong>：一种基于队列的最短路径算法，可以处理负权边。</li>
            <li><strong>Floyd-Warshall算法</strong>：用于寻找所有节点对之间的最短路径，时间复杂度O(V³)。</li>
          </ol>

          <h3>应用场景</h3>
          <p>狄克斯特拉算法广泛应用于以下场景：</p>
          <ul>
            <li>路由算法：如OSPF(开放式最短路径优先)协议</li>
            <li>地图导航系统中的最短路径计算</li>
            <li>网络流量优化</li>
            <li>机器人路径规划</li>
            <li>游戏开发中的寻路算法</li>
            <li>航班行程规划</li>
            <li>物流配送路线优化</li>
          </ul>

          <h3>局限性与解决方案</h3>
          <p>狄克斯特拉算法的主要局限性是不能处理负权边。如果图中存在负权边，可以使用以下替代算法：</p>
          <ul>
            <li><strong>Bellman-Ford算法</strong>：可以处理负权边，但时间复杂度较高(O(V*E))</li>
            <li><strong>SPFA算法</strong>：Bellman-Ford的队列优化版本，平均时间复杂度较低</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'learning'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          <p>狄克斯特拉算法是由荷兰计算机科学家艾兹赫尔·戴克斯特拉于1956年提出的，它的核心思想是：</p>
          <ol>
            <li>维护一个距离数组，记录从起始节点到其他所有节点的当前最短距离</li>
            <li>每次从未访问的节点中选择距离最小的节点进行访问</li>
            <li>更新被访问节点的所有邻居节点的距离</li>
            <li>重复步骤2和3，直到所有节点都被访问</li>
          </ol>

          <h3>与其他算法的对比</h3>
          <table border="1" cellspacing="0" cellpadding="5" style="width: 100%; border-collapse: collapse;">
            <tr>
              <th>算法</th>
              <th>适用场景</th>
              <th>优点</th>
              <th>缺点</th>
            </tr>
            <tr>
              <td>Dijkstra</td>
              <td>加权图最短路径(无负权边)</td>
              <td>效率高，可优化至O((V+E)logV)</td>
              <td>不能处理负权边</td>
            </tr>
            <tr>
              <td>BFS</td>
              <td>无权图最短路径</td>
              <td>实现简单，时间复杂度O(V+E)</td>
              <td>仅适用于无权图</td>
            </tr>
            <tr>
              <td>Bellman-Ford</td>
              <td>加权图最短路径(可含负权边)</td>
              <td>可处理负权边，检测负权环</td>
              <td>时间复杂度高O(V*E)</td>
            </tr>
            <tr>
              <td>A*</td>
              <td>有目标的最短路径搜索</td>
              <td>结合启发式，效率更高</td>
              <td>启发式函数设计困难</td>
            </tr>
          </table>

          <h3>实现注意事项</h3>
          <ul>
            <li>在实现Dijkstra算法时，使用优先队列可以显著提高性能</li>
            <li>需要注意处理图中可能存在的不可达节点</li>
            <li>算法的正确性依赖于边权非负的假设</li>
            <li>对于大型图，可以考虑使用斐波那契堆来进一步优化，但实现复杂度较高</li>
          </ul>
        </div>
      </div>
    </div>
</template>