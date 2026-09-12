<style scoped >
 .mst-edge-weight {
  color: #1E88E5 !important;
  font-size: 1.5em !important;
  font-weight: bold !important;
}
</style>
<style scoped src="./bfs-styles.css"></style>
<template>
  <div class="algorithm-detail-container detail-container">
   <div class="modal-header">
      <h2>Prim算法</h2>
       <button class="close-btn" @click="closeDetail">×</button>
      <p>Prim算法是一种用于构建最小生成树(MST)的贪心算法，它从一个起始顶点开始，逐步扩展生成树，每次选择与当前生成树相邻且权重最小的边加入生成树。</p>
    </div>
    <div class="modal-content">
      <div class="search-section">
        <h3>Prim算法可视化</h3>
        <p>Prim算法用于构建最小生成树，从一个起始顶点开始，每次选择权重最小的边加入生成树。</p>
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
              <span class="stat-value">{{ visitedNodes.join(', ') }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">MST总权重:</span>
              <span class="stat-value">{{ mstTotalWeight }}</span>
            </div>
          </div>

          <div class="graph-container">
            <div class="graph-left">
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                <!-- 边 -->
                <template v-for="(edges, node) in currentGraph" :key="node + '-edges'">
                  <template v-for="[neighbor, weight] in Object.entries(edges)" :key="node + '-' + neighbor">
                    <template v-if="nodesPositions[node] && nodesPositions[neighbor]">
                      <!-- 边路径 -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).edgePath"
                        :stroke="isMSTEdge(node, neighbor) ? '#1E88E5' : '#666'"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'mst-edge': isMSTEdge(node, neighbor) }"
                      />
        
                      <!-- 边权重 -->
                      <text
                        :x="(nodesPositions[node].x + nodesPositions[neighbor].x) / 2"
                        :y="(nodesPositions[node].y + nodesPositions[neighbor].y) / 2 - 10"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        :class="{'edge-weight': true, 'mst-edge-weight': isMSTEdge(node, neighbor)}"
                      >
                        {{ weight }}
                      </text>
                    </template>
                  </template>
                </template>

                <!-- 节点 -->
                <template v-for="node in Object.keys(currentGraph)" :key="node">
                  <g v-if="nodesPositions[node]">
                    <circle
                      :cx="nodesPositions[node].x+25"
                      :cy="nodesPositions[node].y+25"
                      r="25"
                      class="node"
                      :class="{
                        'visited': visitedNodes.includes(node),
                        'start': node === startNode,
                        'mst-node': isMSTNode(node)
                      }"
                    />
                    <text
                      :x="nodesPositions[node].x+25"
                      :y="nodesPositions[node].y+25"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-text"
                    >
                      {{ node }}
                    </text>
                    <text
                      v-if="node === startNode"
                      :x="nodesPositions[node].x"
                      :y="nodesPositions[node].y + 40"
                      text-anchor="middle"
                      dominant-baseline="middle"
                      class="node-label"
                    >
                      起点
                    </text>
                  </g>
                </template>
              </svg>
            </div>
            <div class="graph-right" style="width: 40%; align-items: center; padding-top: 10%;">
                <div class="graph-info">
                  <h4>图结构信息</h4>
                  <div v-for="(edges, node) in currentGraph" :key="node" class="graph-node-info" style="text-align: left;">
                    <p>{{ node }}: {{ Object.entries(edges).map(([n, w]) => `${n}(${w})`).join(', ') }}</p>
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
              <label>起始节点:</label>
              <select v-model="startNode" :disabled="isRunning">
                <option v-for="node in Object.keys(currentGraph)" :key="node" :value="node">{{ node }}</option>
              </select>
            </div>
            <div class="slider-group">
              <label>边权重范围:</label>
              <input type="range" min="1" max="20" v-model="maxWeight" :disabled="isRunning">
            </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isRunning">
            </div>
          </div>

          <div class="button-group">
            <button @click="generateNewGraph" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">生成新图</button>
            <button @click="runPrim" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">开始算法</button>
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
            <h4>搜索步骤历史</h4>
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

<script setup>
import { ref, computed, onMounted } from 'vue';

