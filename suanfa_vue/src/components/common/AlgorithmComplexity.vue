<script setup>
// 共享算法复杂度分析块
// 用法：<AlgorithmComplexity algorithm-id="bubble-sort" />
// 数据来源：src/data/algorithms.js（单一数据源）
import { computed } from 'vue'
import { getAlgorithmById } from '../../data/algorithms'

const props = defineProps({
  algorithmId: {
    type: String,
    required: true,
  },
})

const algorithm = computed(() => getAlgorithmById(props.algorithmId))
</script>

<template>
  <div v-if="algorithm" class="complexity-analysis">
    <h3>复杂度分析</h3>
    <div class="complexity-item merged-complexity">
      <div class="complexity-row">
        <p class="complexity-title" style="text-align: left;">时间复杂度</p>
        <ul class="complexity-subitems" style="text-align: left;">
          <li v-for="item in algorithm.complexityDetails.time" :key="item.label">
            <span>{{ item.label }}:</span> {{ item.value }}
          </li>
        </ul>
      </div>
      <div class="complexity-row">
        <p><span class="complexity-title">空间复杂度:</span> {{ algorithm.complexityDetails.space }}</p>
      </div>
      <div v-if="algorithm.complexityDetails.stability" class="complexity-row">
        <p><span class="complexity-title">稳定性:</span> {{ algorithm.complexityDetails.stability }}</p>
      </div>
      <div v-if="algorithm.complexityDetails.difficulty" class="complexity-row">
        <p><span class="complexity-title">难度:</span> {{ algorithm.complexityDetails.difficulty }}</p>
      </div>
      <div v-for="extra in algorithm.complexityDetails.extras" :key="extra.label || extra.note" class="complexity-row">
        <p v-if="extra.label"><span class="complexity-title">{{ extra.label }}:</span> {{ extra.value }}</p>
        <p v-else>{{ extra.note }}</p>
      </div>
    </div>
  </div>
</template>