<template>
  <div class="algorithm-detail-container detail-container">
   <div class="modal-header">
      <h2>Prim算法</h2>
       <button class="close-btn" @click="closeDetail">×</button>
      <p>Prim算法是一种用于构建最小生成树(MST)的贪心算法，它从一个起始顶点开始，逐步扩展生成树，每次选择与当前生成树相邻且权重最小的边加入生成树。</p>
      <!-- 标签页控制 -->
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
        <h2>Prim算法基础</h2>

        <div class="section-card">
          <h3>算法描述</h3>
          <p>Prim算法是一种贪心算法，用于在加权连通图中构建最小生成树(MST)。算法的核心思想是：</p>
          <ol>
            <li>从一个起始顶点开始，初始时生成树仅包含该顶点</li>
            <li>在每一步中，选择一条权重最小的边，该边连接当前生成树中的顶点与不在生成树中的顶点</li>
            <li>将选择的边和顶点加入生成树</li>
            <li>重复步骤2-3，直到所有顶点都被加入生成树</li>
          </ol>
        </div>

        <div class="complexity-analysis">
          <h3>复杂度分析</h3>
          <div class="complexity-item merged-complexity">
            <div class="complexity-row">
              <p class="complexity-title" style="text-align: left;">时间复杂度</p>
              <ul class="complexity-subitems" style="text-align: left;">
                <li><span>一般实现:</span> O(E log V)</li>
                <li><span>使用斐波那契堆:</span> O(E + V log V)</li>
              </ul>
            </div>
            <div class="complexity-row">
              <p><span class="complexity-title">空间复杂度:</span> O(V + E)</p>
            </div>
            <div class="complexity-row">
              <p><span class="complexity-title">难度:</span> 中等</p>
            </div>
            <div class="complexity-row">
              <p><strong>V:</strong> 顶点数量, <strong>E:</strong> 边的数量</p>
            </div>
          </div>
        </div>

      
          <div class="code-examples">
          <h3>伪代码</h3>
          <pre><code>function Prim(G, start):
  for each vertex v in G:
    key[v] = ∞
    parent[v] = null
  key[start] = 0
  mstSet = empty set
  priorityQueue = all vertices ordered by key

  while priorityQueue is not empty:
    u = extractMin(priorityQueue)
    add u to mstSet
    for each neighbor v of u:
      if v not in mstSet and weight(u,v) < key[v]:
        key[v] = weight(u,v)
        parent[v] = u
  return parent</code></pre>

          <h3>Python实现</h3>
          <pre><code>import heapq

def prim(graph, start):
    mst = []
    visited = set([start])
    edges = [
        (cost, start, to)
        for to, cost in graph[start].items()
    ]
    heapq.heapify(edges)

    while edges:
        cost, from_node, to_node = heapq.heappop(edges)
        if to_node not in visited:
            visited.add(to_node)
            mst.append((from_node, to_node, cost))

            for next_node, next_cost in graph[to_node].items():
                if next_node not in visited:
                    heapq.heappush(edges, (next_cost, to_node, next_node))
    return mst

# 示例图（邻接表表示）
graph = {
    'A': {'B': 2, 'C': 3},
    'B': {'A': 2, 'C': 1, 'D': 1},
    'C': {'A': 3, 'B': 1, 'D': 4, 'E': 5},
    'D': {'B': 1, 'C': 4, 'E': 2},
    'E': {'C': 5, 'D': 2}
}

# 测试
mst = prim(graph, 'A')
print("最小生成树的边:")
for edge in mst:
    print(f"{edge[0]} - {edge[1]}: {edge[2]}")</code></pre>

          <h3>JavaScript实现</h3>
          <pre><code>function prim(graph, start) {
  const mst = [];
  const visited = new Set([start]);
  const edges = [];

  // 初始化边集合
  for (const [to, cost] of Object.entries(graph[start])) {
    edges.push({ from: start, to, cost });
  }

  // 使用优先队列（最小堆）
  edges.sort((a, b) => a.cost - b.cost);

  while (edges.length > 0) {
    const { from, to, cost } = edges.shift();

    if (!visited.has(to)) {
      visited.add(to);
      mst.push({ from, to, cost });

      // 添加新的边
      for (const [nextTo, nextCost] of Object.entries(graph[to])) {
        if (!visited.has(nextTo)) {
          edges.push({ from: to, to: nextTo, cost: nextCost });
        }
      }

      // 重新排序边集合
      edges.sort((a, b) => a.cost - b.cost);
    }
  }

  return mst;
}

// 示例图（邻接表表示）
const graph = {
  'A': { 'B': 2, 'C': 3 },
  'B': { 'A': 2, 'C': 1, 'D': 1 },
  'C': { 'A': 3, 'B': 1, 'D': 4, 'E': 5 },
  'D': { 'B': 1, 'C': 4, 'E': 2 },
  'E': { 'C': 5, 'D': 2 }
};

