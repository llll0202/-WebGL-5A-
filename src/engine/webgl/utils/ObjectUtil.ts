//深度合并对象，deepAssign方法会将源对象的属性递归地合并到目标对象中，如果源对象的属性也是一个对象，那么这个方法会继续递归地合并这个属性的子属性，直到所有的属性都被合并完成为止，这个方法可以用于将多个对象的属性合并到一个对象中，从而实现更复杂的数据结构和功能
function deepAssign(target: any, source: any): any {
  if (!source) return target;
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue;
    let sourceValue: any = source[key];
    let targetValue: any = target[key];
    if (sourceValue !== undefined && targetValue !== undefined) {
      if (typeof sourceValue === "object" && typeof targetValue === "object") {
        if (sourceValue === null || targetValue === null) {
          target[key] = sourceValue;
        } else if (
          sourceValue instanceof Array &&
          targetValue instanceof Array
        ) {
          for (let i = 0, l = sourceValue.length; i < l; i++) {
            let tv: any = targetValue[i];
            let sv: any = sourceValue[i];
            if (!tv || !sv) {
              targetValue[i] = deepClone(sv);
            } else {
              deepAssign(tv, sv);
            }
          }
          targetValue.splice(
            sourceValue.length,
            targetValue.length - sourceValue.length,
          );
        } else {
          deepAssign(targetValue, sourceValue);
        }
      } else {
        target[key] = sourceValue;
      }
    } else {
      target[key] = sourceValue;
    }
  }
  return target;
}

//深度克隆对象，deepClone方法会创建一个新的对象，并将源对象的属性递归地复制到这个新对象中，如果源对象的属性也是一个对象，那么这个方法会继续递归地复制这个属性的子属性，直到所有的属性都被复制完成为止，这个方法可以用于创建一个与源对象完全独立的新对象，从而避免对原始数据的修改和副作用
function deepClone(data: any): any {
  if (!(data instanceof Object) || typeof data == "function") {
    return data;
  }
  let constructor = data.constructor;
  let result = new constructor();

  for (let key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = deepClone(data[key]);
    }
  }
  return result;
}

//设置对象属性，setProps方法会将源对象的属性设置到目标对象中，如果源对象的属性也是一个对象，那么这个方法会直接将这个属性赋值给目标对象，而不会进行递归的合并，这个方法可以用于将一个对象的属性直接覆盖到另一个对象中，从而实现简单的数据更新和替换功能
function setProps(target: any, source: any): any {
  if (!source) return target;
  for (let key in source) {
    if (!source.hasOwnProperty(key)) continue;
    let sourceValue: any = source[key];
    let targetValue: any = target[key];
    if (sourceValue !== undefined && targetValue !== undefined) {
      if (typeof sourceValue === "object" && typeof targetValue === "object") {
        if (sourceValue === null || targetValue === null) {
          target[key] = sourceValue;
        } else if (
          sourceValue instanceof Array &&
          targetValue instanceof Array
        ) {
          target[key] = sourceValue;
        } else {
          deepAssign(targetValue, sourceValue);
        }
      } else {
        target[key] = sourceValue;
      }
    } else {
      target[key] = sourceValue;
    }
  }
  return target;
}

export default { deepAssign, deepClone, setProps };
