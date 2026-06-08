import Matrix3D from '../math/Matrix3D'
import AnimationUtil from '../animation/AnimationUtil'

const TRANSFORM_MATRIX: any = (Matrix3D.identity as any)()
Matrix3D.scale(TRANSFORM_MATRIX, 1, -1, 1, TRANSFORM_MATRIX)
Matrix3D.xRotate(TRANSFORM_MATRIX, Math.PI / 2, TRANSFORM_MATRIX)

const EPS = 0.001

const MAX_RADIUS = 1
const MIN_RADIUS = 0.000011

interface Center {
  x: number
  y: number
  z: number
}

interface CameraProps {
  radius: number
  phi: number
  theta: number
  _radius: number
  _phi: number
  _theta: number
}

// Minimal MathUtil.rotate replacement
const MathUtil = {
  rotate(x: number, y: number, theta: number): number[] {
    const sinTheta = Math.sin(theta)
    const cosTheta = Math.cos(theta)
    return [x * cosTheta - y * sinTheta, x * sinTheta + y * cosTheta]
  },
}

// Minimal EventTarget replacement
class EventTarget {
  captureHandlers: Record<string, Array<{ once: boolean; callback: (event?: any) => void }>>
  bubbleHandlers: Record<string, Array<{ once: boolean; callback: (event?: any) => void }>>
  __eventTimers__: any[]

  constructor() {
    this.captureHandlers = {}
    this.bubbleHandlers = {}
    this.__eventTimers__ = []
  }

  //触发事件，capture参数表示是否触发捕获阶段的事件监听器，默认为false，即触发冒泡阶段的事件监听器
  fire(type: string, event?: any, capture?: boolean): void {
    if (!this.captureHandlers || !this.bubbleHandlers) return
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }> | undefined
    if (capture) {
      handlers = this.captureHandlers[type]
    } else {
      handlers = this.bubbleHandlers[type]
    }
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

  once(type: string, callback: (event?: any) => void): void {
    this.on(type, callback, { once: true })
  }

  on(
    type: string,
    callback: (event?: any) => void,
    option?: { capture?: boolean; once?: boolean; time?: number },
  ): void {
    const capture = option ? option.capture : false
    const once = option ? option.once : false
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }>
    if (capture) {
      handlers = this.captureHandlers[type]
      if (!handlers) {
        this.captureHandlers[type] = handlers = []
      }
    } else {
      handlers = this.bubbleHandlers[type]
      if (!handlers) {
        this.bubbleHandlers[type] = handlers = []
      }
    }
    handlers.push({ once, callback })
  }

  off(type: string, callback?: (event?: any) => void, option?: { capture?: boolean }): void {
    const capture = option ? option.capture : false
    let handlers: Array<{ once: boolean; callback: (event?: any) => void }> | undefined
    if (capture) {
      handlers = this.captureHandlers[type]
    } else {
      handlers = this.bubbleHandlers[type]
    }
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
}

export default class SphericalCamera extends EventTarget {
  center: Center
  props: CameraProps
  needUpdate: boolean
  canControl: boolean
  domElement?: HTMLElement
  downX: number
  downY: number
  followId: number
  followRadiusId: number
  matrix: any

  constructor(domElement?: HTMLElement) {
    super()
    this.center = {
      x: 0,
      y: 0,
      z: 0,
    }

    //用的是球形坐标系，radius是相机到中心点的距离，phi是相机与y轴的夹角，theta是相机在xz平面上的旋转角度
    //_radius、_phi、_theta是用于动画过渡的临时属性，props对象里存储了相机的状态，
    // 外部通过访问props对象来获取相机的状态，而不是直接访问_radius、_phi、_theta，这样可以在动画过渡时保持props对象的状态不变，
    // 动画过渡完成后再将_radius、_phi、_theta的值赋给props对象，从而实现平滑过渡的效果
    this.props = {
      radius: 1,
      phi: EPS,
      theta: 0,
      _radius: 1,
      _phi: EPS,
      _theta: 0,
    }

    this.needUpdate = true
    this.canControl = true
    this.downX = 0
    this.downY = 0
    this.followId = 0
    this.followRadiusId = 0
    this.matrix = null
    if (domElement) {
      //绑定事件处理函数，确保this指向正确，并添加事件监听器
      this.dragStart = this.dragStart.bind(this)
      this.dragMove = this.dragMove.bind(this)
      this.dragEnd = this.dragEnd.bind(this)
      this.wheel = this.wheel.bind(this)
      this.update = this.update.bind(this)
      this.domElement = domElement
      this.domElement.addEventListener('mousedown', this.dragStart as any)
      this.domElement.addEventListener('wheel', this.wheel as any)
    }
  }

