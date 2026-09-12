<script setup>
import { ref } from 'vue'
import { useGraphVisualization } from '../../../composables/useGraphVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

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
    predecessors.value = {}
  },
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// Bellman-Ford 专属状态
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)
const hasNegativeCycle = ref(false)
const distances = ref({})
const predecessors = ref({})

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

// 重置搜索与 onMounted 布局由 useGraphVisualization 提供
</script>

<style scoped src="./bfs-styles.css"></style>

<template>
  <div class="bellman-ford-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>Bellman-Ford算法</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
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
    </div>
</template>