<script setup>
import { ref, onMounted, nextTick } from 'vue'
import * as XLSX from 'xlsx'

// 分页参数
const currentPage = ref(1)
const pageSize = ref(10)
const totalItems = ref(0)
const tasks = ref([])
const loading = ref(false)
const exportLoading = ref(false)
const allTasks = ref([])
const 工时Map = ref({})

// 生成模拟任务数据
function generateMockTasks() {
  const tasks = [];
  for (let i = 1; i <= 30; i++) {
    tasks.push({
      id: i,
      title: `任务 ${i}`,
      status: ['待处理', '进行中', '已完成', '已延期'][Math.floor(Math.random() * 4)],
      createTime: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
      工时: Math.floor(Math.random() * 10) + 1
    });
  }
  return tasks;
}

// 从页面section元素提取任务数据
const extractTasksFromSection = () => {
  loading.value = true
  try {
    // 等待DOM更新完成
    nextTick(() => {
      // 获取section元素
      const section = document.querySelector('section.teamix-layout-content')
      if (!section) {
        console.error('未找到任务列表section元素。请确保页面中有class为teamix-layout-content的section元素。')
        console.warn('将使用模拟数据。')
        const mockTasks = generateMockTasks()
        allTasks.value = mockTasks
        totalItems.value = mockTasks.length

        // 加载当前页数据
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        tasks.value = allTasks.value.slice(startIndex, endIndex)

        // 初始化工时Map
        mockTasks.forEach(task => {
          const taskId = `task_${task.id}`
          工时Map.value[taskId] = task.工时
        })

        loading.value = false
        return
      }

      // 获取所有任务行
      const taskRows = section.querySelectorAll('tbody tr')
      if (taskRows.length === 0) {
        console.error('在section元素中未找到任务行。请确保任务列表以表格形式呈现且包含tbody和tr元素。')
        console.warn('将使用模拟数据。')
        const mockTasks = generateMockTasks()
        allTasks.value = mockTasks
        totalItems.value = mockTasks.length

        // 加载当前页数据
        const startIndex = (currentPage.value - 1) * pageSize.value
        const endIndex = startIndex + pageSize.value
        tasks.value = allTasks.value.slice(startIndex, endIndex)

        // 初始化工时Map
        mockTasks.forEach(task => {
          const taskId = `task_${task.id}`
          工时Map.value[taskId] = task.工时
        })

        loading.value = false
        return
      }
      const extractedTasks = []

      taskRows.forEach((row, index) => {
        // 获取标题
        const titleElement = row.querySelector('.yunxiao-projex-workitem-title')
        const title = titleElement ? titleElement.title || titleElement.textContent : `未命名任务 ${index + 1}`

        // 获取状态
        const statusElement = row.querySelector('.workitemStatus--statusMenu--JUX5Omr span')
        const status = statusElement ? statusElement.textContent : '未知状态'

        // 获取创建时间
        // 假设创建时间在第6个td元素(索引5)
        const createTimeElement = row.cells[5]?.querySelector('.teamix-title span')
        const createTime = createTimeElement ? createTimeElement.textContent : '未知时间'

        // 初始化工时为0
        const taskId = `task_${index + 1}`

        extractedTasks.push({
          id: index + 1,
          title,
          status,
          createTime,
          工时: 0 // 默认工时为0，用户可以修改
        })

        // 初始化工时Map
        工时Map.value[taskId] = 0
      })

      allTasks.value = extractedTasks
      totalItems.value = extractedTasks.length

      // 加载当前页数据
      const startIndex = (currentPage.value - 1) * pageSize.value
      const endIndex = startIndex + pageSize.value
      tasks.value = allTasks.value.slice(startIndex, endIndex)

      loading.value = false
    })
  } catch (error) {
    console.error('提取任务数据失败:', error)
    console.warn('将使用模拟数据。')
    const mockTasks = generateMockTasks()
    allTasks.value = mockTasks
    totalItems.value = mockTasks.length

    // 加载当前页数据
    const startIndex = (currentPage.value - 1) * pageSize.value
    const endIndex = startIndex + pageSize.value
    tasks.value = allTasks.value.slice(startIndex, endIndex)

    // 初始化工时Map
    mockTasks.forEach(task => {
      const taskId = `task_${task.id}`
      工时Map.value[taskId] = task.工时
    })

    loading.value = false
  }
}

// 更新工时
const update工时 = (taskId, value) => {
  工时Map.value[taskId] = Number(value) || 0
  // 更新对应任务的工时
  const task = allTasks.value.find(t => `task_${t.id}` === taskId)
  if (task) {
    task.工时 = 工时Map.value[taskId]
  }
}

