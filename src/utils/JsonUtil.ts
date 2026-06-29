// JSON 请求的运行时内存缓存。
//
// 浏览器 HTTP 缓存可以避免重复下载同一个文件，但每次调用 loadJson 时，
// 代码仍然可能创建请求、等待 304 校验，并重新执行 JSON 解析。
//
// 这里缓存的是 Promise：
// 1. 已经加载过的 URL 可以直接复用解析后的 JSON 数据。
// 2. 短时间内多个相同 URL 的并发请求会合并成一次真实请求。
// 3. 通过 LRU 上限控制缓存数量，避免用户连续下钻很多区域后内存一直增长。
const MAX_JSON_CACHE_SIZE = 10

const jsonCache = new Map<string, Promise<any>>()

function getJsonCache(url: string) {
  const task = jsonCache.get(url)

  if (!task) return null

  // Map 会按照插入顺序保存 key。
  // 命中缓存后先删除再插入，可以把当前 URL 移动到最后，
  // 表示它是最近使用过的数据。
  jsonCache.delete(url)
  jsonCache.set(url, task)

  return task
}

function setJsonCache(url: string, task: Promise<any>) {
  if (jsonCache.has(url)) {
    jsonCache.delete(url)
  }

  jsonCache.set(url, task)

  if (jsonCache.size <= MAX_JSON_CACHE_SIZE) return

  // Map 的第一个 key 就是最久没有访问的数据。
  // 超出缓存上限时，删除最旧的一项。
  const oldestUrl = jsonCache.keys().next().value

  if (oldestUrl) {
    jsonCache.delete(oldestUrl)
  }
}

const JsonUtil = {
  loadJson(url: string): Promise<any> {
    const cachedTask = getJsonCache(url)

    if (cachedTask) {
      return cachedTask
    }

    const task = fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`request failed: ${url}`)
        }

        return res.json()
      })
      .catch((error) => {
        // 请求失败时不要保留失败的 Promise。
        // 这样下一次调用同一个 URL 时，还可以重新发起请求。
        jsonCache.delete(url)
        throw error
      })

    // 请求还没完成时就先写入缓存。
    // 这样相同 URL 的 pending 请求也能被复用。
    setJsonCache(url, task)

    return task
  },
}

export default JsonUtil
