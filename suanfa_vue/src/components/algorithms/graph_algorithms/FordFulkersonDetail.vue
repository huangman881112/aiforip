<style scoped>
 .max-flow-edge {
  color: #1E88E5 !important;
  font-size: 1.5em !important;
  font-weight: bold !important;
}
.source-node {
  color: #FF5722 ;
  font-size: 1.5em !important;
  font-weight: bold !important;
}
.sink-node {
  color: #4CAF50 ;
  font-size: 1.5em !important;
  font-weight: bold !important;
}
.final-node {
  fill: #1E88E5 !important;
  font-size: 1.5em !important;
  font-weight: bold !important;
}

.in-path-node {
  color: #FF5722 !important;
  font-size: 1.5em !important;
  font-weight: bold !important;
}
</style>

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

// Ford-Fulkerson算法可视化相关状态
// 图结构控制
const numNodes = ref(6)
const minNodes = ref(4)
const maxNodes = ref(10)
const minCapacity = ref(1)
const maxCapacity = ref(10)
// 算法完成状态
const algorithmCompleted = ref(false)

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
const maxFlowValue = ref(0)
const processedEdges = ref(0)
const residualGraph = ref({})

// 确保numNodes始终是数字类型
watch(numNodes, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue)) {
    console.warn('[WARNING] 节点数量不是有效数字，已重置为默认值');
    numNodes.value = 6;
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
    
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    if (typeof minCapacity !== 'number' || minCapacity < 1) {
      throw new Error('无效的最小容量: ' + minCapacity);
    }
    if (typeof maxCapacity !== 'number' || maxCapacity < minCapacity) {
      throw new Error('无效的最大容量: ' + maxCapacity);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 源点和汇点固定为第一个和最后一个节点
    const source = nodes[0];
    const sink = nodes[nodes.length - 1];
    
    // 生成有向图
    const graph = {};
    const edges = [];
    nodes.forEach(node => {
      graph[node] = [];
    });
    
    // 确保源点有出边，汇点有入边
    // 1. 源点连接到多个节点
    const sourceEdgesCount = Math.min(3, size - 2); // 源点连接到2-3个节点
    for (let i = 1; i <= sourceEdgesCount; i++) {
      const weight = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
      graph[source].push({ node: nodes[i], capacity: weight, flow: 0 });
      edges.push({ from: source, to: nodes[i], capacity: weight, flow: 0 });
    }
    
    // 2. 中间节点连接
    for (let i = 1; i < nodes.length - 1; i++) {
      // 每个中间节点连接到2-3个其他节点
      const edgesCount = Math.min(3, size - i - 1);
      for (let j = 0; j < edgesCount; j++) {
        // 确保连接到后面的节点（避免环）
        const targetIndex = i + 1 + j;
        if (targetIndex >= nodes.length - 1) break;
        
        const weight = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
        graph[nodes[i]].push({ node: nodes[targetIndex], capacity: weight, flow: 0 });
        edges.push({ from: nodes[i], to: nodes[targetIndex], capacity: weight, flow: 0 });
      }
    }
    
    // 3. 多个节点连接到汇点
    const sinkEdgesCount = Math.min(3, size - 2);
    for (let i = nodes.length - 1 - sinkEdgesCount; i < nodes.length - 1; i++) {
      const weight = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
      graph[nodes[i]].push({ node: sink, capacity: weight, flow: 0 });
      edges.push({ from: nodes[i], to: sink, capacity: weight, flow: 0 });
    }
    
    // 4. 添加一些随机边，增加图的复杂性
    const additionalEdges = Math.min(5, size * 2);
    for (let i = 0; i < additionalEdges; i++) {
      const fromIndex = Math.floor(Math.random() * (nodes.length - 2)) + 1; // 避免源点
      const toIndex = Math.floor(Math.random() * (nodes.length - 1 - fromIndex)) + fromIndex + 1; // 确保to在from后面
      
      const weight = Math.floor(Math.random() * (maxCapacity - minCapacity + 1)) + minCapacity;
      graph[nodes[fromIndex]].push({ node: nodes[toIndex], capacity: weight, flow: 0 });
      edges.push({ from: nodes[fromIndex], to: nodes[toIndex], capacity: weight, flow: 0 });
    }
    
    console.log('生成随机流网络 - 节点:', nodes);
    console.log('生成随机流网络 - 边:', graph);
    console.log('生成随机流网络 - 边列表:', edges);
    
    // 初始化残量网络
    const residual = {};
    nodes.forEach(node => {
      residual[node] = [];
    });
    
    edges.forEach(edge => {
      // 正向边
      residual[edge.from].push({ 
        node: edge.to, 
        capacity: edge.capacity, 
        flow: edge.flow,
        isReverse: false,
        originalEdge: edge 
      });
      // 反向边
      residual[edge.to].push({ 
        node: edge.from, 
        capacity: 0, 
        flow: 0,
        isReverse: true,
        originalEdge: edge 
      });
    });
    
    return { graph, edges, residual, source, sink };
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
const sourceNode = ref(graphData.value.source)
const sinkNode = ref(graphData.value.sink)

// 生成节点位置 (参考Kruskal算法优化，使节点更稀疏)
const generateNodesPositions = () => {
  const positions = {};
  const nodes = Object.keys(currentGraph.value);
  // 根据SVG viewBox(800x600)和节点数量动态计算位置
  const maxWidth = 750; // 增加宽度留出更多空间
  const maxHeight = 550; // 增加高度留出更多空间
  const columnWidth = maxWidth / (nodes.length); // 增加节点间水平间距
  
  console.log('生成节点位置 - 开始，nodes:', nodes);
  nodes.forEach((node, index) => {
    // 优化节点分布，使位置更稀疏
    positions[node] = {
      x: columnWidth * (index + 0.5),
      y: maxHeight / 2 + (Math.random() - 0.5) * 300 // 增加Y位置随机性范围
    };
  });
  console.log('生成节点位置 - 完成，positions:', positions);

  return positions;
}

// 检查容量类型
const checkCapacityTypes = () => {
  // 在页面上显示结果
  currentStepDetails.value = `
    minCapacity类型: ${typeof minCapacity.value}, 值: ${minCapacity.value}
    maxCapacity类型: ${typeof maxCapacity.value}, 值: ${maxCapacity.value}
  `;
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
    residualGraph.value = {...graphData.value.residual};
    sourceNode.value = graphData.value.source;
    sinkNode.value = graphData.value.sink;
    console.log('[DEBUG] 图已更新:', currentGraph.value);

    // 生成节点位置
    nodesPositions.value = generateNodesPositions();
    console.log('[DEBUG] 生成新图 - 完成');
  } catch (error) {
    console.error('[ERROR] 生成新图失败:', error);
    errorMessage.value = `生成新图失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
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

  // 生成路径数据
  return {
    edgePath: `M ${startX} ${startY} L ${adjustedEndX} ${adjustedEndY}`,
    arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`
  };
};

// 当前增广路径中的边集合（用于高效查询）
const currentAugmentingEdges = ref(new Set());

// 检查边是否在当前增广路径中
const isInCurrentPath = (from, to) => {
  return currentAugmentingEdges.value.has(`${from}-${to}`);
}

// 当前增广路径中的节点集合（用于高效查询）
const currentAugmentingNodes = ref(new Set());

// 检查节点是否在当前增广路径中
const isInCurrentPathNodes = (node) => {
  return currentAugmentingNodes.value.has(node);
}

// 生成带箭头的边路径函数已在上方定义，此处不再重复

// 使用BFS寻找增广路径
const findAugmentingPath = (residual, source, sink, visited) => {
  // 队列用于BFS
  const queue = [source];
  // 记录每个节点的前驱节点和边
  const parent = {};
  // 初始化访问状态
  Object.keys(visited).forEach(node => {
    visited[node] = false;
  });
  visited[source] = true;
  
  // 标记是否找到汇点
  let foundSink = false;
  
  while (queue.length > 0 && !foundSink) {
    const current = queue.shift();
    
    for (const edge of residual[current]) {
      if (!visited[edge.node] && edge.capacity > edge.flow) {
        visited[edge.node] = true;
        parent[edge.node] = { node: current, edge: edge };
        queue.push(edge.node);
        
        if (edge.node === sink) {
          foundSink = true;
          break;
        }
      }
    }
  }
  
  // 如果没有找到到汇点的路径
  if (!visited[sink]) return null;
  
  // 构建路径并计算最小剩余容量
  let minCapacity = Infinity;
  const augmentingPath = [];
  let currentPathNodes = [sink];
  
  let current = sink;
  while (current !== source) {
    const { node: prevNode, edge } = parent[current];
    augmentingPath.push(edge);
    minCapacity = Math.min(minCapacity, edge.capacity - edge.flow);
    current = prevNode;
    currentPathNodes.push(current);
  }
  
  // 反转路径，使其从源点到汇点
  augmentingPath.reverse();
  currentPathNodes.reverse();
  
  return { path: augmentingPath, minCapacity, nodes: currentPathNodes };
}

// Ford-Fulkerson算法实现
const runAlgorithm = async () => {
  console.log('开始算法按钮被点击');
  isButtonClicked.value = true;
  isRunning.value = true;
  algorithmStatus.value = '执行中';
  algorithmCompleted.value = false; // 重置算法完成状态
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  currentStep.value = 0;
  maxFlowValue.value = 0;
  processedEdges.value = 0;
  algorithmSteps.value = [];
  currentStepDetails.value = '';
  
  // 初始化残量网络
  residualGraph.value = JSON.parse(JSON.stringify(graphData.value.residual));
  
  console.log('算法开始前的残量网络:', residualGraph.value);
  algorithmSteps.value.push({ step: 0, type: 'info', details: `Ford-Fulkerson算法开始，寻找最大流` });

  currentStep.value++;
  const initDetails = `第 ${currentStep.value} 步: 初始化残量网络，源点: ${sourceNode.value}，汇点: ${sinkNode.value}`;
  console.log(initDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    // 循环寻找增广路径
    while (true) {
      currentStep.value++;
      const searchDetails = `第 ${currentStep.value} 步: 使用BFS寻找增广路径`;
      algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: searchDetails });
      currentStepDetails.value = searchDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      // 使用BFS寻找增广路径
      const visited = {};
      Object.keys(residualGraph.value).forEach(node => {
        visited[node] = false;
      });
      
      const result = findAugmentingPath(residualGraph.value, sourceNode.value, sinkNode.value, visited);
      console.log('BFS寻找增广路径结果:', result);
      
      // 更新当前增广路径的节点和边
      currentAugmentingNodes.value.clear();
      currentAugmentingEdges.value.clear();
      
      if (!result) {
        // 没有找到增广路径，算法结束
        currentStep.value++;
        const doneDetails = `第 ${currentStep.value} 步: 没有找到更多增广路径，算法结束`;
        console.log(doneDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: doneDetails });
        currentStepDetails.value = doneDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        break;
      }
      
      const { path, minCapacity } = result;
      
      currentStep.value++;
      const pathDetails = `第 ${currentStep.value} 步: 找到增广路径，最小剩余容量: ${minCapacity}`;
      console.log(pathDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: pathDetails });
      currentStepDetails.value = pathDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 沿路径增加流量
      path.forEach(edge => {
        edge.flow += minCapacity;
        // 更新反向边
        for (const reverseEdge of residualGraph.value[edge.node]) {
          console.log('反向边:', reverseEdge);
          if (reverseEdge.node === edge.originalEdge.from && reverseEdge.isReverse) {
            reverseEdge.flow -= minCapacity;
            break;
          }
        }
      });
      
      maxFlowValue.value += minCapacity;
      processedEdges.value += path.length;
      
      currentStep.value++;
      const updateDetails = `第 ${currentStep.value} 步: 沿路径增加流量 ${minCapacity}，当前最大流: ${maxFlowValue.value}`;
      console.log(updateDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'add', details: updateDetails });
      currentStepDetails.value = updateDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    }

    isRunning.value = false;
    algorithmStatus.value = '算法完成';
    algorithmCompleted.value = true; // 标记算法完成
    currentStep.value++;
    const finalDetails = `第 ${currentStep.value} 步: 最大流计算完成，最大流值: ${maxFlowValue.value}`;
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
    maxFlowValue.value = 0;
    processedEdges.value = 0;
    algorithmSteps.value = [];
    currentStepDetails.value = '';
    errorMessage.value = '';
    
    // 重新复制原始图
    currentGraph.value = {...graphData.value.graph};
    currentEdges.value = [...graphData.value.edges];
    residualGraph.value = {...graphData.value.residual};
    console.log('[DEBUG] 重置算法 - 图已重置:', currentGraph.value);
  } catch (error) {
    console.error('[ERROR] 重置算法失败:', error);
  }
}

