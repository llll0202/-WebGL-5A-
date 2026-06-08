import MapData from '../core/data/MapData'
import JsonUtil from '../utils/JsonUtil'
import FilterMapData from '../core/data/FilterMapData'
import AnimationUtil from '../engine/animation/AnimationUtil'
import { onDrillDown } from '../core/drill'
import { showDetail } from '../core/detail'
import { changeRegion } from '../core/region'

const BASE = import.meta.env.BASE_URL

const PATH = '${BASE}geoJson/'
const TOURISM_PATH = '${BASE}tourism/'

export default {
  name: '全国5A景区',
  description: 'Point + PanelText',
  async setup(map: any) {
    const [geoJson, boundaryGeoJson, spotsData] = await Promise.all([
      JsonUtil.loadJson(PATH + '100000.json'),
      JsonUtil.loadJson(PATH + '100000_boundary.json'),
      JsonUtil.loadJson(TOURISM_PATH + 'spots222_complete.json'),
    ])
    // console.log(spotsData)

    const mapData = new MapData(geoJson, 'Mercator')
    const boundaryData = new MapData(boundaryGeoJson, 'Mercator')
    const HEIGHT = 50

    // TexturePanel - 纹理底图
    const txtPanel = map.createChild('TexturePanel')
    txtPanel.setProps({
      radius: 1.5,
      url: '/assets/txt.png',
      duration: -1,
      opacity: 0.3,
    })

    // TexturePanel - 圆圈背景底座
    const circleBasePanel = map.createChild('TexturePanel')
    circleBasePanel.setProps({
      radius: 1,
      url: '/assets/circle1.png',
      duration: 30000,
      blur: 2,
      opacity: 0.1,
    })

    // GridPanel -格网背景底座
    const gridPanel = map.createChild('GridPanel')
    gridPanel.setProps({
      number: 30,
      line: { enable: true, color: 'rgba(120,120,140,0.2)' },
      point: { enable: true, color: '#51b4c2' },
    })

    // Trace
    const trace = map.createChild('Trace')

    // CirclePanel--最外圈移动圆环
    const circlePanel = map.createChild('CirclePanel')
    circlePanel.setProps({ number: 50 })

    // 地理底图
    const backgroundArea = map.createChild('BackgroundArea')
    backgroundArea.$cursor = 'pointer'
    backgroundArea.setProps({
      border: { color: '#81d6d7' },
      background: { color: 'rgba(34,55,55,0.1)', texture: { enable: false } },
    })
    backgroundArea.height = HEIGHT
    // console.log('backgroundArea', backgroundArea)
    // Boundary - 带高度线边框
    const boundary = map.createChild('Boundary')
    boundary.setProps({
      color: '#5ff',
      lineWidth: 2,
      lineStyle: 'solid',
      shadow: {
        enable: true,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 10,
        shadowColor: '#fff',
      },
      insetShadow: { enable: true, shadowBlur: 100, shadowColor: '#00cfff' },
    })
    boundary.height = HEIGHT

    // EffectLight --外圈移动灯光
    const effectLight = map.createChild('EffectLight')
    effectLight.setProps({
      color: '#ffaa33',
      lineWidth: 50,
      lightNumber: 3,
      lightLength: 0.5,
      duration: 2000,
      ease: 'linear',
    })
    effectLight.height = HEIGHT

    // Section - 立体增强倒影
    const section = map.createChild('Section')
    section.setProps({
      color: [
        [0, '#5ff'],
        [0.3, 'rgba(0,0,0,0.5)'],
        [1, '#0092ff'],
      ],
      thickness: HEIGHT,
      reflection: { enable: true, scale: 2, blur: 1, opacity: 0.8 },
    })
    section.height = HEIGHT

    // 景区散点
    const point = map.createChild('Point')
    // 根据省份代码过滤景点数据
    function getPointData(spotsData: any[], mapData: MapData, adcode?: string) {
      return (
        spotsData
          .filter((spot: any) => {
            if (!spot.location) return false
            // 全国
            if (!adcode) return true
            // 省级
            if (adcode.endsWith('0000')) {
              return spot.provinceCode === adcode
            }
            // 市级
            if (adcode.endsWith('00')) {
              return spot.cityCode === adcode
            }
            return true // 全国显示所有
          })
          //经纬度数据格式转换
          .map((spot: any) => {
            const [lng, lat] = spot.location.split(',').map(Number)
            const position = mapData.getPositionByCoordinate([lng, lat])
            if (!position) return null
            return {
              pointType: 'position',
              point: position,
              radius: 10,
              color: '#ff6600',
              detail: spot,
            }
          })
          .filter(Boolean)
      )
    }
    point.setData(getPointData(spotsData, mapData))
    // console.log("spotsData", pointData);
    point.height = HEIGHT

    // 点位 Hover 交互
    point.on('pointMousemove', (e: any) => {
      showDetail({
        x: e.x,
        y: e.y,
        data: e.data,
      })
      // console.log(
      //   e,
      //   // e.x,
      //   // e.y,
      //   // e.data.detail.cityName,
      //   // e.data.detail.cityCode,
      //   // e.data.detail.name,
      //   // e.data.detail.id,
      // )
    })
    point.on('pointMouseout', () => {
      showDetail(null)
    })

    // PanelText - 渐变文字
    const panelText = map.createChild('PanelText')
    panelText.setProps({
      text: {
        font: {
          fontSize: 14,
          fontStyle: 'normal',
          fontWeight: 'normal',
          fontFamily: 'DingTalk',
          color: '#ffcf0f',
        },
        shadow: {
          //文字阴影
          enable: true,
          shadowBlur: 4,
          shadowColor: '#000',
          shadowOffsetX: -5,
          shadowOffsetY: 8,
        },
      },
    })
    panelText.height = HEIGHT

    //设置鼠标移动高亮
    // 设置数据
    const hoverMapData = new FilterMapData(mapData)
    hoverMapData.setDataFilter(() => false)

    // Hover 组件  --鼠标移动高光
    const hoverArea = map.createChild('BackgroundArea')
    hoverArea.$ignoreEvent = true
    hoverArea.setProps({
      border: { color: '#ffc400' },
      background: { color: 'rgba(255,242,0,0.15)' },
    })
    hoverArea.height = HEIGHT

    const hoverBoundary = map.createChild('Boundary')
    hoverBoundary.setProps({
      color: '#FF0',
      lineWidth: 2,
      shadow: {
        enable: true,
        shadowOffsetX: 0,
        shadowOffsetY: 0,
        shadowBlur: 10,
        shadowColor: '#FF0',
      },
      insetShadow: { enable: true, shadowBlur: 80, shadowColor: '#Fa0' },
    })

    // Section - 立体增强倒影(边界)
    const hoverSection = map.createChild('Section')
    hoverSection.setProps({
      effect: 0.5,
      color: [
        [0, 'rgba(255,242,0,0.4)'],
        [1, 'rgba(210,131,5,0.4)'],
      ],
      thickness: 0,
    })
    hoverSection.height = HEIGHT

    // 下钻交互
    backgroundArea.on('areaClick', async (area: any) => {
      const adcode: Number = area.properties.adcode
      changeRegion(area.properties.name)
      // console.log('点击了区域', area.properties.name, adcode)
      mapData.setData(await JsonUtil.loadJson(PATH + area.properties.adcode + '.json'))
      boundaryData.setData(
        await JsonUtil.loadJson(PATH + area.properties.adcode + '_boundary.json'),
      )
      // 下钻后只显示该省景点
      point.setData(getPointData(spotsData, mapData, adcode.toString()))

      onDrillDown(async () => {
        mapData.setData(await JsonUtil.loadJson(PATH + '100000.json'))
        // console.log(PATH + '100000.json')
        boundaryData.setData(await JsonUtil.loadJson(PATH + '100000_boundary.json'))
        // 返回全国时恢复所有景点
        point.setData(getPointData(spotsData, mapData))
      })
    })

    map.addChild(
      backgroundArea,
      circleBasePanel,
      effectLight,
      txtPanel,
      gridPanel,
      // hoverArea,
      section,
      trace,
      circlePanel,
      point,
      boundary,
      panelText,
      hoverArea,
      hoverBoundary,
      hoverSection,
    )

    boundary.setMapData(boundaryData)
    circleBasePanel.setMapData(boundaryData)
    txtPanel.setMapData(boundaryData)
    effectLight.setMapData(boundaryData)
    section.setMapData(boundaryData)
    gridPanel.setMapData(boundaryData)
    trace.setMapData(boundaryData)
    circlePanel.setMapData(boundaryData)
    map.setMapData(mapData)
    backgroundArea.setMapData(mapData)
    panelText.setMapData(mapData)
    // 用经纬度坐标设置点位
    point.setMapData(mapData)

    hoverArea.setMapData(hoverMapData)
    hoverBoundary.setMapData(hoverMapData)
    hoverSection.setMapData(hoverMapData)

    // Hover 交互
    backgroundArea.on('areaChange', (area: any) => {
      if (area) {
        hoverMapData.setDataFilter((item: any) => {
          return item.properties && item.properties.adcode === area.properties.adcode
        })
        hoverArea.height = backgroundArea.height
        hoverSection.height = backgroundArea.height
        hoverBoundary.height = backgroundArea.height
        AnimationUtil.execute({
          duration: 3000,
          ease: 'cubicOut',
          update(percent: number) {
            const h = backgroundArea.height + 20 * percent
            hoverArea.height = h // 高亮区域升高
            hoverSection.height = h // 侧面升高
            hoverBoundary.height = h // 边界线升高
            hoverSection.setProps({ thickness: 20 * percent })
          },
        })
      } else {
        hoverMapData.setDataFilter(() => false) // 过滤掉所有，高亮消失
      }
    })
  },
}
