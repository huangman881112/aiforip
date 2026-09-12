<script setup>
// 贪心算法分类页：卡片列表 + 子分类筛选
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { categorySubCategories, greedyAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

const router = useRouter()

const openDetail = (id) => {
  router.push(`/algorithms/greedy/${id}`)
}

// 子分类清单同样取自单一数据源，与卡片上的 subCategory 标签一一对应
const categories = [
  { id: 'all', name: '全部算法' },
  ...categorySubCategories.greedy.map((name) => ({ id: name, name })),
]

const currentCategory = ref('all')

const filteredAlgorithms = computed(() =>
  currentCategory.value === 'all'
    ? greedyAlgorithms
    : greedyAlgorithms.filter((algo) => algo.subCategory === currentCategory.value)
)
</script>

<template>
  <div class="algorithm-page-container greedy-page-container">
    <h1>贪心算法</h1>
    <p class="page-description">
      贪心算法每一步都只挑「当前看起来最好」的选择，不回溯、不试错。它比动态规划更快、更省空间，
      但前提是这个选择具备<strong>贪心选择性质</strong>与<strong>最优子结构</strong>——
      否则就会像「找零问题」里不规范的面额一样给出错误答案。下面的可视化会同时告诉你贪心什么时候成立。
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
