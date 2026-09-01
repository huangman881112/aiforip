<script setup>
import { ref } from 'vue'
import AlgorithmComplexity from '../../common/AlgorithmComplexity.vue'
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
  graph, currentGraph, nodesPositions,
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

// 控制标签页切换
const activeTab = ref('basic')

// BFS 专属状态
const visitedNodes = ref([])
const path = ref([])
const found = ref(false)
// BFS搜索算法实现
const bfsSearch = async () => {
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

  // BFS搜索实现
  const visited = new Set();
  const queue = [startNode.value];
  const parent = new Map(); // 用于记录路径

  visited.add(startNode.value);
  visitedNodes.value.push(startNode.value);
  path.value = [startNode.value];

  currentStep.value++;
  const stepDetails = `第 ${currentStep.value} 步: 初始化队列，加入起始节点 ${startNode.value}`;
  console.log(stepDetails);
  searchSteps.value.push({ step: currentStep.value, type: 'visit', details: stepDetails });
  currentStepDetails.value = stepDetails;
  await new Promise(resolve => setTimeout(resolve, animationSpeed.value));

  try {
    while (queue.length > 0 && !found.value) {
      const node = queue.shift();

      currentStep.value++;
      const dequeueDetails = `第 ${currentStep.value} 步: 从队列中取出节点 ${node}`;
      console.log(dequeueDetails);
      searchSteps.value.push({ step: currentStep.value, type: 'visit', details: dequeueDetails });
      currentStepDetails.value = dequeueDetails;
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

        // 重建路径
        const resultPath = [];
        let current = node;
        while (current) {
          resultPath.unshift(current);
          current = parent.get(current);
        }
        path.value = resultPath;
        break;
      }

      // 访问所有邻居
      for (const neighbor of currentGraph.value[node] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          visitedNodes.value.push(neighbor);
          queue.push(neighbor);
          parent.set(neighbor, node);

          currentStep.value++;
          const neighborDetails = `第 ${currentStep.value} 步: 访问节点 ${neighbor}，加入队列`;
          console.log(neighborDetails);
          searchSteps.value.push({ step: currentStep.value, type: 'neighbor', details: neighborDetails });
          currentStepDetails.value = neighborDetails;
          await new Promise(resolve => setTimeout(resolve, animationSpeed.value));
        }
      }
    }

    isSearching.value = false;
    if (found.value) {
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