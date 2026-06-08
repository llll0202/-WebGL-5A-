import GLRenderer from './GLRenderer'
import GLGroup from './GLGroup'
import Ray from './Ray'
import MapData from './data/MapData'
import ObjectUtil from '../engine/utils/ObjectUtil'
import Matrix3D from '../engine/math/Matrix3D'
import SphericalCamera from '../engine/camera/SphericalCamera'
import AnimationUtil from '../engine/animation/AnimationUtil'
import componentsIndex from '../components/index'

export default class Map3D extends GLRenderer {
  props: {
    observe: {
      perspective: { viewRadians: number }
      pitch: number
      theta: number
      scale: number
      offsetX: number
      offsetY: number
      control: boolean
    }
    animation: {
      init: { enable: boolean; duration: number; ease: string }
      transform: { enable: boolean; duration: number; ease: string }
    }
  }
  sphericalCamera: SphericalCamera
  mapData: MapData
  animation: any
  renderMatrix: Float32Array
  _DOWN_ELEMENT_: any
  _HOVER_ELEMENT_: any

  //解构赋值，constructor方法会接受一个包含el和fps属性的对象作为参数，
  // 并将这些属性解构赋值到Map3D实例中，从而初始化地图渲染器的相关属性和功能
  constructor({ el, fps }: { el: null | HTMLElement; fps?: boolean }) {
    super({ el, fps })

    this.props = {
      observe: {
        perspective: {
          viewRadians: Math.PI / 3,
        },
        pitch: 30,
        theta: 0,
        scale: 1,
        offsetX: 0,
        offsetY: 0,
        control: true,
      },
      animation: {
        init: {
          enable: true,
          duration: 600,
          ease: 'cubicInOut',
        },
        transform: {
          enable: true,
          duration: 500,
          ease: 'cubicInOut',
        },
      },
    }
    this.sphericalCamera = new SphericalCamera(this.canvas)
    this.sphericalCamera.on('update', this.updateSelf)
    this.reload = this.reload.bind(this) as any

    this.__mousedown__ = this.__mousedown__.bind(this)
    this.__mouseup__ = this.__mouseup__.bind(this)
    this.__mousemove__ = this.__mousemove__.bind(this)
    this.__mouseout__ = this.__mouseout__.bind(this)
    this.__dblclick__ = this.__dblclick__.bind(this)
    this.canvas.addEventListener('mousedown', this.__mousedown__)
    this.canvas.addEventListener('mouseup', this.__mouseup__)
    this.canvas.addEventListener('dblclick', this.__dblclick__)
    this.canvas.addEventListener('mousemove', this.__mousemove__)
    this.canvas.addEventListener('mouseout', this.__mouseout__)
  }

  //设置地图数据，setMapData方法会将传入的地图数据设置到Map3D实例中，
  // 并根据这些数据来更新相机的位置和视角，以适应新的地图数据，
  // 从而实现地图的动态更新和交互功能
  setMapData(mapData: MapData) {
    if (this.mapData) {
      this.mapData.off('change', this.reload)
    }
    this.mapData = mapData
    this.mapData.on('change', this.reload)
    this.reload()
  }

  //重新加载地图数据，重新计算相机位置和视角，以适应新的地图数据
  reload() {
    if (!this.mapData || !this.mapData.getData().length) return

    //获取地图的边界框
    const [minX, minY, maxX, maxY] = this.mapData.getBounding()

    const w = maxX - minX
    const h = maxY - minY

    //计算地图的中心位置,offsetX和offsetY是相机观察中心的偏移量，单位是屏幕宽高的比例，例如offsetX=0.5表示相机观察中心向右偏移半个屏幕宽度，offsetY=0.5表示相机观察中心向下偏移半个屏幕高度，这样可以实现地图的平移效果
    const centerX = (maxX + minX) / 2 - w * this.props.observe.offsetX,
      centerY = (maxY + minY) / 2 - h * this.props.observe.offsetY

    //计算地图的大小和相机与地图之间的距离，size是根据地图的宽高和屏幕的宽高来计算的一个值，
    // 用于确定相机与地图之间的距离，以确保地图能够完整地显示在视野中，同时也可以根据需要进行适当的缩放和调整
    let size: number
    const widthRatio = w / this.style.width / window.devicePixelRatio,
      heightRatio = h / this.style.height / window.devicePixelRatio
    if (widthRatio > heightRatio) {
      size = w / 2
    } else {
      size = h / 2
    }

    //缩放
    //根据地图的大小和相机的视角来计算相机与地图之间的距离，
    // 以确保地图能够完整地显示在视野中，同时也可以根据需要进行适当的缩放和调整
    const distance =
      (size * 1.2 * this.props.observe.scale) /
      Math.tan(this.props.observe.perspective.viewRadians / 2)

    const isInit = !this.animation

    //如果正在进行动画，则取消当前动画，并将相机的位置和视角设置为动画结束时的状态，以确保在新的地图数据加载后相机能够正确地显示地图
    if (this.animation) {
      this.animation.cancel()
      this.sphericalCamera.theta =
        (this.props.observe.theta / 180) * Math.PI + (this.sphericalCamera.theta % (Math.PI * 2))
    } else {
      this.sphericalCamera.radius = distance * 2
      this.sphericalCamera.theta = (this.props.observe.theta / 180) * Math.PI - Math.PI / 2
      this.sphericalCamera.phi = 0.0001
      this.sphericalCamera.lookAt(centerX, 0.0001, centerY)
    }
    const animation = isInit ? this.props.animation.init : this.props.animation.transform

    const cameraProp = {
      radius: distance,
      theta: (this.props.observe.theta / 180) * Math.PI,
      phi: (this.props.observe.pitch / 180) * Math.PI,
    }

    const cameraCenterProp = {
      x: centerX,
      y: 0.0001,
      z: centerY,
    }

    if (animation.enable) {
      this.animation = AnimationUtil.executes({
        entries: [
          {
            target: this.sphericalCamera,
            properties: cameraProp,
          },
          {
            target: this.sphericalCamera.center,
            properties: cameraCenterProp,
          },
        ],
        duration: animation.duration,
        ease: animation.ease,
      })
    } else {
      Object.assign(this.sphericalCamera, cameraProp)
      Object.assign(this.sphericalCamera.center, cameraCenterProp)
    }
  }

