import GLTexture from "./GLTexture";
import type { GLTextureOptions } from "./GLTexture";

//帧缓冲对象，GLRenderTarget类用于创建和管理WebGL的帧缓冲对象（Framebuffer Object），
// 它提供了一系列方法来设置帧缓冲的属性、绑定和解绑帧缓冲、获取帧缓冲中的纹理等功能，
// 从而使得开发者可以方便地在WebGL中实现离屏渲染、后期处理等效果
export default class GLRenderTarget {
  gl: WebGL2RenderingContext;
  width: number;
  height: number;
  textureOptions: GLTextureOptions | undefined;
  frameBuffer: WebGLFramebuffer | null;
  texture: GLTexture | null;
  beforeFrameBuffer: WebGLFramebuffer | null;
  beforeViewPort: Int32Array | Float32Array | null;

  constructor(
    gl: WebGL2RenderingContext,
    width: number,
    height: number,
    textureOptions?: GLTextureOptions,
  ) {
    this.gl = gl;
    this.width = width;
    this.height = height;
    this.textureOptions = textureOptions;
    this.frameBuffer = null;
    this.texture = null;
    this.beforeFrameBuffer = null;
    this.beforeViewPort = null;
  }

  use(): void {
    let beforeFrameBuffer = this.gl.getParameter(this.gl.FRAMEBUFFER_BINDING);
    if (this.frameBuffer !== null && beforeFrameBuffer === this.frameBuffer)
      return;
    this.beforeFrameBuffer = beforeFrameBuffer;
    this.beforeViewPort = this.gl.getParameter(this.gl.VIEWPORT);
    if (!this.frameBuffer) {
      this.frameBuffer = this.gl.createFramebuffer();
      this.texture = new GLTexture(
        this.gl,
        [this.width, this.height],
        this.textureOptions,
      );
      this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.texture.get(),
        0,
      );
    }

    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.frameBuffer);

    if (this.texture && this.texture.needUpdate) {
      this.gl.framebufferTexture2D(
        this.gl.FRAMEBUFFER,
        this.gl.COLOR_ATTACHMENT0,
        this.gl.TEXTURE_2D,
        this.texture.get(),
        0,
      );
    }

    this.gl.viewport(0, 0, this.width, this.height);
  }

  pop(): void {
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, this.beforeFrameBuffer);
    if (this.beforeViewPort) {
      this.gl.viewport(
        this.beforeViewPort[0],
        this.beforeViewPort[1],
        this.beforeViewPort[2],
        this.beforeViewPort[3],
      );
    }
  }

  getTexture(): GLTexture | null {
    if (!this.texture) this.use();
    return this.texture;
  }

  clear(): void {
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    if (this.texture) {
      this.texture.setSize(width, height);
    }
  }

  destroy(): void {
    if (this.frameBuffer) this.gl.deleteFramebuffer(this.frameBuffer);
    if (this.texture) this.texture.destroy();
  }
}
