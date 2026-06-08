import MapUtil from "./MapUtil";
import EventTarget from "../EventTarget";

export default class MapData extends EventTarget {
  geoJson: any;
  projection: string | null;
  bounding: [number | null, number | null, number | null, number | null];
  projectionData: any[];
  projectionDataMapping: Record<string, any>;
  width: number;
  height: number;
  radius: number;
  areaPositionFilter: Function | null;

  constructor(geoJson: any = null, projection: string = "Mercator") {
    super();
    this.geoJson = geoJson;
    this.projection = null;
    this.bounding = [null, null, null, null];
    this.projectionDataMapping = {};
    this.areaPositionFilter = null;
    this.setProjection(projection);
  }

  destroy() {
    super.destroy();
  }

  //设置地图数据，geoJson参数是一个包含地理信息的对象，setData方法会将这个对象存储在MapData实例中，
  // 并调用computeProjectionData方法来计算投影数据和相关属性
  setData(geoJson: any) {
    this.geoJson = geoJson;
    this.computeProjectionData();
  }

  //设置地图的投影方式，projection参数是一个字符串，表示地图的投影方式，
  // setProjection方法会将这个投影方式存储在MapData实例中，并调用computeProjectionData方法来重新计算投影数据和相关属性
  setProjection(projection: string) {
    if (this.projection === projection) return;
    this.projection = projection;
    this.computeProjectionData();
  }

  //获取地图的边界框，返回一个包含最小x、最小y、最大x、最大y的数组，getBounding方法会根据地图数据计算出地图的边界框，并返回这个边界框，如果地图数据为空，则返回一个默认的边界框[0, 0, 1, 1]
  getBounding(): [number, number, number, number] {
    if (this.isEmpty()) return [0, 0, 1, 1];
    return this.bounding as [number, number, number, number];
  }

  //获取地图范围的范围半径
  getRadius(): number {
    if (this.isEmpty()) return 0;
    return this.radius;
  }

  //获取地图的宽度，如果地图数据为空，则返回0，getWidth方法会根据地图的边界框来计算地图的宽度，并返回这个宽度
  getWidth(): number {
    if (this.isEmpty()) return 0;
    return this.width;
  }

  //获取地图的高度，如果地图数据为空，则返回0，getHeight方法会根据地图的边界框来计算地图的高度，并返回这个高度
  getHeight(): number {
    if (this.isEmpty()) return 0;
    return this.height;
  }

  //获取地图的宽高比，getRatio方法会根据地图的宽度和高度来计算地图的宽高比，并返回这个宽高比，如果地图数据为空，则返回1
  getRatio(): number {
    if (this.isEmpty()) return 1;
    return this.height / this.width;
  }

  //将地图数据中的距离值转换为地图坐标系中的值，convertSize方法会根据地图的半径来计算出一个比例因子，然后将传入的距离值乘以这个比例因子，从而得到在地图坐标系中的值，这个方法可以用于将实际的距离值转换为在地图上显示的距离值，从而实现地图的缩放效果
  convertSize(value: number): number {
    if (this.isEmpty()) return 0;
    return (this.radius / 1000) * value;
  }

  //计算地图的投影数据和相关属性，computeProjectionData方法会根据地图数据和投影方式来计算出地图的投影数据，
  // 并根据投影数据来计算地图的边界框、宽度、高度和半径等属性，这些属性可以用于地图的渲染和交互等功能
  computeProjectionData() {
    this.projectionData = MapUtil.build(this.geoJson, this.projection!);
    this.projectionDataMapping = {};
    this.bounding = [null, null, null, null];
    for (let row of this.projectionData) {
      this.bounding[0] =
        this.bounding[0] === null
          ? row.geometry.box[0]
          : Math.min(row.geometry.box[0], this.bounding[0]!);
      this.bounding[1] =
        this.bounding[1] === null
          ? row.geometry.box[1]
          : Math.min(row.geometry.box[1], this.bounding[1]!);
      this.bounding[2] =
        this.bounding[2] === null
          ? row.geometry.box[2]
          : Math.max(row.geometry.box[2], this.bounding[2]!);
      this.bounding[3] =
        this.bounding[3] === null
          ? row.geometry.box[3]
          : Math.max(row.geometry.box[3], this.bounding[3]!);
      if (!row.properties || !row.properties.adcode) continue;
      this.projectionDataMapping[row.properties.adcode] = row;
    }
    this.width = (this.bounding[2] as number) - (this.bounding[0] as number);
    this.height = (this.bounding[3] as number) - (this.bounding[1] as number);
    //sqar平方根，pow平方，半径是宽高的一半的平方和的平方根，即对角线的一半，
    // 这样可以保证地图的所有部分都在一个以中心点为圆心，半径为radius的圆内，从而方便进行缩放和平移等操作
    this.radius = Math.sqrt(
      Math.pow(this.width / 2, 2) + Math.pow(this.height / 2, 2),
    );
    this.fire("change");
  }

