<script setup>
import { ref } from 'vue'
import { useGraphVisualization } from '../../../composables/useGraphVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

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

// 搜索参数（须在脚手架之前声明，generateGraph 闭包会引用）
const startNode = ref('A')
const targetNode = ref('C')

// 可视化共享脚手架（节点数/图数据/节点位置/统计状态/生成新图/重置搜索）
const {
  numNodes, minNodes, maxNodes,
  errorMessage, searchSteps, currentStepDetails,
  currentGraph, nodesPositions,
  getEdgePath, generateNewGraph, resetSearch,
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
    return generateRandomGraph(size)
  },
  onReset: () => {
    visitedNodes.value = []
    path.value = []
    found.value = false
    hasNegativeCycle.value = false
    distances.value = {}
  },
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// Floyd-Warshall 专属状态
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)
const distances = ref({})
const hasNegativeCycle = ref(false)

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

// 重置搜索与 onMounted 布局由 useGraphVisualization 提供
</script>

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="floyd-warshall-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>Floyd-Warshall算法</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
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
                      stroke="#6b7c99"
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
                      fill="#e9eff8"
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
     </div>
 </div>
</template>