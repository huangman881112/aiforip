<template>
  <div class="simple-bubble-sort">
    <h2>简单冒泡排序测试</h2>
    <div class="array-container">
      <div v-for="(value, index) in sortedData" :key="index" class="bar" :style="{ height: `${value * 10}px` }"></div>
    </div>
    <div class="controls">
      <button @click="testBubbleSort">测试排序</button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 测试数据
const data = ref([64, 34, 25, 12, 22, 11, 90])
const sortedData = ref([...data.value])

const testBubbleSort = async () => {
  console.log('测试排序按钮被点击')
  alert('测试排序开始')

  const arr = [...data.value]
  const n = arr.length
  console.log('初始数组:', arr)

  for (let i = 0; i < n - 1; i++) {
    console.log(`第 ${i+1} 轮排序开始`)
    let swapped = false
    for (let j = 0; j < n - i - 1; j++) {
      console.log(`比较: ${arr[j]} 和 ${arr[j+1]}`)
      if (arr[j] > arr[j + 1]) {
        // 交换元素
        const temp = arr[j]
        arr[j] = arr[j + 1]
        arr[j + 1] = temp
        swapped = true
        console.log(`交换: ${temp} 和 ${arr[j]}`)
        sortedData.value = [...arr]
        await new Promise(resolve => setTimeout(resolve, 500))
      }
    }
    console.log(`第 ${i+1} 轮排序结束，数组:`, arr)
    if (!swapped) {
      console.log('没有交换发生，数组已经有序')
      break
    }
  }

  console.log('排序完成:', sortedData.value)
  alert('排序完成')
}
</script>

<style scoped>
.simple-bubble-sort {
  padding: 20px;
}

.array-container {
  display: flex;
  align-items: flex-end;
  height: 300px;
  margin: 20px 0;
  gap: 5px;
}

.bar {
  width: 30px;
  background-color: #42b983;
  transition: all 0.3s ease;
}

.controls {
  margin-top: 20px;
}

button {
  padding: 8px 16px;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #2980b9;
}
</style>