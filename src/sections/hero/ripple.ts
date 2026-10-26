/**
 * Real water under the cursor: a small height-field wave simulation (WebGL2,
 * half-float ping-pong) that refracts the live Blender loop and catches the sun
 * on the ripple crests. Desktop pointer only; the caller pauses it off-screen.
 * Returns null when the GPU path is unavailable, and the plain video stays.
 */

const VERT = `#version 300 es
in vec2 p; out vec2 uv;
void main() { uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

const UPDATE = `#version 300 es
precision highp float;
uniform sampler2D s; uniform vec2 px; in vec2 uv; out vec4 o;
void main() {
  vec4 c = texture(s, uv);
  float avg = (texture(s, uv - vec2(px.x, 0.0)).r + texture(s, uv + vec2(px.x, 0.0)).r
    + texture(s, uv - vec2(0.0, px.y)).r + texture(s, uv + vec2(0.0, px.y)).r) * 0.25;
  c.g += (avg - c.r) * 2.0;
  c.g *= 0.986;
  c.r += c.g;
  c.r *= 0.996;
  o = c;
}`;

const DROP = `#version 300 es
precision highp float;
uniform sampler2D s; uniform vec2 center; uniform float radius; uniform float strength;
uniform float aspect; in vec2 uv; out vec4 o;
void main() {
  vec4 c = texture(s, uv);
  vec2 d = uv - center; d.x *= aspect;
  float k = max(0.0, 1.0 - length(d) / radius);
  c.r += (0.5 - cos(k * 3.14159265) * 0.5) * strength;
  o = c;
}`;

const RENDER = `#version 300 es
precision highp float;
uniform sampler2D s; uniform sampler2D v; uniform vec2 px; uniform vec2 cover;
in vec2 uv; out vec4 o;
void main() {
  float hL = texture(s, uv - vec2(px.x, 0.0)).r;
  float hR = texture(s, uv + vec2(px.x, 0.0)).r;
  float hD = texture(s, uv - vec2(0.0, px.y)).r;
  float hU = texture(s, uv + vec2(0.0, px.y)).r;
  vec2 g = vec2(hR - hL, hU - hD);
  vec2 vuv = (uv - 0.5) * cover + 0.5;
  vuv += g * 0.55 * cover;
  vuv.y = 1.0 - vuv.y;
  vec3 col = texture(v, clamp(vuv, 0.001, 0.999)).rgb;
  vec3 n = normalize(vec3(-g * 9.0, 1.0));
  vec3 l = normalize(vec3(-0.45, 0.55, 1.0));
  float spec = pow(max(dot(reflect(-l, n), vec3(0.0, 0.0, 1.0)), 0.0), 90.0);
  col += spec * vec3(1.0, 0.96, 0.88) * 0.55;
  col *= 1.0 + dot(g, vec2(-0.9, 0.9)) * 1.6;
  o = vec4(col, 1.0);
}`;

export type Ripple = {
  drop: (x: number, y: number, strength: number) => void;
  resize: () => void;
  start: () => void;
  stop: () => void;
  dispose: () => void;
};

function compile(gl: WebGL2RenderingContext, frag: string) {
  const program = gl.createProgram();
  for (const [type, src] of [
    [gl.VERTEX_SHADER, VERT],
    [gl.FRAGMENT_SHADER, frag],
  ] as const) {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return null;
    gl.attachShader(program, shader);
  }
  gl.bindAttribLocation(program, 0, "p");
  gl.linkProgram(program);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}

export function createRipple(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  onFirstFrame: () => void,
): Ripple | null {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    powerPreference: "high-performance",
  });
  if (!gl || !gl.getExtension("EXT_color_buffer_float")) return null;
  const update = compile(gl, UPDATE);
  const dropProgram = compile(gl, DROP);
  const render = compile(gl, RENDER);
  if (!update || !dropProgram || !render) return null;

  // Not a React hook: WebGL's program switch, renamed so linters do not think so.
  const activate = (program: WebGLProgram) =>
    WebGL2RenderingContext.prototype.useProgram.call(gl, program);

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const simW = 256;
  let simH = 144;
  let aspect = 16 / 9;
  const state: { tex: WebGLTexture; fbo: WebGLFramebuffer }[] = [];
  const makeState = () => {
    for (const s of state.splice(0)) {
      gl.deleteTexture(s.tex);
      gl.deleteFramebuffer(s.fbo);
    }
    for (let i = 0; i < 2; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA16F,
        simW,
        simH,
        0,
        gl.RGBA,
        gl.HALF_FLOAT,
        null,
      );
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      const fbo = gl.createFramebuffer();
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        tex,
        0,
      );
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      state.push({ tex, fbo });
    }
  };

  const videoTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, videoTex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  let read = 0;
  const pending: { x: number; y: number; s: number }[] = [];
  let raf = 0;
  let running = false;
  let hasFrame = false;

  const pass = (program: WebGLProgram, setup: () => void) => {
    const target = state[1 - read];
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    gl.viewport(0, 0, simW, simH);
    activate(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state[read].tex);
    gl.uniform1i(gl.getUniformLocation(program, "s"), 0);
    setup();
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    read = 1 - read;
  };

  const frame = () => {
    raf = 0;
    if (!running) return;
    if (video.readyState >= 2) {
      gl.bindTexture(gl.TEXTURE_2D, videoTex);
      gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        video,
      );
      if (!hasFrame) {
        hasFrame = true;
        onFirstFrame();
      }
    }
    for (const d of pending.splice(0, 6)) {
      pass(dropProgram, () => {
        gl.uniform2f(gl.getUniformLocation(dropProgram, "center"), d.x, d.y);
        gl.uniform1f(gl.getUniformLocation(dropProgram, "radius"), 0.028);
        gl.uniform1f(gl.getUniformLocation(dropProgram, "strength"), d.s);
        gl.uniform1f(gl.getUniformLocation(dropProgram, "aspect"), aspect);
      });
    }
    for (let i = 0; i < 2; i++) {
      pass(update, () => {
        gl.uniform2f(gl.getUniformLocation(update, "px"), 1 / simW, 1 / simH);
      });
    }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    activate(render);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, state[read].tex);
    gl.uniform1i(gl.getUniformLocation(render, "s"), 0);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, videoTex);
    gl.uniform1i(gl.getUniformLocation(render, "v"), 1);
    gl.uniform2f(gl.getUniformLocation(render, "px"), 1 / simW, 1 / simH);
    const va = video.videoWidth / Math.max(1, video.videoHeight) || 16 / 9;
    gl.uniform2f(
      gl.getUniformLocation(render, "cover"),
      Math.min(1, aspect / va),
      Math.min(1, va / aspect),
    );
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    raf = requestAnimationFrame(frame);
  };

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    canvas.width = Math.max(2, Math.round(rect.width * dpr));
    canvas.height = Math.max(2, Math.round(rect.height * dpr));
    aspect = rect.width / Math.max(1, rect.height);
    const nextH = Math.max(64, Math.round(simW / aspect));
    if (nextH !== simH || state.length === 0) {
      simH = nextH;
      makeState();
    }
  };
  resize();

  return {
    drop(x, y, strength) {
      const rect = canvas.getBoundingClientRect();
      pending.push({
        x: (x - rect.left) / rect.width,
        y: 1 - (y - rect.top) / rect.height,
        s: strength,
      });
    },
    resize,
    start() {
      if (running) return;
      running = true;
      raf = requestAnimationFrame(frame);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
    },
    dispose() {
      running = false;
      cancelAnimationFrame(raf);
      for (const s of state) {
        gl.deleteTexture(s.tex);
        gl.deleteFramebuffer(s.fbo);
      }
      gl.deleteTexture(videoTex);
      gl.deleteBuffer(quad);
      for (const p of [update, dropProgram, render]) gl.deleteProgram(p);
      // The context itself stays: a remount (React dev double-mount, or coming
      // back to the page) reuses this canvas, and a lost context cannot be.
    },
  };
}
