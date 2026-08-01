// WebGL2 renderer: one chunk mesh per VAO, a solid pass and a translucent
// pass for the window glass, plus the wireframe box around the targeted block.
import { buildChunkMesh } from './mesher.js';
import { buildAtlas } from './textures.js';
import { CHUNK } from './world.js';
import { perspective, lookAt, multiply, forwardVector } from './mat4.js';

const VERT = `#version 300 es
in vec3 aPos;
in vec2 aUV;
in float aLight;
uniform mat4 uMVP;
uniform vec3 uCam;
out vec2 vUV;
out float vLight;
out float vDist;
void main() {
  vUV = aUV;
  vLight = aLight;
  vDist = distance(aPos, uCam);
  gl_Position = uMVP * vec4(aPos, 1.0);
}`;

const FRAG = `#version 300 es
precision mediump float;
in vec2 vUV;
in float vLight;
in float vDist;
uniform sampler2D uTex;
uniform float uAlphaCut;
uniform vec3 uFog;
uniform float uFogNear;
uniform float uFogFar;
out vec4 outColor;
void main() {
  vec4 c = texture(uTex, vUV);
  if (c.a < uAlphaCut) discard;
  vec3 rgb = c.rgb * vLight;
  float f = clamp((vDist - uFogNear) / (uFogFar - uFogNear), 0.0, 1.0);
  rgb = mix(rgb, uFog, f * 0.9);
  outColor = vec4(rgb, c.a);
}`;

const LINE_VERT = `#version 300 es
in vec3 aPos;
uniform mat4 uMVP;
uniform vec3 uOffset;
void main() { gl_Position = uMVP * vec4(aPos + uOffset, 1.0); }`;

const LINE_FRAG = `#version 300 es
precision mediump float;
out vec4 outColor;
void main() { outColor = vec4(0.05, 0.04, 0.03, 0.75); }`;

const SKY = [0.62, 0.74, 0.86];

function compile(gl, type, source) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, source);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    throw new Error('Shader error: ' + gl.getShaderInfoLog(sh));
  }
  return sh;
}

function link(gl, vs, fs) {
  const p = gl.createProgram();
  gl.attachShader(p, compile(gl, gl.VERTEX_SHADER, vs));
  gl.attachShader(p, compile(gl, gl.FRAGMENT_SHADER, fs));
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
    throw new Error('Program link error: ' + gl.getProgramInfoLog(p));
  }
  return p;
}

