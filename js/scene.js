import * as THREE from 'three';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {crearSoldado} from './crearSoldado.js';

// Si ves al soldado de espaldas, cambia 0 por Math.PI
const FACE = 0;
const CAMS = {
  FPP: {p: [0, 1.15, 3.7], l: [0, 0.95, 0]},
  TPP: {p: [0, 1.4, 5.2], l: [0, 0.92, 0]}
};
const PR = {alta: 2, media: 1.5, baja: 1};

let renderer, scene, camera, holder, soldado, box, pendingSkin = null,
    camMode = 'FPP', rotY = 0, drag = false, last = 0, quality = 'alta';

function resize() {
  if (!renderer) return;
  const w = box.clientWidth || innerWidth, h = box.clientHeight || innerHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}

export function setQuality(q) {
  quality = q;
  if (!renderer) return;
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, PR[q] || 1));
  resize();
}

export function setCam(mode) {
  camMode = mode;
  if (!camera) return;
  const c = CAMS[mode] || CAMS.FPP;
  camera.position.set(...c.p);
  camera.lookAt(...c.l);
}

// Cambia el uniforme (uniforme, partes claras y casco) según la skin elegida
const UNIFORME = 0x343d2b, CLARO = 0x51583b, CASCO = 0x414832;
export function setSkin(color) {
  pendingSkin = color;
  if (!soldado) return;
  const base = new THREE.Color(color);
  const tonos = {
    [UNIFORME]: base.clone(),
    [CLARO]: base.clone().lerp(new THREE.Color(0xffffff), 0.18),
    [CASCO]: base.clone().lerp(new THREE.Color(0xffffff), 0.08)
  };
  soldado.traverse(o => {
    if (!o.isMesh || !o.material || !o.material.color) return;
    const m = o.material;
    if (m.userData.orig === undefined) m.userData.orig = m.color.getHex();
    const t = tonos[m.userData.orig];
    if (t) m.color.copy(t);
  });
}

export function initScene(el, skinColor, cam, q) {
  box = el;
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.1;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffd9b0, 0x1a2238, 0.9));
  const key = new THREE.DirectionalLight(0xffb06a, 2.8);
  key.position.set(3, 3, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7aa8ff, 2.2);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  holder = new THREE.Group();
  scene.add(holder);

  // sombra suave bajo los pies
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const cx = cv.getContext('2d');
  const g = cx.createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g;
  cx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false})
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = 0.01;
  scene.add(shadow);

  soldado = crearSoldado();
  holder.add(soldado);
  pendingSkin = skinColor;
  setSkin(skinColor);

  // girar arrastrando (si el celular está vertical, el lobby está girado: se usa Y)
  const pos = e => (matchMedia('(orientation:portrait)').matches ? e.clientY : e.clientX);
  const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { drag = true; last = pos(e); cvs.setPointerCapture(e.pointerId); });
  cvs.addEventListener('pointermove', e => { if (drag) { rotY += (pos(e) - last) * 0.01; last = pos(e); } });
  const up = () => { drag = false; };
  cvs.addEventListener('pointerup', up);
  cvs.addEventListener('pointercancel', up);

  addEventListener('resize', resize);
  setQuality(q || quality);
  setCam(cam || camMode);

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    if (!drag) rotY *= 0.96;
    holder.rotation.y = FACE + rotY + Math.sin(t * 0.6) * 0.08;
    soldado.position.y = Math.sin(t * 1.6) * 0.004; // respiración leve
    renderer.render(scene, camera);
  })();
}