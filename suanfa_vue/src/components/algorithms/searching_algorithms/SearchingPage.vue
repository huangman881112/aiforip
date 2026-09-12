<script setup>
// 搜索算法页面组件
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// 单一数据源
import { searchingAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

const router = useRouter()

// 点击卡片/查看详情 -> 统一详情页路由
const openDetail = (id) => {
  router.push(`/algorithms/searching/${id}`)
}

// 分类标签
const categories = [
  { id: 'all', name: '全部搜索' },
  { id: 'sequential', name: '顺序查找' },
  { id: 'divide', name: '分治查找' },
  { id: 'block', name: '分块查找' },
  { id: 'hash', name: '哈希查找' }
]

// 当前选中的分类
const currentCategory = ref('all')

// 筛选算法
const filteredAlgorithms = computed(() => {
  if (currentCategory.value === 'all') {
    return searchingAlgorithms
  } else if (currentCategory.value === 'sequential') {
    return searchingAlgorithms.filter(algo => algo.subCategory === '顺序查找')
  } else if (currentCategory.value === 'divide') {
    return searchingAlgorithms.filter(algo => algo.subCategory === '分治查找')
  } else if (currentCategory.value === 'block') {
    return searchingAlgorithms.filter(algo => algo.subCategory === '分块查找')
  } else if (currentCategory.value === 'hash') {
    return searchingAlgorithms.filter(algo => algo.subCategory === '哈希查找')
  }
  return searchingAlgorithms
})
</script>

<template>
  <div class="searching-page-container">
    <h1>搜索算法</h1>
    <p class="page-description">
      搜索算法是计算机科学中用于查找数据结构中特定元素的算法。以下是常见的搜索算法分类和实现。
    </p>

    <!-- 分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ 'active': currentCategory === category.id }"
        @click="currentCategory = category.id"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 算法卡片容器 -->
    <div class="algorithms-grid">
      <div v-for="algorithm in filteredAlgorithms" :key="algorithm.id" class="algorithm-card" @click="openDetail(algorithm.id)">
        <div class="card-header">
          <h3>{{ algorithm.name }}</h3>
          <div class="tags-container">
            <span class="tag difficulty-tag">{{ algorithm.difficulty }}</span>
            <span class="tag category-tag">{{ algorithm.subCategory }}</span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity">{{ algorithm.complexity }}</span>
          <ProgressMark :algorithm-id="algorithm.id" />
          <button class="detail-btn" @click.stop="openDetail(algorithm.id)">查看详情</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 引入公共样式文件（与排序/图页统一外观） */
@import '../sorting_algorithms/common-algorithm-page.css';
</style>
