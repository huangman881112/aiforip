<style scoped>
 .mst-edge-weight {
  color: #1E88E5 !important;
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

// Kruskal算法可视化相关状态
// 图结构控制
const numNodes = ref(5)
const minNodes = ref(3)
const maxNodes = ref(10)
const minWeight = ref(1)
const maxWeight = ref(10)

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
const mstEdges = ref([])
const totalWeight = ref(0)
const processedEdges = ref(0)

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

// 确保minWeight始终是数字类型
watch(minWeight, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue) || newValue < 1) {
    console.warn('[WARNING] 最小权重不是有效数字，已重置为默认值');
    minWeight.value = 1;
  } else {
    // 确保minWeight不大于maxWeight
    if (newValue > maxWeight.value) {
      minWeight.value = maxWeight.value - 1;
      console.warn('[WARNING] 最小权重大于最大权重，已调整');
    }
  }
})

// 确保maxWeight始终是数字类型
watch(maxWeight, (newValue) => {
  if (typeof newValue !== 'number' || isNaN(newValue) || newValue < 1) {
    console.warn('[WARNING] 最大权重不是有效数字，已重置为默认值');
    maxWeight.value = 10;
  } else {
    // 确保maxWeight不小于minWeight
    if (newValue < minWeight.value) {
      maxWeight.value = minWeight.value + 1;
      console.warn('[WARNING] 最大权重小于最小权重，已调整');
    }
  }
})

// 生成随机加权无向图
const generateRandomGraph = (size, minWeight, maxWeight) => {
  try {
    console.log('生成随机图 - 开始，size:', size, 'minWeight:', minWeight, 'maxWeight:', maxWeight);
    console.log('minWeight类型:', typeof minWeight, '值:', minWeight);
    console.log('maxWeight类型:', typeof maxWeight, '值:', maxWeight);
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的节点数量: ' + size);
    }
    if (typeof minWeight !== 'number' || minWeight < 1) {
      console.error('无效的最小权重:', minWeight);
      throw new Error('无效的最小权重: ' + minWeight);
    } else {
      console.log('最小权重验证通过:', minWeight);
    }
    console.log('[DEBUG] 检查maxWeight类型:', typeof maxWeight, '值:', maxWeight);
    if (typeof maxWeight !== 'number' || maxWeight < minWeight) {
      console.error('[ERROR] maxWeight类型错误:', typeof maxWeight, '值:', maxWeight);
      throw new Error('无效的最大权重: ' + maxWeight);
    }
    
    // 生成节点 (用字母表示)
    const nodes = Array.from({ length: size }, (_, i) => String.fromCharCode(65 + i));
    
    // 生成边 (无向图)
    const graph = {};
    const edges = [];
    nodes.forEach(node => {
      graph[node] = [];
    });
    console.log('生成随机图 - 节点:', nodes);
    
    // 生成完全图的边
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const weight = Math.floor(Math.random() * (maxWeight - minWeight + 1)) + minWeight;
        console.log('生成的边权重:', weight, '范围:', minWeight, '-', maxWeight);
        graph[nodes[i]].push({ node: nodes[j], weight });
        graph[nodes[j]].push({ node: nodes[i], weight });
        edges.push({ from: nodes[i], to: nodes[j], weight });
      }
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
const graphData = ref(generateRandomGraph(numNodes.value, minWeight.value, maxWeight.value))
const currentGraph = ref({...graphData.value.graph})
const currentEdges = ref([...graphData.value.edges])
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

// 检查权重类型
const checkWeightTypes = () => {
 
  // 在页面上显示结果
  currentStepDetails.value = `
    minWeight类型: ${typeof minWeight.value}, 值: ${minWeight.value}
    maxWeight类型: ${typeof maxWeight.value}, 值: ${maxWeight.value}
  `;
}

