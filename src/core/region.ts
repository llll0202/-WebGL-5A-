// core/region.ts
let handler: any = null

export function registerRegionHandler(fn: any) {
  handler = fn
}

export function changeRegion(name: string) {
  handler?.(name)
}
