'use client';

// One fixed WebGL scene behind the whole home page: a night "circuit city" of PCB traces with light pulses,
// chips and tower blocks. Scrolling flies the camera over it; a tap or click sends a ring of light across the board.
import { useEffect, useRef } from 'react';
import * as THREE from 'three';

type Props = { onReady?: () => void };

const BOARD_W = 90; // half width of the board
const BOARD_FROM = 30;
const BOARD_TO = -820;
const TRAVEL = 540; // how far the camera flies over the whole page

// ---------------------------------------------------------------- shaders
const shared = /* glsl */ `
  uniform float uTime, uDim, uRippleT;
  uniform vec2 uRippleAt;
  float fogAmt(float dist) { return smoothstep(40.0, 230.0, dist); }
  // expanding ring of light from the last tap/click on the board
  float ripple(vec2 xz) {
    float r = uRippleT * 38.0;
    float d = length(xz - uRippleAt);
    return exp(-pow((d - r) / 4.0, 2.0)) * max(0.0, 1.0 - uRippleT / 2.2);
  }
`;

const traceVert = /* glsl */ `
  attribute float aDist, aLen, aSeed;
  varying float vDist, vLen, vSeed, vFog;
  varying vec2 vXZ;
  ${shared}
  void main() {
    vDist = aDist; vLen = aLen; vSeed = aSeed; vXZ = position.xz;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vFog = fogAmt(-mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const traceFrag = /* glsl */ `
  varying float vDist, vLen, vSeed, vFog;
  varying vec2 vXZ;
  ${shared}
  void main() {
    // a pulse of light runs along every trace; each trace has its own speed and phase
    float speed = 6.0 + vSeed * 14.0;
    float head = mod(uTime * speed + vSeed * 300.0, vLen + 30.0) - 15.0;
    float pulse = exp(-pow((vDist - head) / 2.2, 2.0));
    vec3 base = vec3(0.07, 0.32, 0.45);
    vec3 hot = mix(vec3(0.35, 0.9, 1.0), vec3(1.0, 0.72, 0.3), step(0.82, vSeed));
    float rp = ripple(vXZ);
    vec3 c = base * 0.55 + hot * pulse * 1.6 + vec3(0.4, 0.9, 1.0) * rp * 3.5;
    gl_FragColor = vec4(c * uDim, (1.0 - vFog) * (0.55 + pulse + rp));
  }
