import GLShader from "./GLShader";

interface UniformInfo {
  type: number;
  location: WebGLUniformLocation | null;
}

interface AttributeInfo {
  type: number;
  location: number;
}

interface UniformData {
  data: any;
  transpose?: boolean;
}

interface AttributeData {
  data: any;
  size: number;
  type?: number;
  normalized?: boolean;
  stride?: number;
  offset?: number;
}

export default class GLProject {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  vsShader: GLShader;
  fsShader: GLShader;
  uniforms: Record<string, WebGLUniformLocation | null>;
  attributes: Record<string, number>;
  uniformMap: Record<string, UniformInfo>;
  attributeMap: Record<string, AttributeInfo>;

  constructor(
    gl: WebGL2RenderingContext,
    { vsSource, fsSource }: { vsSource: string; fsSource: string },
  ) {
    this.gl = gl;
    //创建WebGL程序对象，并编译和链接顶点着色器和片段着色器，GLProject类的构造函数会创建一个新的WebGL程序对象，并使用传入的顶点着色器和片段着色器源代码来编译和链接这个程序，从而使得这个程序可以用于后续的渲染操作
    this.program = gl.createProgram()!;
    this.vsShader = new GLShader(gl, gl.VERTEX_SHADER, vsSource);
    this.fsShader = new GLShader(gl, gl.FRAGMENT_SHADER, fsSource);
    gl.attachShader(this.program, this.vsShader.shader);
    gl.attachShader(this.program, this.fsShader.shader);
    gl.linkProgram(this.program);
    this.uniforms = {};
    this.attributes = {};

    this.uniformMap = {};
    this.attributeMap = {};

    let numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
    let numAttributes = gl.getProgramParameter(
      this.program,
      gl.ACTIVE_ATTRIBUTES,
    );

    for (let i = 0; i < numUniforms; ++i) {
      let obj = gl.getActiveUniform(this.program, i);
      if (!obj) continue;
      let location = gl.getUniformLocation(this.program, obj.name);
      this.uniforms[obj.name] = location;
      this.uniformMap[obj.name] = {
        type: obj.type,
        location: location,
      };
    }
    for (let i = 0; i < numAttributes; i++) {
      let obj = gl.getActiveAttrib(this.program, i);
      if (!obj) continue;
      let location = gl.getAttribLocation(this.program, obj.name);
      this.attributes[obj.name] = location;
      this.attributeMap[obj.name] = {
        type: obj.type,
        location: location,
      };
    }
  }

  //使用当前绑定的WebGL程序对象，
  use(): void {
    this.gl.useProgram(this.program);
  }

  destroy(): void {
    for (let key in this.attributeMap) {
      let attributeInfo = this.attributeMap[key];
      this.gl.disableVertexAttribArray(attributeInfo.location);
    }
    this.gl.deleteProgram(this.program);
    this.vsShader.destroy();
    this.fsShader.destroy();
  }

  //创建uniforms数据，setUniforms方法会将传入的uniforms数据设置到WebGL上下文中，并根据uniforms数据的类型来调用对应的WebGL函数，从而使得这些uniforms可以用于后续的渲染操作
  setUniforms(uniforms: Record<string, UniformData>): void {
    for (let key in uniforms) {
      let uniformInfo = this.uniformMap[key];
      if (!uniformInfo) continue;
      let uniform = uniforms[key];

      switch (uniformInfo.type) {
        case this.gl.FLOAT: {
          this.gl.uniform1f(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC2: {
          this.gl.uniform2fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC3: {
          this.gl.uniform3fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_VEC4: {
          this.gl.uniform4fv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.SAMPLER_2D:
        case this.gl.INT_SAMPLER_2D:
        case this.gl.BOOL:
        case this.gl.INT: {
          this.gl.uniform1i(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC2: {
          this.gl.uniform2iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC3: {
          this.gl.uniform3iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.INT_VEC4: {
          this.gl.uniform4iv(uniformInfo.location, uniform.data);
          break;
        }
        case this.gl.FLOAT_MAT2: {
          this.gl.uniformMatrix2fv(
            uniformInfo.location,
            uniform.transpose,
            uniform.data,
          );
          break;
        }
        case this.gl.FLOAT_MAT3: {
          this.gl.uniformMatrix3fv(
            uniformInfo.location,
            uniform.transpose,
            uniform.data,
          );
          break;
        }
        case this.gl.FLOAT_MAT4: {
          this.gl.uniformMatrix4fv(
            uniformInfo.location,
            uniform.transpose,
            uniform.data,
          );
          break;
        }
        default: {
          console.warn("没有匹配到对应类型:" + uniformInfo.type);
        }
      }
    }
  }

  //设置属性数据，setAttributes方法会将传入的属性数据设置到WebGL上下文中，并启用对应的顶点属性数组，从而使得这些属性可以用于后续的渲染操作
  setAttributes(attributes: Record<string, AttributeData>): void {
    for (let key in attributes) {
      let attributeInfo = this.attributeMap[key];
      if (!attributeInfo) continue;
      let attribute = attributes[key];
      attribute.data.use();
      this.gl.enableVertexAttribArray(attributeInfo.location);
      this.gl.vertexAttribPointer(
        attributeInfo.location,
        attribute.size,
        attribute.type || this.gl.FLOAT,
        attribute.normalized || false,
        attribute.stride || 0,
        attribute.offset || 0,
      );
    }
  }
}