// 测试
const mst = prim(graph, 'A');
console.log("最小生成树的边:");
mst.forEach(edge => {
  console.log(`${edge.from} - ${edge.to}: ${edge.cost}`);
});</code></pre> 
        </div>
      </div>
      </div>
      <div v-if="activeTab === 'search'" class="search-content">
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
                      <!-- 箭头路径 -->
                      <path
                        :d="getEdgePath(nodesPositions[node], nodesPositions[neighbor]).arrowPath"
                        :stroke="isMSTEdge(node, neighbor) ? '#1E88E5' : '#666'"
                        stroke-width="2"
                        fill="none"
                      />
                      <!-- 边权重 -->
                      <text
                        :x="(nodesPositions[node].x + nodesPositions[neighbor].x) / 2"
                        :y="(nodesPositions[node].y + nodesPositions[neighbor].y) / 2 - 10"
                        text-anchor="middle"
                        dominant-baseline="middle"
                        class="edge-weight"
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
                        'start': node === startNode.value,
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
                      v-if="node === startNode.value"
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

          <div class="step-history">
            <h4>算法步骤历史</h4>
            <div class="step-container">
              <div v-for="step in algorithmSteps" :key="step.step" :class="'step-item ' + step.type">
                <span class="step-number">{{ step.step }}.</span>
                <span class="step-details">{{ step.details }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="activeTab === 'advanced'" class="advanced-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>算法变种</h3>
          <p>Prim算法有一些重要的变种和优化：</p>
          <ol>
            <li><strong>标准Prim算法</strong>：使用优先队列来选择最小权重的边。</li>
            <li><strong>使用斐波那契堆的Prim算法</strong>：可以将时间复杂度优化到O(E + V log V)。</li>
            <li><strong>适用于稠密图的Prim算法</strong>：对于稠密图，可以使用邻接矩阵表示，时间复杂度为O(V²)。</li>
          </ol>

          <h3>与Kruskal算法的比较</h3>
          <p>Prim算法和Kruskal算法都是构建最小生成树的贪心算法，但它们有以下区别：</p>
          <ul>
            <li>Prim算法从一个顶点开始，逐步扩展生成树；Kruskal算法从所有边开始，按权重排序逐步添加。</li>
            <li>Prim算法更适合于稠密图；Kruskal算法更适合于稀疏图。</li>
            <li>Prim算法使用优先队列；Kruskal算法使用并查集(Union-Find)数据结构。</li>
          </ul>

          <h3>应用场景</h3>
          <p>Prim算法广泛应用于以下场景：</p>
          <ul>
            <li>网络设计（如计算机网络、通信网络）</li>
            <li>电路设计</li>
            <li>交通网络规划</li>
            <li>管道网络优化</li>
            <li>数据聚类</li>
            <li>图像分割</li>
            <li>旅行商问题近似解</li>
          </ul>
        </div>
      </div>

      <div v-if="activeTab === 'learning'" class="learning-section">
        <div class="markdown-content" style="text-align: left;">
          <h3>学习资源</h3>
          <p>以下是学习Prim算法的一些优质资源：</p>
          <ul>
            <li><strong>算法导论</strong>：第23章详细介绍了最小生成树算法，包括Prim算法和Kruskal算法。</li>
            <li><strong>数据结构与算法分析</strong>：提供了Prim算法的多种实现方式和复杂度分析。</li>
            <li><strong>在线课程</strong>：Coursera上的算法课程通常会详细讲解最小生成树算法。</li>
            <li><strong>可视化工具</strong>：使用算法可视化工具可以帮助理解Prim算法的执行过程。</li>
          </ul>

          <h3>常见问题</h3>
          <dl>
            <dt><strong>Prim算法是否总是能找到最小生成树？</strong></dt>
            <dd>是的，当图中的边权重都是正数时，Prim算法总是能找到最小生成树。</dd>

            <dt><strong>Prim算法的时间复杂度取决于什么？</strong></dt>
            <dd>Prim算法的时间复杂度取决于用于选择最小权重边的数据结构。使用二叉堆时为O(E log V)，使用斐波那契堆时为O(E + V log V)。</dd>

            <dt><strong>Prim算法和Dijkstra算法有什么相似之处？</strong></dt>
            <dd>两者都使用优先队列来选择下一个节点，并且都可以用类似的方式实现。但Prim算法寻找最小生成树，而Dijkstra算法寻找最短路径。</dd>
          </dl>

          <h3>实践提示</h3>
          <p>在实现Prim算法时，需要注意以下几点：</p>
          <ul>
            <li>选择合适的数据结构来表示图（邻接表或邻接矩阵）。</li>
            <li>使用高效的优先队列实现来降低时间复杂度。</li>
            <li>确保正确处理图中的负权重边（虽然在最小生成树问题中，通常假设边权重为正）。</li>
            <li>对于大型图，可以考虑使用并行化技术来加速算法。</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';

// 标签页状态
const activeTab = ref('basic');

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

<style scoped src="./bfs-styles.css"></style>