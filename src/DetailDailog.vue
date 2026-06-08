<script setup lang="ts">
//父组件传入的props
defineProps({
  visible: Boolean,
  x: Number,
  y: Number,
  data: Object,
})
</script>

<template>
  <div
    v-if="visible"
    class="detail"
    :style="{
      left: x + 'px',
      top: y + 'px',
    }"
  >
    <div class="title">{{ data?.detail?.name }} {{ data?.detail?.id }}</div>

    <div class="content">{{ data?.detail?.provinceName }} {{ data?.detail?.cityName }}</div>
  </div>
</template>

<style lang="less" scoped>
.detail {
  position: fixed;

  z-index: 9999;

  width: 260px;

  padding: 14px;

  background: rgba(0, 0, 0, 0.72);

  border: 1px solid rgba(0, 255, 174, 0.3);

  border-radius: 10px;

  color: white;

  backdrop-filter: blur(12px);

  pointer-events: none;

  transform: translate(12px, 12px);
}

.title {
  font-size: 16px;
  font-weight: bold;

  color: #00ffae;

  margin-bottom: 8px;
}

.content {
  font-size: 13px;

  line-height: 1.6;

  color: rgba(255, 255, 255, 0.82);
}
</style>
