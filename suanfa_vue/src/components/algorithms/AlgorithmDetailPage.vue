<script setup>
// 路由级包装：/algorithms/:category/:id -> 统一详情页，收起时返回分类页
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AlgorithmDetailView from './AlgorithmDetailView.vue'

const route = useRoute()
const router = useRouter()

const algorithmId = computed(() => route.params.id)

function goBack() {
  router.push(`/algorithms/${route.params.category}`)
}
</script>

<template>
  <AlgorithmDetailView :algorithm-id="algorithmId" @close="goBack" />
</template>
