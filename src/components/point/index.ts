// import GL3DLayer from "../../core/layers/GL3DLayer";
import GLPanelLayer from '../../core/layers/GLPanelLayer'
import GLProject from '../../engine/webgl/GLProject'
import shader from './shader'
import GLBuffer from '../../engine/webgl/GLBuffer'
import ColorUtil from '../../engine/color/ColorUtil'
import ObjectUtil from '../../engine/utils/ObjectUtil'
import AnimationUtil from '../../engine/animation/AnimationUtil'

export default class Point extends GLPanelLayer {
  props: any = {
    duration: 5000,
    number: 4,
  }
  needUpdate: boolean = true
  ticker: any = null
  drawProject: any = null
  buffer: any = null
  colorBuffer: any = null
  data: any = null
  timer: number = 0
  percent: number = 0
  pointPositions: any[] = []
  activePoint: any = null

  constructor() {
    super()

    this.on('destroy', () => {
      AnimationUtil.cancelTick(this.ticker)
      if (this.drawProject) this.drawProject.destroy()
      if (this.drawProject) this.drawProject.destroy()
      if (this.buffer) this.buffer.destroy()
      if (this.colorBuffer) this.colorBuffer.destroy()
    })
  }

  setProps(props: any) {
    ObjectUtil.setProps(this.props, props)
    this.refresh()
  }

  setData(data: any) {
    this.data = data
    this.refresh()
  }

  setMapData(mapData: any) {
    if (this.mapData) {
      this.mapData.off('change', this.refresh)
      this.mapData.off('areaPositionChange', this.refresh)
    }
    this.mapData = mapData
    if (this.mapData) {
      this.mapData.on('change', this.refresh)
      this.mapData.on('areaPositionChange', this.refresh)
    }
    this.refresh()
  }

  reset() {
    this.timer = 0
    this.percent = 0
    AnimationUtil.cancelTick(this.ticker)
    this.ticker = AnimationUtil.tick((delta: number) => {
      this.percent = this.timer / this.props.duration
      this.timer += delta
      this.timer = this.timer % this.props.duration
      this.updateSelf()
    })
  }

  refresh() {
    this.needUpdate = true
    this.updateSelf()
    this.reset()
  }

  refreshBuffer(gl: any) {
    const array: any = []
    const colorArray: any = []
    this.pointPositions = []

    for (const row of this.data) {
      let position = null

      // 根据 pointType 判断
      switch (row.pointType) {
        // 经纬度
        case 'coordinate':
          position = this.mapData.getPositionByCoordinate(row.point)
          break

        // 已经是屏幕坐标
        case 'position':
          position = row.point
          break

        // adcode / name 等默认逻辑
        default:
          position = this.mapData.getPositionByAny(row.point)
      }

      if (!position) continue

      const radius = this.mapData.convertSize(row.radius)
      const color = ColorUtil.toOneRGBA(row.color)

      this.pointPositions.push({
        x: position[0],
        y: position[1],
        radius,
        data: row,
      })

      if (array.length) {
        array.push(
          array[array.length - 4],
          array[array.length - 3],
          array[array.length - 2],
          array[array.length - 1],
        )

        array.push(position[0] - radius, position[1] - radius, 0, 0)

        colorArray.push(
          colorArray[colorArray.length - 4],
          colorArray[colorArray.length - 3],
          colorArray[colorArray.length - 2],
          colorArray[colorArray.length - 1],
        )

        colorArray.push(color[0], color[1], color[2], color[3])
      }

      array.push(position[0] - radius, position[1] - radius, 0, 0)
      array.push(position[0] + radius, position[1] - radius, 1, 0)
      array.push(position[0] - radius, position[1] + radius, 0, 1)
      array.push(position[0] + radius, position[1] + radius, 1, 1)

      for (let i = 0; i < 4; i++) {
        colorArray.push(color[0], color[1], color[2], color[3])
      }
    }

    if (!this.buffer) {
      this.buffer = new GLBuffer(gl, gl.ARRAY_BUFFER, gl.STATIC_DRAW, new Float32Array(array))
    } else {
      this.buffer.setData(new Float32Array(array))
    }

    if (!this.colorBuffer) {
      this.colorBuffer = new GLBuffer(
        gl,
        gl.ARRAY_BUFFER,
        gl.STATIC_DRAW,
        new Float32Array(colorArray),
      )
    } else {
      this.colorBuffer.setData(new Float32Array(colorArray))
    }
  }

  // 判断鼠标是否在某个点的范围内
  contain(p: any, e?: any) {
    for (const point of this.pointPositions) {
      const dx = p[0] - point.x
      const dy = p[1] - point.y
      // console.log(p)
      // console.log(e)
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= point.radius) {
        this.activePoint = point

        this.fire('pointMousemove', {
          x: e.mouse.x,
          y: e.mouse.y,
          data: point.data,
        })

        return true
      }
    }

    if (this.activePoint) {
      this.activePoint = null

      this.fire('pointMouseout')
    }

    return false
  }

  render(gl: any, matrix: any) {
    if (!this.mapData || this.mapData.isEmpty() || !this.data) return

    if (this.needUpdate) {
      this.needUpdate = false
      this.refreshBuffer(gl)
    }

    if (!this.drawProject) {
      this.drawProject = new GLProject(gl, shader)
    }

    this.drawProject.use()

    this.drawProject.setUniforms({
      uMatrix: {
        data: matrix,
      },
      uHeight: {
        data: this.mapData.convertSize(this.height),
      },
      uSize: {
        data: [gl.canvas.width, gl.canvas.height],
      },
      uPercent: {
        data: this.percent,
      },
      uNumber: {
        data: this.props.number,
      },
    })
    this.drawProject.setAttributes({
      aVertices: {
        data: this.buffer,
        size: 4,
      },
      aVerticesColor: {
        data: this.colorBuffer,
        size: 4,
      },
    })
    gl.disable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.buffer.length / 4)
  }
}
