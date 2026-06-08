import Node from "./Node";
import Ray from "./Ray";

export default class GLGroup extends Node {
  $ignoreEvent: boolean;
  $zIndex: number;
  $visible: boolean;

  constructor() {
    super();
    this.updateSelf = this.updateSelf.bind(this);
    this.$ignoreEvent = false;
    this.$zIndex = 0;
    this.$visible = true;
  }

  //更新自己，默认实现是调用父节点的updateSelf方法，子类可以重写这个方法来实现自己的更新逻辑
  //这个方法的作用是当节点的状态发生变化时，通知父节点进行更新，从而触发整个场景的重新渲染
  updateSelf() {
    if (this.parentNode) (this.parentNode as any).updateSelf();
  }

  //判断是否可见，不可见的节点不会被渲染，也不会参与事件检测
  draw(...args: any[]) {
    if (!this.$visible) return;
    this.render(
      ...(args as [
        WebGLRenderingContext | WebGL2RenderingContext,
        Float32Array,
        any,
      ]),
    );
  }

  //判断子节点是否可见，不可见的子节点不会被渲染，也不会参与事件检测
  render(
    gl: WebGLRenderingContext | WebGL2RenderingContext,
    matrix: Float32Array,
    options?: any,
  ) {
    for (let child of this.getSortRenderChildren()) {
      child.draw(gl, matrix, options);
    }
  }

  //判断鼠标点击位置，与渲染顺序相反的顺序遍历子节点，找到第一个包含点击位置的子节点并返回，如果没有找到则返回null
  __contain__(ray: Ray): any {
    if (this.$ignoreEvent) return false;
    let children = this.getSortRenderChildren();
    for (let i = children.length - 1; i >= 0; i--) {
      let child = children[i] as any;
      let evt = child.__contain__(ray);
      if (evt) return evt;
    }
    return null;
  }

  //获取排序后的子节点，默认实现是根据子节点的$zIndex属性进行排序，子类可以重写这个方法来实现自己的排序逻辑
  getSortRenderChildren(): GLGroup[] {
    let list: any[] = [];
    //根据子节点的$zIndex属性将子节点分组，$zIndex相同的子节点会被放在同一个组里(数组包数组的形式)
    //list是全新的数组，里面【【$zIndex一样的】，【】，【】】
    for (let child of this.children) {
      let zIndex = Math.max(0, (child as any).$zIndex);
      let current = list[zIndex];
      if (!current) {
        //排序利用了数组的索引，隐式排序，$zIndex相同的子节点会被放在同一个组里(数组包数组的形式)，list是全新的数组，里面【【$zIndex一样的】，【】，【】】
        list[zIndex] = current = [];
      }
      current.push(child);
    }
    //将分组后的子节点按照$zIndex从小到大排序，$zIndex相同的子节点保持原有顺序
    let sorts: any[] = [];
    for (let current of list) {
      if (!current) continue;
      for (let item of current) {
        sorts.push(item);
      }
    }
    return sorts;
  }
}
