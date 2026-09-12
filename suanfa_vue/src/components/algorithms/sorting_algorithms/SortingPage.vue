<script setup>
// 排序算法页面组件
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
// 单一数据源
import { sortingAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

const router = useRouter()

// 点击卡片/查看详情 -> 统一详情页路由
const openDetail = (id) => {
  router.push(`/algorithms/sorting/${id}`)
}

// 分类标签
const categories = [
  { id: 'all', name: '全部排序' },
  { id: 'comparison', name: '比较类排序' },
  { id: 'non-comparison', name: '非比较类排序' },
  { id: 'stable', name: '稳定排序' },
  { id: 'unstable', name: '不稳定排序' }
]

// 当前选中的分类
const currentCategory = ref('all')

// 筛选算法
const filteredAlgorithms = computed(() => {
  if (currentCategory.value === 'all') {
    return sortingAlgorithms
  } else if (currentCategory.value === 'comparison') {
    return sortingAlgorithms.filter(algo => algo.subCategory === '比较类排序')
  } else if (currentCategory.value === 'non-comparison') {
    return sortingAlgorithms.filter(algo => algo.subCategory === '非比较类排序')
  } else if (currentCategory.value === 'stable') {
    return sortingAlgorithms.filter(algo => algo.stability === '稳定')
  } else if (currentCategory.value === 'unstable') {
    return sortingAlgorithms.filter(algo => algo.stability === '不稳定')
  }
  return sortingAlgorithms
})
</script>

<template>
  <div class="sorting-page-container">
    <h1>排序算法</h1>
    <p class="page-description">
      排序算法是计算机科学中最基础且应用广泛的算法之一。它通过特定的规则将一组数据按照一定的顺序排列。以下是常见的排序算法分类和实现。
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
            <span :class="['tag', algorithm.stability === '稳定' ? 'stable-tag' : 'unstable-tag']">
              {{ algorithm.stability }}
            </span>
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
/* 引入公共样式文件 */
@import './common-algorithm-page.css';

/* 排序页面特有样式 */
.sorting-page-container {
  /* 继承自公共样式，如有需要可添加排序页面特有样式 */
}
</style>
