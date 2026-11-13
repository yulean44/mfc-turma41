/* Planetinha 3D low-poly no espaço — cresce sozinho com o estudo */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as SkeletonUtils from "three/addons/utils/SkeletonUtils.js";
import { CRIATURAS, DECOS } from "./data.js";

/* ---------- ruído ---------- */
function hash(x, y, z) { let h = x * 374761393 + y * 668265263 + z * 2147483647; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf), l = (a, b, t) => a + (b - a) * t, c = (a, b, d) => hash(xi + a, yi + b, zi + d);
  return l(l(l(c(0,0,0), c(1,0,0), u), l(c(0,1,0), c(1,1,0), u), v), l(l(c(0,0,1), c(1,0,1), u), l(c(0,1,1), c(1,1,1), u), v), w) * 2 - 1;
}
function fbm(x, y, z, o = 4) { let a = .5, f = 1, s = 0; for (let i = 0; i < o; i++) { s += a * vnoise(x * f + 11.3 * i, y * f + 3.1 * i, z * f + 7.7 * i); f *= 2; a *= .5; } return s; }
function rnd(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

const MONTE = .27;
function terreno(d, agua) {
  const h = fbm(d.x * 1.4 + 2, d.y * 1.4, d.z * 1.4 - 1, 4);
  const lago = agua && h < -0.04;
  const monte = h > MONTE;
  let r = lago ? 0.975 : 1 + Math.max(0, h + 0.04) * 0.07 + h * 0.012;
  if (monte) r += Math.pow(h - MONTE, .9) * .32;
  return { h, lago, monte, r };
}
export function sorteiaPonto(agua, querLago = false, seed = Math.random() * 1e9) {
  const R = rnd(seed), v = new THREE.Vector3();
  for (let i = 0; i < 600; i++) {
    v.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (v.lengthSq() < .01 || v.lengthSq() > 1) continue; v.normalize();
    const t = terreno(v, agua); if (t.lago === querLago && (querLago || (t.h > -0.02 && t.h < MONTE - .03))) return v.toArray().map(x => +x.toFixed(4));
  }
  return [0, 1, 0];
}

const C = {
  cristal: new THREE.Color("#a9cbe0"), cristal2: new THREE.Color("#7aa6c6"), cristal3: new THREE.Color("#d2e6f1"),
  terra: new THREE.Color("#93a866"), rocha: new THREE.Color("#9aa3ad"), rocha2: new THREE.Color("#7f8894"), areia: new THREE.Color("#e9e1c4"),
  grama: new THREE.Color("#7fbf5e"), grama2: new THREE.Color("#9fd27a"), floresta: new THREE.Color("#4f9a5c"),
  agua: new THREE.Color("#6cc3e0"), agua2: new THREE.Color("#3f97c4"), neve: new THREE.Color("#f2f7fa"),
};

/* ---------- decorações low-poly ---------- */
const MATS = {};
const M = (c, o) => (MATS[c + JSON.stringify(o || {})] ||= new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true, ...o }));
function blob(r, c, x, y, z, det = 1) { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, det), M(c)); m.position.set(x, y, z); m.castShadow = true; return m; }
function cyl(r1, r2, h, c, y = h / 2, seg = 6) { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r2, h, seg), M(c)); m.position.y = y; m.castShadow = true; return m; }
function fazDeco(k, seed) {
  const g = new THREE.Group(), R = rnd(seed);
  const verdes = ["#4f9a5c", "#5ea862", "#3f7d58", "#6fb46a"];
  if (k === "arvore") {
    g.add(cyl(.008, .012, .06, "#8a6a4a"));
    const v = verdes[Math.floor(R() * 4)];
    g.add(blob(.042, v, 0, .085, 0)); g.add(blob(.03, v, .028, .07, .012)); g.add(blob(.028, v, -.024, .075, -.014)); g.add(blob(.026, v, 0, .118, 0));
  } else if (k === "pinheiro") {
    g.add(cyl(.006, .008, .035, "#7a5a3c"));
    const v = R() > .5 ? "#3f7d58" : "#468a5f";
    [[.04, .055, .045], [.032, .048, .078], [.022, .04, .108]].forEach(([r, h, y]) => { const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), M(v)); m.position.y = y; m.castShadow = true; g.add(m); });
  } else if (k === "arbusto") {
    const v = verdes[Math.floor(R() * 4)];
    g.add(blob(.026, v, 0, .016, 0)); g.add(blob(.02, v, .022, .011, .006)); g.add(blob(.018, v, -.019, .011, .01));
  } else if (k === "flores" || k === "girassois") {
    const cores = k === "flores" ? ["#f2b8cf", "#ffffff", "#c9b3f0", "#9fd0e6"] : ["#f5d76e", "#ffffff", "#f2b35c"];
    for (let i = 0; i < 6; i++) {
      const a = R() * 6.28, d = R() * .03, f = new THREE.Group();
      f.add(cyl(.0016, .0016, .02, "#5ea862", .01, 4));
      const p = new THREE.Mesh(new THREE.IcosahedronGeometry(.006, 0), M(cores[Math.floor(R() * cores.length)])); p.position.y = .022; f.add(p);
      f.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); g.add(f);
    }
  } else if (k === "pedra") {
    const m = new THREE.Mesh(new THREE.DodecahedronGeometry(.024, 0), M("#b8bcc4")); m.scale.set(1.2, .75, 1); m.position.y = .01; m.castShadow = true; g.add(m);
    const m2 = new THREE.Mesh(new THREE.DodecahedronGeometry(.013, 0), M("#9aa0aa")); m2.position.set(.024, .006, .01); g.add(m2);
  } else if (k === "toco") {
    const m = cyl(.011, .011, .06, "#8a6a4a", 0, 6); m.rotation.z = Math.PI / 2; m.position.y = .011; g.add(m);
  } else if (k === "cogumelos") {
    for (let i = 0; i < 3; i++) {
      const f = new THREE.Group(), s = .7 + R() * .6;
      f.add(cyl(.004 * s, .005 * s, .018 * s, "#f3ead8", .009 * s, 5));
      const c = new THREE.Mesh(new THREE.ConeGeometry(.013 * s, .012 * s, 7), M("#e07a6a")); c.position.y = .022 * s; f.add(c);
      f.position.set((R() - .5) * .04, 0, (R() - .5) * .04); g.add(f);
    }
  } else if (k === "cristal") {
    const c = M("#c9b8f5", { emissive: "#7a60d6", emissiveIntensity: .45, roughness: .25, transparent: true, opacity: .9 });
    [[0, .03, 0, .026], [.02, .018, .01, .015], [-.017, .016, -.01, .013]].forEach(([x, y, z, s]) => { const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), c); m.scale.y = 1.9; m.position.set(x, y, z); g.add(m); });
  } else if (k === "cabana") {
    const b = new THREE.Mesh(new THREE.BoxGeometry(.06, .04, .05), M("#efe4cc")); b.position.y = .02; b.castShadow = true; g.add(b);
    const t = new THREE.Mesh(new THREE.ConeGeometry(.05, .04, 4), M("#b8684e")); t.rotation.y = Math.PI / 4; t.position.y = .06; t.castShadow = true; g.add(t);
    const w = new THREE.Mesh(new THREE.BoxGeometry(.012, .01, .002), M("#ffe7a3", { emissive: "#ffcf66", emissiveIntensity: .9 })); w.position.set(.016, .024, .026); g.add(w);
  } else if (k === "fogueira") {
    for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28, p = new THREE.Mesh(new THREE.DodecahedronGeometry(.006, 0), M("#9aa0aa")); p.position.set(Math.cos(a) * .02, .004, Math.sin(a) * .02); g.add(p); }
    [0, 1.2, 2.4].forEach(r => { const l = cyl(.003, .003, .03, "#7a5a3c", 0, 5); l.rotation.z = Math.PI / 2; l.rotation.y = r; l.position.y = .005; g.add(l); });
    const fogo = new THREE.Group(); fogo.position.y = .008;
    [["#ffd27a", .009, .03, 0], ["#ff9a3c", .007, .022, .004], ["#ff6a2c", .005, .016, -.004]].forEach(([c, r, h, x]) => { const f = new THREE.Mesh(new THREE.ConeGeometry(r, h, 5), M(c, { emissive: c, emissiveIntensity: 1.4, roughness: 1 })); f.position.set(x, h / 2, x * .5); fogo.add(f); });
    fogo.userData.chama = true; g.add(fogo);
    const brilho = new THREE.Sprite(new THREE.SpriteMaterial({ color: "#ffb35c", transparent: true, opacity: .35, depthWrite: false, blending: THREE.AdditiveBlending })); brilho.scale.set(.09, .09, 1); brilho.position.y = .02; brilho.userData.chama = true; g.add(brilho);
  } else if (k === "lanterna") {
    g.add(cyl(.0025, .003, .055, "#5b4a3a", .0275, 4));
    const l = new THREE.Mesh(new THREE.OctahedronGeometry(.01, 0), M("#ffd88a", { emissive: "#ffb347", emissiveIntensity: 1.2 })); l.position.y = .06; g.add(l);
  } else if (k === "bambu") {
    for (let i = 0; i < 4; i++) { const m = cyl(.004, .004, .07 + R() * .05, "#9fcf6a", undefined, 5); m.position.x = (R() - .5) * .025; m.position.z = (R() - .5) * .025; m.position.y = m.geometry.parameters.height / 2; g.add(m); }
  }
  return g;
}

