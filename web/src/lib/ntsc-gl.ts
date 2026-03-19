/**
 * NtscGL — GPU-only NTSC/VHS processing pipeline.
 *
 * Runs the entire NTSC signal processing as 7 multi-pass WebGL 2 fragment
 * shaders. Video frames go directly from source → GPU texture → shader
 * pipeline → screen, with zero CPU pixel touching.
 */

import { VERTEX_SHADER } from "./shaders/common";
import { PASS0_FRAGMENT } from "./shaders/pass0-yiq";
import { PASS1_FRAGMENT } from "./shaders/pass1-lowpass-in";
import { PASS2_FRAGMENT } from "./shaders/pass2-encode";
import { PASS3_FRAGMENT } from "./shaders/pass3-decode";
import { PASS4_FRAGMENT } from "./shaders/pass4-chroma-fx";
import { PASS5_FRAGMENT } from "./shaders/pass5-vhs";
import { PASS6_FRAGMENT } from "./shaders/pass6-rgb";
import {
  MAX_KERNEL_RADIUS,
  getInputLowpassKernels,
  getOutputChromaKernel,
  getVhsLumaKernel,
  getVhsChromaKernel,
} from "./kernel";

/** All tunable parameter names. */
export type NtscParam =
  | "video_noise"
  | "video_chroma_noise"
  | "video_chroma_phase_noise"
  | "composite_preemphasis"
  | "subcarrier_amplitude"
  | "video_scanline_phase_shift"
  | "emulating_vhs"
  | "vhs_speed"
  | "vhs_head_switching"
  | "color_bleed_horiz"
  | "color_bleed_vert"
  | "composite_in_chroma_lowpass"
  | "composite_out_chroma_lowpass"
  | "vhs_out_sharpen"
  | "vhs_edge_wave"
  | "video_chroma_loss";

type TexImageSource =
  | HTMLVideoElement
  | HTMLImageElement
  | HTMLCanvasElement
  | ImageBitmap;

interface PassProgram {
  program: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation>;
}

interface FBO {
  framebuffer: WebGLFramebuffer;
  texture: WebGLTexture;
}

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

// Default parameter values
const DEFAULT_PARAMS: Record<string, number> = {
  video_noise: 2,
  video_chroma_noise: 0,
  video_chroma_phase_noise: 0,
  composite_preemphasis: 0,
  subcarrier_amplitude: 50,
  video_scanline_phase_shift: 2,
  emulating_vhs: 0,
  vhs_speed: 0,
  vhs_head_switching: 0,
  color_bleed_horiz: 0,
  color_bleed_vert: 0,
  composite_in_chroma_lowpass: 1,
  composite_out_chroma_lowpass: 1,
  vhs_out_sharpen: 1.5,
  vhs_edge_wave: 0,
  video_chroma_loss: 0,
};

const FRAGMENT_SHADERS = [
  PASS0_FRAGMENT,
  PASS1_FRAGMENT,
  PASS2_FRAGMENT,
  PASS3_FRAGMENT,
  PASS4_FRAGMENT,
  PASS5_FRAGMENT,
  PASS6_FRAGMENT,
];

export class NtscGL {
  private readonly gl: WebGL2RenderingContext;
  private readonly passes: PassProgram[];
  private readonly vao: WebGLVertexArrayObject;
  private readonly sourceTex: WebGLTexture;
  private readonly edgeWaveTex: WebGLTexture;
  private fboA: FBO;
  private fboB: FBO;
  private width = 0;
  private height = 0;
  private frameCounter = 0;
  private params: Record<string, number>;
  private vpCache: ViewportCache | null = null;
  private edgeWaveData: Float32Array | null = null;
  private edgeWaveRng = 0x12345678;

  // Cached kernels (recomputed on resize or param change)
  private kernelsDirty = true;
  private inputKernelI = new Float32Array(MAX_KERNEL_RADIUS + 1);
  private inputKernelQ = new Float32Array(MAX_KERNEL_RADIUS + 1);
  private inputRadiusI = 0;
  private inputRadiusQ = 0;
  private outChromaKernel = new Float32Array(MAX_KERNEL_RADIUS + 1);
  private outChromaRadius = 0;
  private vhsLumaKernel = new Float32Array(MAX_KERNEL_RADIUS + 1);
  private vhsLumaRadius = 0;
  private vhsChromaKernel = new Float32Array(MAX_KERNEL_RADIUS + 1);
  private vhsChromaRadius = 0;