// 组件挂载时生成节点位置
onMounted(() => {
  nodesPositions.value = generateNodesPositions();
});
</script>

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="ford-fulkerson-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>福特-富尔克森算法(Ford-Fulkerson)</h2>
      <div class="tabs">
        <button :class="{ active: activeTab === 'basic' }" @click="activeTab = 'basic'">基础</button>
        <button :class="{ active: activeTab === 'search' }" @click="activeTab = 'search'">查找</button>
        <button :class="{ active: activeTab === 'advanced' }" @click="activeTab = 'advanced'">进阶</button>
        <button :class="{ active: activeTab === 'notes' }" @click="activeTab = 'notes'">学习</button>
      </div>
    </div>

    <div class="modal-content">
      <div v-if="activeTab === 'basic'" class="basic-section">
        <div class="markdown-content" style="text-align: left;">
          <p>福特-富尔克森算法(Ford-Fulkerson)是一种用于计算网络最大流的贪心算法。它的核心思想是通过反复寻找从源点到汇点的增广路径，并沿着这些路径增加流量，直到无法找到更多增广路径为止。</p>

          <div class="complexity-analysis">
            <h3>复杂度分析</h3>
            <div class="complexity-item merged-complexity">
              <div class="complexity-row">
                <p class="complexity-title" style="text-align: left;">时间复杂度</p>
                <ul class="complexity-subitems" style="text-align: left;">
                  <li><span>最坏情况:</span> O(F * E)，其中F是最大流值，E是边数</li>
                  <li><span>使用Edmonds-Karp算法变种:</span> O(V * E²)，其中V是顶点数</li>
                </ul>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">空间复杂度:</span> O(V + E)</p>
              </div>
              <div class="complexity-row">
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function FordFulkerson(G, s, t):
  initialize flow on all edges to 0
  while there exists an augmenting path P from s to t in the residual network G_f:
    let c_f(P) be the minimum residual capacity on the path P
    augment the flow along P by c_f(P)
  return the total flow from s to t</code></pre>

            <h3>Python 实现</h3>
            <pre><code>from collections import deque