/* ---------- modelos (base64 em módulos) ---------- */
const loader = new GLTFLoader();
const cache = {};
function carregaGLB(id) {
  return (cache[id] ||= import(`./m/${id}.js`).then(mod => {
    const bin = atob(mod.default), buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return new Promise((res, rej) => loader.parse(buf.buffer, "", res, rej));
  }));
}
function ajusta(obj, alt) {
  obj.updateMatrixWorld(true);
  const b = new THREE.Box3().setFromObject(obj), s = b.getSize(new THREE.Vector3());
  const k = alt / Math.max(s.y, s.x * .6, s.z * .6, 1e-6);
  obj.scale.multiplyScalar(k); obj.position.y -= b.min.y * k;
  obj.traverse(o => { if (o.isMesh) { o.castShadow = true; o.frustumCulled = false;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m && "metalness" in m) { m.metalness = 0; m.roughness = Math.max(.6, m.roughness ?? 1); } }); } });
}
const clip = (anims, ...nomes) => { for (const n of nomes) { const a = anims.find(x => x.name.split("|").pop().toLowerCase() === n.toLowerCase()); if (a) return a; } return null; };
function preparaModelo(g, def) {
  const modelo = SkeletonUtils.clone(g.scene);
  if (def.modo === "nada" || def.modo === "ceu") { const sz = new THREE.Box3().setFromObject(modelo).getSize(new THREE.Vector3()); if (sz.y > sz.z * 1.3 && sz.y > sz.x) modelo.rotation.x = Math.PI / 2; }
  return modelo;
}