  //设置相机是否可控，默认是可控的，如果不可控则无法通过鼠标操作来改变相机的视角和位置
  setControl(flag: boolean): void {
    this.canControl = flag
  }

  //鼠标按下事件处理函数，记录鼠标按下时的坐标，并添加鼠标移动和鼠标抬起事件监听器
  dragStart(e: MouseEvent): void {
    if (!this.canControl) return
    window.addEventListener('mousemove', this.dragMove as any)
    window.addEventListener('mouseup', this.dragEnd as any)
    //记录鼠标按下时的坐标，用于计算鼠标移动的距离
    this.downX = e.clientX
    this.downY = e.clientY
    // console.log("dragStart", this.downX, this.downY);
  }

  //鼠标移动事件处理函数，根据鼠标移动的距离来计算相机的旋转角度和位置，并更新相机的状态
  dragMove(e: MouseEvent): void {
    const deltaX = e.clientX - this.downX
    const deltaY = e.clientY - this.downY
    // console.log("dragStart111", e.clientX, e.clientY);
    // console.log("dragStart", this.downX, this.downY);
    // console.log("dragMove", deltaX, deltaY);
    const radius = Math.max(0.0004, this.radius)
    if (e.buttons === 1) {
      const p = MathUtil.rotate(
        //将鼠标移动的距离转换为相机旋转的角度，deltaX和deltaY分别表示鼠标在x轴和y轴上的移动距离，
        // domElement.clientHeight是为了将鼠标移动的距离归一化，使得相机旋转的速度与鼠标移动的距离成正比
        deltaX / (this.domElement as HTMLElement).clientHeight,
        deltaY / (this.domElement as HTMLElement).clientHeight,
        -this.props.theta,
      )
      this.lookAt(this.center.x - p[0] * radius, this.center.y, this.center.z - p[1] * radius)
    } else {
      this.props._theta -= (2 * Math.PI * deltaX) / (this.domElement as HTMLElement).clientHeight
      this.props._phi -= (2 * Math.PI * deltaY) / (this.domElement as HTMLElement).clientHeight

      this.props._phi = Math.max(EPS, Math.min(Math.PI / 2.2 - EPS, this.props._phi))

      AnimationUtil.cancelFollow(this.followId)
      this.followId = AnimationUtil.follow({
        target: this.props,
        properties: {
          theta: this.props._theta,
          phi: this.props._phi,
        },
        minDelta: 0.001,
        speed: 0.3,
        update: this.update,
      })
    }
    this.downX = e.clientX
    this.downY = e.clientY

    this.update()
  }

  //鼠标抬起事件处理函数，移除鼠标移动和鼠标抬起事件监听器
  dragEnd(): void {
    window.removeEventListener('mousemove', this.dragMove as any)
    window.removeEventListener('mouseup', this.dragEnd as any)
  }

  //鼠标滚轮事件处理函数，根据鼠标滚轮的滚动方向来调整相机的半径，从而实现缩放效果
  wheel(e: WheelEvent): void {
    if (!this.canControl) return
    //根据鼠标滚轮的滚动方向来调整相机的半径，从而实现缩放效果，deltaY属性表示鼠标滚轮的滚动距离，正值表示向下滚动，负值表示向上滚动
    this.props._radius *= e.deltaY > 0 ? 1.3 : 0.8
    this.props._radius = this.props._radius * 1.1 // 变大（变远
    // console.log("wheel", e.deltaY, this.props._radius);
    //限制放大缩小的范围
    this.props._radius = Math.max(Math.min(this.props._radius, MAX_RADIUS), MIN_RADIUS)
    AnimationUtil.cancelFollow(this.followRadiusId)
    this.followRadiusId = AnimationUtil.follow({
      target: this.props,
      properties: {
        radius: this.props._radius,
      },
      minDelta: 0.0001,
      speed: 0.2,
      update: this.update,
    })

    this.update()
  }

  //标记需要更新相机的状态，下一次渲染时会调用getMatrix方法来获取相机的视图矩阵
  update(): void {
    this.needUpdate = true
    this.fire('update')
  }

