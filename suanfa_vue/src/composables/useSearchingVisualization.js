// 搜索可视化共享脚手架
// 抽取自 6 个搜索 Detail 组件中逐字重复的可视化调度逻辑：
// listSize/targetValue 校验、随机数据生成、生成新列表、重置搜索、统计状态。
// 各 Detail 只保留算法专属逻辑（searchFn/testSearch + 自定义 ref），
// 算法专属状态的重置通过 onReset 钩子注入。
import { ref, watch, nextTick } from 'vue'

/**
 * @param {Object} [options]
 * @param {number} [options.defaultSize=7]     默认列表长度
 * @param {number} [options.minSize=3]         列表长度下限
 * @param {number} [options.maxSize=20]        列表长度上限
 * @param {number} [options.defaultTarget=35]  默认目标值
 * @param {number} [options.minTarget=1]       目标值下限
 * @param {number} [options.maxTarget=100]     目标值上限
 * @param {Function} [options.generateRandomData] 自定义数据生成器 (size) => number[]；默认生成 1-100 随机数
 * @param {Function|null} [options.onReset]    重置搜索时清除算法专属状态
 */
export function useSearchingVisualization(options = {}) {
  const defaultSize = options.defaultSize ?? 7
  const minSize = ref(options.minSize ?? 3)
  const maxSize = ref(options.maxSize ?? 20)
  const defaultTarget = options.defaultTarget ?? 35
  const minTarget = ref(options.minTarget ?? 1)
  const maxTarget = ref(options.maxTarget ?? 100)
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

  // 目标值控制
  const targetValue = ref(defaultTarget)
  watch(targetValue, (newValue) => {
    if (typeof newValue !== 'number' || isNaN(newValue)) {
      targetValue.value = defaultTarget
    } else {
      targetValue.value = Math.max(minTarget.value, Math.min(maxTarget.value, Math.round(newValue)))
    }
  })

  // 错误信息 / 步骤记录
  const errorMessage = ref('')
  const searchSteps = ref([])
  const currentStepDetails = ref('')

  const data = ref(generateRandomData(defaultSize))
  const searchData = ref([...data.value])

  // 可视化统计状态
  const isSearching = ref(false)
  const isButtonClicked = ref(false)
  const searchStatus = ref('就绪')
  const animationSpeed = ref(500)
  const comparisonCount = ref(0)
  const currentStep = ref(0)
  const currentIndex = ref(-1)
  const foundIndex = ref(-1)

  // 生成新列表：校验大小 → 生成随机数据 → 等待 DOM → 重置搜索
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
      resetSearch()
    } catch (error) {
      errorMessage.value = `生成新列表失败: ${error.message}`
      currentStepDetails.value = errorMessage.value
      alert(errorMessage.value)
    }
  }

  // 重置搜索：公共状态清零 + 重新复制原始数据
  const resetSearch = () => {
    isSearching.value = false
    searchStatus.value = '就绪'
    comparisonCount.value = 0
    currentStep.value = 0
    currentIndex.value = -1
    foundIndex.value = -1
    searchSteps.value = []
    currentStepDetails.value = ''
    searchData.value = [...data.value]
    if (typeof onReset === 'function') {
      onReset()
    }
  }

  return {
    listSize, minSize, maxSize,
    targetValue, minTarget, maxTarget,
    errorMessage, searchSteps, currentStepDetails,
    generateRandomData, data, searchData,
    generateNewList, resetSearch,
    isSearching, isButtonClicked, searchStatus, animationSpeed,
    comparisonCount, currentStep, currentIndex, foundIndex,
  }
}