`;

const boxVert = /* glsl */ `
  attribute float aLit;
  varying vec3 vLocal, vScale;
  varying float vFog, vLit;
  varying vec2 vXZ;
  ${shared}
  void main() {
    vScale = vec3(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz), length(instanceMatrix[2].xyz));
    vLocal = (position - vec3(0.0, 0.5, 0.0)) * vScale;
    vLit = aLit;
    vec4 world = instanceMatrix * vec4(position, 1.0);
    vXZ = world.xz;
    vec4 mv = modelViewMatrix * world;
    vFog = fogAmt(-mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const boxFrag = /* glsl */ `
  varying vec3 vLocal, vScale;
  varying float vFog, vLit;
  varying vec2 vXZ;
  ${shared}
  float h(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  void main() {
    vec3 d = vScale * 0.5 - abs(vLocal);
    float mn = min(d.x, min(d.y, d.z)), mx = max(d.x, max(d.y, d.z));
    float second = d.x + d.y + d.z - mn - mx;
    float edge = smoothstep(0.07, 0.0, second);
    vec3 c = vec3(0.025, 0.04, 0.06) + vec3(0.2, 0.75, 1.0) * edge * (0.75 + ripple(vXZ) * 3.0);
    // lit windows on the tall towers' sides, flickering slowly
    bool side = d.y > 0.05;
    float wy = vLocal.y + vScale.y * 0.5;
    vec2 cell = vec2(floor((vLocal.x + vLocal.z) * 1.6), floor(wy * 1.4));
    vec2 fr = vec2(fract((vLocal.x + vLocal.z) * 1.6), fract(wy * 1.4));
    float win = step(0.35, fr.x) * step(fr.x, 0.8) * step(0.3, fr.y) * step(fr.y, 0.75);
    float on = step(0.55, h(cell + vLit * 13.0 + floor(uTime * 0.15 + h(cell) * 7.0)));
    if (side && vLit > 0.5) c += mix(vec3(1.0, 0.7, 0.3), vec3(0.5, 0.85, 1.0), h(cell)) * win * on * 0.55;
    gl_FragColor = vec4(c * uDim, 1.0 - vFog);
  }
`;

const groundVert = /* glsl */ `
  varying vec2 vXZ;
  varying float vFog;
  ${shared}
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vXZ = world.xz;
    vec4 mv = viewMatrix * world;
    vFog = fogAmt(-mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;
const groundFrag = /* glsl */ `
  varying vec2 vXZ;
  varying float vFog;
  ${shared}
  void main() {
    vec2 g = abs(fract(vXZ / 4.0 - 0.5) - 0.5) / fwidth(vXZ / 4.0);
    float line = 1.0 - min(min(g.x, g.y), 1.0);
    float rp = ripple(vXZ);
    vec3 c = vec3(0.15, 0.55, 0.75) * line * (0.18 + rp * 2.5) + vec3(0.2, 0.7, 1.0) * rp * 0.45;
    gl_FragColor = vec4(c * uDim, (1.0 - vFog) * max(line, rp * 0.6));
  }
`;

// ---------------------------------------------------------------- city generation
function buildTraces(count: number) {
  const pts: number[] = [], dist: number[] = [], len: number[] = [], seed: number[] = [];
  const snap = (v: number) => Math.round(v / 1.5) * 1.5;
  for (let t = 0; t < count; t++) {
    let x = snap((Math.random() * 2 - 1) * BOARD_W);
    let z = BOARD_FROM - Math.random() * (BOARD_FROM - BOARD_TO);
    const path: [number, number][] = [[x, z]];
    const segs = 2 + ((Math.random() * 4) | 0);
    for (let s = 0; s < segs; s++) {
      const L = 4 + Math.random() * 22;
      if (s % 2 === 0) {
        z -= L; // run along the board
      } else {
        x += (Math.random() < 0.5 ? -1 : 1) * L * 0.5; // 45° jog sideways, like a PCB trace
        z -= L * 0.5;
      }
      path.push([x, z]);
    }
    let total = 0;
    const segLens = path.slice(1).map((p, k) => Math.hypot(p[0] - path[k][0], p[1] - path[k][1]));
    const traceLen = segLens.reduce((a, b) => a + b, 0);
    const sd = Math.random();
    for (let k = 0; k < segLens.length; k++) {
      const [ax, az] = path[k], [bx, bz] = path[k + 1];
      pts.push(ax, 0.03, az, bx, 0.03, bz);
      dist.push(total, total + segLens[k]);
      total += segLens[k];
      len.push(traceLen, traceLen);
      seed.push(sd, sd);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  geo.setAttribute('aDist', new THREE.Float32BufferAttribute(dist, 1));
  geo.setAttribute('aLen', new THREE.Float32BufferAttribute(len, 1));
  geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1));
  return geo;
}

function buildBlocks(count: number, mat: THREE.ShaderMaterial) {
  const geo = new THREE.BoxGeometry(1, 1, 1);
  geo.translate(0, 0.5, 0);
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const lit = new Float32Array(count);
  const m = new THREE.Matrix4();
  for (let i = 0; i < count; i++) {
    const tower = Math.random() < 0.28;
    let x = (Math.random() * 2 - 1) * BOARD_W;
    // keep a clear runway down the middle so the camera never flies through a building
    if (tower && Math.abs(x) < 16) x = Math.sign(x || 1) * (16 + Math.random() * 20);
    if (!tower && Math.abs(x) < 6) x = Math.sign(x || 1) * (6 + Math.random() * 10);
    const z = BOARD_FROM - Math.random() * (BOARD_FROM - BOARD_TO);
    const w = tower ? 2 + Math.random() * 4 : 2.5 + Math.random() * 8;
    const d = tower ? 2 + Math.random() * 4 : 2.5 + Math.random() * 8;
    const hgt = tower ? 4 + Math.random() * Math.random() * 30 : 0.3 + Math.random() * 1.2;
    m.makeScale(w, hgt, d).setPosition(x, 0, z);
    mesh.setMatrixAt(i, m);
    lit[i] = tower ? 1 : 0;
  }
  geo.setAttribute('aLit', new THREE.InstancedBufferAttribute(lit, 1));
  mesh.frustumCulled = false;
  return mesh;
}

// ---------------------------------------------------------------- component
export default function Scene({ onReady }: Props) {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch {
      onReady?.(); // no WebGL: the CSS backdrop still looks fine
      return;
    }
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const mobile = window.innerWidth < 768;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 1.75));
    renderer.setClearColor(0x000000, 0);
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 400);

    const uniforms = { uTime: { value: 0 }, uDim: { value: 1 }, uRippleT: { value: 9 }, uRippleAt: { value: new THREE.Vector2() } };
    const traceMat = new THREE.ShaderMaterial({ uniforms, vertexShader: traceVert, fragmentShader: traceFrag, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const traces = new THREE.LineSegments(buildTraces(mobile ? 900 : 1800), traceMat);
    traces.frustumCulled = false;
    const boxMat = new THREE.ShaderMaterial({ uniforms, vertexShader: boxVert, fragmentShader: boxFrag, transparent: true });
    const blocks = buildBlocks(mobile ? 480 : 950, boxMat);
    const groundMat = new THREE.ShaderMaterial({ uniforms, vertexShader: groundVert, fragmentShader: groundFrag, transparent: true, depthWrite: false, extensions: { derivatives: true } as any });
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(BOARD_W * 2, BOARD_FROM - BOARD_TO).rotateX(-Math.PI / 2), groundMat);
    ground.position.set(0, 0, (BOARD_FROM + BOARD_TO) / 2);
    scene.add(ground, traces, blocks);

    // input: the pointer tilts the camera a little; a tap/click on empty space sends a ripple across the board
    const mouse = new THREE.Vector2();
    const tilt = new THREE.Vector2();
    const zero = new THREE.Vector2();
    let hasPointer = false;
    const ray = new THREE.Raycaster();
    const floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    const toNdc = (cx: number, cy: number, v: THREE.Vector2) => v.set((cx / window.innerWidth) * 2 - 1, -(cy / window.innerHeight) * 2 + 1);
    const onMove = (e: PointerEvent) => { if (e.pointerType === 'mouse') { toNdc(e.clientX, e.clientY, mouse); hasPointer = true; } };
    const onLeave = () => (hasPointer = false);
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest('a,button,input,textarea,label,article,[data-no-ripple]')) return;
      const p = toNdc(e.clientX, e.clientY, new THREE.Vector2());
      ray.setFromCamera(p, camera);
      // aim at the floor; if the tap is above the horizon, ripple from the spot straight ahead
      if (!ray.ray.intersectPlane(floor, hit)) hit.set(camera.position.x, 0, camera.position.z - 60);
      uniforms.uRippleAt.value.set(hit.x, hit.z);
      uniforms.uRippleT.value = 0;
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    window.addEventListener('pointerdown', onDown, { passive: true });

    const resize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight, false);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', resize);
    resize();

    let progress = 0, last = performance.now(), raf = 0, time = 0, sentReady = false;
    const look = new THREE.Vector3();
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      if (document.hidden) return;
      if (!reduced) time += dt;
      const k = (rate: number) => (reduced ? 1 : Math.min(dt * rate, 1));

      // camera: flies forward with page scroll, rises over the middle of the page, drops back down at the end
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const target = max > 0 ? window.scrollY / max : 0;
      progress += (target - progress) * k(4);
      const rise = THREE.MathUtils.smoothstep(progress, 0.04, 0.3) - 0.6 * THREE.MathUtils.smoothstep(progress, 0.85, 1);
      const z = 14 - progress * TRAVEL - 20 * (1 - Math.cos(time * 0.02)); // slow idle drift, bounded
      tilt.lerp(hasPointer ? mouse : zero, k(2));
      camera.position.set(Math.sin(time * 0.15) * 2 + tilt.x * 1.5, 4.5 + rise * 20 + tilt.y * 0.8, z);
      look.set(Math.sin(time * 0.1) * 4, 1.5 + rise * 2, z - 42 + rise * 14);
      camera.lookAt(look);

      uniforms.uTime.value = time;
      uniforms.uRippleT.value += dt;
      uniforms.uDim.value += ((window.scrollY < window.innerHeight * 0.6 ? 1 : 0.55) - uniforms.uDim.value) * k(2);

      renderer.render(scene, camera);
      if (!sentReady) {
        sentReady = true;
        onReady?.();
      }
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('pointerdown', onDown);
      window.removeEventListener('resize', resize);
      [traces.geometry, blocks.geometry, ground.geometry].forEach((g) => g.dispose());
      [traceMat, boxMat, groundMat].forEach((m) => m.dispose());
      renderer.dispose();
      renderer.domElement.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={host}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(120%_70%_at_50%_0%,#0c1f2e_0%,#05070a_55%)] [&>canvas]:block [&>canvas]:h-full [&>canvas]:w-full"
    />
  );
}
