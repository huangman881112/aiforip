<script setup>
import { ref } from 'vue'
import { useGraphVisualization } from '../../../composables/useGraphVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

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

// 搜索参数（须在脚手架之前声明，generateGraph 闭包会引用）
const startNode = ref('A')
const targetNode = ref('C')

// 可视化共享脚手架（节点数/图数据/节点位置/统计状态/生成新图/重置搜索）
const {
  numNodes, minNodes, maxNodes,
  errorMessage, searchSteps, currentStepDetails,
  currentGraph, nodesPositions,
  generateNewGraph, resetSearch,
  isSearching, isButtonClicked, searchStatus, animationSpeed, currentStep,
} = useGraphVisualization({
  generateGraph: (size) => {
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i))
    if (!nodes.includes(startNode.value)) {
      startNode.value = nodes[0]
    }
    if (!nodes.includes(targetNode.value) || targetNode.value === startNode.value) {
      targetNode.value = nodes.length > 1 ? nodes[1] : nodes[0]
    }
    return generateRandomWeightedGraph(size)
  },
  onReset: () => {
    visitedNodes.value = []
    path.value = []
    found.value = false
    distances.value = {}
    predecessors.value = {}
  },
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// Dijkstra 专属状态
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)
const distances = ref({})
const predecessors = ref({})

// 生成带箭头的边路径（含权重位置，Dijkstra 模板专用）
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

// 重置搜索与 onMounted 布局由 useGraphVisualization 提供
</script>

<style scoped src="./dfs-styles.css"></style>

<template>
  <div class="dfs-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>狄克斯特拉算法(Dijkstra)</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
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
          <div v-if="path.length > 0 && found" class="stat-item">
            <span class="stat-label">总距离:</span>
            <span class="stat-value">{{ distances[targetNode] }}</span>
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
                        stroke="#6b7c99"
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
                        'target': node === targetNode,
                        'start': node === startNode
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
                      v-if="node === startNode || node === targetNode"
                      :x="nodesPositions[node].x + 25"
                      :y="nodesPositions[node].y + 60"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-label"
                    >
                      {{ node === startNode ? '起点' : '终点' }}
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
                <option v-for="node in Object.keys(currentGraph)" :key="node" :value="node" :disabled="node === startNode">{{ node }}</option>
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
    </div>
</template>