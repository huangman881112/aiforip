// 图算法可视化共享脚手架
// 抽取自 11 个图算法 Detail 组件中逐字重复的可视化调度逻辑：
// numNodes 校验、节点位置生成、箭头边路径计算、生成新图、重置搜索、统计状态。
// 各 Detail 只保留算法专属逻辑（图生成器 generateGraph + 搜索/遍历函数 + 自定义 ref），
// 算法专属状态的重置通过 onReset 钩子注入。
import { ref, watch, nextTick } from 'vue'

/**
 * @param {Object} [options]
 * @param {number} [options.defaultSize=5]       默认节点数
 * @param {number} [options.minSize=3]           节点数下限
 * @param {number} [options.maxSize=10]          节点数上限
 * @param {Function} [options.generateGraph]     图生成器 (size) => graph 对象
 * @param {Function|null} [options.onReset]      重置搜索时清除算法专属状态
 */
export function useGraphVisualization(options = {}) {
  const defaultSize = options.defaultSize ?? 5
  const minSize = ref(options.minSize ?? 3)
  const maxSize = ref(options.maxSize ?? 10)
  const generateGraph = options.generateGraph ?? (() => ({}))
  const onReset = options.onReset ?? null

  // 图结构控制
  const numNodes = ref(defaultSize)
  watch(numNodes, (newValue) => {
    if (typeof newValue !== 'number' || isNaN(newValue)) {
      numNodes.value = defaultSize
    } else {
      numNodes.value = Math.max(minSize.value, Math.min(maxSize.value, Math.round(newValue)))
    }
  })

  // 错误信息 / 步骤记录
  const errorMessage = ref('')
  const searchSteps = ref([])
  const currentStepDetails = ref('')

  // 图数据（初始图在 setup 时生成一次）
  const graph = ref(generateGraph(defaultSize))
  const currentGraph = ref({ ...graph.value })

  // 可视化统计状态
  const isSearching = ref(false)
  const isButtonClicked = ref(false)
  const searchStatus = ref('就绪')
  const animationSpeed = ref(500)
  const currentStep = ref(0)

  // 生成节点位置（800x600 viewBox，环形布局）
  const generateNodesPositions = () => {
    const positions = {}
    const nodes = Object.keys(currentGraph.value)
    const maxWidth = 700
    const maxHeight = 500
    const diameter = Math.min(maxWidth, maxHeight) * 0.8
    const radius = diameter / 2
    const centerX = 400
    const centerY = 300
    nodes.forEach((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI
      positions[node] = {
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle)
      }
    })
    return positions
  }

  // 首帧渲染发生在 onMounted 之前，必须在 setup 内同步生成初始位置，
  // 否则模板读 nodesPositions[node].x 会取到 undefined 而崩溃。
  const nodesPositions = ref(generateNodesPositions())

  // 生成带箭头的边路径（边 + 箭头分开）
  const getEdgePath = (start, end) => {
    const startX = start.x + 25
    const startY = start.y + 25
    const endX = end.x + 25
    const endY = end.y + 25

    const dx = endX - startX
    const dy = endY - startY
    const length = Math.sqrt(dx * dx + dy * dy)
    const unitDx = dx / length
    const unitDy = dy / length

    const nodeRadius = 25
    const adjustedEndX = endX - nodeRadius * unitDx
    const adjustedEndY = endY - nodeRadius * unitDy

    const arrowLength = 10
    const arrowWidth = 5

    const arrow1X = adjustedEndX - arrowLength * unitDx + arrowWidth * unitDy
    const arrow1Y = adjustedEndY - arrowLength * unitDy - arrowWidth * unitDx
    const arrow2X = adjustedEndX - arrowLength * unitDx - arrowWidth * unitDy
    const arrow2Y = adjustedEndY - arrowLength * unitDy + arrowWidth * unitDx

    return {
      edgePath: `M ${startX} ${startY} L ${adjustedEndX} ${adjustedEndY}`,
      arrowPath: `M ${adjustedEndX} ${adjustedEndY} L ${arrow1X} ${arrow1Y} M ${adjustedEndX} ${adjustedEndY} L ${arrow2X} ${arrow2Y}`
    }
  }

  // 生成新图：校验节点数 → 生成图 → 等待 DOM → 重置搜索 → 重新布局
  const generateNewGraph = async () => {
    try {
      errorMessage.value = ''
      const size = Number(numNodes.value)
      if (typeof size !== 'number' || isNaN(size)) {
        throw new Error('节点数量必须是数字类型')
      }
      const clampedSize = Math.max(minSize.value, Math.min(maxSize.value, Math.round(size)))
      if (clampedSize !== size) {
        numNodes.value = clampedSize
      }
      graph.value = generateGraph(numNodes.value)
      await nextTick()
      resetSearch()
      nodesPositions.value = generateNodesPositions()
    } catch (error) {
      errorMessage.value = `生成新图失败: ${error.message}`
      currentStepDetails.value = errorMessage.value
      alert(errorMessage.value)
    }
  }

  // 重置搜索：公共状态清零 + 重新复制原始图
  const resetSearch = () => {
    isSearching.value = false
    searchStatus.value = '就绪'
    currentStep.value = 0
    searchSteps.value = []
    currentStepDetails.value = ''
    currentGraph.value = { ...graph.value }
    if (typeof onReset === 'function') {
      onReset()
    }
  }

  return {
    numNodes, minNodes: minSize, maxNodes: maxSize,
    errorMessage, searchSteps, currentStepDetails,
    graph, currentGraph, nodesPositions,
    generateNodesPositions, getEdgePath,
    generateNewGraph, resetSearch,
    isSearching, isButtonClicked, searchStatus, animationSpeed, currentStep,
  }
}