<script setup>
// 排序算法页面组件
import { ref, computed } from 'vue'
import BubbleSortDetail from './BubbleSortDetail.vue'
import QuickSortDetail from './QuickSortDetail.vue'
import MergeSortDetail from './MergeSortDetail.vue'
import HeapSortDetail from './HeapSortDetail.vue'
import InsertionSortDetail from './InsertionSortDetail.vue'
import SelectionSortDetail from './SelectionSortDetail.vue'
import ShellSortDetail from './ShellSortDetail.vue'
import CountingSortDetail from './CountingSortDetail.vue'
import BucketSortDetail from './BucketSortDetail.vue'
import RadixSortDetail from './RadixSortDetail.vue'
// 单一数据源
import { sortingAlgorithms } from '../../../data/algorithms'
import ProgressMark from '../../common/ProgressMark.vue'

// 当前选中的算法ID（语义 id，如 'bubble-sort'）
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
      <div v-for="algorithm in filteredAlgorithms" :key="algorithm.id" :class="['algorithm-card', { 'selected': selectedAlgorithm === algorithm.id }]" @click="selectedAlgorithm = algorithm.id">
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
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 冒泡排序详情 -->
    <BubbleSortDetail v-if="selectedAlgorithm === 'bubble-sort'" @close="selectedAlgorithm = null" />
    <!-- 快速排序详情 -->
    <QuickSortDetail v-if="selectedAlgorithm === 'quick-sort'" @close="selectedAlgorithm = null" />
    <!-- 归并排序详情 -->
    <MergeSortDetail v-if="selectedAlgorithm === 'merge-sort'" @close="selectedAlgorithm = null" />
    <!-- 堆排序详情 -->
    <HeapSortDetail v-if="selectedAlgorithm === 'heap-sort'" @close="selectedAlgorithm = null" />
    <!-- 插入排序详情 -->
    <InsertionSortDetail v-if="selectedAlgorithm === 'insertion-sort'" @close="selectedAlgorithm = null" />
    <!-- 选择排序详情 -->
    <SelectionSortDetail v-if="selectedAlgorithm === 'selection-sort'" @close="selectedAlgorithm = null" />
    <!-- 希尔排序详情 -->
    <ShellSortDetail v-if="selectedAlgorithm === 'shell-sort'" @close="selectedAlgorithm = null" />
    <!-- 计数排序详情 -->
    <CountingSortDetail v-if="selectedAlgorithm === 'counting-sort'" @close="selectedAlgorithm = null" />
    <!-- 桶排序详情 -->
    <BucketSortDetail v-if="selectedAlgorithm === 'bucket-sort'" @close="selectedAlgorithm = null" />
    <!-- 基数排序详情 -->
    <RadixSortDetail v-if="selectedAlgorithm === 'radix-sort'" @close="selectedAlgorithm = null" />
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