<script setup lang="ts">
import { ref } from 'vue'
import Title from './Title.vue'

// const currentRegion = ref('全国')

// function handleRegionChange(regionName: string) {
//   currentRegion.value = regionName || '全国'
// }
</script>

<template>
  <main class="home">
    <Title></Title>

    <section class="home-content">
      <router-view >
      </router-view>
    </section>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #02080b;
}

.home-content {
  flex: 1;
  min-height: 0;
  width: 100%;
  overflow: hidden;
}
</style>
