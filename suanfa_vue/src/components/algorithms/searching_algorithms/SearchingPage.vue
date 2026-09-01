<script setup>
// 搜索算法页面组件
import { ref, computed } from 'vue'
import LinearSearchDetail from './LinearSearchDetail.vue'
import BinarySearchDetail from './BinarySearchDetail.vue'
import InterpolationSearchDetail from './InterpolationSearchDetail.vue'
import JumpSearchDetail from './JumpSearchDetail.vue'
import ExponentialSearchDetail from './ExponentialSearchDetail.vue'
import HashingSearchDetail from './HashingSearchDetail.vue'
// 单一数据源
import { searchingAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

// 当前选中的算法ID（语义 id，如 'linear-search'）
const selectedAlgorithm = ref(null)

// 滚动到详情区域
const scrollToDetail = () => {
  setTimeout(() => {
    const detailElement = document.querySelector('.detail-container');
    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
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
      <div v-for="algorithm in filteredAlgorithms" :key="algorithm.id" :class="['algorithm-card', { 'selected': selectedAlgorithm === algorithm.id }]" @click="selectedAlgorithm = algorithm.id">
        <div class="card-header">
          <h3>{{ algorithm.name }}</h3>
          <div class="tags-container">
            <span class="tag difficulty-tag">{{ algorithm.difficulty }}</span>
            <span class="tag category-tag">{{ algorithm.subCategory }}</span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity-display">{{ algorithm.complexity }}</span>
          <ProgressMark :algorithm-id="algorithm.id" />
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 线性查找详情 -->
    <LinearSearchDetail v-if="selectedAlgorithm === 'linear-search'" @close="selectedAlgorithm = null" />
    <!-- 二分查找详情 -->
    <BinarySearchDetail v-if="selectedAlgorithm === 'binary-search'" @close="selectedAlgorithm = null" />
    <!-- 插值查找详情 -->
    <InterpolationSearchDetail v-if="selectedAlgorithm === 'interpolation-search'" @close="selectedAlgorithm = null" />
    <!-- 跳跃查找详情 -->
    <JumpSearchDetail v-if="selectedAlgorithm === 'jump-search'" @close="selectedAlgorithm = null" />
    <!-- 指数查找详情 -->
    <ExponentialSearchDetail v-if="selectedAlgorithm === 'exponential-search'" @close="selectedAlgorithm = null" />
    <!-- 哈希查找详情 -->
    <HashingSearchDetail v-if="selectedAlgorithm === 'hashing-search'" @close="selectedAlgorithm = null" />
  </div>
</template>

<style scoped>
/* 引入公共样式文件（搜索页外观统一由 common-searching-page.css 提供） */
@import './common-searching-page.css';
</style>