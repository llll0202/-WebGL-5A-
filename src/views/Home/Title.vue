<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'   

const route = useRoute()

const title = computed(() => {
  const provinceName = route.params.provinceName as string || '全国'

  if ( provinceName !== '全国') {
    return `${provinceName}5A级旅游景区`
  }
  return '中国5A级旅游景区'
})
</script>

<template>
  <header class="home-title">
    <h1>{{ title }}</h1>
  </header>
</template>

<style scoped>
.home-title {
  flex: 0 0 88px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  z-index: 1000;
  width: 100%;
  background: rgba(2, 8, 11, 0.96);
  border-bottom: 1px solid rgba(0, 255, 174, 0.22);
}

.home-title h1 {
  margin: 0;
  color: #00ffae;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;
  text-shadow:
    0 0 10px rgba(0, 255, 174, 0.8),
    0 0 20px rgba(0, 255, 174, 0.5),
    0 0 40px rgba(0, 255, 174, 0.3);
}
</style>