/* ---------- miniaturas das criaturas (para a coleção) ---------- */
let miniR = null; const miniCache = {};
export function miniatura(k) {
  if (miniCache[k]) return miniCache[k];
  return (miniCache[k] = (async () => {
    const def = CRIATURAS[k]; const g = await carregaGLB(k);
    if (!miniR) { miniR = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); miniR.setSize(200, 200); miniR.outputColorSpace = THREE.SRGBColorSpace; }
    const sc = new THREE.Scene();
    sc.add(new THREE.HemisphereLight("#eaf6ff", "#40506a", 1.6));
    const dl = new THREE.DirectionalLight("#ffffff", 2.2); dl.position.set(-2, 3, 3); sc.add(dl);
    const rim = new THREE.DirectionalLight("#8fd0e6", 1.6); rim.position.set(2, 1, -3); sc.add(rim);
    const m = preparaModelo(g, def); ajusta(m, 1); sc.add(m);
    const A = g.animations, a = clip(A, "Idle", "Flying_Idle", "Swim", "Swim.001") || A[0];
    if (a) { const mx = new THREE.AnimationMixer(m); mx.clipAction(a).play(); mx.update(.3); }
    const box = new THREE.Box3().setFromObject(m), c = box.getCenter(new THREE.Vector3()), s = box.getSize(new THREE.Vector3()).length();
    const cam = new THREE.PerspectiveCamera(30, 1, .01, 100);
    cam.position.copy(c).add(new THREE.Vector3(.9, .55, 1.4).normalize().multiplyScalar(s * 1.75)); cam.lookAt(c);
    miniR.render(sc, cam);
    return miniR.domElement.toDataURL("image/png");
  })().catch(() => null));
}

