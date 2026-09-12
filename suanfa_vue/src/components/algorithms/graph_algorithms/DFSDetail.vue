<script setup>
import { ref } from 'vue'
import { useGraphVisualization } from '../../../composables/useGraphVisualization.js'

// 定义emits
const emit = defineEmits(['close'])

// 生成随机有向无环图(DAG)
const generateRandomDAG = (size) => {
  try {
    console.log('生成随机DAG - 开始，size:', size);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边 (确保是DAG)
    const graph = {};
    nodes.forEach(node => {
      graph[node] = [];
    
    });
    console.log('生成随机DAG - 节点:', nodes);
    // 为每个节点添加指向后面节点的边 (确保无环)
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      // 每个节点可以连接到后面的1到3个节点
      const numEdges = Math.floor(Math.random() * 3) + 1;
      for (let j = 1; j <= numEdges && i + j < nodes.length; j++) {
        graph[node].push(nodes[i + j]);
      }
    }
    console.log('生成随机DAG - 边:', graph);

    // 随机添加一些反向边，但确保仍然是DAG
    for (let i = nodes.length - 1; i > 0; i--) {
      const node = nodes[i];
      // 50%的概率添加反向边
      if (Math.random() > 0.5) {
        const numBackEdges = Math.floor(Math.random() * 2) + 1;
        for (let j = 1; j <= numBackEdges && i - j >= 0; j++) {
          const backNode = nodes[i - j];
          console.log('生成随机DAG - 尝试添加反向边:', node, '->', backNode);
          // 确保backNode存在于graph中，并检查是否已有边
          if (graph[backNode] && !graph[backNode].includes(node)) {
            graph[node].push(backNode);
          }
        }
      }
    }
    
    console.log('生成随机DAG - 完成，结果:', graph);
    return graph;
  } catch (error) {
    console.error('生成随机DAG失败:', error.message);
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
    return generateRandomDAG(size)
  },
  onReset: () => {
    visitedNodes.value = []
    path.value = []
    found.value = false
  },
})

// 关闭详情
const closeDetail = () => {
  emit('close')
}

// DFS 专属状态
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)

// DFS搜索算法实现
const dfsSearch = async () => {
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

  // DFS搜索实现
  const visited = new Set();
  const currentPath = [];

  const dfs = async (node) => {
    // 如果找到目标节点，终止搜索
    if (found.value) {
      return true;
    }

    // 如果节点已访问，直接返回
    if (visited.has(node)) {
      return false;
    }

    // 标记为已访问
    visited.add(node);
    visitedNodes.value.push(node);
    currentPath.push(node);
    path.value = [...currentPath];

    currentStep.value++;
    const stepDetails = `第 ${currentStep.value} 步: 访问节点 ${node}`;
    console.log(stepDetails);
    searchSteps.value.push({ step: currentStep.value, type: 'visit', details: stepDetails });
    currentStepDetails.value = stepDetails;
    await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

    // 如果找到目标节点
    if (node === targetNode.value) {
      found.value = true;
      currentStep.value++;
      const foundDetails = `第 ${currentStep.value} 步: 找到目标节点 ${node}`;
      console.log(foundDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'found', details: foundDetails });
      currentStepDetails.value = foundDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      return true;
    }

    // 访问所有邻居
    for (const neighbor of currentGraph.value[node] || []) {
      if (found.value) break;
      
      currentStep.value++;
      const neighborDetails = `第 ${currentStep.value} 步: 从节点 ${node} 移动到邻居 ${neighbor}`;
      console.log(neighborDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'neighbor', details: neighborDetails });
      currentStepDetails.value = neighborDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      if (await dfs(neighbor)) {
        return true;
      }
    }

    // 回溯
    if (!found.value) {
      currentPath.pop();
      path.value = [...currentPath];
      currentStep.value++;
      const backtrackDetails = `第 ${currentStep.value} 步: 从节点 ${node} 回溯`;
      console.log(backtrackDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'backtrack', details: backtrackDetails });
      currentStepDetails.value = backtrackDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
    }

    return found.value;
  };

  try {
    // 开始搜索
    const result = await dfs(startNode.value);

    isSearching.value = false;
    if (result) {
      searchStatus.value = '搜索成功';
      currentStep.value++;
      const finalDetails = `第 ${currentStep.value} 步: 搜索完成，找到路径: [${path.value.join(' -> ')}]`;
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
      <h2>深度优先搜索(DFS)</h2>
    </div>

    <div class="modal-content">

      <div class="sort-section">
        <h3>DFS搜索可视化</h3>
        <p>深度优先搜索(DFS)是一种用于遍历或搜索树或图的算法。它尽可能深地搜索图的分支，当节点的所有边都已被探寻过，搜索将回溯到发现该节点的那条边的起始节点。</p>
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
        </div>

      
          <div class="graph-container">
            <div class="graph-left">
              <!-- 合并后的SVG容器：边和节点 -->
              <svg width="100%" height="100%" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet">
                <!-- 移除marker定义，使用CSS实现箭头 -->

                <!-- 边 -->
                <template v-for="(neighbors, node) in currentGraph" :key="node + '-edges'">
                  <template v-for="neighbor in neighbors" :key="node + '-' + neighbor">
                    <template v-if="nodesPositions[node] && nodesPositions[neighbor]">
                      <!-- 边路径 (黑色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).edgePath"
                        stroke="#6b7c99"
                        stroke-width="2"
                        fill="none"
                        :class="{ 'path-highlight': isPathEdge(node, neighbor) }"
                      />
                      <!-- 箭头路径 (红色) -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).arrowPath"
                        stroke="#ff0000"
                        stroke-width="2"
                        fill="none"
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
                        'visited': visitedNodes.includes(node),
                        'current': path.length > 0 && path[path.length - 1] === node,
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
                    <p>{{ node }}: {{ neighbors.join(', ') }}</p>
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
            <button @click="dfsSearch" :disabled="isSearching" :class="{ 'clicked': isButtonClicked }">开始搜索</button>
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