  //设置地图属性，setProps方法会将传入的属性设置到Map3D实例中，并根据这些属性来更新相机的控制状态和地图的渲染状态，从而实现地图的动态更新和交互功能
  setProps(props: any) {
    ObjectUtil.setProps(this.props, props)
    this.sphericalCamera.setControl(this.props.observe.control)
    this.updateSelf()
  }

  //渲染地图，render方法会根据当前的地图数据和相机位置来渲染地图，
  render(gl: WebGLRenderingContext | WebGL2RenderingContext) {
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    if (!this.mapData || this.mapData.isEmpty()) return

    const projectionMatrix = Matrix3D.perspective(
      this.props.observe.perspective.viewRadians,
      this.style.width / this.style.height,
      0.00001,
      1000,
    )
    const viewMatrix = this.sphericalCamera.getMatrix()
    const matrix = Matrix3D.multiply(projectionMatrix, viewMatrix)
    const cameraPosition = this.sphericalCamera.getRealPosition()
    this.renderMatrix = matrix as unknown as Float32Array
    for (const child of this.getSortRenderChildren()) {
      child.draw(gl, matrix, {
        cameraPosition,
        pitch: this.sphericalCamera.phi,
      })
    }
  }

  //获取排序后的渲染子元素，getSortRenderChildren方法会根据子元素的zIndex属性来对子元素进行排序，
  // 并返回一个排序后的子元素列表，从而确保在渲染时按照正确的顺序来渲染子元素，以实现正确的视觉效果
  getSortRenderChildren(): GLGroup[] {
    const list: any[] = []
    for (const child of this.children) {
      const zIndex = Math.max(0, (child as any).$zIndex)
      let current = list[zIndex]
      if (!current) {
        list[zIndex] = current = []
      }
      current.push(child)
    }
    const sorts: any[] = []
    for (const current of list) {
      if (!current) continue
      for (const item of current) {
        sorts.push(item)
      }
    }
    return sorts
  }

  //创建一个新的GLGroup实例，createGroup方法会创建并返回一个新的GLGroup实例，
  // 这个实例可以作为地图的子元素来添加到地图中，从而实现地图的分层和组织结构
  createGroup(): GLGroup {
    const group = new GLGroup()
    return group
  }

  //根据类型创建一个新的组件实例，
  // createChild方法会根据传入的组件类型来创建并返回一个新的组件实例，
  // 这个实例可以作为地图的子元素来添加到地图中，从而实现地图的功能扩展和组件化开发
  createChild(type: string) {
    return new (componentsIndex[type] as any)(this)
  }

