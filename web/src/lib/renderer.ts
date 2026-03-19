interface ViewportCache {
  canvasW: number;
  canvasH: number;
  frameW: number;
  frameH: number;
  vx: number;
  vy: number;
  vw: number;
  vh: number;
}

export interface RendererHandle {
  readonly gl: WebGLRenderingContext;
  readonly texture: WebGLTexture;
  /** @internal cached viewport geometry */
  _vp: ViewportCache | null;
}

export function createRenderer(
  canvas: HTMLCanvasElement,
): RendererHandle | null {
  const gl = canvas.getContext("webgl", {
    antialias: false,
    alpha: false,
    preserveDrawingBuffer: true,
  });
  if (!gl) return null;

  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(
    vs,
    `attribute vec2 aPos; attribute vec2 aUV; varying vec2 vUV;
     void main() { gl_Position = vec4(aPos, 0.0, 1.0); vUV = aUV; }`,
  );
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(
    fs,
    `precision mediump float; varying vec2 vUV; uniform sampler2D uTex;
     void main() { gl_FragColor = texture2D(uTex, vUV); }`,
  );
  gl.compileShader(fs);

  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.useProgram(prog);

  // prettier-ignore
  const verts = new Float32Array([
    -1,-1, 0,1,  1,-1, 1,1,  -1,1, 0,0,  1,1, 1,0,
  ]);
  const vbo = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(prog, "aPos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);

  const aUV = gl.getAttribLocation(prog, "aUV");
  gl.enableVertexAttribArray(aUV);
  gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 16, 8);

  const texture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return { gl, texture, _vp: null };
}

/** Sync the canvas backing buffer to match its CSS display size at device pixel ratio. */
export function syncCanvasSize(handle: RendererHandle): void {
  const canvas = handle.gl.canvas as HTMLCanvasElement;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const w = Math.round((canvas.clientWidth || window.innerWidth) * dpr);
  const h = Math.round((canvas.clientHeight || window.innerHeight) * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
    handle._vp = null;
  }
}

/** Upload RGBA pixels and draw the fullscreen quad, letterboxing to preserve aspect ratio. */
export function drawFrame(
  handle: RendererHandle,
  width: number,
  height: number,
  pixels: Uint8Array,
): void {
  const { gl, texture } = handle;
  const cw = gl.canvas.width;
  const ch = gl.canvas.height;

  let vp = handle._vp;
  if (
    !vp ||
    vp.canvasW !== cw ||
    vp.canvasH !== ch ||
    vp.frameW !== width ||
    vp.frameH !== height
  ) {
    const scale = Math.min(cw / width, ch / height);
    const vw = Math.round(width * scale);
    const vh = Math.round(height * scale);
    vp = {
      canvasW: cw,
      canvasH: ch,
      frameW: width,
      frameH: height,
      vx: Math.round((cw - vw) / 2),
      vy: Math.round((ch - vh) / 2),
      vw,
      vh,
    };
    handle._vp = vp;
  }

  gl.clearColor(0, 0, 0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.viewport(vp.vx, vp.vy, vp.vw, vp.vh);

  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    width,
    height,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}
