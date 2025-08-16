<script setup>
// 搜索算法页面组件
import { ref, computed } from 'vue'
import LinearSearchDetail from './LinearSearchDetail.vue'
import BinarySearchDetail from './BinarySearchDetail.vue'
import InterpolationSearchDetail from './InterpolationSearchDetail.vue'
import JumpSearchDetail from './JumpSearchDetail.vue'
import ExponentialSearchDetail from './ExponentialSearchDetail.vue'
import HashingSearchDetail from './HashingSearchDetail.vue'

// 当前选中的算法ID
const selectedAlgorithm = ref(null)

// 滚动到详情区域
const scrollToDetail = () => {
  setTimeout(() => {
    let detailElement;
    if (selectedAlgorithm.value === 1) {
      detailElement = document.querySelector('.linear-search-detail');
    } else if (selectedAlgorithm.value === 2) {
      detailElement = document.querySelector('.binary-search-detail');
    } else if (selectedAlgorithm.value === 3) {
      detailElement = document.querySelector('.interpolation-search-detail');
    } else if (selectedAlgorithm.value === 4) {
      detailElement = document.querySelector('.jump-search-detail');
    } else if (selectedAlgorithm.value === 5) {
      detailElement = document.querySelector('.exponential-search-detail');
    } else if (selectedAlgorithm.value === 6) {
      detailElement = document.querySelector('.hashing-search-detail');
    }

    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// 搜索算法数据
const searchingAlgorithms = [
  {
    id: 1,
    name: '线性查找',
    difficulty: '简单',
    category: '顺序查找',
    timeComplexity: 'O(n)',
    description: '线性查找是一种简单的搜索算法，它按顺序检查数组中的每个元素，直到找到目标值或遍历完整个数组。',
  },
  {
    id: 2,
    name: '二分查找',
    difficulty: '中等',
    category: '分治查找',
    timeComplexity: 'O(log n)',
    description: '二分查找是一种高效的搜索算法，它要求数组已排序。它不断将搜索范围缩小一半，直到找到目标值或确定目标值不存在。',
  },
  {
    id: 3,
    name: '插值查找',
    difficulty: '中等',
    category: '分治查找',
    timeComplexity: 'O(log log n)',
    description: '插值查找是二分查找的改进版本，它根据目标值与数组边界值的关系，估计目标值可能的位置，从而加速查找过程。',
  },
  {
    id: 4,
    name: '跳跃搜索',
    difficulty: '中等',
    category: '分块查找',
    timeComplexity: 'O(√n)',
    description: '跳跃搜索是一种分块搜索算法，它通过跳过一定数量的元素来减少比较次数，适用于已排序的数组。',
  },
  {
    id: 5,
    name: '指数搜索',
    difficulty: '中等',
    category: '分治查找',
    timeComplexity: 'O(log n)',
    description: '指数搜索首先通过指数增长的方式确定目标值可能存在的范围，然后在该范围内使用二分查找，适用于大型数组。',
  },
  {
    id: 6,
    name: '哈希查找',
    difficulty: '中等',
    category: '哈希查找',
    timeComplexity: 'O(1)',
    description: '哈希查找使用哈希函数将键映射到数组中的位置，从而实现常数时间复杂度的查找，但需要额外的空间来存储哈希表。',
  }
]

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
    return searchingAlgorithms.filter(algo => algo.category === '顺序查找')
  } else if (currentCategory.value === 'divide') {
    return searchingAlgorithms.filter(algo => algo.category === '分治查找')
  } else if (currentCategory.value === 'block') {
    return searchingAlgorithms.filter(algo => algo.category === '分块查找')
  } else if (currentCategory.value === 'hash') {
    return searchingAlgorithms.filter(algo => algo.category === '哈希查找')
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
      <div v-for="algorithm in filteredAlgorithms" :key="algorithm.id" :class="['algorithm-card', { 'selected': selectedAlgorithm === algorithm.id }]" @click="selectedAlgorithm = algorithm.id">
        <div class="card-header">
          <h3>{{ algorithm.name }}</h3>
          <div class="tags-container">
            <span class="tag difficulty-tag">{{ algorithm.difficulty }}</span>
            <span class="tag category-tag">{{ algorithm.category }}</span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity-display">{{ algorithm.timeComplexity }}</span>
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 线性查找详情 -->
    <LinearSearchDetail v-if="selectedAlgorithm === 1" @close="selectedAlgorithm = null" />
    <!-- 二分查找详情 -->
    <BinarySearchDetail v-if="selectedAlgorithm === 2" @close="selectedAlgorithm = null" />
    <!-- 插值查找详情 -->
    <InterpolationSearchDetail v-if="selectedAlgorithm === 3" @close="selectedAlgorithm = null" />
    <!-- 跳跃查找详情 -->
    <JumpSearchDetail v-if="selectedAlgorithm === 4" @close="selectedAlgorithm = null" />
    <!-- 指数查找详情 -->
    <ExponentialSearchDetail v-if="selectedAlgorithm === 5" @close="selectedAlgorithm = null" />
    <!-- 哈希查找详情 -->
    <HashingSearchDetail v-if="selectedAlgorithm === 6" @close="selectedAlgorithm = null" />
  </div>
</template>

<style scoped>
/* 引入公共样式文件 */
@import './common-algorithm-page.css';

/* 搜索页面特有样式 */
.searching-page-container {
  /* 继承自公共样式，如有需要可添加搜索页面特有样式 */
}

/* 分类标签样式 */
.category-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
  justify-content: flex-start;
}

.category-tabs button {
  padding: 8px 16px;
  border-radius: 20px;
  border: none;
  background-color: #f0f0f0;
  color: #666;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.category-tabs button.active {
  background-color: #42b983;
  color: white;
}

/* 卡片底部样式调整 */
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background-color: #fafafa;
  border-top: 1px solid #f0f0f0;
}

.complexity-display {
  font-size: 14px;
  font-weight: 500;
  color: #999;
}

/* 详情按钮样式 */
.detail-btn {
  padding: 6px 12px;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.detail-btn:hover {
  background-color: #389e70;
}

/* 算法卡片标签样式 */
.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tag {
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.difficulty-tag {
  background-color: #e6f7ff;
  color: #1890ff;
}

.category-tag {
  background-color: #fff7e6;
  color: #faad14;
}

.complexity-tag {
  background-color: #f0f0f0;
  color: #333;
}
</style>