// 分页获取任务数据
const fetchTasks = () => {
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  tasks.value = allTasks.value.slice(startIndex, endIndex)
}

// 导出为Excel
const exportToExcel = () => {
  exportLoading.value = true
  try {
    // 准备导出数据（只包含需要的字段）
    const exportData = allTasks.value.map(task => ({
      标题: task.title,
      状态: task.status,
      创建时间: task.createTime,
      工时: task.工时
    }))

    // 创建工作表
    const ws = XLSX.utils.json_to_sheet(exportData)
    // 创建工作簿
    const wb = XLSX.utils.book_new()
    // 将工作表添加到工作簿
    XLSX.utils.book_append_sheet(wb, ws, '任务数据')
    // 导出Excel文件
    XLSX.writeFile(wb, '任务数据.xlsx')

    exportLoading.value = false
  } catch (error) {
    console.error('导出Excel失败:', error)
    exportLoading.value = false
  }
}

// 上一页
const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--
    fetchTasks()
  }
}

// 下一页
const nextPage = () => {
  if (currentPage.value * pageSize.value < totalItems.value) {
    currentPage.value++
    fetchTasks()
  }
}

// 初始加载数据
onMounted(() => {
  extractTasksFromSection()
  // 监听section内容变化，实时更新任务数据
  const observer = new MutationObserver(extractTasksFromSection)
  const section = document.querySelector('section.teamix-layout-content')
  if (section) {
    observer.observe(section, { childList: true, subtree: true })
  }
})
</script>

<template>
  <div class="task-export-container">
    <h2>任务数据管理</h2>
    <div class="export-button-container">
      <button @click="exportToExcel" :disabled="exportLoading || tasks.length === 0">
        <span v-if="exportLoading">导出中...</span>
        <span v-else>导出为Excel</span>
      </button>
    </div>

    <div class="tasks-table-container">
      <table class="tasks-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>标题</th>
            <th>状态</th>
            <th>创建时间</th>
            <th>工时 (小时)</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="task in tasks" :key="task.id">
            <td>{{ task.id }}</td>
            <td>{{ task.title }}</td>
            <td>{{ task.status }}</td>
            <td>{{ task.createTime }}</td>
            <td>
              <input
                type="number"
                :id="`task_${task.id}`"
                :value="task.工时"
                @input="update工时(`task_${task.id}`, $event.target.value)"
                min="0"
                step="0.5"
                class="work-time-input"
              >
            </td>
          </tr>
          <tr v-if="loading">
            <td colspan="5" class="loading-cell">加载中...</td>
          </tr>
          <tr v-else-if="tasks.length === 0">
            <td colspan="5" class="empty-cell">暂无数据，请确保页面中有任务列表section元素</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="pagination">
      <button @click="prevPage" :disabled="currentPage === 1 || loading">上一页</button>
      <span>第 {{ currentPage }} 页 / 共 {{ Math.ceil(totalItems / pageSize) }} 页</span>
      <button @click="nextPage" :disabled="currentPage * pageSize >= totalItems || loading">下一页</button>
    </div>
  </div>
</template>

<style scoped>
.task-export-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.export-button-container {
  margin-bottom: 20px;
  text-align: right;
}

.export-button-container button {
  padding: 8px 16px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-button-container button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.tasks-table-container {
  overflow-x: auto;
}

.tasks-table {
  width: 100%;
  border-collapse: collapse;
}

.tasks-table th,
.tasks-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.tasks-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

.tasks-table th:nth-child(1),
.tasks-table td:nth-child(1) {
  width: 50px;
  text-align: center;
}

.tasks-table th:nth-child(2),
.tasks-table td:nth-child(2) {
  width: 40%;
}

.tasks-table th:nth-child(3),
.tasks-table td:nth-child(3) {
  width: 120px;
}

.tasks-table th:nth-child(4),
.tasks-table td:nth-child(4) {
  width: 120px;
}

.tasks-table th:nth-child(5),
.tasks-table td:nth-child(5) {
  width: 100px;
}

.tasks-table tr:hover {
  background-color: #f5f5f5;
}

.loading-cell,
.empty-cell {
  text-align: center;
  color: #666;
}

.work-time-input {
  width: 80px;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  gap: 10px;
}

.pagination button {
  padding: 6px 12px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background-color: #f8f8f8;
  color: #ccc;
  cursor: not-allowed;
}
</style>