// Prim算法可视化相关状态
const numNodes = ref(5);
const minNodes = 3;
const maxNodes = 10;
const maxWeight = ref(10);
const startNode = ref('A');
const animationSpeed = ref(500);
const isRunning = ref(false);
const algorithmStatus = ref('就绪');
const currentStep = ref(0);
const visitedNodes = ref([]);
const mstEdges = ref([]);
const mstTotalWeight = ref(0);
const currentGraph = ref({});
const nodesPositions = ref({});
const algorithmSteps = ref([]);
const currentStepDetails = ref('');
const errorMessage = ref('');
const isButtonClicked = ref(false);

// 生成随机图
function generateRandomGraph(numNodes) {
  const graph = {};
  const nodes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, numNodes);

  // 初始化节点
  nodes.forEach(node => {
    graph[node] = {};
  });

  // 生成边（确保图是连通的）
  for (let i = 0; i < numNodes - 1; i++) {
    const from = nodes[i];
    const to = nodes[i + 1];
    const weight = Math.floor(Math.random() * maxWeight.value) + 1;
    graph[from][to] = weight;
    graph[to][from] = weight;
  }

  // 添加额外的随机边
  const maxExtraEdges = numNodes * (numNodes - 1) / 2 - (numNodes - 1);
  const numExtraEdges = Math.floor(Math.random() * maxExtraEdges / 2) + 1;

  for (let i = 0; i < numExtraEdges; i++) {
    const fromIndex = Math.floor(Math.random() * numNodes);
    const toIndex = Math.floor(Math.random() * numNodes);
    if (fromIndex !== toIndex) {
      const from = nodes[fromIndex];
      const to = nodes[toIndex];
      if (!graph[from][to]) {
        const weight = Math.floor(Math.random() * maxWeight.value) + 1;
        graph[from][to] = weight;
        graph[to][from] = weight;
      }
    }
  }

  return graph;
}

// 生成节点位置
function generateNodesPositions(numNodes) {
    const positions = {};
    const nodes = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').slice(0, numNodes);
    // 根据SVG viewBox(800x600)和节点数量动态计算半径
    const maxWidth = 700; // 留出边距
    const maxHeight = 500; // 留出边距
    const diameter = Math.min(maxWidth, maxHeight) * 0.8; // 直径为较小维度的80%
    const radius = diameter / 2;
    // 中心点设置为viewBox中心
    const centerX = 400;
    const centerY = 300;

    nodes.forEach((node, index) => {
      const angle = (index / numNodes) * 2 * Math.PI;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;
      positions[node] = { x, y };
    });

    return positions;
  }

// 生成新图
function generateNewGraph() {
  isButtonClicked.value = true;
  setTimeout(() => { isButtonClicked.value = false; }, 300);

  resetAlgorithm();
  currentGraph.value = generateRandomGraph(numNodes.value);
  nodesPositions.value = generateNodesPositions(numNodes.value);
  startNode.value = Object.keys(currentGraph.value)[0];
}

// 获取边路径
function getEdgePath(from, to) {
  const fromX = from.x + 25;
  const fromY = from.y + 25;
  const toX = to.x + 25;
  const toY = to.y + 25;

  // 计算箭头位置（距离节点边缘的距离）
  const arrowSize = 15;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitDx = dx / length;
  const unitDy = dy / length;

  // 边的终点（距离节点边缘有一段距离）
  const edgeEndX = toX - unitDx * 25;
  const edgeEndY = toY - unitDy * 25;

  // 箭头的两个点
  const arrow1X = edgeEndX - unitDx * arrowSize + unitDy * arrowSize / 2;
  const arrow1Y = edgeEndY - unitDy * arrowSize - unitDx * arrowSize / 2;
  const arrow2X = edgeEndX - unitDx * arrowSize - unitDy * arrowSize / 2;
  const arrow2Y = edgeEndY - unitDy * arrowSize + unitDx * arrowSize / 2;

  // 边路径
  const edgePath = `M ${fromX} ${fromY} L ${edgeEndX} ${edgeEndY}`;

  // 箭头路径
  const arrowPath = `M ${edgeEndX} ${edgeEndY} L ${arrow1X} ${arrow1Y} M ${edgeEndX} ${edgeEndY} L ${arrow2X} ${arrow2Y}`;

  return { edgePath, arrowPath };
}