def bfs(residual, source, sink, parent):
    visited = {node: False for node in residual}
    queue = deque([source])
    visited[source] = True

    while queue:
        current = queue.popleft()
        for edge in residual[current]:
            if not visited[edge['node']] and edge['capacity'] > edge['flow']:
                parent[edge['node']] = current
                visited[edge['node']] = True
                if edge['node'] == sink:
                    return True
                queue.append(edge['node'])
    return False

def ford_fulkerson(graph, source, sink):
    # 创建残量网络
    residual = {node: [] for node in graph}
    for node in graph:
        for neighbor in graph[node]:
            # 正向边
            residual[node].append({
                'node': neighbor['node'],
                'capacity': neighbor['capacity'],
                'flow': 0,
                'is_reverse': False
            })
            # 反向边
            residual[neighbor['node']].append({
                'node': node,
                'capacity': 0,
                'flow': 0,
                'is_reverse': True
            })

    parent = {node: -1 for node in graph}
    max_flow = 0

    while bfs(residual, source, sink, parent):
        # 找到路径上的最小残量容量
        path_flow = float('inf')
        s = sink
        while s != source:
            for edge in residual[parent[s]]:
                if edge['node'] == s and edge['capacity'] - edge['flow'] > 0:
                    path_flow = min(path_flow, edge['capacity'] - edge['flow'])
                    break
            s = parent[s]

        # 更新路径上的流量
        v = sink
        while v != source:
            for edge in residual[parent[v]]:
                if edge['node'] == v and not edge['is_reverse']:
                    edge['flow'] += path_flow
                    break
            # 更新反向边
            for edge in residual[v]:
                if edge['node'] == parent[v] and edge['is_reverse']:
                    edge['flow'] -= path_flow
                    break
            v = parent[v]

        max_flow += path_flow
        parent = {node: -1 for node in graph}

    return max_flow