  set radius(radius: number) {
    this.props._radius = this.props.radius = radius
    this.update()
  }

  get radius(): number {
    return this.props.radius
  }

  set phi(phi: number) {
    this.props._phi = this.props.phi = phi
    this.makeSafe()
    this.update()
  }

  get phi(): number {
    return this.props.phi
  }

  set theta(theta: number) {
    this.props._theta = this.props.theta = theta
    this.update()
  }

  get theta(): number {
    return this.props.theta
  }

  //设置相机的中心点，即相机所看的目标点，lookAt方法会根据中心点和相机的半径、phi、theta来计算相机的位置和视角
  lookAt(x: number, y: number, z: number): void {
    this.center.x = x
    this.center.y = y
    this.center.z = z
    this.update()
  }

  // restrict phi to be between EPS and PI-EPS
  makeSafe(): void {
    this.props.phi = Math.max(EPS, Math.min(Math.PI / 2.2 - EPS, this.props.phi))
  }
  //根据笛卡尔坐标设置相机的位置，x、y、z分别表示相机在x轴、y轴、z轴上的坐标，setFromCartesianCoords方法会根据这些坐标来计算相机的半径、phi、theta，从而更新相机的状态
  setFromCartesianCoords(x: number, y: number, z: number): void {
    this.props.radius = Math.sqrt(x * x + y * y + z * z)
    if (this.props.radius === 0) {
      this.props.theta = 0
      this.props.phi = 0
    } else {
      this.props.theta = Math.atan2(x, z)
      this.props.phi = Math.acos(Math.max(-1, Math.min(1, y / this.props.radius)))
    }
    this.update()
  }

  //获取相机的位置，返回一个包含x、y、z坐标的数组，getPosition方法会根据相机的半径、phi、theta来计算相机在笛卡尔坐标系中的位置
  getPosition(): number[] {
    const sinPhiRadius = Math.sin(this.props.phi) * this.props.radius
    return [
      sinPhiRadius * Math.sin(this.props.theta),
      Math.cos(this.props.phi) * this.props.radius,
      sinPhiRadius * Math.cos(this.props.theta),
    ]
  }

  //实际上y和z是交换的
  getRealPosition(): number[] {
    const sinPhiRadius = Math.sin(this.props.phi) * this.props.radius
    return [
      this.center.x + sinPhiRadius * Math.sin(this.props.theta),
      this.center.z + sinPhiRadius * Math.cos(this.props.theta),
      this.center.y + Math.cos(this.props.phi) * this.props.radius,
    ]
  }

  //获取相机的视图矩阵，getMatrix方法会根据相机的半径、phi、theta和中心点来计算相机的视图矩阵（逆），并返回这个矩阵
  getMatrix(): any {
    if (!this.needUpdate && this.matrix) return this.matrix
    this.needUpdate = false
    this.matrix = (Matrix3D.identity as any)()
    const position = this.getPosition()

    Matrix3D.inverse(
      Matrix3D.lookAt(
        [this.center.x + position[0], this.center.y + position[1], this.center.z + position[2]],
        [this.center.x, this.center.y, this.center.z],
        [0, 1, 0],
        this.matrix,
      ),
      this.matrix,
    )
    Matrix3D.multiply(this.matrix, TRANSFORM_MATRIX, this.matrix)
    return this.matrix
  }

  //根据给定的参数来计算相机的视图矩阵，getMatrixForParams方法会根据传入的phi、theta、radius和center来计算相机的视图矩阵，
  // 并返回这个矩阵，这个方法可以用于在动画过渡时根据中间状态来计算相机的视图矩阵，从而实现平滑过渡的效果
  getMatrixForParams(phi: number, theta: number, radius: number, center: Center): any {
    const matrix = (Matrix3D.identity as any)()
    const sinPhiRadius = Math.sin(phi) * radius
    const position = [
      sinPhiRadius * Math.sin(theta),
      Math.cos(phi) * radius,
      sinPhiRadius * Math.cos(theta),
    ]

    Matrix3D.inverse(
      Matrix3D.lookAt(
        [center.x + position[0], center.y + position[1], center.z + position[2]],
        [center.x, center.y, center.z],
        [0, 1, 0],
        matrix,
      ),
      matrix,
    )
    Matrix3D.multiply(matrix, TRANSFORM_MATRIX, matrix)
    return matrix
  }
}
