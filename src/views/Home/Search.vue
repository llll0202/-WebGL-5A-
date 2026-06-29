<script setup lang="ts">
type RegionOption = {
  name: string
  adcode: string
  level: 'province' | 'city'
}

const props = defineProps<{
  options: RegionOption[]
}>()

const emit = defineEmits<{
  (event: 'select', option: RegionOption): void
}>()

function querySearch(queryString: string, 
  callback: (results: RegionOption[]) => void) {
  const keyword = queryString.trim()

  if (!keyword) {
    callback([])
    return
  }

  callback(
    props.options
      .filter((item) => item.name.includes(keyword))
      .slice(0, 8),
  )
}

function handleSelect(option: RegionOption) {
  emit('select', option)
}
</script>

<template>
  <div class="search-box">
    <el-autocomplete
      placeholder="搜索省份或城市"
      value-key="name"
      :fetch-suggestions="querySearch"
      @select="handleSelect"
    />
  </div>
</template>
<style scoped>
.search-box {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  width: 240px;
}

.search-box input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid rgba(0, 255, 174, 0.35);
  border-radius: 4px;
  outline: none;
  color: #00ffae;
  background: rgba(0, 0, 0, 0.72);
}

.search-list {
  margin-top: 6px;
  background: rgba(0, 0, 0, 0.78);
  border: 1px solid rgba(0, 255, 174, 0.25);
}

.search-list button {
  display: block;
  width: 100%;
  padding: 8px 12px;
  border: 0;
  color: #fff;
  text-align: left;
  cursor: pointer;
  background: transparent;
}

.search-list button:hover {
  color: #00ffae;
  background: rgba(0, 255, 174, 0.12);
}
</style>