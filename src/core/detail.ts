type DetailPayload = {
  x: number
  y: number
  data: any
}

let detailHandler: ((payload: DetailPayload | null) => void) | null = null

// App.vue 注册
export function registerDetailHandler(handler: (payload: DetailPayload | null) => void) {
  detailHandler = handler
}

// 显示详情
export function showDetail(payload: DetailPayload | null) {
  detailHandler?.(payload)
}

// 隐藏详情
export function hideDetail() {
  detailHandler?.(null)
}
