<style scoped>
 .topo-edge-active { 
  stroke: #1E88E5 !important;
  stroke-width: 3 !important;
}
 .topo-node-active { 
  fill: #1E88E5 !important;
}
 .topo-node-visited { 
  fill: #4CAF50 !important;
}
 .topo-node-in-stack { 
  fill: #FF9800 !important;
}
 .topo-edge-weight { 
  color: #1E88E5 !important;
  font-size: 1.2em !important;
  font-weight: bold !important;
}

/* 进度条样式 */
.progress-container {
  width: 100%;
  margin: 15px 0;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.progress-label {
  margin-bottom: 5px;
  font-weight: bold;
  color: #333;
}

.progress-bar {
  width: 100%;
  height: 10px;
  background-color: #e0e0e0;
  border-radius: 5px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
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

// 拓扑排序算法可视化相关状态
// 图结构控制
const numNodes = ref(5)
const minNodes = ref(3)
const maxNodes = ref(10)
const hasCycle = ref(false)

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
const topoOrder = ref([])
const visitedNodes = ref([])
const recursionStack = ref([])
const processedNodes = ref(0)
const hasCycleMessage = ref('')
// 优化添加的状态
const progressPercent = ref(0)
const executionTime = ref(0)

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

// 生成随机有向无环图 (DAG)，可以选择是否生成环
const generateRandomGraph = (size, includeCycle = false) => {
  try {
    console.log('生成随机图 - 开始，size:', size, 'includeCycle:', includeCycle);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    hasCycle.value = includeCycle;
    hasCycleMessage.value = includeCycle ? '图中包含环，无法进行拓扑排序' : '';

    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));

    // 生成边 (有向图)
    const graph = {};
    const edges = [];
    nodes.forEach(node => {
      graph[node] = [];
    });
    console.log('生成随机图 - 节点:', nodes);

    // 生成有向边，确保默认情况下是DAG
    for (let i = 0; i < nodes.length; i++) {
      // 每个节点连接到后面的节点，形成DAG
      const maxConnections = Math.min(3, nodes.length - i - 1);
      const numConnections = Math.max(1, Math.floor(Math.random() * maxConnections) + 1);
      
      for (let j = 0; j < numConnections; j++) {
        const targetIndex = i + 1 + Math.floor(Math.random() * (nodes.length - i - 1));
        const from = nodes[i];
        const to = nodes[targetIndex];
        graph[from].push({ node: to });
        edges.push({ from, to });
      }
    }

    // 如果需要包含环
    if (includeCycle && size > 2) {
      // 随机选择两个节点形成环
      const node1Index = Math.floor(Math.random() * (size - 1));
      let node2Index = Math.floor(Math.random() * (size - node1Index - 1)) + node1Index + 1;
      
      // 确保至少有一个边从后向前
      const temp = node1Index;
      node1Index = node2Index;
      node2Index = temp;
      
      const from = nodes[node1Index];
      const to = nodes[node2Index];
      graph[from].push({ node: to });
      edges.push({ from, to });
      console.log('生成环: ', from, '->', to);
    }

    console.log('生成随机图 - 边:', graph);
    console.log('生成随机图 - 边列表:', edges);
    return { graph, edges };
  } catch (error) {
    console.error('生成随机图失败:', error.message);
    throw error; // 重新抛出错误以便上层处理
  }
}

// 模拟图数据
const graphData = ref(generateRandomGraph(numNodes.value, hasCycle.value))
const currentGraph = ref({...graphData.value.graph})
const currentEdges = ref([...graphData.value.edges])
const nodesPositions = ref({})