  //根据鼠标坐标获取被点击的元素，contain方法会根据传入的鼠标坐标来计算出一个射线，
  // 并遍历地图的子元素来判断这个射线是否与某个元素相交，
  // 如果相交则返回这个元素，否则返回地图本身，这个方法可以用于实现地图的交互功能，
  // 例如点击地图上的某个区域来显示相关信息，或者点击地图上的某个标记来触发相应的事件等
  contain(mx: number, my: number): any {
    //投影矩阵的计算，首先根据相机的视角和地图的宽高来计算出一个投影矩阵，
    const projectionMatrix = Matrix3D.perspective(
      this.props.observe.perspective.viewRadians,
      this.style.width / this.style.height,
      0.00001,
      1000,
    )
    //视图矩阵的计算，然后根据相机的位置和朝向来计算出一个视图矩阵
    const viewMatrix = this.sphericalCamera.getMatrix()
    //最后将投影矩阵和视图矩阵相乘得到一个最终的变换矩阵，这个矩阵可以将地图上的坐标转换为屏幕上的坐标，从而实现地图的渲染和交互功能
    const matrix = Matrix3D.multiply(projectionMatrix, viewMatrix)
    //归一化屏幕坐标
    const px = (mx / this.canvas.clientWidth) * 2 - 1
    const py = 1 - (my / this.canvas.clientHeight) * 2
    //获取相机的位置，然后根据鼠标的屏幕坐标和相机的位置来计算出一个射线，
    // 这个射线可以用于判断鼠标点击的位置是否与地图上的某个元素相交，从而实现地图的交互功能
    const position = this.sphericalCamera.getRealPosition()
    //屏幕位置到世界坐标的转换
    //screenpoint=projection * view * worldpoint
    //worldpoint= inverse(projection * view) * screenpoint
    const worldPosition = Matrix3D.transformPoint(Matrix3D.inverse(matrix), [px, py, 1])
    //
    const direction = Matrix3D.subtractVectors(worldPosition, position)
    const ray = new Ray(
      position as unknown as Float32Array,
      Matrix3D.normalize(direction) as unknown as Float32Array,
      { x: mx, y: my },
      matrix as unknown as Float32Array,
      { width: this.style.width, height: this.style.height },
    )

    const children = this.getSortRenderChildren()
    for (let i = children.length - 1; i >= 0; i--) {
      const child = children[i] as any
      const evt = child.__contain__(ray)
      if (evt) return evt
    }
    //如果没有任何子元素被点击，则返回地图本身，这样可以确保在点击地图的空白区域时仍然能够触发地图的相关事件和交互功能
    return this
  }

  //鼠标事件处理方法，__mousedown__、__mouseup__、__mousemove__、__mouseout__和__dblclick__方法
  // 分别用于处理鼠标按下、鼠标松开、鼠标移动、鼠标移出和鼠标双击事件，这些方法会根据事件的类型和位置来判断被点击的元素，
  // 并触发相应的事件，从而实现地图的交互功能
  __mousedown__(e: MouseEvent) {
    if (e.target !== this.canvas) return
    const target = this.contain(e.offsetX, e.offsetY)
    this._DOWN_ELEMENT_ = target
    this.__doEvent__('mousedown', target, e)
  }

  __mouseup__(e: MouseEvent) {
    const beforeElement = this._DOWN_ELEMENT_
    if (this._DOWN_ELEMENT_) {
      this.__doEvent__('mouserelease', this._DOWN_ELEMENT_, e)
      this._DOWN_ELEMENT_ = null
    }
    if (e.target !== this.canvas) return
    const target = this.contain(e.offsetX, e.offsetY)
    this.__doEvent__('mouseup', target, e)
    if (target === beforeElement) {
      this.__doEvent__('click', target, e)
    }
  }

  __dblclick__(e: MouseEvent) {
    if (e.target !== this.canvas) return
    const target = this.contain(e.offsetX, e.offsetY)
    this.__doEvent__('dblclick', target, e)
  }

  __mousemove__(e: MouseEvent) {
    if (e.target !== this.canvas) return
    const target = this.contain(e.offsetX, e.offsetY)
    this.canvas.style.cursor = (target as any).$cursor || ''
    if (this._HOVER_ELEMENT_ !== target && this._HOVER_ELEMENT_) {
      this.__doEvent__('mouseout', this._HOVER_ELEMENT_, e)
      this.__doEvent__('mouseover', target, e)
    }
    this._HOVER_ELEMENT_ = target
    this.__doEvent__('mousemove', target, e)
  }

  __mouseout__(e: MouseEvent) {
    if (this._HOVER_ELEMENT_) {
      this.__doEvent__('mouseout', this._HOVER_ELEMENT_, e)
      this._HOVER_ELEMENT_ = null
    }
  }

  __doEvent__(type: string, target: any, e: MouseEvent) {
    const event: any = {
      type,
      target,
      bubble: true,
      primitiveEvent: e,
    }
    const path: any[] = []
    let node = event.target
    while (node) {
      path.unshift(node)
      node = node.parentNode
    }
    event.path = path
    for (const node of path) {
      event.currentTarget = node
      node.fire(type, event, { capture: true })
      if (!event.bubble) return
    }
    event.target.bubbleEvent(type, event)
  }

  destroy() {
    this.canvas.removeEventListener('mousedown', this.__mousedown__)
    this.canvas.removeEventListener('mouseup', this.__mouseup__)
    this.canvas.removeEventListener('mousemove', this.__mousemove__)
    this.canvas.removeEventListener('mouseout', this.__mouseout__)
    this.canvas.removeEventListener('dblclick', this.__dblclick__)
    super.destroy()
  }
}
