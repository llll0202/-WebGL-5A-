<script setup lang="ts">
import './style.css'
import DetailDailog from './DetailDailog.vue'
import { ref, onMounted } from 'vue'
import { Map3D } from './index'
import tourism from './examples/tourism'
import { registerDrillHandler } from './core/drill'
import { registerDetailHandler } from './core/detail'
import { registerRegionHandler } from './core/region'

const loading = ref(false)

const showBack = ref(false)

const currentMap = ref<Map3D | null>(null)

const currentBackFn = ref<(() => void) | null>(null)

const mapContainerRef = ref<HTMLElement | null>(null)

const currentRegion = ref('全国')

//5A景区详细信息弹框
const detailVisible = ref(false)
const detailX = ref()
const detailY = ref()
const detailData = ref()
onMounted(async () => {
  loading.value = true
  currentMap.value = new Map3D({
    // 传入地图容器的DOM元素，mapContainerRef.value在组件挂载后会被赋值为地图容器的DOM元素
    el: mapContainerRef.value,
  })
  await tourism.setup(currentMap.value)
  loading.value = false
})

// 注册详情弹框事件,根本没有执行，只是传递了一个函数，
// 等到数据传递了才会调用这个函数，
// 并传入数据
registerDetailHandler((payload) => {
  // console.log('收到payload', payload)
  if (!payload) {
    detailVisible.value = false
    return
  }
  detailVisible.value = true
  detailX.value = payload.x
  detailY.value = payload.y
  detailData.value = payload.data

  // console.log(detailData.value)
})

//显示返回按钮，并注册返回函数
registerDrillHandler((backFn: () => void) => {
  showBack.value = true
  currentBackFn.value = backFn
})

// 注册区域变化事件，当区域变化时，更新currentRegion的值
registerRegionHandler((name: string) => {
  currentRegion.value = name
})

// 处理返回事件
function handleBack() {
  currentBackFn.value?.()
  showBack.value = false
}
</script>

<template>
  <div id="app">
    <!-- 地图区域 -->
    <div ref="mapContainerRef" id="map-container">
      <div class="page-title">
        {{ currentRegion === '全国' ? '中国5A级旅游景区' : currentRegion + '5A级旅游景区' }}
      </div>
      <div v-if="showBack" class="back-btn" @click="handleBack">← 返回全国</div>

      <div v-if="loading" class="loading">加载中...</div>

      <!-- 详情弹框 -->
      <DetailDailog :visible="detailVisible" :x="detailX" :y="detailY" :data="detailData" />
    </div>
  </div>
</template>

<style scoped>
#app {
  display: flex;
  width: 100vw;
  height: 100vh;
}
.page-title {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);

  z-index: 1000;

  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;

  color: #00ffae;

  text-shadow:
    0 0 10px rgba(0, 255, 174, 0.8),
    0 0 20px rgba(0, 255, 174, 0.5),
    0 0 40px rgba(0, 255, 174, 0.3);

  user-select: none;
  pointer-events: none;
}
.back-btn {
  display: block;
  position: absolute;
  top: 16px;
  right: 16px;
  z-index: 10;
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.7);
  border: 1px solid rgba(0, 255, 174, 0.4);
  border-radius: 4px;
  color: #00ffae;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  backdrop-filter: blur(4px);
}
.back-btn:hover {
  background: rgba(0, 255, 174, 0.25);
}
#map-container {
  flex: 1;
  height: 100vh;
  position: relative;
}
#map-container .loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
