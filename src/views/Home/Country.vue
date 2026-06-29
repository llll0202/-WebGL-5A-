<script setup lang="ts">
import '@/style.css'
import DetailDailog from '@/DetailDailog.vue'
import Search from './Search.vue'
import { onMounted, ref } from 'vue'
import { Map3D } from '@/index.ts'
import tourism from '@/examples/tourism'
import { registerDrillHandler } from '@/core/drill'
import { registerDetailHandler } from '@/core/detail'
import { registerRegionHandler } from '@/core/region'
import { useRouter, useRoute } from 'vue-router'

const emit = defineEmits<{
  (event: 'region-change', regionName: string): void
}>()

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const showBack = ref(false)
const currentMap = ref<Map3D | null>(null)
const currentBackFn = ref<(() => void) | null>(null)
const mapContainerRef = ref<HTMLElement | null>(null)

const detailVisible = ref(false)
const detailX = ref()
const detailY = ref()
const detailData = ref()

onMounted(async () => {
  loading.value = true

  currentMap.value = new Map3D({
    el: mapContainerRef.value,
  })

  mapController.value = await tourism.setup(currentMap.value)
  searchOptions.value = mapController.value.searchOptions

  const routeProvinceName = route.params.provinceName
  const currentRegionName = (
    Array.isArray(routeProvinceName) ? routeProvinceName[0] : routeProvinceName
  )?.trim()

  if (currentRegionName) {
    const target = searchOptions.value.find((item) => item.name === currentRegionName)

    if (target) {
      await mapController.value.drillToRegion(target.adcode, target.name)
    }
  } else {
    emit('region-change', '全国')
  }

  loading.value = false
})

//注册弹框事件函数
registerDetailHandler((payload) => {
  if (!payload) {
    detailVisible.value = false
    return
  }

  detailVisible.value = true
  detailX.value = payload.x
  detailY.value = payload.y
  detailData.value = payload.data
})

//注册下钻事件回调，接收一个函数参数，在下钻后调用该函数可以返回上一级
registerDrillHandler((backFn: () => void) => {
  showBack.value = true
  currentBackFn.value = backFn
})

//下钻后改变网址参数

registerRegionHandler((name: string) => {
  emit('region-change', name)
  if (name && name !== '全国') {
    router.push({
      name: 'map',
      params: { provinceName: name },
    })
  }
})

function handleBack() {
  currentBackFn.value?.()
  showBack.value = false
  emit('region-change', '全国')
  router.push({
    name: 'map',
    params: {},
  })
}
// 搜索选择后下钻
//定义搜索选项数据类型
type RegionOption = {
  name: string
  adcode: string
  level: 'province' | 'city'
}

const searchOptions = ref<RegionOption[]>([])
const mapController = ref<any>(null)

async function handleSearchSelect(option: RegionOption) {
  // console.log('Country receive select:', option)
  // console.log('mapController:', mapController.value)
  await mapController.value.drillToRegion(option.adcode, option.name)

  router.push({
    name: 'map',
    params: {
      provinceName: option.name,
    },
  })
}
</script>

<template>
  <div class="country-map">
    <div ref="mapContainerRef" id="map-container">
      <Search :options="searchOptions" @select="handleSearchSelect" />
      <button v-if="showBack" class="back-btn" type="button" @click="handleBack">返回全国</button>

      <div v-if="loading" class="loading">加载中...</div>

      <DetailDailog :visible="detailVisible" :x="detailX" :y="detailY" :data="detailData" />
    </div>
  </div>
</template>

<style scoped>
.country-map {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 0;
}

#map-container {
  flex: 1;
  width: 100%;
  height: 100%;
  min-height: 0;
  position: relative;
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

.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
</style>