// 生成新图
const generateNewGraph = async () => {
  isButtonClicked.value = true;
  setTimeout(() => { isButtonClicked.value = false; }, 300);

  try {
    errorMessage.value = ''; // 清除之前的错误
    resetAlgorithm();
    const newGraphData = generateRandomGraph(numNodes.value, minWeight.value, maxWeight.value);
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

// 检查边是否在MST中
const isMSTEdge = (from, to, weight) => {
  // 因为边是无向的，所以需要检查两种顺序
  return mstEdges.value.some(edge => 
    (edge.from === from && edge.to === to && edge.weight === weight) || 
    (edge.from === to && edge.to === from && edge.weight === weight)
  );
};

// 检查节点是否在MST中
const isMSTNode = (node) => {
  // 检查节点是否存在于MST的任何一条边中
  return mstEdges.value.some(edge => 
    edge.from === node || edge.to === node
  );
};

// Kruskal算法实现
const runAlgorithm = async () => {
  console.log('开始算法按钮被点击');
  isButtonClicked.value = true;
  isRunning.value = true;
  algorithmStatus.value = '执行中'
  // 100ms后重置按钮状态
  setTimeout(() => {
    isButtonClicked.value = false;
  }, 100);
  currentStep.value = 0;
  mstEdges.value = [];
  totalWeight.value = 0;
  processedEdges.value = 0;
  algorithmSteps.value = [];
  currentStepDetails.value = '';
  console.log('算法开始前的边列表:', currentEdges.value);
  algorithmSteps.value.push({ step: 0, type: 'info', details: `Kruskal算法开始，寻找最小生成树` });

  // Kruskal算法实现
  // 1. 将所有边按权重从小到大排序
  const sortedEdges = [...currentEdges.value].sort((a, b) => a.weight - b.weight);

  currentStep.value++;
  const sortDetails = `第 ${currentStep.value} 步: 将所有边按权重从小到大排序`;
  console.log(sortDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: sortDetails });
  currentStepDetails.value = sortDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  // 2. 初始化并查集
  const parent = {};
  Object.keys(currentGraph.value).forEach(node => {
    parent[node] = node;
  });

  currentStep.value++;
  const initDetails = `第 ${currentStep.value} 步: 初始化并查集，每个节点的父节点是自己`;
  console.log(initDetails);
  algorithmSteps.value.push({ step: currentStep.value, type: 'info', details: initDetails });
  currentStepDetails.value = initDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  // 并查集查找函数
  const find = (node) => {
    if (parent[node] !== node) {
      parent[node] = find(parent[node]); // 路径压缩
    }
    return parent[node];
  };

  // 并查集合并函数
  const union = (node1, node2) => {
    const root1 = find(node1);
    const root2 = find(node2);
    if (root1 !== root2) {
      parent[root2] = root1;
      return true;
    }
    return false;
  };

  try {
    // 3. 依次考察每条边
    for (const edge of sortedEdges) {
      currentStep.value++;
      const edgeDetails = `第 ${currentStep.value} 步: 考察边 ${edge.from}-${edge.to} (权重: ${edge.weight})`;
      console.log(edgeDetails);
      processedEdges.value++;
      algorithmSteps.value.push({ step: currentStep.value, type: 'visit', details: edgeDetails });
      currentStepDetails.value = edgeDetails;
      await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

      // 检查加入这条边是否会形成环
      if (find(edge.from) !== find(edge.to)) {
        // 不会形成环，加入MST
        union(edge.from, edge.to);
        mstEdges.value.push(edge);
        totalWeight.value += edge.weight;

        currentStep.value++;
        const addDetails = `第 ${currentStep.value} 步: 加入边 ${edge.from}-${edge.to} (权重: ${edge.weight}) 到最小生成树`;
        console.log(addDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'add', details: addDetails });
        currentStepDetails.value = addDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

        // 检查是否已经包含所有节点
        if (mstEdges.value.length === Object.keys(currentGraph.value).length - 1) {
          break;
        }
      } else {
        // 会形成环，跳过这条边
        currentStep.value++;
        const skipDetails = `第 ${currentStep.value} 步: 跳过边 ${edge.from}-${edge.to} (权重: ${edge.weight})，加入会形成环`;
        console.log(skipDetails);
        algorithmSteps.value.push({ step: currentStep.value, type: 'skip', details: skipDetails });
          currentStepDetails.value = skipDetails;
        await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
      }
    }

    isRunning.value = false;
    algorithmStatus.value = '算法完成';
    currentStep.value++;
    const finalDetails = `第 ${currentStep.value} 步: 最小生成树构建完成，总权重: ${totalWeight.value}`;
    console.log(finalDetails);
    algorithmSteps.value.push({ step: currentStep.value, type: 'complete', details: finalDetails });
    currentStepDetails.value = finalDetails;
  } catch (error) {
    console.error('[ERROR] 搜索失败:', error);
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
    mstEdges.value = [];
    totalWeight.value = 0;
    processedEdges.value = 0;
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
  <div class="kruskal-detail detail-container">
  <button class="close-btn" @click="closeDetail">×</button>
    <div class="modal-header">
      <h2>克鲁斯卡尔算法(Kruskal)</h2>
    </div>

    <div class="modal-content">

      <div class="search-section">
        <h3>Kruskal算法可视化</h3>
        <p>克鲁斯卡尔算法(Kruskal)是一种用于寻找加权无向图的最小生成树的算法。它通过按权重排序边并使用并查集来避免环的形成。</p>
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
            <span class="stat-label">MST边数:</span>
            <span class="stat-value">{{ mstEdges.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总权重:</span>
            <span class="stat-value total-weight-value">{{ totalWeight }}</span>
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
                      <!-- 确保每条无向边只绘制一次 -->
                      <template v-if="node < neighbor.node">
                        <!-- 边路径（无向图不显示箭头） -->
                        <path
                          :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor.node]).edgePath"
                          :stroke="isMSTEdge(node, neighbor.node, neighbor.weight) ? '#1E88E5' : '#666'"
                          stroke-width="2"
                          fill="none"
                          :class="{ 'mst-edge': isMSTEdge(node, neighbor.node, neighbor.weight) }"
                        />
                        <!-- 边权重 -->
                        <text
                          :x="(nodesPositions[node].x + nodesPositions[neighbor.node].x) / 2"
                          :y="(nodesPositions[node].y + nodesPositions[neighbor.node].y) / 2 - 10"
                          text-anchor="middle"
                          dominant-baseline="middle"
                          :class="{'edge-weight': true, 'mst-edge-weight': isMSTEdge(node, neighbor.node, neighbor.weight)}"
                        >
                          {{ neighbor.weight }}
                        </text>
                      </template>
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
                      :class="{ 'mst-node': isMSTNode(node) }"
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
                    <p>{{ node }}: {{ neighbors.map(n => `${n.node}(${n.weight})`).join(', ') }}</p>
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
            <label>边权重范围: {{ minWeight }}-{{ maxWeight }}</label>
            <input type="range" min="1" max="20" v-model.number="minWeight" :disabled="isRunning">
            <input type="range" min="1" max="20" v-model.number="maxWeight" :disabled="isRunning">
          </div>
            <div class="slider-group">
              <label>动画速度:</label>
              <input type="range" min="100" max="1000" v-model="animationSpeed" :disabled="isRunning">
            </div>
          </div>

          <div class="button-group">
            <button @click="generateNewGraph" :disabled="isRunning" :class="{ 'clicked': isButtonClicked }">生成新图</button>
            <button @click="checkWeightTypes" :disabled="isRunning" class="ml-2">检查权重类型</button>
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
    </div>
</template>