# 示例使用
# graph = {
#     'A': [{'node': 'B', 'capacity': 16}, {'node': 'D', 'capacity': 13}],
#     'B': [{'node': 'C', 'capacity': 12}, {'node': 'D', 'capacity': 10}],
#     'C': [{'node': 'E', 'capacity': 20}],
#     'D': [{'node': 'B', 'capacity': 4}, {'node': 'C', 'capacity': 9}, {'node': 'E', 'capacity': 14}],
#     'E': []
# }
# source = 'A'
# sink = 'E'
# print(f"最大流: {ford_fulkerson(graph, source, sink)}")</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function bfs(residual, source, sink, parent) {
    const visited = {};
    for (const node in residual) {
        visited[node] = false;
    }

    const queue = [source];
    visited[source] = true;

    while (queue.length > 0) {
        const current = queue.shift();
        for (const edge of residual[current]) {
            if (!visited[edge.node] && edge.capacity > edge.flow) {
                parent[edge.node] = current;
                visited[edge.node] = true;
                if (edge.node === sink) {
                    return true;
                }
                queue.push(edge.node);
            }
        }
    }
    return false;
}

function fordFulkerson(graph, source, sink) {
    // 创建残量网络
    const residual = {};
    for (const node in graph) {
        residual[node] = [];
        for (const neighbor of graph[node]) {
            // 正向边
            residual[node].push({
                node: neighbor.node,
                capacity: neighbor.capacity,
                flow: 0,
                isReverse: false
            });
            // 反向边
            if (!residual[neighbor.node]) {
                residual[neighbor.node] = [];
            }
            residual[neighbor.node].push({
                node: node,
                capacity: 0,
                flow: 0,
                isReverse: true
            });
        }
    }

    const parent = {};
    let maxFlow = 0;

    while (bfs(residual, source, sink, parent)) {
        // 找到路径上的最小残量容量
        let pathFlow = Infinity;
        let s = sink;
        while (s !== source) {
            for (const edge of residual[parent[s]]) {
                if (edge.node === s && edge.capacity - edge.flow > 0) {
                    pathFlow = Math.min(pathFlow, edge.capacity - edge.flow);
                    break;
                }
            }
            s = parent[s];
        }

        // 更新路径上的流量
        let v = sink;
        while (v !== source) {
            for (const edge of residual[parent[v]]) {
                if (edge.node === v && !edge.isReverse) {
                    edge.flow += pathFlow;
                    break;
                }
            }
            // 更新反向边
            for (const edge of residual[v]) {
                if (edge.node === parent[v] && edge.isReverse) {
                    edge.flow -= pathFlow;
                    break;
                }
            }
            v = parent[v];
        }

        maxFlow += pathFlow;
        // 重置parent
        Object.keys(residual).forEach(node => {
            parent[node] = null;
        });
    }

    return maxFlow;
}

