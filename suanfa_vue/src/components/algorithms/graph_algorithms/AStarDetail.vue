<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'

// 定义emits
const emit = defineEmits(['close'])

// 关闭详情
// 关闭详情
const closeDetail = () => {
  emit('close')
}

// 控制标签页切换
// 控制标签页切换
const activeTab = ref('basic')

// A*搜索可视化相关状态
// 图结构控制
// 图结构控制
const numNodes = ref(5)
const minNodes = ref(3)
const maxNodes = ref(10)

// 错误信息
// 错误信息
const errorMessage = ref('')

// 搜索步骤记录
// 搜索步骤记录
const searchSteps = ref([])
const currentStepDetails = ref('')
// 搜索状态
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

// 生成随机有向图
const generateRandomGraph = (size) => {
  try {
    console.log('生成随机图 - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边和权重
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    });
    
    console.log('生成随机图 - 节点:', nodes);
    
    // 为每个节点添加一些边
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到1到3个其他节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numEdges; j++) {
        // 随机选择一个不同于当前节点的节点作为目标
        let targetIndex = Math.floor(Math.random() * nodes.length);
        while (targetIndex === i) {
          targetIndex = Math.floor(Math.random() * nodes.length);
        }
        
        const targetNode = nodes[targetIndex];
        // 随机权重 (1-10)
        const weight = Math.floor(Math.random() * 10) + 1;
        
        // 确保不添加重复的边
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

// 启发函数 - 估计从当前节点到目标节点的距离
// 这里使用简单的节点索引差作为启发值
const heuristic = (current, target) => {
  const nodes = Object.keys(currentGraph.value);
  const currentIndex = nodes.indexOf(current);
  const targetIndex = nodes.indexOf(target);
  return Math.abs(currentIndex - targetIndex);
}

// A*搜索算法实现
const aStarSearch = async () => {
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

  // A*搜索实现
  const openSet = new Set([startNode.value]);
  const closedSet = new Set();
  const gScore = new Map(); // 从起点到当前节点的实际代价
  const fScore = new Map(); // 从起点到目标节点的估计总代价 (g + h)
  const parent = new Map(); // 用于记录路径

  // 初始化gScore和fScore
  Object.keys(currentGraph.value).forEach(node => {
    gScore.set(node, Infinity);
    fScore.set(node, Infinity);
  });
  gScore.set(startNode.value, 0);
  fScore.set(startNode.value, heuristic(startNode.value, targetNode.value));

  currentStep.value++;
  const stepDetails = `第 ${currentStep.value} 步: 初始化开放列表，加入起始节点 ${startNode.value}`;
  console.log(stepDetails);
  searchSteps.value.push({ step: currentStep.value, type: 'visit', details: stepDetails });
  currentStepDetails.value = stepDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    while (openSet.size > 0 && !found.value) {
      // 找到fScore最小的节点
      let currentNode = null;
      let minFScore = Infinity;
      
      for (const node of openSet) {
        const score = fScore.get(node);
        if (score < minFScore) {
          minFScore = score;
          currentNode = node;
        }
      }

      currentStep.value++;
      const selectDetails = `第 ${currentStep.value} 步: 从开放列表中选择f值最小的节点 ${currentNode} (f=${fScore.get(currentNode)})`;
      console.log(selectDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'visit', details: selectDetails });
      currentStepDetails.value = selectDetails;
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
        let current = currentNode;
        while (current) {
          resultPath.unshift(current);
          current = parent.get(current);
        }
        path.value = resultPath;
        break;
      }

      // 将当前节点从开放列表移到关闭列表
      openSet.delete(currentNode);
      closedSet.add(currentNode);
      visitedNodes.value.push(currentNode);

      currentStep.value++;
      const moveDetails = `第 ${currentStep.value} 步: 将节点 ${currentNode} 从开放列表移到关闭列表`;
      console.log(moveDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'visit', details: moveDetails });
      currentStepDetails.value = moveDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 检查所有邻居
      for (const neighborInfo of currentGraph.value[currentNode] || []) {
        const neighbor = neighborInfo.node;
        const weight = neighborInfo.weight;

        // 如果邻居在关闭列表中，跳过
        if (closedSet.has(neighbor)) {
          continue;
        }

        // 计算从起点经过当前节点到邻居的代价
        const tentativeGScore = gScore.get(currentNode) + weight;

        // 如果这是一条更好的路径
        if (tentativeGScore < gScore.get(neighbor)) {
          parent.set(neighbor, currentNode);
          gScore.set(neighbor, tentativeGScore);
          fScore.set(neighbor, tentativeGScore + heuristic(neighbor, targetNode.value));

          // 如果邻居不在开放列表中，添加它
          if (!openSet.has(neighbor)) {
            openSet.add(neighbor);
            
            currentStep.value++;
            const neighborDetails = `第 ${currentStep.value} 步: 发现节点 ${neighbor}，加入开放列表 (g=${gScore.get(neighbor)}, h=${heuristic(neighbor, targetNode.value)}, f=${fScore.get(neighbor)})`;
            console.log(neighborDetails);
            searchSteps.value.push({ step: currentStep.value, type: 'neighbor', details: neighborDetails });
            currentStepDetails.value = neighborDetails;
            await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
          } else {
            currentStep.value++;
            const updateDetails = `第 ${currentStep.value} 步: 更新节点 ${neighbor} 的代价 (g=${gScore.get(neighbor)}, h=${heuristic(neighbor, targetNode.value)}, f=${fScore.get(neighbor)})`;
            console.log(updateDetails);
            searchSteps.value.push({ step: currentStep.value, type: 'update', details: updateDetails });
            currentStepDetails.value = updateDetails;
            await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
          }
        }
      }
    }

    isSearching.value = false;
    if (found.value) {
      searchStatus.value = '搜索成功';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，找到路径: [${path.value.join(' -> ')}]，总代价: ${gScore.get(targetNode.value)}`;
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
    if (path.value[i] === from) {
      // 检查当前节点的邻居中是否有下一个路径节点
      const nextNode = path.value[i + 1];
      return currentGraph.value[from].some(edge => edge.node === nextNode);
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

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="algorithm-detail-container detail-container">
    <div class="modal-header">
      <h2>A*算法详情</h2>
      <button class="close-btn" @click="closeDetail">×</button>
       <!-- 标签页控制 -->
      <div class="tabs">
      <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
      <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
      <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
      <button :class="{ active: activeTab === 'learning' }" @click="activeTab = 'learning'">学习</button>
      </div>
    </div>
    <!-- 标签页内容 -->
    <div class="modal-content">
      <!-- 基础标签页 -->
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>A*算法是一种启发式搜索算法，它结合了Dijkstra算法和贪心最佳优先搜索的优点。A*算法使用启发式函数来估计从当前节点到目标节点的最短路径，从而加速搜索过程。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(V²)</li>
                  <li><span>平均情况:</span> O(E log V)</li>
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
            <pre><code>function AStar(graph, start, goal, heuristic):
  openSet = {start}
  closedSet = {}
  gScore = map with infinity for all nodes
  gScore[start] = 0
  fScore = map with infinity for all nodes
  fScore[start] = heuristic(start, goal)
  parent = {}
  
  while openSet not empty:
    current = node in openSet with lowest fScore
    
    if current == goal:
      return reconstructPath(parent, current)
    
    openSet.remove(current)
    closedSet.add(current)
    
    for each neighbor of current:
      if neighbor in closedSet:
        continue
      
      tentativeGScore = gScore[current] + distance(current, neighbor)
      
      if neighbor not in openSet:
        openSet.add(neighbor)
      else if tentativeGScore >= gScore[neighbor]:
        continue
      
      parent[neighbor] = current
      gScore[neighbor] = tentativeGScore
      fScore[neighbor] = gScore[neighbor] + heuristic(neighbor, goal)
  
  return failure</code></pre>

            <h3>Python 实现</h3>
        <pre><code class="language-python">def a_star_search(graph, start, goal, heuristic):
    open_set = set([start])
    closed_set = set()
    g_score = {node: float('inf') for node in graph}
    g_score[start] = 0
    f_score = {node: float('inf') for node in graph}
    f_score[start] = heuristic(start, goal)
    parent = {}

    while open_set:
        current = min(open_set, key=lambda x: f_score[x])

        if current == goal:
            path = []
            while current in parent:
                path.append(current)
                current = parent[current]
            path.append(start)
            return path[::-1]

        open_set.remove(current)
        closed_set.add(current)

        for neighbor, weight in graph[current].items():
            if neighbor in closed_set:
                continue

            tentative_g_score = g_score[current] + weight
            if neighbor not in open_set:
                open_set.add(neighbor)
            elif tentative_g_score >= g_score[neighbor]:
                continue

            parent[neighbor] = current
            g_score[neighbor] = tentative_g_score
            f_score[neighbor] = g_score[neighbor] + heuristic(neighbor, goal)

    return None</code></pre>
    </div>
        </div>
  
      </div>

      <!-- 查找标签页 -->
      <div v-else-if="activeTab === 'search'" class="search-content">
         <h3>A*搜索可视化</h3>
        <p>A*算法用于寻找带权图中单源最短路径，能够处理包含负权边的图，但不能处理包含负权环的图。</p>
      <div class="visualization-container">
        <div class="stats-container">
          <div class="stat-item">
            <span class="label">状态:</span>
            <span class="value">{{ searchStatus }}</span>
          </div>
          <div class="stat-item">
            <span class="label">当前步骤:</span>
            <span class="value">{{ currentStep }}</span>
          </div>
          <div class="stat-item">
            <span class="label">已访问节点:</span>
            <span class="value">{{ visitedNodes.join(', ') }}</span>
          </div>
          <div class="stat-item">
            <span class="label">找到路径:</span>
            <span class="value">{{ found ? path.join(' -> ') : '未找到' }}</span>
          </div>
        </div>

        <!-- 图可视化区域 -->
        <div class="graph-container">
           <div class="graph-left">
            <!-- 合并后的SVG容器：边和节点 -->
            <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
            <!-- 边 -->
            <template v-for="(edges, fromNode) in currentGraph" :key="fromNode">
              <template v-for="edge in edges" :key="fromNode + '-' + edge.node">
                <!-- <g :class="{ 'path-edge': isPathEdge(fromNode, edge.node) }"
                   :style="{ 'opacity': visitedNodes.includes(fromNode) || visitedNodes.includes(edge.node) ? 1 : 0.3 }"> -->
                  <!-- 边路径 -->
                  <path
                    :d="getEdgePath(nodesPositions[fromNode], nodesPositions[edge.node]).edgePath"
                    stroke="#666"
                    stroke-width="2"
                    fill="none"
                  />
                  <!-- 箭头路径 -->
                  <path
                    :d="getEdgePath(nodesPositions[fromNode], nodesPositions[edge.node]).arrowPath"
                    stroke="#666"
                    stroke-width="2"
                    fill="none"
                  />
                   <!-- 权重标签 -->
                  <text
                    :x="(nodesPositions[fromNode].x + nodesPositions[edge.node].x) / 2 + 10"
                    :y="(nodesPositions[fromNode].y + nodesPositions[edge.node].y) / 2 - 10"
                    font-size="12"
                    fill="#333"
                  >
                    {{ edge.weight }}
                  </text>
                <!-- </g> -->
              </template>
            </template>

            <!-- 节点 -->
            <template v-for="(position, node) in nodesPositions" :key="node">
              <circle
                :cx="position.x + 25"
                :cy="position.y + 25"
                r="25"
                class="node"
                :class="{
                  'start': node === startNode.value,
                  'target': node === targetNode.value,
                  'visited': visitedNodes.includes(node),
                  'current': path.includes(node)
                }"
              />
              <text
                :x="position.x + 25"
                :y="position.y + 30"
                text-anchor="middle"
                dominant-baseline="middle"
                font-weight="bold"
                fill="white"
              >
                {{ node }}
              </text>
            </template>
          </svg>
           </div>
           <!-- 图结构信息 -->
           <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
              <div class="graph-info">
                <h4>图结构信息</h4>
                <div v-for="(neighbors, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                  <p>{{ node }}: {{ neighbors.map(edge => `${edge.node}(${edge.weight})`).join(', ') }}</p>
                </div>
              </div>
          </div>
        </div>

        <!-- 控制区域 -->
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
            <button @click="aStarSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
            <button @click="resetSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">重置搜索</button>
          </div>

        <!-- 错误信息 -->
        <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>

        <!-- 步骤详情 -->
        <div class="step-details">
          <h4>当前步骤详情</h4>
          <p>{{ currentStepDetails }}</p>
        </div>

        <!-- 搜索步骤历史 -->
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
      <!-- 进阶标签页 -->
      <div v-else-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content" style="text-align: left;">
        <h3>算法变种</h3>
        <p>A*算法有许多变种，适用于不同的场景：</p>
        <ul>
          <li><strong>加权A*</strong>：对g(n)或h(n)使用不同的权重，以平衡搜索速度和路径质量。</li>
          <li><strong>增量A*</strong>：当图发生变化时，避免重新从头开始搜索。</li>
          <li><strong>动态A*</strong>：适用于动态变化的环境，如机器人导航。</li>
          <li><strong>分层A*</strong>：将搜索空间划分为多个层级，加速搜索过程。</li>
        </ul>

        <h3>优化技巧</h3>
        <ol>
          <li><strong>选择合适的启发函数</strong>：启发函数越接近实际代价，搜索效率越高。</li>
          <li><strong>使用高效的数据结构</strong>：开放列表可以使用优先队列实现，以快速找到f值最小的节点。</li>
          <li><strong>剪枝策略</strong>：提前排除不可能的路径，减少搜索空间。</li>
        </ol>

        <h3>应用场景</h3>
        <p>A*算法在以下领域有广泛应用：</p>
        <ul>
          <li>游戏开发中的寻路算法</li>
          <li>机器人导航</li>
          <li>网络路由</li>
          <li>地图软件中的路径规划</li>
          <li>人工智能中的问题求解</li>
        </ul>
        </div>
      </div>

      <!-- 学习标签页 -->
      <div v-else-if="activeTab === 'learning'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
        <h3>学习资源</h3>
        <p>以下是学习A*算法的推荐资源：</p>
        <ul>
          <li><a href="https://en.wikipedia.org/wiki/A*_search_algorithm" target="_blank">维基百科 - A*搜索算法</a></li>
          <li><a href="https://www.redblobgames.com/pathfinding/a-star/introduction.html" target="_blank">Red Blob Games - A*算法介绍</a></li>
          <li><a href="https://www.geeksforgeeks.org/a-search-algorithm/" target="_blank">GeeksforGeeks - A*搜索算法</a></li>
        </ul>

        <h3>常见问题</h3>
        <dl>
          <dt>Q: A*算法与Dijkstra算法有什么区别？</dt>
          <dd>A: A*算法结合了Dijkstra算法的优点（保证找到最短路径）和贪心最佳优先搜索的优点（使用启发式函数加速搜索）。Dijkstra算法会探索所有可能的路径，而A*算法会优先探索更可能接近目标的路径。</dd>

          <dt>Q: 什么是可接受的启发函数？</dt>
          <dd>A: 可接受的启发函数是指不会高估从当前节点到目标节点的实际代价的函数。使用可接受的启发函数可以保证A*算法找到最短路径。</dd>

          <dt>Q: 什么是一致的启发函数？</dt>
          <dd>A: 一致的启发函数是指对于任意节点n和n的邻居m，启发函数满足h(n) ≤ c(n,m) + h(m)，其中c(n,m)是从n到m的实际代价。一致的启发函数一定是可接受的。</dd>
        </dl>

        <h3>实践提示</h3>
        <p>在实现A*算法时，需要注意以下几点：</p>
        <ul>
          <li>选择合适的启发函数对算法性能至关重要。</li>
          <li>确保启发函数是可接受的，以保证找到最短路径。</li>
          <li>对于大型图，可以考虑使用剪枝策略或并行化技术来提高性能。</li>
          <li>在动态环境中，可能需要使用A*算法的变种，如动态A*。</li>
        </ul>
        </div>
      </div>
    </div>
  </div>
</template>