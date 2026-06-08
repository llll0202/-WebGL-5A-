let drillHandler: ((backFn: () => void) => void) | null = null

// App.vue 注册处理器
export function registerDrillHandler(handler: (backFn: () => void) => void) {
  drillHandler = handler
}

// 子模块调用
export function onDrillDown(backFn: () => void) {
  drillHandler?.(backFn)
}
