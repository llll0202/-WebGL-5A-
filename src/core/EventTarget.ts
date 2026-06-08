export default class EventTarget {
  //handers对象，对象里是数组，数组里是对象，对象里有once和callback属性
  handlers: Record<string, Array<{ once: boolean; callback: Function }>>

  constructor() {
    this.handlers = {}
  }

  //触发事件
  fire(type: string, event?: any) {
    const handlers = this.handlers[type]
    if (!handlers) return
    for (let i = 0, l = handlers.length; i < l; i++) {
      const handler = handlers[i]
      try {
        handler.callback(event)
      } catch (err) {
        console.error(err)
      }
      if (handler.once) {
        handlers.splice(i, 1)
        i--
        l--
      }
    }
  }

  //一次性类型事件监听器，触发一次后自动移除
  once(type: string, callback: Function) {
    this.on(type, callback, { once: true })
  }

  //注册监听，option参数里可以设置once属性，表示是否一次性事件监听器
  on(type: string, callback: Function, option?: { once?: boolean }) {
    const once = option ? option.once : false
    let handlers = this.handlers[type]
    if (!handlers) {
      this.handlers[type] = handlers = []
    }
    handlers.push({ once, callback })
  }

  //移除监听,callback不存在则移除所有该类型监听器
  off(type: string, callback?: Function) {
    const handlers = this.handlers[type]
    if (!handlers) return

    if (!callback) {
      handlers.length = 0
    } else {
      for (let i = 0, l = handlers.length; i < l; i++) {
        const handler = handlers[i]
        if (handler.callback === callback) {
          handlers.splice(i, 1)
          break
        }
      }
    }
  }

  destroy() {
    this.handlers = {}
  }
}
