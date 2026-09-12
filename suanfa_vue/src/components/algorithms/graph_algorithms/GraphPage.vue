<script setup>
// 图算法页面组件
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// 单一数据源
import { graphAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

const router = useRouter()

// 点击卡片/查看详情 -> 统一详情页路由
const openDetail = (id) => {
  router.push(`/algorithms/graph/${id}`)
}

// 分类标签
const categories = [
  { id: 'all', name: '全部算法' },
  { id: 'traversal', name: '图遍历' },
  { id: 'shortest-path', name: '最短路径' },
  { id: 'mst', name: '最小生成树' },
  { id: 'network-flow', name: '网络流' },
  { id: 'topology', name: '拓扑结构' }
]

// 当前选中的分类
const currentCategory = ref('all')

// 筛选算法
const filteredAlgorithms = computed(() => {
  if (currentCategory.value === 'all') {
    return graphAlgorithms
  } else if (currentCategory.value === 'traversal') {
    return graphAlgorithms.filter(algo => algo.subCategory === '图遍历')
  } else if (currentCategory.value === 'shortest-path') {
    return graphAlgorithms.filter(algo => algo.subCategory === '最短路径')
  } else if (currentCategory.value === 'mst') {
    return graphAlgorithms.filter(algo => algo.subCategory === '最小生成树')
  } else if (currentCategory.value === 'network-flow') {
    return graphAlgorithms.filter(algo => algo.subCategory === '网络流')
  } else if (currentCategory.value === 'topology') {
    return graphAlgorithms.filter(algo => algo.subCategory === '拓扑结构')
  }
  return graphAlgorithms
})
</script>

<template>
  <div class="graph-page-container">
    <h1>图算法</h1>
    <p class="page-description">
      图算法是用于解决图结构相关问题的算法。图是由顶点和边组成的数据结构，广泛应用于计算机网络、社交网络、路由算法等领域。以下是常见的图算法分类和实现。
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
/* 引入公共样式文件（与排序/搜索页统一由 common-algorithm-page.css 提供） */
@import '../sorting_algorithms/common-algorithm-page.css';
</style>
