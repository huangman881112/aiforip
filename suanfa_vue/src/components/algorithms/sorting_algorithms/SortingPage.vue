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

// 当前选中的算法ID
const selectedAlgorithm = ref(null)

// 滚动到详情区域
const scrollToDetail = () => {
  setTimeout(() => {
    let detailElement;
    if (selectedAlgorithm.value === 1) {
      detailElement = document.querySelector('.bubble-sort-detail');
    } else if (selectedAlgorithm.value === 2) {
      detailElement = document.querySelector('.quick-sort-detail');
    } else if (selectedAlgorithm.value === 3) {
      detailElement = document.querySelector('.merge-sort-detail');
    } else// 堆排序详情
    if (selectedAlgorithm.value === 4) {
      detailElement = document.querySelector('.heap-sort-detail');
    } else if (selectedAlgorithm.value === 5) {
      detailElement = document.querySelector('.insertion-sort-detail');
    } else if (selectedAlgorithm.value === 6) {
      detailElement = document.querySelector('.selection-sort-detail');
    } else if (selectedAlgorithm.value === 7) {
      detailElement = document.querySelector('.shell-sort-detail');
    } else if (selectedAlgorithm.value === 8) {
      detailElement = document.querySelector('.counting-sort-detail');
    } else if (selectedAlgorithm.value === 9) {
      detailElement = document.querySelector('.bucket-sort-detail');
    } else if (selectedAlgorithm.value === 10) {
      detailElement = document.querySelector('.radix-sort-detail');
    }

    if (detailElement) {
      detailElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, 100);
}

// 排序算法数据
const sortingAlgorithms = [
  {
    id: 1,
    name: '冒泡排序',
    difficulty: '简单',
    category: '比较类排序',
    stability: '稳定',
    description: '冒泡排序是一种简单的排序算法。它重复地走访过要排序的数列，一次比较两个元素，如果它们的顺序错误就把它们交换过来。',
    complexity: 'O(n²)'
  },
  {
    id: 2,
    name: '快速排序',
    difficulty: '中等',
    category: '比较类排序',
    stability: '不稳定',
    description: '快速排序是一种高效的排序算法，采用了分治的思想。它选择一个基准元素，将数组分为两个子数组，小于基准的元素放在左边，大于基准的元素放在右边。',
    complexity: 'O(n log n)'
  },
  {
    id: 3,
    name: '归并排序',
    difficulty: '中等',
    category: '比较类排序',
    stability: '稳定',
    description: '归并排序是建立在归并操作上的一种有效的排序算法。该算法是采用分治法的一个非常典型的应用。',
    complexity: 'O(n log n)'
  },
  {
    id: 4,
    name: '堆排序',
    difficulty: '中等',
    category: '比较类排序',
    stability: '不稳定',
    description: '堆排序是利用堆这种数据结构所设计的一种排序算法。堆是一个近似完全二叉树的结构，并同时满足堆的性质。',
    complexity: 'O(n log n)'
  },
  {
    id: 5,
    name: '插入排序',
    difficulty: '简单',
    category: '比较类排序',
    stability: '稳定',
    description: '插入排序是一种简单直观的排序算法。它的工作原理是通过构建有序序列，对于未排序数据，在已排序序列中从后向前扫描，找到相应位置并插入。',
    complexity: 'O(n²)'
  },
  {
    id: 6,
    name: '选择排序',
    difficulty: '简单',
    category: '比较类排序',
    stability: '不稳定',
    description: '选择排序是一种简单直观的排序算法。它的工作原理是每一次从待排序的数据元素中选出最小（或最大）的一个元素，存放在序列的起始位置。',
    complexity: 'O(n²)'
  },
  {
    id: 7,
    name: '希尔排序',
    difficulty: '中等',
    category: '比较类排序',
    stability: '不稳定',
    description: '希尔排序是插入排序的一种改进版本，它通过比较相距一定间隔的元素来进行排序，逐渐减小这个间隔直到为1。',
    complexity: 'O(n^1.3)'
  },
  {
    id: 8,
    name: '计数排序',
    difficulty: '中等',
    category: '非比较类排序',
    stability: '稳定',
    description: '计数排序是一种非比较排序算法，它通过计算每个元素出现的次数来进行排序，适用于已知范围的整数排序。',
    complexity: 'O(n + k)' 
  },
  {
    id: 9,
    name: '桶排序',
    difficulty: '中等',
    category: '非比较类排序',
    stability: '稳定',
    description: '桶排序是一种分布式排序算法，它将元素分配到一定数量的桶中，然后对每个桶中的元素进行排序，最后合并所有桶中的元素。',
    complexity: 'O(n + k)' 
  },
  {
    id: 10,
    name: '基数排序',
    difficulty: '中等',
    category: '非比较类排序',
    stability: '稳定',
    description: '基数排序是一种非比较排序算法，它通过按位排序来进行排序，从最低有效位开始，到最高有效位结束。',
    complexity: 'O(n * k)' 
  }
]

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
    return sortingAlgorithms.filter(algo => algo.category === '比较类排序')
  } else if (currentCategory.value === 'non-comparison') {
    return sortingAlgorithms.filter(algo => algo.category === '非比较类排序')
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
            <span class="tag category-tag">{{ algorithm.category }}</span>
            <span :class="['tag', algorithm.stability === '稳定' ? 'stable-tag' : 'unstable-tag']">
              {{ algorithm.stability }}
            </span>
          </div>
        </div>
        <p class="card-description">{{ algorithm.description }}</p>
        <div class="card-footer">
          <span class="complexity">{{ algorithm.complexity }}</span>
          <button class="detail-btn" @click.stop="selectedAlgorithm = algorithm.id; scrollToDetail()">查看详情</button>
        </div>
      </div>
    </div>

    <!-- 冒泡排序详情 -->
    <BubbleSortDetail v-if="selectedAlgorithm === 1" @close="selectedAlgorithm = null" />
    <!-- 快速排序详情 -->
    <QuickSortDetail v-if="selectedAlgorithm === 2" @close="selectedAlgorithm = null" />
    <!-- 归并排序详情 -->
    <MergeSortDetail v-if="selectedAlgorithm === 3" @close="selectedAlgorithm = null" />
    <!-- 堆排序详情 -->
    <HeapSortDetail v-if="selectedAlgorithm === 4" @close="selectedAlgorithm = null" />
    <!-- 插入排序详情 -->
    <InsertionSortDetail v-if="selectedAlgorithm === 5" @close="selectedAlgorithm = null" />
    <!-- 选择排序详情 -->
    <SelectionSortDetail v-if="selectedAlgorithm === 6" @close="selectedAlgorithm = null" />
    <!-- 希尔排序详情 -->
    <ShellSortDetail v-if="selectedAlgorithm === 7" @close="selectedAlgorithm = null" />
    <!-- 计数排序详情 -->
    <CountingSortDetail v-if="selectedAlgorithm === 8" @close="selectedAlgorithm = null" />
    <!-- 桶排序详情 -->
    <BucketSortDetail v-if="selectedAlgorithm === 9" @close="selectedAlgorithm = null" />
    <!-- 基数排序详情 -->
    <RadixSortDetail v-if="selectedAlgorithm === 10" @close="selectedAlgorithm = null" />
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