  //获取地图的投影数据，getData方法会返回一个包含地图投影数据的数组，这些数据可以用于地图的渲染和交互等功能
  getData(): any[] {
    return this.projectionData;
  }

  //根据行政区划代码获取地图数据，getDataByAdcode方法会根据传入的行政区划代码来查找对应的地图数据，
  // 并返回这个数据，如果没有找到对应的数据，则返回null，这个方法可以用于根据用户的输入或者交互来获取特定区域的地图数据，
  // 从而实现地图的动态更新和交互功能
  getDataByAdcode(adcode: string | number): any {
    if (!adcode) return null;
    return this.projectionDataMapping[adcode];
  }

  //设置区域位置过滤器，setAreaPositionFilter方法会将传入的函数存储在MapData实例中，
  // 并在获取区域位置时调用这个函数来对位置进行过滤和调整，从而实现自定义的区域位置计算逻辑，
  // 这个方法可以用于根据特定的需求来调整区域的位置，例如根据人口密度来调整城市的位置，或者根据地形特征来调整山区的位置等
  setAreaPositionFilter(callback: Function) {
    this.areaPositionFilter = callback;
    this.fire("areaPositionChange");
  }

  //根据行政区划代码获取区域的位置，getPositionByAdcode方法会根据传入的行政区划代码来获取对应的地图数据，
  getPositionByAdcode(adcode: string | number): number[] | null {
    if (!adcode) return null;
    let position: number[] | null;
    try {
      position = this.__getPositionByAdcode__(adcode);
    } catch (e) {
      return null;
    }
    if (!this.areaPositionFilter || !position) return position;
    let area = this.getDataByAdcode(adcode);
    return this.areaPositionFilter(area, position);
  }

  //根据行政区划代码获取区域的位置，__getPositionByAdcode__方法会根据传入的行政区划代码来获取对应的地图数据，
  __getPositionByAdcode__(adcode: string | number): number[] | null {
    if (!adcode) return null;
    let screenData = this.getDataByAdcode(adcode);
    if (!screenData) return null;
    let centroid =
      screenData.properties.centroid || screenData.properties.center;
    if (centroid) {
      return MapUtil.convert(centroid, this.projection!);
    }
    return [
      (screenData.geometry.box[0] + screenData.geometry.box[2]) / 2,
      (screenData.geometry.box[1] + screenData.geometry.box[3]) / 2,
    ];
  }

  //根据坐标获取区域的位置，getPositionByCoordinate方法会根据传入的坐标来计算出在地图坐标系中的位置，并返回这个位置，如果计算过程中发生错误，则返回null，这个方法可以用于根据用户的输入或者交互来获取特定坐标的地图位置，从而实现地图的动态更新和交互功能
  getPositionByCoordinate(coordinate: number[]): number[] | null {
    try {
      return MapUtil.convert(coordinate, this.projection!);
    } catch (e) {
      return null;
    }
  }

  //根据任意数据获取区域的位置，getPositionByAny方法会根据传入的数据来判断应该使用哪种方式来获取区域的位置，如果数据是一个数组，则调用getPositionByCoordinate方法来获取位置，如果数据不是一个数组，则调用getPositionByAdcode方法来获取位置，这个方法可以用于根据不同类型的数据来获取区域的位置，从而实现更灵活的地图交互功能
  getPositionByAny(data: any): number[] | null {
    if (data instanceof Array) {
      return this.getPositionByCoordinate(data);
    }
    return this.getPositionByAdcode(data);
  }

  isEmpty(): boolean {
    return !this.projectionData || !this.projectionData.length;
  }
}