  private constructor(gl: WebGL2RenderingContext) {
    this.gl = gl;
    this.params = { ...DEFAULT_PARAMS };

    // Compile all 7 pass programs
    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER);
    this.passes = FRAGMENT_SHADERS.map((fsSrc) => {
      const fs = this.compileShader(gl.FRAGMENT_SHADER, fsSrc);
      const program = gl.createProgram()!;
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(
          `Shader link error: ${gl.getProgramInfoLog(program)}`,
        );
      }
      gl.deleteShader(fs);

      // Collect all active uniforms
      const uniforms = new Map<string, WebGLUniformLocation>();
      const count = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < count; i++) {
        const info = gl.getActiveUniform(program, i)!;
        // For arrays like u_kernelI[0], strip the [0] suffix to get the base name
        const baseName = info.name.replace(/\[0\]$/, "");
        const loc = gl.getUniformLocation(program, baseName);
        if (loc) uniforms.set(baseName, loc);
        // Also store the original name for array element access
        if (info.name !== baseName) {
          const locOrig = gl.getUniformLocation(program, info.name);
          if (locOrig) uniforms.set(info.name, locOrig);
        }
      }

      return { program, uniforms };
    });
    gl.deleteShader(vs);

    // Empty VAO for fullscreen triangle (uses gl_VertexID)
    this.vao = gl.createVertexArray()!;

    // Source texture (RGBA8, receives video/image frames)
    this.sourceTex = this.createTexture(gl.LINEAR);

    // Edge wave 1D texture (R16F)
    this.edgeWaveTex = this.createTexture(gl.NEAREST);

    // Ping-pong FBOs (created with dummy 1x1 size, resized on first use)
    this.fboA = this.createFBO(1, 1);
    this.fboB = this.createFBO(1, 1);
  }

  static create(canvas: HTMLCanvasElement): NtscGL {
    const gl = canvas.getContext("webgl2", {
      antialias: false,
      alpha: false,
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error("WebGL 2 not supported");

    // Required for rendering to RGBA16F
    const ext = gl.getExtension("EXT_color_buffer_float");
    if (!ext) throw new Error("EXT_color_buffer_float not supported");

    return new NtscGL(gl);
  }

  resize(width: number, height: number): void {
    if (this.width === width && this.height === height) return;
    this.width = width;
    this.height = height;
    this.kernelsDirty = true;

    // Recreate FBOs at new size
    this.deleteFBO(this.fboA);
    this.deleteFBO(this.fboB);
    this.fboA = this.createFBO(width, height);
    this.fboB = this.createFBO(width, height);

    // Recreate edge wave data
    this.edgeWaveData = new Float32Array(Math.ceil(height / 2));
  }

  setParam(name: string, value: number): void {
    this.params[name] = value;
    // Filter-related params require kernel recomputation
    if (
      name === "composite_in_chroma_lowpass" ||
      name === "composite_out_chroma_lowpass" ||
      name === "emulating_vhs"
    ) {
      this.kernelsDirty = true;
    }
  }

  processFrame(source: TexImageSource): void {
    const gl = this.gl;
    const w = this.width;
    const h = this.height;

    if (w === 0 || h === 0) return;

    // Recompute kernels if needed
    if (this.kernelsDirty) {
      this.recomputeKernels();
      this.kernelsDirty = false;
    }

    // Upload source to GPU (Y-flip handled in pass 0 shader)
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sourceTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      source,
    );

    // Update edge wave data for VHS
    if (this.params.emulating_vhs && this.params.vhs_edge_wave > 0) {
      this.updateEdgeWave();
    }

    // Increment frame counter
    this.frameCounter++;

    // Head switching shift (random per frame)
    const headSwitchShift = this.params.vhs_head_switching
      ? (this.simpleRandom() - 0.5) * 8
      : 0;

    gl.bindVertexArray(this.vao);

    // Run 7 passes
    // Pass 0: Source → FBO-A (RGB→YIQ + color bleed before)
    this.beginPass(0, this.fboA, w, h);
    this.bindInputTexture(0, this.sourceTex, 0);
    this.setPassUniforms(0, {
      u_resolution: [w, h],
      u_colorBleedH: this.params.color_bleed_horiz * 0.5,
      u_colorBleedV: this.params.color_bleed_vert * 0.5,
    });
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 1: FBO-A → FBO-B (input chroma lowpass)
    this.beginPass(1, this.fboB, w, h);
    this.bindInputTexture(1, this.fboA.texture, 0);
    this.setPassUniforms(1, {
      u_resolution: [w, h],
    }, {
      u_enabled: this.params.composite_in_chroma_lowpass ? 1 : 0,
      u_radiusI: this.inputRadiusI,
      u_radiusQ: this.inputRadiusQ,
    });
    this.setKernelUniform(1, "u_kernelI", this.inputKernelI);
    this.setKernelUniform(1, "u_kernelQ", this.inputKernelQ);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 2: FBO-B → FBO-A (composite encode + preemphasis + luma noise)
    this.beginPass(2, this.fboA, w, h);
    this.bindInputTexture(2, this.fboB.texture, 0);
    this.setPassUniforms(2, {
      u_resolution: [w, h],
      u_subcarrierAmplitude: this.params.subcarrier_amplitude,
      u_preemphasis: this.params.composite_preemphasis,
      u_lumaNoiseAmount: this.params.video_noise,
    }, {
      u_scanlinePhaseShift: this.params.video_scanline_phase_shift,
    });
    this.setUintUniform(2, "u_frame", this.frameCounter);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 3: FBO-A → FBO-B (head switching + composite decode)
    this.beginPass(3, this.fboB, w, h);
    this.bindInputTexture(3, this.fboA.texture, 0);
    this.setPassUniforms(3, {
      u_resolution: [w, h],
      u_headSwitchShift: headSwitchShift,
    }, {
      u_scanlinePhaseShift: this.params.video_scanline_phase_shift,
      u_headSwitchingEnabled: this.params.vhs_head_switching ? 1 : 0,
      u_emulatingVhs: this.params.emulating_vhs ? 1 : 0,
    });
    this.setUintUniform(3, "u_frame", this.frameCounter);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 4: FBO-B → FBO-A (chroma noise + phase noise + edge wave + chroma loss)
    this.beginPass(4, this.fboA, w, h);
    this.bindInputTexture(4, this.fboB.texture, 0);
    // Bind edge wave texture to unit 1
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this.edgeWaveTex);
    const edgeLoc = this.passes[4].uniforms.get("u_edgeWaveTex");
    if (edgeLoc) gl.uniform1i(edgeLoc, 1);
    this.setPassUniforms(4, {
      u_resolution: [w, h],
      u_chromaNoiseAmount: this.params.video_chroma_noise,
      u_chromaPhaseNoise: this.params.video_chroma_phase_noise,
      u_chromaLoss: this.params.video_chroma_loss,
    }, {
      u_edgeWaveEnabled: this.params.vhs_edge_wave > 0 ? 1 : 0,
      u_emulatingVhs: this.params.emulating_vhs ? 1 : 0,
    });
    this.setUintUniform(4, "u_frame", this.frameCounter);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 5: FBO-A → FBO-B (VHS lowpass/sharpen + output lowpass + color bleed after)
    this.beginPass(5, this.fboB, w, h);
    this.bindInputTexture(5, this.fboA.texture, 0);
    this.setPassUniforms(5, {
      u_resolution: [w, h],
      u_sharpenAmount: this.params.vhs_out_sharpen,
      u_colorBleedH: this.params.color_bleed_horiz * 0.5,
      u_colorBleedV: this.params.color_bleed_vert * 0.5,
    }, {
      u_emulatingVhs: this.params.emulating_vhs ? 1 : 0,
      u_outputLowpassEnabled: this.params.composite_out_chroma_lowpass ? 1 : 0,
      u_vhsLumaRadius: this.vhsLumaRadius,
      u_vhsChromaRadius: this.vhsChromaRadius,
      u_outChromaRadius: this.outChromaRadius,
    });
    this.setKernelUniform(5, "u_vhsLumaKernel", this.vhsLumaKernel);
    this.setKernelUniform(5, "u_vhsChromaKernel", this.vhsChromaKernel);
    this.setKernelUniform(5, "u_outChromaKernel", this.outChromaKernel);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    // Pass 6: FBO-B → Screen (YIQ→RGB)
    this.syncCanvasSize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.setupViewport(w, h);
    gl.useProgram(this.passes[6].program);
    this.bindInputTexture(6, this.fboB.texture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.bindVertexArray(null);
  }

  /** Read back the rendered frame as RGBA pixels (for lastFrame caching). */
  getPixels(): Uint8Array {
    const gl = this.gl;
    const w = this.width;
    const h = this.height;

    // Render pass 6 (YIQ→RGB) to a temporary RGBA8 FBO for readback
    const readTex = this.createTexture(gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, readTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const readFbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, readFbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, readTex, 0);

    gl.viewport(0, 0, w, h);
    gl.bindVertexArray(this.vao);
    gl.useProgram(this.passes[6].program);
    this.bindInputTexture(6, this.fboB.texture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);

    const pixels = new Uint8Array(w * h * 4);
    gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(readFbo);
    gl.deleteTexture(readTex);

    return pixels;
  }

  /** Re-render last processed frame to screen (e.g. after canvas resize). */
  redraw(): void {
    if (this.width === 0 || this.height === 0) return;
    const gl = this.gl;
    this.syncCanvasSize();
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.setupViewport(this.width, this.height);
    gl.bindVertexArray(this.vao);
    gl.useProgram(this.passes[6].program);
    this.bindInputTexture(6, this.fboB.texture, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.bindVertexArray(null);
  }

  dispose(): void {
    const gl = this.gl;
    for (const pass of this.passes) {
      gl.deleteProgram(pass.program);
    }
    gl.deleteVertexArray(this.vao);
    gl.deleteTexture(this.sourceTex);
    gl.deleteTexture(this.edgeWaveTex);
    this.deleteFBO(this.fboA);
    this.deleteFBO(this.fboB);
  }

  // ---- Internal helpers ----

  private compileShader(type: number, source: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(`Shader compile error: ${info}`);
    }
    return shader;
  }

  private createTexture(filter: number): WebGLTexture {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
    return tex;
  }

  private createFBO(width: number, height: number): FBO {
    const gl = this.gl;
    const texture = this.createTexture(gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA16F,
      width,
      height,
      0,
      gl.RGBA,
      gl.HALF_FLOAT,
      null,
    );

    const framebuffer = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,
      gl.COLOR_ATTACHMENT0,
      gl.TEXTURE_2D,
      texture,
      0,
    );

    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
      throw new Error(`Framebuffer not complete: ${status}`);
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer, texture };
  }

  private deleteFBO(fbo: FBO): void {
    const gl = this.gl;
    gl.deleteFramebuffer(fbo.framebuffer);
    gl.deleteTexture(fbo.texture);
  }

  private beginPass(
    passIndex: number,
    targetFBO: FBO,
    width: number,
    height: number,
  ): void {
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, targetFBO.framebuffer);
    gl.viewport(0, 0, width, height);
    gl.useProgram(this.passes[passIndex].program);
  }

  private bindInputTexture(
    passIndex: number,
    texture: WebGLTexture,
    unit: number,
  ): void {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Set the sampler uniform (u_source for pass 0, u_input for others)
    const name = passIndex === 0 ? "u_source" : "u_input";
    const loc = this.passes[passIndex].uniforms.get(name);
    if (loc) gl.uniform1i(loc, unit);
  }

  /** Set uniforms. Arrays become vec2/vec3 (float). Scalars: use 'i:' prefix for int. */
  private setPassUniforms(
    passIndex: number,
    floats: Record<string, number | number[]>,
    ints?: Record<string, number>,
  ): void {
    const gl = this.gl;
    const pass = this.passes[passIndex];

    for (const [name, value] of Object.entries(floats)) {
      const loc = pass.uniforms.get(name);
      if (!loc) continue;
      if (Array.isArray(value)) {
        if (value.length === 2) gl.uniform2f(loc, value[0], value[1]);
        else if (value.length === 3) gl.uniform3f(loc, value[0], value[1], value[2]);
      } else {
        gl.uniform1f(loc, value);
      }
    }

    if (ints) {
      for (const [name, value] of Object.entries(ints)) {
        const loc = pass.uniforms.get(name);
        if (loc) gl.uniform1i(loc, value);
      }
    }
  }

  private setUintUniform(passIndex: number, name: string, value: number): void {
    const gl = this.gl;
    const loc = this.passes[passIndex].uniforms.get(name);
    if (loc) gl.uniform1ui(loc, value >>> 0);
  }

  private setKernelUniform(
    passIndex: number,
    name: string,
    weights: Float32Array,
  ): void {
    const gl = this.gl;
    const loc = this.passes[passIndex].uniforms.get(name);
    if (loc) gl.uniform1fv(loc, weights);
  }

  private recomputeKernels(): void {
    const w = this.width;
    if (w === 0) return;

    // Input chroma lowpass
    const { kernelI, kernelQ } = getInputLowpassKernels(w);
    this.inputKernelI.set(kernelI.weights);
    this.inputRadiusI = kernelI.radius;
    this.inputKernelQ.set(kernelQ.weights);
    this.inputRadiusQ = kernelQ.radius;

    // Output chroma lowpass
    const outK = getOutputChromaKernel(w);
    this.outChromaKernel.set(outK.weights);
    this.outChromaRadius = outK.radius;

    // VHS lowpass
    const vhsL = getVhsLumaKernel(w);
    this.vhsLumaKernel.set(vhsL.weights);
    this.vhsLumaRadius = vhsL.radius;

    const vhsC = getVhsChromaKernel(w);
    this.vhsChromaKernel.set(vhsC.weights);
    this.vhsChromaRadius = vhsC.radius;
  }

  private syncCanvasSize(): void {
    const canvas = this.gl.canvas as HTMLCanvasElement;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round((canvas.clientWidth || window.innerWidth) * dpr);
    const h = Math.round((canvas.clientHeight || window.innerHeight) * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      this.vpCache = null;
    }
  }

  private setupViewport(frameW: number, frameH: number): void {
    const gl = this.gl;
    const cw = gl.canvas.width;
    const ch = gl.canvas.height;

    let vp = this.vpCache;
    if (
      !vp ||
      vp.canvasW !== cw ||
      vp.canvasH !== ch ||
      vp.frameW !== frameW ||
      vp.frameH !== frameH
    ) {
      const scale = Math.min(cw / frameW, ch / frameH);
      const vw = Math.round(frameW * scale);
      const vh = Math.round(frameH * scale);
      vp = {
        canvasW: cw,
        canvasH: ch,
        frameW,
        frameH,
        vx: Math.round((cw - vw) / 2),
        vy: Math.round((ch - vh) / 2),
        vw,
        vh,
      };
      this.vpCache = vp;
    }

    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(vp.vx, vp.vy, vp.vw, vp.vh);
  }

  private updateEdgeWave(): void {
    const gl = this.gl;
    const data = this.edgeWaveData!;
    const len = data.length;
    const amplitude = this.params.vhs_edge_wave;

    // Generate per-scanline displacement with IIR smoothing
    let prev = 0;
    const alpha = 0.1; // smoothing factor
    for (let i = 0; i < len; i++) {
      const raw = (this.simpleRandom() - 0.5) * amplitude * 2;
      prev = prev * (1 - alpha) + raw * alpha;
      data[i] = prev;
    }

    // Upload as 1D R32F texture (Float32Array → FLOAT)
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this.edgeWaveTex);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.R32F,
      len,
      1,
      0,
      gl.RED,
      gl.FLOAT,
      data,
    );
  }

  private simpleRandom(): number {
    // Simple xorshift-based PRNG for deterministic per-frame values
    this.edgeWaveRng ^= this.edgeWaveRng << 13;
    this.edgeWaveRng ^= this.edgeWaveRng >> 17;
    this.edgeWaveRng ^= this.edgeWaveRng << 5;
    return (this.edgeWaveRng >>> 0) / 4294967296;
  }
}