// 示例使用
// const graph = {
//     'A': [{ node: 'B', capacity: 16 }, { node: 'D', capacity: 13 }],
//     'B': [{ node: 'C', capacity: 12 }, { node: 'D', capacity: 10 }],
//     'C': [{ node: 'E', capacity: 20 }],
//     'D': [{ node: 'B', capacity: 4 }, { node: 'C', capacity: 9 }, { node: 'E', capacity: 14 }],
//     'E': []
// };
// const source = 'A';
// const sink = 'E';
// console.log(`最大流: ${fordFulkerson(graph, source, sink)}`);</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>Ford-Fulkerson算法可视化</h3>
        <p>福特-富尔克森算法是一种用于计算网络最大流的贪心算法。它通过反复寻找从源点到汇点的增广路径，并沿着这些路径增加流量。</p>
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
            <span class="stat-label">最大流值:</span>
            <span class="stat-value total-flow-value">{{ maxFlowValue }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">已处理边数:</span>
            <span class="stat-value">{{ processedEdges }}</span>
          </div>
        </div>

          <div class="graph-container">
            <div class="graph-left">
              <!-- 合并后的SVG容器：边和节点 -->
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                <!-- 边 -->
                <template v-for="(neighbors, node) in currentGraph" :key="node + '-edges'">
                  <template v-for="neighbor in neighbors" :key="node + '-' + neighbor.node">
                    <template v-if="nodesPositions[node] && nodesPositions[neighbor.node]">
                      <!-- 边路径 -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor.node]).edgePath"
                        :stroke="algorithmCompleted ? '#1E88E5' : (isInCurrentPath(node, neighbor.node) ? '#43A047' : (neighbor.flow > 0 ? '#1E88E5' : '#666'))"
                        :stroke-width="neighbor.flow > 0 ? 3 : 2"
                        :stroke-dasharray="neighbor.flow > 0 && neighbor.flow < neighbor.capacity && !algorithmCompleted ? '5,5' : 'none'"
                        fill="none"
                      />
                      <!-- 箭头 -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor.node]).arrowPath"
                        :stroke="algorithmCompleted ? '#1E88E5' : (isInCurrentPath(node, neighbor.node) ? '#43A047' : (neighbor.flow > 0 ? '#1E88E5' : '#666'))"
                        stroke-width="2"
                        fill="none"
                      />
                      <!-- 边容量和流量 -->
                      <text
                        :x="(nodesPositions[node].x + nodesPositions[neighbor.node].x) / 2"
                        :y="(nodesPositions[node].y + nodesPositions[neighbor.node].y) / 2 - 10"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        :class="{'edge-weight': true, 'max-flow-edge': isInCurrentPath(node, neighbor.node)}"
                      >
                        {{ neighbor.flow }}/{{ neighbor.capacity }}
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
                      :class="{ 'source-node': node === sourceNode, 'sink-node': node === sinkNode, 'in-path-node': isInCurrentPathNodes(node), 'final-node': algorithmCompleted }"
                      :fill="algorithmCompleted ? '#1E88E5' : ''"
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
                  </g>
                </template>
              </svg>
            </div>
            <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
                <div class="graph-info">
                  <h4>流网络信息</h4>
                  <div v-for="(neighbors, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                    <p>{{ node }}: {{ neighbors.map(n => `${n.node}(${n.flow}/${n.capacity})`).join(', ') }}</p>
                  </div>
                  <p><strong>源点:</strong> {{ sourceNode }}</p>
                  <p><strong>汇点:</strong> {{ sinkNode }}</p>
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
            <label>容量范围: {{ minCapacity }}-{{ maxCapacity }}</label>
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
            <button @click="checkCapacityTypes" :disabled="isRunning" class="ml-2">检查容量类型</button>
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

      <div v-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>算法变种</h3>
          <p>福特-富尔克森算法有一些重要的变种：</p>
          <ol>
            <li><strong>Edmonds-Karp算法</strong>：使用BFS寻找增广路径，时间复杂度为O(V*E²)。</li>
            <li><strong>Dinic算法</strong>：使用分层图和阻塞流，时间复杂度为O(V²*E)。</li>
            <li><strong>Push-Relabel算法</strong>：使用预流和重标技术，时间复杂度为O(V³)。</li>
            <li><strong>Capacity Scaling算法</strong>：按容量大小寻找增广路径，时间复杂度为O(E² log U)，其中U是最大边容量。</li>
          </ol>

          <h3>应用场景</h3>
          <p>福特-富尔克森算法广泛应用于以下场景：</p>
          <ul>
            <li>网络流问题</li>
            <li>最大匹配问题</li>
            <li> bipartite图匹配</li>
            <li>运输问题</li>
            <li>任务分配问题</li>
            <li>网络可靠性分析</li>
            <li>通信网络中的流量控制</li>
          </ul>

          <h3>理论扩展</h3>
          <p>福特-富尔克森算法基于最大流最小割定理，该定理指出网络中的最大流等于最小割的容量。这个定理是网络流理论中的核心结果，也是许多网络流算法的基础。</p>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          <p>福特-富尔克森算法是解决网络流问题的基础算法，以下是一些学习要点：</p>

          <h4>核心概念</h4>
          <ul>
            <li><strong>流网络</strong>：一个有向图，其中每条边都有一个非负容量，且有一个源点和一个汇点。</li>
            <li><strong>流</strong>：从源点到汇点的流量分配，满足容量约束和流量守恒。</li>
            <li><strong>残量网络</strong>：表示网络中剩余容量的有向图，包括正向边和反向边。</li>
            <li><strong>增广路径</strong>：残量网络中从源点到汇点的路径，可以用来增加流量。</li>
            <li><strong>最小割</strong>：将图分成两个子集S和T(S包含源点，T包含汇点)的边集，其容量之和最小。</li>
          </ul>

          <h4>算法步骤</h4>
          <ol>
            <li>初始化所有边的流量为0。</li>
            <li>在残量网络中寻找从源点到汇点的增广路径。</li>
            <li>沿增广路径增加尽可能多的流量（路径上的最小残量容量）。</li>
            <li>更新残量网络。</li>
            <li>重复步骤2-4，直到无法找到增广路径。</li>
          </ol>

          <h4>注意事项</h4>
          <ul>
            <li>福特-富尔克森算法的时间复杂度取决于寻找增广路径的方法。</li>
            <li>如果边容量是无理数，算法可能不会终止。</li>
            <li>Edmonds-Karp算法是福特-富尔克森算法的一个特例，它使用BFS寻找增广路径，保证在有限时间内终止。</li>
            <li>在实际应用中，Dinic算法和Push-Relabel算法通常比Edmonds-Karp算法更高效。</li>
          </ul>

          <h4>参考资源</h4>
          <ul>
            <li>《算法导论》（第三版）第26章：最大流</li>
            <li>《算法》（第四版）第4.3节：最大流</li>
            <li>维基百科：福特-富尔克森算法</li>
          </ul>
        </div>
      </div>
    </div>

</template>