// 生成节点位置 - 优化的力导向布局
const generateNodesPositions = () => {const positions = {};
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
  isButtonClicked.value = true;
  setTimeout(() => { isButtonClicked.value = false; }, 300);

  try {
    errorMessage.value = ''; // 清除之前的错误
    resetAlgorithm();
    const newGraphData = generateRandomGraph(numNodes.value, hasCycle.value);
    console.log('[DEBUG] 生成的新图:', newGraphData);

    // 更新图
    graphData.value = newGraphData;
    currentGraph.value = {...graphData.value.graph};
    currentEdges.value = [...graphData.value.edges];
    console.log('[DEBUG] 图已更新:', currentGraph.value);

    // 生成节点位置
    nodesPositions.value = generateNodesPositions();
    console.log('[DEBUG] 生成新图 - 完成');
  } catch (error) {
    console.error('[ERROR] 生成新图失败:', error);
    console.error('[ERROR] 错误堆栈:', error.stack);
    errorMessage.value = `生成新图失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
  }
}

// 切换是否包含环
const toggleCycle = () => {
  hasCycle.value = !hasCycle.value;
  generateNewGraph();
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

// 检查节点是否已访问 - 优化为使用Set提高查找效率
const visitedSet = new Set();
const isVisited = (node) => {
  return visitedSet.has(node);
};

// 检查节点是否在递归栈中 - 优化为使用Set提高查找效率
const stackSet = new Set();
const isInStack = (node) => {
  return stackSet.has(node);
};

// 算法类型选择
const algorithmType = ref('dfs'); // 'dfs' 或 'kahn'

// 拓扑排序算法入口
const runAlgorithm = async () => {
  console.log('开始算法按钮被点击');
  isButtonClicked.value = true;
  isRunning.value = true;
  algorithmStatus.value = '执行中';
  progressPercent.value = 0; // 初始化进度
  
  // // 100ms后重置按钮状态
  // setTimeout(() => {
  //   isButtonClicked.value = false;
  // }, 100);
  
  // 重置算法状态
  currentStep.value = 0;
  topoOrder.value = [];
  visitedNodes.value = [];
  recursionStack.value = [];
  processedNodes.value = 0;
  algorithmSteps.value = [];
  currentStepDetails.value = '';
  errorMessage.value = '';
  executionTime.value = 0;
  const startTime = performance.now();
  
  try {
    if (algorithmType.value === 'dfs') {
      await runDfsAlgorithm(startTime);
    } else {
      await runKahnAlgorithm(startTime);
    }
  } catch (error) {
    console.error('[ERROR] 算法执行失败:', error);
    isRunning.value = false;
    algorithmStatus.value = '算法失败';
    errorMessage.value = `算法执行失败: ${error.message}`;
    currentStepDetails.value = errorMessage.value;
    algorithmSteps.value.push({ step: currentStep.value + 1, type: 'error', details: errorMessage.value });
  }
};

// DFS方法实现拓扑排序
const runDfsAlgorithm = async (startTime) => {
  if (hasCycle.value) {
    isRunning.value = false;
    algorithmStatus.value = '无法执行';
    errorMessage.value = '图中包含环，无法进行拓扑排序';
    currentStepDetails.value = errorMessage.value;
    return;
  }

  console.log('DFS算法开始前的图:', currentGraph.value);
  algorithmSteps.value.push({ step: 0, type: 'info', details: `DFS拓扑排序算法开始，寻找有向无环图的拓扑序列` });

  currentStep.value++;
  const initDetails = `第 ${currentStep.value} 步: 初始化访问数组和递归栈`;
  console.log(initDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  const nodes = Object.keys(currentGraph.value);
  const totalNodes = nodes.length;

  // 对每个未访问的节点执行DFS
  for (const node of nodes) {
    if (!isVisited(node)) {
      currentStep.value++;
      const startDetails = `第 ${currentStep.value} 步: 开始访问节点 ${node}`;
      console.log(startDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: startDetails });
      currentStepDetails.value = startDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      await dfs(node);
    }
    // 更新进度
    progressPercent.value = Math.round((processedNodes.value / totalNodes) * 100);
  }

  // 反转拓扑序列以获得正确顺序
  topoOrder.value = topoOrder.value.reverse();

  // 计算执行时间
  executionTime.value = Math.round(performance.now() - startTime);

  isRunning.value = false;
  algorithmStatus.value = '算法完成';
  currentStep.value++;
  const finalDetails = `第 ${currentStep.value} 步: DFS拓扑排序完成，排序结果: ${topoOrder.value.join(' -> ')}，执行时间: ${executionTime.value}ms`;
  console.log(finalDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
  currentStepDetails.value = finalDetails;
};

// Kahn算法实现拓扑排序 - 优化版本
const runKahnAlgorithm = async (startTime) => {
  console.log('开始执行Kahn算法');
  algorithmType.value = 'kahn';
  algorithmSteps.value.push({ step: 0, type: 'info', details: `Kahn拓扑排序算法开始，基于入度的迭代方法` });
  currentStep.value++;

  const graph = currentGraph.value;
  // 使用Map存储入度表，提高查找和更新效率
  const inDegreeMap = new Map();
  const queue = []; // 入度为0的节点队列
  const result = [];

  // 获取所有节点
  const nodes = Object.keys(graph);
  const totalNodes = nodes.length;

  // 初始化入度表为0
  nodes.forEach(node => {
    inDegreeMap.set(node, 0);
  });

  // 计算每个节点的入度
  nodes.forEach(node => {
    const neighbors = graph[node] || [];
    neighbors.forEach(neighbor => {
      const nextNode = neighbor.node;
      inDegreeMap.set(nextNode, (inDegreeMap.get(nextNode) || 0) + 1);
    });
  });

  const initDetails = `第 ${currentStep.value} 步: 初始化入度表`;
  console.log(initDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
  currentStep.value++;

  // 将所有入度为0的节点加入队列
  nodes.forEach(node => {
    if (inDegreeMap.get(node) === 0) {
      queue.push(node);
      algorithmSteps.value.push({ step: currentStep.value, type: 'queue', details: `节点 ${node} 入度为0，加入队列` });
      currentStep.value++;
    }
  });

  const queueDetails = `第 ${currentStep.value} 步: 初始队列: [${queue.join(', ')}]`;
  console.log(queueDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: queueDetails });
  currentStepDetails.value = queueDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
  currentStep.value++;

  let processed = 0;

  // 开始Kahn算法
  while (queue.length > 0) {
    const node = queue.shift();
    result.push(node);
    processed++;
    progressPercent.value = Math.round((processed / totalNodes) * 100);

    const processDetails = `第 ${currentStep.value} 步: 从队列取出节点 ${node}，加入结果序列`;
    console.log(processDetails);
    algorithmSteps.value.push({ step: currentStep.value, type: 'process', details: processDetails });
    currentStepDetails.value = processDetails;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    currentStep.value++;

    // 减少所有邻居节点的入度
    if (graph[node]) {
      for (const neighbor of graph[node]) {
        const nextNode = neighbor.node;

        currentStep.value++;
        const neighborDetails = `第 ${currentStep.value} 步: 处理节点 ${node} 的邻接节点 ${nextNode}`;
        console.log(neighborDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: neighborDetails });
        currentStepDetails.value = neighborDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        currentStep.value++;

        // 减少入度
        const newInDegree = inDegreeMap.get(nextNode) - 1;
        inDegreeMap.set(nextNode, newInDegree);
        
        const updateDetails = `第 ${currentStep.value} 步: 节点 ${nextNode} 入度减1，当前入度: ${newInDegree}`;
        console.log(updateDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'update', details: updateDetails });
        currentStepDetails.value = updateDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        currentStep.value++;

        if (newInDegree === 0) {
          queue.push(nextNode);
          const queueDetails = `第 ${currentStep.value} 步: 节点 ${nextNode} 入度变为0，加入队列`;
          console.log(queueDetails);
          algorithmSteps.value.push({ step: currentStep.value, type: 'queue', details: queueDetails });
          currentStepDetails.value = queueDetails;
          await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
          currentStep.value++;
        }
      }
    }
  }

  // 检查是否有环
  if (result.length !== totalNodes) {
    hasCycle.value = true;
    isRunning.value = false;
    algorithmStatus.value = '无法执行';
    errorMessage.value = '图中包含环，无法进行拓扑排序';
    currentStepDetails.value = errorMessage.value;
    algorithmSteps.value.push({ step: currentStep.value, type: 'error', details: errorMessage.value });
    return;
  }

  topoOrder.value = result;

  // 计算执行时间
  executionTime.value = Math.round(performance.now() - startTime);

  isRunning.value = false;
  algorithmStatus.value = '算法完成';
  const finalDetails = `第 ${currentStep.value} 步: Kahn拓扑排序完成，排序结果: ${topoOrder.value.join(' -> ')}，执行时间: ${executionTime.value}ms`;
  console.log(finalDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
  currentStepDetails.value = finalDetails;
}

// 深度优先搜索函数 - 非递归实现
const dfs = async (startNode) => {
  // 使用显式栈来避免递归调用导致的栈溢出
  const stack = [{ node: startNode, visited: false }];
  const tempStack = []; // 用于存储后序遍历结果

  while (stack.length > 0) {
    const { node, visited } = stack.pop();

    if (!visited) {
      // 第一次访问节点
      if (isVisited(node)) continue;

      // 标记节点为已访问
      visitedNodes.value.push(node);
      visitedSet.add(node);
      processedNodes.value++;
      // 将节点加入递归栈
      recursionStack.value.push(node);
      stackSet.add(node);

      currentStep.value++;
      const visitDetails = `第 ${currentStep.value} 步: 访问节点 ${node}，将其加入递归栈`;
      console.log(visitDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'visit', details: visitDetails });
      currentStepDetails.value = visitDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 将节点重新入栈，并标记为已访问
      stack.push({ node, visited: true });

      // 将所有未访问的邻接节点入栈（逆序以保持相同的遍历顺序）
      const neighbors = currentGraph.value[node] || [];
      for (let i = neighbors.length - 1; i >= 0; i--) {
        const neighbor = neighbors[i];
        const nextNode = neighbor.node;

        currentStep.value++;
        const neighborDetails = `第 ${currentStep.value} 步: 考察节点 ${node} 的邻接节点 ${nextNode}`;
        console.log(neighborDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: neighborDetails });
        currentStepDetails.value = neighborDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

        if (!isVisited(nextNode)) {
          stack.push({ node: nextNode, visited: false });
        } else if (isInStack(nextNode)) {
          // 检测到环
          hasCycle.value = true;
          hasCycleMessage.value = '图中包含环，无法进行拓扑排序';
          errorMessage.value = `检测到环: ${nextNode} -> ${node}`;
          currentStepDetails.value = errorMessage.value;
          algorithmSteps.value.push({ step: currentStep.value + 1, type: 'error', details: errorMessage.value });
          throw new Error(errorMessage.value);
        }
      }
    } else {
      // 第二次访问节点，处理后序遍历
      recursionStack.value = recursionStack.value.filter(n => n !== node);
      stackSet.delete(node);
      tempStack.push(node); // 存储后序遍历结果

      currentStep.value++;
      const processDetails = `第 ${currentStep.value} 步: 节点 ${node} 的所有邻接节点处理完成，将其加入拓扑序列`;
      console.log(processDetails);
      algorithmSteps.value.push({ step: currentStep.value, type: 'process', details: processDetails });
      currentStepDetails.value = processDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    }
  }

  // 将后序遍历结果添加到拓扑序列
  topoOrder.value.push(...tempStack);
};

// 重置算法
const resetAlgorithm = () => {
  try {
    isRunning.value = false;
    
    // 重置算法状态
    algorithmStatus.value = '就绪';
    currentStep.value = 0;
    topoOrder.value = [];
    visitedNodes.value = [];
    recursionStack.value = [];
    processedNodes.value = 0;
    algorithmSteps.value = [];
    currentStepDetails.value = '';
    errorMessage.value = '';
    
    // 重新复制原始图
    currentGraph.value = {...graphData.value.graph};
    currentEdges.value = [...graphData.value.edges];
    console.log('[DEBUG] 重置算法 - 图已重置:', currentGraph.value);
  } catch (error) {
    console.error('[ERROR] 重置算法失败:', error);
    console.error('[ERROR] 错误堆栈:', error.stack);
    throw error;
  }
}

// 组件挂载时生成节点位置
onMounted(() => {
  nodesPositions.value = generateNodesPositions();
});
</script>

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="topological-sort-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>拓扑排序算法(Topological Sort)</h2>
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
          <p>拓扑排序(Topological Sort)是一种对有向无环图(DAG)中的节点进行排序的算法，使得对于每一条有向边(u, v)，节点u在排序结果中都出现在节点v之前。</p>

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
                <p><span class="complexity-title">难度:</span> 中等</p>
              </div>
            </div>
          </div>

          <div class="code-examples">
            <h3>伪代码</h3>
            <pre><code>function topologicalSort(G):
  visited = empty set
  recursionStack = empty set
  result = empty stack
  
  for each node u in G:
    if u not in visited:
      if dfs(u, visited, recursionStack, result) is False:
        return "Graph contains cycle"
  
  return result reversed
  
function dfs(u, visited, recursionStack, result):
  add u to visited
  add u to recursionStack
  
  for each neighbor v of u:
    if v not in visited:
      if dfs(v, visited, recursionStack, result) is False:
        return False
    else if v in recursionStack:
      return False
  
  remove u from recursionStack
  push u to result
  return True</code></pre>

            <h3>Python 实现</h3>
            <pre><code>def topological_sort(graph):
    visited = set()
    recursion_stack = set()
    result = []
    
    def dfs(node):
        visited.add(node)
        recursion_stack.add(node)
        
        for neighbor in graph.get(node, []):
            if neighbor not in visited:
                if not dfs(neighbor):
                    return False
            elif neighbor in recursion_stack:
                return False
        
        recursion_stack.remove(node)
        result.append(node)
        return True
    
    for node in graph:
        if node not in visited:
            if not dfs(node):
                return "Graph contains cycle"
    
    return result[::-1]  # 反转结果

# 示例使用
# graph = {
#     'A': ['B', 'C'],
#     'B': ['D'],
#     'C': ['D'],
#     'D': ['E'],
#     'E': []
# }
# print(topological_sort(graph))  # 输出: ['A', 'C', 'B', 'D', 'E']</code></pre>

            <h3>JavaScript 实现</h3>
            <pre><code>function topologicalSort(graph) {
    const visited = new Set();
    const recursionStack = new Set();
    const result = [];
    
    function dfs(node) {
        visited.add(node);
        recursionStack.add(node);
        
        for (const neighbor of graph[node] || []) {
            if (!visited.has(neighbor)) {
                if (!dfs(neighbor)) {
                    return false;
                }
            } else if (recursionStack.has(neighbor)) {
                return false;
            }
        }
        
        recursionStack.delete(node);
        result.push(node);
        return true;
    }
    
    for (const node in graph) {
        if (!visited.has(node)) {
            if (!dfs(node)) {
                return "Graph contains cycle";
            }
        }
    }
    
    return result.reverse();
}

// 示例使用
// const graph = {
//     'A': ['B', 'C'],
//     'B': ['D'],
//     'C': ['D'],
//     'D': ['E'],
//     'E': []
// };
// console.log(topologicalSort(graph));  // 输出: ['A', 'C', 'B', 'D', 'E']</code></pre>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'search'" class="search-section">
        <h3>拓扑排序算法可视化</h3>
        <p>拓扑排序是一种对有向无环图(DAG)中的节点进行排序的算法，使得对于每一条有向边(u, v)，节点u在排序结果中都出现在节点v之前。</p>
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
            <span class="stat-label">已访问节点:</span>
            <span class="stat-value">{{ processedNodes }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">拓扑序列长度:</span>
            <span class="stat-value">{{ topoOrder.length }}</span>
          </div>
          <div class="stat-item" v-if="topoOrder.length > 0">
            <span class="stat-label">当前拓扑序列:</span>
            <span class="stat-value topo-order-value">{{ topoOrder.join(' -> ') }}</span>
          </div>
        </div>

        <div v-if="hasCycleMessage" class="error-message cycle-message">
          <p>{{ hasCycleMessage }}</p>
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
                        stroke="#666"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'topo-edge-active': isVisited(node) && isVisited(neighbor.node) }"
                      />
                      <!-- 箭头 -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor.node]).arrowPath"
                        stroke="#666"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'topo-edge-active': isVisited(node) && isVisited(neighbor.node) }"
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
                        'topo-node-visited': isVisited(node),
                        'topo-node-in-stack': isInStack(node)
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
                  </g>
                </template>
              </svg>
            </div>
            <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
                <div class="graph-info">
                  <h4>图结构信息</h4>
                  <div v-for="(neighbors, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                    <p>{{ node }}: {{ neighbors.map(n => n.node).join(', ') }}</p>
                  </div>
                </div>
            </div>
          </div>

         <div class="progress-container" v-if="isRunning">
            <div class="progress-label">算法进度: {{ progressPercent }}%</div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
            </div>
          </div>
          
          <div class="slider-controls">
            <div class="slider-group">
              <label>节点数量: {{ numNodes }}</label>
              <input type="text" :min="minNodes" :max="maxNodes" v-model.number="numNodes" :disabled="isRunning" @input="numNodes = Number($event.target.value)" class="short-input">
              <span class="range-info">({{ minNodes }}-{{ maxNodes }})</span>
            </div>
            <div class="slider-group">
              <label>算法类型:</label>
              <select v-model="algorithmType" :disabled="isRunning">
                <option value="dfs">DFS算法</option>
                <option value="kahn">Kahn算法</option>
              </select>
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isRunning">
            </div>
            <div class="slider-group">
              <label>包含环:</label>
              <input type="checkbox" v-model="hasCycle" :disabled="isRunning" @change="toggleCycle">
              <span v-if="hasCycle">是</span>
              <span v-else>否</span>
            </div>
          </div>

          <div class="button-group">
            <button @click="generateNewGraph" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">生成新图</button>
            <button @click="runAlgorithm" :disabled="isRunning || hasCycle" :class="{ 'clicked': isButtonClicked }">运行算法</button>
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
          <p>拓扑排序算法有一些重要的变种和扩展：</p>
          <ol>
            <li><strong>Kahn算法</strong>：基于入度的拓扑排序算法，通过反复移除入度为0的节点实现。</li>
            <li><strong>并行拓扑排序</strong>：利用并行计算来加速拓扑排序过程。</li>
            <li><strong>动态拓扑排序</strong>：当图的结构发生变化时，能够高效地更新拓扑序列。</li>
            <li><strong>带权拓扑排序</strong>：考虑边权重的拓扑排序扩展。</li>
          </ol>

          <h3>应用场景</h3>
          <p>拓扑排序广泛应用于以下场景：</p>
          <ul>
            <li>项目调度和任务排序</li>
            <li>编译系统中的依赖解析</li>
            <li>数据库查询优化</li>
            <li>网络路由算法</li>
            <li>事件驱动系统</li>
            <li>工厂生产流程规划</li>
            <li>软件包管理系统</li>
            <li>电路设计</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'notes'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习笔记</h3>
          <p>拓扑排序是一种仅适用于有向无环图(DAG)的排序算法。如果图中存在环，则无法进行拓扑排序。</p>
          <p>拓扑排序的结果不是唯一的。对于同一个DAG，可能存在多个有效的拓扑序列。</p>
          <p>拓扑排序通常有两种实现方式：</p>
          <ol>
            <li><strong>深度优先搜索(DFS)方法</strong>：通过DFS访问所有节点，在回溯时将节点加入结果列表，最后反转该列表。</li>
            <li><strong>Kahn算法</strong>：通过反复移除入度为0的节点并将其加入结果列表来实现。</li>
          </ol>
          <p>在实现拓扑排序时，需要注意以下几点：</p>
          <ul>
            <li>检测图中是否存在环。如果存在环，拓扑排序将无法完成。</li>
            <li>拓扑排序的时间复杂度为O(V + E)，其中V是节点数量，E是边的数量。</li>
            <li>对于大型图，可以考虑使用并行化技术来加速拓扑排序过程。</li>
            <li>在实际应用中，拓扑排序通常与其他算法结合使用，如关键路径分析。</li>
          </ul>
          <p>拓扑排序在计算机科学中有着广泛的应用，特别是在那些需要处理依赖关系的场景中。</p>
        </div>
      </div>
    </div>
</template>