/* ---------- mundo ---------- */
export function criaMundo(host) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, devicePixelRatio || 1));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  const canvas = renderer.domElement; canvas.className = "mundo-canvas"; host.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .05, 200);
  camera.position.set(0, 1.4, 6);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableDamping = true; controls.dampingFactor = .07;
  controls.minDistance = 1.5; controls.maxDistance = 10; controls.autoRotate = true; controls.autoRotateSpeed = .45; controls.rotateSpeed = .55; controls.zoomSpeed = .7;

  scene.add(new THREE.HemisphereLight("#dff1ff", "#2a3550", 1.1));
  const sol = new THREE.DirectionalLight("#fff3e0", 2.3); sol.castShadow = true;
  sol.shadow.mapSize.set(1024, 1024); Object.assign(sol.shadow.camera, { left: -1.6, right: 1.6, top: 1.6, bottom: -1.6, near: .5, far: 12 }); sol.shadow.bias = -.0015; sol.shadow.normalBias = .01;
  scene.add(sol, sol.target);
  const contra = new THREE.DirectionalLight("#7fc8ff", 1.1); scene.add(contra);
  const raiz = new THREE.Group(); scene.add(raiz);

  /* planeta facetado (cada triângulo com uma cor) */
  const geo = new THREE.IcosahedronGeometry(1, 14);
  const base = geo.attributes.position.array.slice();
  geo.setAttribute("color", new THREE.BufferAttribute(new Float32Array(base.length), 3));
  const matPlaneta = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .8, flatShading: true, emissive: "#16324a", emissiveIntensity: .25 });
  const planeta = new THREE.Mesh(geo, matPlaneta); planeta.receiveShadow = true; planeta.castShadow = true; raiz.add(planeta);

  /* halo de atmosfera e casca de vidro */
  const halo = (() => {
    const cv = document.createElement("canvas"); cv.width = cv.height = 256; const x = cv.getContext("2d");
    const gr = x.createRadialGradient(128, 128, 60, 128, 128, 128); gr.addColorStop(0, "rgba(160,215,255,.55)"); gr.addColorStop(.45, "rgba(120,190,240,.22)"); gr.addColorStop(1, "rgba(80,140,220,0)");
    x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    s.scale.set(3.6, 3.6, 1); s.renderOrder = -1; return s;
  })(); scene.add(halo);
  const casca = new THREE.Mesh(new THREE.IcosahedronGeometry(1.12, 5), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide,
    uniforms: { cor: { value: new THREE.Color("#8fd6ff") }, forca: { value: .7 } },
    vertexShader: "varying vec3 vN; varying vec3 vV; void main(){ vec4 mv = modelViewMatrix*vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz); gl_Position = projectionMatrix*mv; }",
    fragmentShader: "uniform vec3 cor; uniform float forca; varying vec3 vN; varying vec3 vV; void main(){ float f = pow(1. - max(dot(vN, vV), 0.), 3.); gl_FragColor = vec4(cor*f*forca, f*forca); }",
  })); raiz.add(casca);

  let st = { verdor: -1, efeitos: {} }, corCasca = "#8fd6ff";
  const tmp = new THREE.Vector3(), cen = new THREE.Vector3(), cor = new THREE.Color();
  function pintaPlaneta() {
    const pos = geo.attributes.position, col = geo.attributes.color, ag = !!st.efeitos.agua, verdor = st.verdor;
    for (let i = 0; i < pos.count; i++) { tmp.set(base[i * 3], base[i * 3 + 1], base[i * 3 + 2]).normalize(); const r = terreno(tmp, ag).r; pos.setXYZ(i, tmp.x * r, tmp.y * r, tmp.z * r); }
    for (let f = 0; f < pos.count; f += 3) {
      cen.set(0, 0, 0); for (let j = 0; j < 3; j++) cen.add(tmp.set(base[(f + j) * 3], base[(f + j) * 3 + 1], base[(f + j) * 3 + 2]));
      cen.normalize();
      const t = terreno(cen, ag), g = fbm(cen.x * 2.1 - 5, cen.y * 2.1 + 1, cen.z * 2.1 + 4, 3), v = fbm(cen.x * 5, cen.y * 5, cen.z * 5, 2);
      if (t.lago) cor.copy(C.agua).lerp(C.agua2, sm(-.1, -.4, t.h));
      else if (t.monte) {
        cor.copy(verdor > 0 ? C.rocha : C.cristal2).lerp(verdor > 0 ? C.rocha2 : C.cristal, sm(-.3, .4, v));
        if (verdor > 0) cor.lerp(C.floresta, sm(MONTE + .15, MONTE + .02, t.h) * .95);
        cor.lerp(C.neve, sm(.5, .56, t.h) * .9);
      } else {
        cor.copy(C.cristal).lerp(C.cristal2, sm(-.2, .5, v)).lerp(C.cristal3, sm(.3, .7, -v) * .6);
        if (verdor > 0) {
          cor.copy(C.terra).lerp(C.floresta, .2);
          const lim = -1 + 2.4 * verdor, gr = sm(lim + .06, lim - .06, g);
          if (gr > 0) cor.lerp(C.grama.clone().lerp(C.grama2, sm(-.1, .5, v)).lerp(C.floresta, sm(.2, .55, t.h)), gr);
          if (ag) cor.lerp(C.areia, sm(-.01, -.035, t.h) * .85);
        }
      }
      for (let j = 0; j < 3; j++) col.setXYZ(f + j, cor.r, cor.g, cor.b);
    }
    pos.needsUpdate = true; col.needsUpdate = true; geo.computeVertexNormals();
    matPlaneta.emissiveIntensity = verdor > 0 ? .08 : .35;
  }

  /* estrelas, nuvens, lua, anel, borboletas */
  const estrelas = (() => {
    const n = 1400, p = new Float32Array(n * 3), cs = new Float32Array(n * 3), R = rnd(7), c = new THREE.Color();
    for (let i = 0; i < n; i++) { tmp.set(R() - .5, R() - .5, R() - .5).normalize().multiplyScalar(40 + R() * 30); p.set([tmp.x, tmp.y, tmp.z], i * 3); c.setHSL(.55 + R() * .1, .4, .7 + R() * .3); cs.set([c.r, c.g, c.b], i * 3); }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.BufferAttribute(p, 3)); g.setAttribute("color", new THREE.BufferAttribute(cs, 3));
    return new THREE.Points(g, new THREE.PointsMaterial({ size: .16, vertexColors: true, transparent: true, opacity: .85, depthWrite: false }));
  })(); scene.add(estrelas);
  const nuvens = new THREE.Group(); raiz.add(nuvens);
  { const R = rnd(3), m = new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 1, flatShading: true, transparent: true, opacity: .95 });
    for (let i = 0; i < 10; i++) {
      const c = new THREE.Group();
      for (let j = 0; j < 4; j++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(.03 + R() * .025, 0), m); b.position.set(j * .038 - .057, R() * .02, (R() - .5) * .03); b.castShadow = true; c.add(b); }
      tmp.set(R() - .5, R() - .5, R() - .5).normalize();
      const piv = new THREE.Group(); piv.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tmp.clone());
      c.position.y = 1.26 + R() * .1; piv.add(c); piv.userData.vel = .03 + R() * .04; nuvens.add(piv);
    } }
  const lua = new THREE.Mesh(new THREE.IcosahedronGeometry(.15, 1), new THREE.MeshStandardMaterial({ color: "#d9dde4", flatShading: true, roughness: .9 })); lua.castShadow = true;
  const luaPiv = new THREE.Group(); luaPiv.rotation.z = .35; lua.position.set(2.6, 0, 0); luaPiv.add(lua); scene.add(luaPiv);
  const anel = new THREE.Mesh(new THREE.RingGeometry(1.45, 1.9, 120, 1), new THREE.MeshBasicMaterial({ color: "#bfe3f2", transparent: true, opacity: .28, side: THREE.DoubleSide, depthWrite: false }));
  anel.rotation.x = Math.PI / 2.25; anel.rotation.y = .3; raiz.add(anel);
  const borboletas = new THREE.Group(); raiz.add(borboletas);
  { const R = rnd(11), cs = ["#f5d76e", "#f2b8cf", "#ffffff", "#9fd0e6", "#c9b3f0"];
    for (let i = 0; i < 14; i++) {
      const b = new THREE.Group(), m = new THREE.MeshBasicMaterial({ color: cs[i % 5], side: THREE.DoubleSide });
      const a1 = new THREE.Mesh(new THREE.PlaneGeometry(.013, .011), m), a2 = a1.clone(); a1.position.x = .0065; a2.position.x = -.0065; b.add(a1, a2);
      b.userData = { a1, a2, dir: new THREE.Vector3(R() - .5, R() - .5, R() - .5).normalize(), hd: new THREE.Vector3(R() - .5, R() - .5, R() - .5), f: R() * 10 };
      borboletas.add(b);
    } }

  /* cachoeiras: das encostas das montanhas até os lagos */
  const cachoeiras = new THREE.Group(); raiz.add(cachoeiras);
  const texCach = (() => { const cv = document.createElement("canvas"); cv.width = 32; cv.height = 128; const x = cv.getContext("2d");
    x.fillStyle = "rgba(170,225,245,.75)"; x.fillRect(0, 0, 32, 128);
    for (let i = 0; i < 40; i++) { x.fillStyle = `rgba(255,255,255,${.3 + Math.random() * .6})`; x.fillRect(Math.random() * 32, Math.random() * 128, 1 + Math.random() * 3, 6 + Math.random() * 18); }
    const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; return t; })();
  const matCach = new THREE.MeshBasicMaterial({ map: texCach, transparent: true, opacity: .9, side: THREE.DoubleSide, depthWrite: false });
  const matEsp = new THREE.MeshBasicMaterial({ color: "#ffffff", transparent: true, opacity: .75 });
  function montaCachoeiras() {
    cachoeiras.clear();
    if (!st.efeitos.agua || st.verdor < .3) return;
    const R = rnd(42), achadas = [], a = new THREE.Vector3(), b = new THREE.Vector3(), eixo = new THREE.Vector3();
    for (let i = 0; i < 5000 && achadas.length < 5; i++) {
      a.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (a.lengthSq() < .05) continue; a.normalize();
      const ta = terreno(a, true); if (ta.h < MONTE + .02 || ta.h > MONTE + .1) continue;
      let alvo = null;
      for (let k = 0; k < 16 && !alvo; k++) {
        eixo.set(R() - .5, R() - .5, R() - .5).cross(a).normalize();
        for (let dd = .03; dd < .2; dd += .015) { b.copy(a).applyAxisAngle(eixo, dd); if (terreno(b, true).lago) { alvo = b.clone(); break; } }
      }
      if (!alvo || achadas.some(p => p.distanceTo(a) < .5)) continue;
      achadas.push(a.clone());
      const topo = a.clone().multiplyScalar(ta.r - .01), base = alvo.clone().multiplyScalar(.975);
      const meio = topo.clone().add(base).multiplyScalar(.5), comp = topo.distanceTo(base);
      const q = new THREE.Mesh(new THREE.PlaneGeometry(.035, comp, 1, 1), matCach);
      q.position.copy(meio); q.lookAt(meio.clone().add(meio.clone().normalize()));
      const dir = topo.clone().sub(base).normalize(); const up = new THREE.Vector3(0, 1, 0).applyQuaternion(q.quaternion);
      q.quaternion.premultiply(new THREE.Quaternion().setFromUnitVectors(up, dir));
      cachoeiras.add(q);
      for (let j = 0; j < 5; j++) { const e = new THREE.Mesh(new THREE.IcosahedronGeometry(.008 + R() * .008, 0), matEsp); e.position.copy(base).add(new THREE.Vector3(R() - .5, R() - .5, R() - .5).multiplyScalar(.03)); e.userData.f = R() * 6; cachoeiras.add(e); }
    }
  }

  /* objetos */
  const decoGrupo = new THREE.Group(); raiz.add(decoGrupo);
  const bichos = new THREE.Group(); raiz.add(bichos);
  const decoObjs = new Map(), bichoObjs = new Map(), surgindo = [];
  const UP = new THREE.Vector3(0, 1, 0);
  const raioEm = d => terreno(d, !!st.efeitos.agua).r, ehLago = d => terreno(d, !!st.efeitos.agua).lago, ehMonte = d => terreno(d, !!st.efeitos.agua).monte;
  function surge(o) { o.userData.alvo = o.scale.x; o.scale.setScalar(.001); o.userData.t0 = performance.now() + Math.random() * 300; surgindo.push(o); }

  async function criaDeco(item) {
    const def = DECOS[item.k]; if (!def) return null;
    let o;
    if (def.glb) { const g = await carregaGLB(def.glb); const w = new THREE.Group(), m = g.scene.clone(true); ajusta(m, def.tam); w.add(m); o = w; }
    else o = fazDeco(item.k, item.s || 1);
    let d = new THREE.Vector3().fromArray(item.d).normalize();
    if (ehLago(d) || ehMonte(d)) { const nd = sorteiaPonto(!!st.efeitos.agua, false, item.s || 5); d = new THREE.Vector3().fromArray(nd); }
    o.position.copy(d).multiplyScalar(raioEm(d) - .004); o.quaternion.setFromUnitVectors(UP, d); o.rotateY(item.r || 0);
    return o;
  }
  function pontoAleatorio(R, cond) { for (let i = 0; i < 400; i++) { tmp.set(R() * 2 - 1, R() * 2 - 1, R() * 2 - 1); if (tmp.lengthSq() < .01) continue; tmp.normalize(); if (cond(tmp)) return tmp.clone(); } return null; }
  async function criaBicho(k, idx) {
    const def = CRIATURAS[k]; if (!def) return null;
    const g = await carregaGLB(k), modelo = preparaModelo(g, def);
    ajusta(modelo, def.tam * (def.modo === "anda" ? 1.5 : def.modo === "voa" ? 1.35 : 1));
    const o = new THREE.Group(); o.add(modelo);
    const mixer = new THREE.AnimationMixer(modelo), A = g.animations;
    const andar = clip(A, "Walk", "Run", "Fast_Flying", "Flying_Idle", "Swim", "Swim.001") || A[0];
    const parado = clip(A, "Idle", "Idle_Eating", "Idle_Peck", "Flying_Idle", "Swim", "Swim.001") || andar;
    const acA = andar && mixer.clipAction(andar), acP = parado && mixer.clipAction(parado); (acA || acP)?.play();
    const R = rnd(idx * 977 + k.length * 31);
    let d = def.modo === "nada" ? pontoAleatorio(R, x => ehLago(x)) : def.modo === "ceu" ? new THREE.Vector3(R() - .5, R() * .4 - .2, R() - .5).normalize() : pontoAleatorio(R, x => !ehLago(x) && !ehMonte(x));
    if (!d) { o.visible = false; d = new THREE.Vector3(0, 1, 0); }
    const hd = new THREE.Vector3(R() - .5, R() - .5, R() - .5); hd.sub(d.clone().multiplyScalar(hd.dot(d))).normalize();
    o.userData = { k, def, mixer, acA, acP, d, hd, vel: def.modo === "ceu" ? .05 : def.modo === "voa" ? .09 : def.modo === "nada" ? .06 : .045 + R() * .03, pausa: 0, movendo: true, fase: R() * 10, R };
    return o;
  }

  let sync = 0, carregou = false;
  async function aplica(e) {
    const meu = ++sync;
    const mudouCor = e.verdor !== st.verdor, mudouTerreno = !!e.efeitos.agua !== !!st.efeitos.agua || st.verdor < 0;
    st = { verdor: e.verdor, efeitos: { ...e.efeitos } };
    if (mudouCor || mudouTerreno) { pintaPlaneta(); montaCachoeiras(); }
    const f = st.efeitos;
    nuvens.visible = !!f.nuvens; lua.visible = !!f.lua; anel.visible = !!f.anel; borboletas.visible = !!f.borboletas;
    casca.material.uniforms.forca.value = f.nuvens ? .95 : .6;
    casca.material.uniforms.cor.value.set(f.aurora ? "#a8f0c8" : corCasca);
    const anim = carregou;
    const ids = new Set(e.decos.map(x => x.id));
    for (const [id, o] of decoObjs) if (!ids.has(id) || mudouTerreno) { decoGrupo.remove(o); decoObjs.delete(id); }
    for (const it of e.decos) {
      if (decoObjs.has(it.id)) continue;
      const n = await criaDeco(it).catch(() => null); if (meu !== sync) return;
      if (n) { decoGrupo.add(n); decoObjs.set(it.id, n); if (anim && !mudouTerreno) surge(n); }
    }
    const ks = new Set(e.criaturas);
    for (const [k, o] of bichoObjs) if (!ks.has(k) || mudouTerreno) { bichos.remove(o); bichoObjs.delete(k); }
    let i = 0;
    for (const k of e.criaturas) {
      i++; if (bichoObjs.has(k)) continue;
      const n = await criaBicho(k, i).catch(err => { console.warn("modelo", k, err); return null; }); if (meu !== sync) return;
      if (n) { bichos.add(n); bichoObjs.set(k, n); if (anim && !mudouTerreno) surge(n); }
    }
    carregou = true;
  }

  const nd = new THREE.Vector3(), fw = new THREE.Vector3(), rt = new THREE.Vector3(), mx = new THREE.Matrix4();
  function anda(o, dt, t) {
    const u = o.userData, def = u.def; u.mixer.update(dt);
    if (def.modo === "anda" || def.modo === "voa") {
      u.pausa -= dt;
      if (u.pausa <= 0) {
        if (u.movendo && u.R() < .35) { u.movendo = false; u.pausa = 2 + u.R() * 3; if (u.acP && u.acP !== u.acA && def.modo === "anda") { u.acA.fadeOut(.3); u.acP.reset().fadeIn(.3).play(); } }
        else { if (!u.movendo && u.acP !== u.acA && def.modo === "anda") { u.acP.fadeOut(.3); u.acA.reset().fadeIn(.3).play(); } u.movendo = true; u.pausa = 3 + u.R() * 5; }
      }
    }
    if (u.movendo || def.modo === "nada" || def.modo === "ceu") {
      u.hd.applyAxisAngle(u.d, (u.R() - .5) * dt * 1.6);
      nd.copy(u.d).addScaledVector(u.hd, u.vel * dt).normalize();
      const ok = def.modo === "nada" ? ehLago(nd) : def.modo === "anda" ? !ehLago(nd) && !ehMonte(nd) : true;
      if (ok) u.d.copy(nd); else u.hd.negate();
      u.hd.sub(fw.copy(u.d).multiplyScalar(u.hd.dot(u.d))).normalize();
    }
    const r = def.modo === "ceu" ? 1.8 + Math.sin(t * .4 + u.fase) * .05 : def.modo === "voa" ? raioEm(u.d) + .14 + Math.sin(t * 1.5 + u.fase) * .02 : def.modo === "nada" ? .965 : raioEm(u.d) - .002;
    o.position.copy(u.d).multiplyScalar(r);
    rt.crossVectors(u.d, u.hd).normalize(); mx.makeBasis(rt, u.d, u.hd); o.quaternion.setFromRotationMatrix(mx);
  }
  function voaBorboleta(b, dt, t) {
    const u = b.userData;
    u.hd.applyAxisAngle(u.dir, Math.sin(t + u.f) * dt * 2); u.hd.sub(fw.copy(u.dir).multiplyScalar(u.hd.dot(u.dir))).normalize();
    u.dir.addScaledVector(u.hd, dt * .12).normalize();
    b.position.copy(u.dir).multiplyScalar(Math.max(raioEm(u.dir), 1.02) + .05 + Math.sin(t * 2 + u.f) * .015);
    rt.crossVectors(u.dir, u.hd).normalize(); mx.makeBasis(rt, u.dir, u.hd); b.quaternion.setFromRotationMatrix(mx);
    const a = Math.sin(t * 18 + u.f) * 1.1; u.a1.rotation.z = a; u.a2.rotation.z = -a; u.a1.rotation.x = u.a2.rotation.x = -Math.PI / 2;
  }

  /* layout: o planeta pode ficar no centro, de lado ou ao fundo */
  let deslAlvo = 0, desl = 0, dimAlvo = 1, distAlvo = null, parado = 0, vivo = true, quadro = 0, leve = false;
  controls.addEventListener("start", () => { controls.autoRotate = false; parado = 0; distAlvo = null; });
  function frame(now) {
    if (!vivo) return; requestAnimationFrame(frame);
    if (document.hidden) return;
    quadro++; if (leve && quadro % 2) return;
    const dt = Math.min(.05, (now - (frame.u || now)) / 1000) * (leve ? 2 : 1); frame.u = now; const t = now / 1000;
    parado += dt; if (parado > 5) controls.autoRotate = true;
    desl += (deslAlvo - desl) * Math.min(1, dt * 4);
    if (distAlvo) { const l = camera.position.length(); camera.position.setLength(l + (distAlvo - l) * Math.min(1, dt * 3)); }
    const w = host.clientWidth, h = host.clientHeight;
    if (Math.abs(desl) > .001) camera.setViewOffset(w, h, -desl * w, 0, w, h); else camera.clearViewOffset();
    controls.update();
    sol.position.copy(camera.position).applyAxisAngle(UP, .8).add(new THREE.Vector3(0, 1.6, 0)).normalize().multiplyScalar(5);
    contra.position.copy(camera.position).multiplyScalar(-1).add(new THREE.Vector3(0, .6, 0));
    canvas.style.opacity = String(+(canvas.style.opacity || 1) + (dimAlvo - +(canvas.style.opacity || 1)) * Math.min(1, dt * 4));
    nuvens.children.forEach(p => p.rotateX(p.userData.vel * dt));
    luaPiv.rotation.y += dt * .08;
    for (const o of bichos.children) if (o.visible) anda(o, dt, t);
    if (borboletas.visible) for (const b of borboletas.children) voaBorboleta(b, dt, t);
    for (let i = surgindo.length - 1; i >= 0; i--) {
      const o = surgindo[i], p = Math.min(1, Math.max(0, (now - o.userData.t0) / 700));
      const e = p < 1 ? 1 + 2.2 * Math.pow(p - 1, 3) + 1.2 * Math.pow(p - 1, 2) : 1;
      o.scale.setScalar(Math.max(.001, o.userData.alvo * e)); if (p >= 1) surgindo.splice(i, 1);
    }
    estrelas.rotation.y += dt * .003;
    texCach.offset.y -= dt * 1.4;
    decoGrupo.traverse(o => { if (o.userData.chama) { const f = 1 + Math.sin(t * 13 + o.id) * .12 + Math.sin(t * 7.3 + o.id * 2) * .08; o.scale.y = (o.isSprite ? .09 : 1) * f; if (o.isSprite) o.material.opacity = .28 + Math.sin(t * 9 + o.id) * .08; } });
    for (const e of cachoeiras.children) if (e.userData.f !== undefined) e.scale.setScalar(.8 + Math.sin(t * 6 + e.userData.f) * .3);
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);
  function encaixa() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = camera.aspect < 1 ? Math.min(62, 36 / camera.aspect * .8) : 36; camera.updateProjectionMatrix();
  }
  new ResizeObserver(encaixa).observe(host); encaixa();

  return {
    aplica,
    /* modo: "centro" (início), "mundo" (interativo), "lado" (atrás das páginas), "fundo" (leitura) */
    layout(modo) {
      const estreito = host.clientWidth < 900;
      const cfg = { centro: [estreito ? 0 : -.14, 1, estreito ? 6.4 : 6], mundo: [0, 1, 5], lado: [estreito ? 0 : -.3, estreito ? .25 : .55, 6.4], fundo: [estreito ? 0 : -.32, estreito ? .15 : .3, 7] }[modo] || [0, 1, 4.4];
      deslAlvo = cfg[0]; dimAlvo = cfg[1]; distAlvo = cfg[2]; controls.enabled = modo === "mundo" || modo === "centro"; controls.enableZoom = modo === "mundo"; leve = modo === "fundo";
    },
    tema(t) {
      const c = { meianoite: "#7fa8e0", noite: "#a0d7ff", cristal: "#9ff0ff", aurora: "#c9b3f0", floresta: "#b5e48c", amanhecer: "#ffffff" }[t] || "#a0d7ff";
      halo.material.color.set(c); estrelas.visible = t !== "amanhecer"; halo.material.opacity = t === "amanhecer" ? .6 : t === "meianoite" ? .55 : 1;
      corCasca = t === "aurora" ? "#c9b3f0" : t === "floresta" ? "#b5e48c" : t === "cristal" ? "#9ff0ff" : "#8fd6ff"; if (!st.efeitos.aurora) casca.material.uniforms.cor.value.set(corCasca);
    },
    foco(k) { const o = bichoObjs.get(k); if (!o) return; const p = o.getWorldPosition(new THREE.Vector3()).normalize(); camera.position.copy(p.multiplyScalar(2.1)); distAlvo = null; controls.autoRotate = false; parado = 0; },
  };
}
