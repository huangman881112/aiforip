// 排序可视化共享脚手架
// 抽取自 10 个排序 Detail 组件中逐字重复的可视化调度逻辑：
// listSize 校验、随机数据生成、生成新列表、重置排序、统计状态。
// 各 Detail 只保留算法专属逻辑（sortFn/testSort + 自定义 ref），
// 算法专属状态的重置通过 onReset 钩子注入。
import { ref, watch, nextTick } from 'vue'

/**
 * @param {Object} [options]
 * @param {number} [options.defaultSize=7]   默认列表长度
 * @param {number} [options.minSize=3]       列表长度下限
 * @param {number} [options.maxSize=20]      列表长度上限
 * @param {Function} [options.generateRandomData] 自定义数据生成器 (size) => number[]；默认生成 1-100 随机数
 * @param {Function|null} [options.onReset]  重置排序时清除算法专属状态（在公共状态清零后调用）
 */
export function useSortingVisualization(options = {}) {
  const defaultSize = options.defaultSize ?? 7
  const minSize = ref(options.minSize ?? 3)
  const maxSize = ref(options.maxSize ?? 20)
  const generateRandomData = options.generateRandomData ?? ((size) => {
    if (typeof size !== 'number' || size < 1) {
      throw new Error('无效的数组大小: ' + size)
    }
    return Array.from({ length: size }, () => Math.floor(Math.random() * 100) + 1)
  })
  const onReset = options.onReset ?? null

  // 列表大小控制
  const listSize = ref(defaultSize)
  watch(listSize, (newValue) => {
    if (typeof newValue !== 'number' || isNaN(newValue)) {
      listSize.value = defaultSize
    } else {
      listSize.value = Math.max(minSize.value, Math.min(maxSize.value, Math.round(newValue)))
    }
  })

  // 错误信息 / 步骤记录
  const errorMessage = ref('')
  const sortingSteps = ref([])
  const currentStepDetails = ref('')

  const data = ref(generateRandomData(defaultSize))
  const sortedData = ref([...data.value])

  // 可视化统计状态
  const isSorting = ref(false)
  const isButtonClicked = ref(false)
  const sortingStatus = ref('就绪')
  const animationSpeed = ref(500)
  const comparisonCount = ref(0)
  const swapCount = ref(0)
  const currentStep = ref(0)
  const comparedIndices = ref([])
  const swappedIndices = ref([])

  // 生成新列表：校验大小 → 生成随机数据 → 等待 DOM → 重置排序
  const generateNewList = async () => {
    try {
      errorMessage.value = ''
      const size = Number(listSize.value)
      if (typeof size !== 'number' || isNaN(size)) {
        throw new Error('列表大小必须是数字类型')
      }
      const clampedSize = Math.max(minSize.value, Math.min(maxSize.value, Math.round(size)))
      if (clampedSize !== size) {
        listSize.value = clampedSize
      }
      data.value = generateRandomData(listSize.value)
      await nextTick()
      resetSort()
    } catch (error) {
      errorMessage.value = `生成新列表失败: ${error.message}`
      currentStepDetails.value = errorMessage.value
      alert(errorMessage.value)
    }
  }

  // 重置排序：Fisher-Yates 打乱 + 公共状态清零
  const resetSort = () => {
    isSorting.value = false
    const shuffled = [...data.value]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      const temp = shuffled[i]
      shuffled[i] = shuffled[j]
      shuffled[j] = temp
    }
    sortedData.value = shuffled
    comparisonCount.value = 0
    swapCount.value = 0
    currentStep.value = 0
    comparedIndices.value = []
    swappedIndices.value = []
    sortingStatus.value = '就绪'
    sortingSteps.value = []
    currentStepDetails.value = ''
    if (typeof onReset === 'function') {
      onReset()
    }
  }

  return {
    listSize, minSize, maxSize,
    errorMessage, sortingSteps, currentStepDetails,
    generateRandomData, data, sortedData,
    generateNewList, resetSort,
    isSorting, isButtonClicked, sortingStatus, animationSpeed,
    comparisonCount, swapCount, currentStep, comparedIndices, swappedIndices,
  }
}