// 检查边是否在MST中
function isMSTEdge(from, to) {
  return mstEdges.value.some(edge => 
    (edge.from === from && edge.to === to) || (edge.from === to && edge.to === from)
  );
}

// // 检查边是否在MST中
// const isMSTEdge = (from, to, weight) => {
//   // 因为边是无向的，所以需要检查两种顺序
//   return mstEdges.value.some(edge => 
//     (edge.from === from && edge.to === to && edge.weight === weight) || 
//     (edge.from === to && edge.to === from && edge.weight === weight)
//   );
// };
// 检查节点是否在MST中
function isMSTNode(node) {
  return visitedNodes.value.includes(node);
}

// 运行Prim算法
async function runPrim() {
  if (isRunning.value) return;

  isRunning.value = true;
  algorithmStatus.value = '运行中';
  currentStep.value = 0;
  algorithmSteps.value = [];
  visitedNodes.value = [startNode.value];
  mstEdges.value = [];
  mstTotalWeight.value = 0;
  errorMessage.value = '';

  try {
    // 步骤1: 初始化
    currentStep.value++;
    currentStepDetails.value = `初始化: 从节点 ${startNode.value} 开始`;
    algorithmSteps.value.push({
      step: currentStep.value,
      details: currentStepDetails.value,
      type: 'init'
    });
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    const graph = currentGraph.value;
    const allNodes = Object.keys(graph);

    // 当未访问所有节点时继续
    while (visitedNodes.value.length < allNodes.length) {
      let minEdge = null;
      let minWeight = Infinity;

      // 步骤2: 寻找最小权重边
      currentStep.value++;
      currentStepDetails.value = '寻找连接已访问节点和未访问节点的最小权重边';
      algorithmSteps.value.push({
        step: currentStep.value,
        details: currentStepDetails.value,
        type: 'search'
      });
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 检查所有已访问节点的边
      for (const fromNode of visitedNodes.value) {
        for (const [toNode, weight] of Object.entries(graph[fromNode])) {
          if (!visitedNodes.value.includes(toNode) && weight < minWeight) {
            minEdge = { from: fromNode, to: toNode };
            minWeight = weight;
          }
        }
      }

      if (!minEdge) {
        throw new Error('图不连通，无法构建最小生成树');
      }

      // 步骤3: 添加边到MST
      currentStep.value++;
      currentStepDetails.value = `添加边 ${minEdge.from}-${minEdge.to} (权重: ${minWeight}) 到最小生成树`;
      algorithmSteps.value.push({
        step: currentStep.value,
        details: currentStepDetails.value,
        type: 'add'
      });
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 更新状态
      mstEdges.value.push({ ...minEdge, weight: minWeight });
      mstTotalWeight.value += minWeight;
      visitedNodes.value.push(minEdge.to);

      // 步骤4: 更新已访问节点
      currentStep.value++;
      currentStepDetails.value = `已访问节点: ${visitedNodes.value.join(', ')}`;
      algorithmSteps.value.push({
        step: currentStep.value,
        details: currentStepDetails.value,
        type: 'update'
      });
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    }

    // 完成
    currentStep.value++;
    currentStepDetails.value = `算法完成! 最小生成树总权重: ${mstTotalWeight.value}`;
    algorithmSteps.value.push({
      step: currentStep.value,
      details: currentStepDetails.value,
      type: 'complete'
    });
    algorithmStatus.value = '已完成';
  } catch (error) {
    errorMessage.value = error.message;
    algorithmStatus.value = '出错';
  } finally {
    isRunning.value = false;
  }
}

// 重置算法
function resetAlgorithm() {
  isRunning.value = false;
  algorithmStatus.value = '就绪';
  currentStep.value = 0;
  visitedNodes.value = [];
  mstEdges.value = [];
  mstTotalWeight.value = 0;
  algorithmSteps.value = [];
  currentStepDetails.value = '';
  errorMessage.value = '';
}

// 初始化
onMounted(() => {
  currentGraph.value = generateRandomGraph(numNodes.value);
  nodesPositions.value = generateNodesPositions(numNodes.value);
  startNode.value = Object.keys(currentGraph.value)[0];
});
</script>