export class Renderer {
  constructor(canvas, world) {
    const gl = canvas.getContext('webgl2', {
      antialias: false,
      alpha: false,
      // keeps the frame readable for screenshots and the visual tests
      preserveDrawingBuffer: true,
    });
    if (!gl) throw new Error('WebGL2 is not available in this browser.');
    this.gl = gl;
    this.canvas = canvas;
    this.world = world;
    this.chunks = new Map();
    this.reach = 10; // voxels — about 4 m of arm's reach

    this.program = link(gl, VERT, FRAG);
    this.loc = {
      mvp: gl.getUniformLocation(this.program, 'uMVP'),
      cam: gl.getUniformLocation(this.program, 'uCam'),
      tex: gl.getUniformLocation(this.program, 'uTex'),
      alphaCut: gl.getUniformLocation(this.program, 'uAlphaCut'),
      fog: gl.getUniformLocation(this.program, 'uFog'),
      fogNear: gl.getUniformLocation(this.program, 'uFogNear'),
      fogFar: gl.getUniformLocation(this.program, 'uFogFar'),
      pos: gl.getAttribLocation(this.program, 'aPos'),
      uv: gl.getAttribLocation(this.program, 'aUV'),
      light: gl.getAttribLocation(this.program, 'aLight'),
    };

    this.lineProgram = link(gl, LINE_VERT, LINE_FRAG);
    this.lineLoc = {
      mvp: gl.getUniformLocation(this.lineProgram, 'uMVP'),
      offset: gl.getUniformLocation(this.lineProgram, 'uOffset'),
      pos: gl.getAttribLocation(this.lineProgram, 'aPos'),
    };
    this.#initHighlight();

    this.atlasCanvas = buildAtlas((w, h) => {
      const c = document.createElement('canvas');
      c.width = w;
      c.height = h;
      return c;
    });
    this.texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.atlasCanvas);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.enable(gl.DEPTH_TEST);
    gl.clearColor(SKY[0], SKY[1], SKY[2], 1);
  }

  #initHighlight() {
    const gl = this.gl;
    const e = 0.002; // nudge outwards so the outline is not z-fought
    const a = -e;
    const b = 1 + e;
    const c = [
      [a, a, a], [b, a, a], [b, a, b], [a, a, b],
      [a, b, a], [b, b, a], [b, b, b], [a, b, b],
    ];
    const edges = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const data = [];
    for (const [i, j] of edges) data.push(...c[i], ...c[j]);
    this.highlightVao = gl.createVertexArray();
    gl.bindVertexArray(this.highlightVao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(this.lineLoc.pos);
    gl.vertexAttribPointer(this.lineLoc.pos, 3, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }

  buildAll() {
    const { cx, cy, cz } = this.world;
    let vertices = 0;
    for (let x = 0; x < cx; x++) {
      for (let y = 0; y < cy; y++) {
        for (let z = 0; z < cz; z++) {
          vertices += this.rebuildChunk(this.world.chunkKey(x, y, z), x, y, z);
        }
      }
    }
    this.vertexCount = vertices;
    return vertices;
  }

  rebuildChunk(key, cx, cy, cz) {
    const gl = this.gl;
    const mesh = buildChunkMesh(this.world, cx, cy, cz);
    let entry = this.chunks.get(key);
    if (!entry) {
      entry = { passes: {} };
      this.chunks.set(key, entry);
    }
    let count = 0;
    for (const pass of ['solid', 'blend']) {
      const data = mesh[pass];
      let p = entry.passes[pass];
      if (!p) {
        p = { vao: gl.createVertexArray(), vbo: gl.createBuffer(), ebo: gl.createBuffer(), count: 0 };
        gl.bindVertexArray(p.vao);
        gl.bindBuffer(gl.ARRAY_BUFFER, p.vbo);
        const stride = 6 * 4;
        gl.enableVertexAttribArray(this.loc.pos);
        gl.vertexAttribPointer(this.loc.pos, 3, gl.FLOAT, false, stride, 0);
        gl.enableVertexAttribArray(this.loc.uv);
        gl.vertexAttribPointer(this.loc.uv, 2, gl.FLOAT, false, stride, 12);
        gl.enableVertexAttribArray(this.loc.light);
        gl.vertexAttribPointer(this.loc.light, 1, gl.FLOAT, false, stride, 20);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ebo);
        gl.bindVertexArray(null);
        entry.passes[pass] = p;
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, p.vbo);
      gl.bufferData(gl.ARRAY_BUFFER, data.verts, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(p.vao);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, p.ebo);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, data.idx, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(null);
      p.count = data.idx.length;
      count += data.verts.length / 6;
    }
    entry.center = [cx * CHUNK + CHUNK / 2, cy * CHUNK + CHUNK / 2, cz * CHUNK + CHUNK / 2];
    return count;
  }

  rebuildKeys(keys) {
    const { cx, cz } = this.world;
    for (const key of keys) {
      const x = key % cx;
      const z = Math.floor(key / cx) % cz;
      const y = Math.floor(key / (cx * cz));
      this.rebuildChunk(key, x, y, z);
    }
  }

  resize() {
    // Phones have very dense screens; rendering every physical pixel costs
    // more than it shows, so they get a lower ceiling than desktops.
    const cap = matchMedia('(any-pointer: coarse)').matches ? 1.5 : 2;
    const dpr = Math.min(window.devicePixelRatio || 1, cap);
    const w = Math.floor(this.canvas.clientWidth * dpr);
    const h = Math.floor(this.canvas.clientHeight * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  render(camera, highlight) {
    const gl = this.gl;
    this.resize();
    const aspect = this.canvas.width / Math.max(1, this.canvas.height);
    const proj = perspective((camera.fov ?? 72) * Math.PI / 180, aspect, 0.05, 220);
    const fwd = forwardVector(camera.yaw, camera.pitch);
    const eye = camera.eye;
    const view = lookAt(eye, [eye[0] + fwd[0], eye[1] + fwd[1], eye[2] + fwd[2]]);
    const mvp = multiply(proj, view);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(this.program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture);
    gl.uniform1i(this.loc.tex, 0);
    gl.uniformMatrix4fv(this.loc.mvp, false, mvp);
    gl.uniform3fv(this.loc.cam, eye);
    gl.uniform3fv(this.loc.fog, SKY);
    gl.uniform1f(this.loc.fogNear, 55);
    gl.uniform1f(this.loc.fogFar, 130);

    // solid pass
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    gl.uniform1f(this.loc.alphaCut, 0.35);
    let draws = 0;
    for (const entry of this.chunks.values()) {
      const p = entry.passes.solid;
      if (!p || !p.count) continue;
      gl.bindVertexArray(p.vao);
      gl.drawElements(gl.TRIANGLES, p.count, gl.UNSIGNED_INT, 0);
      draws++;
    }

    // translucent pass (window glass), back to front
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.depthMask(false);
    gl.uniform1f(this.loc.alphaCut, 0.02);
    const blended = [...this.chunks.values()].filter((e) => e.passes.blend?.count);
    blended.sort((a, b) => dist2(b.center, eye) - dist2(a.center, eye));
    for (const entry of blended) {
      const p = entry.passes.blend;
      gl.bindVertexArray(p.vao);
      gl.drawElements(gl.TRIANGLES, p.count, gl.UNSIGNED_INT, 0);
      draws++;
    }
    gl.depthMask(true);
    gl.disable(gl.BLEND);

    if (highlight) {
      gl.useProgram(this.lineProgram);
      gl.uniformMatrix4fv(this.lineLoc.mvp, false, mvp);
      gl.uniform3f(this.lineLoc.offset, highlight.x, highlight.y, highlight.z);
      gl.bindVertexArray(this.highlightVao);
      gl.drawArrays(gl.LINES, 0, 24);
    }
    gl.bindVertexArray(null);
    this.drawCalls = draws;
  }
}

function dist2(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}
