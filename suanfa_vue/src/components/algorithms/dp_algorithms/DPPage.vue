<script setup>
// 动态规划分类页：卡片列表 + 子分类筛选（数据来自单一数据源 data/algorithms.js）
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { categorySubCategories, dpAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

const router = useRouter()

const openDetail = (id) => {
  router.push(`/algorithms/dp/${id}`)
}

// 子分类清单同样取自单一数据源，与卡片上的 subCategory 标签一一对应
const categories = [
  { id: 'all', name: '全部算法' },
  ...categorySubCategories.dp.map((name) => ({ id: name, name })),
]

const currentCategory = ref('all')

const filteredAlgorithms = computed(() =>
  currentCategory.value === 'all'
    ? dpAlgorithms
    : dpAlgorithms.filter((algo) => algo.subCategory === currentCategory.value)
)
</script>

<template>
  <div class="algorithm-page-container dp-page-container">
    <h1>动态规划</h1>
    <p class="page-description">
      动态规划（Dynamic Programming，DP）把问题拆成相互重叠的子问题，按「状态 + 转移方程」自底向上填表，
      从而避免指数级的重复计算。学习时抓住三件事：状态怎么定义、转移方程是什么、边界与填表顺序在哪里。
      下面每个算法都可以逐格观看它填表的过程。
    </p>

    <!-- 子分类标签 -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        :class="{ active: currentCategory === category.id }"
        @click="currentCategory = category.id"
      >
        {{ category.name }}
      </button>
    </div>

    <!-- 算法卡片容器 -->
    <div class="algorithms-grid">
      <div
        v-for="algorithm in filteredAlgorithms"
        :key="algorithm.id"
        class="algorithm-card"
        @click="openDetail(algorithm.id)"
      >
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
/* 分类页外观与排序/搜索/图/动态规划/贪心统一 */
@import '../sorting_algorithms/common-algorithm-page.css';
</style>
