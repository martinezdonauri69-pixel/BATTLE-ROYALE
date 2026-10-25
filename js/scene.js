import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';

// Si ves al soldado de espaldas, cambia 0 por Math.PI
const FACE = 0;
const MODEL_URL = 'assets/scene.gltf';
const NOCHE = 0x20242b;
const CAMS = {
  FPP: {p: [0, 1.1, 3.4], l: [0, 0.98, 0]},
  TPP: {p: [0, 1.3, 5.0], l: [0, 0.95, 0]}
};
const PR = {alta: 2, media: 1.5, baja: 1};

let renderer, scene, camera, holder, model, box, pendingSkin = null,
    camMode = 'FPP', rotY = 0, drag = false, lastX = 0, quality = 'alta';

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

export function setSkin(color) {
  pendingSkin = color;
  if (!model) return;
  const tint = new THREE.Color(color);
  model.traverse(o => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (!m.color) return;
      if (!m.userData.c0) m.userData.c0 = m.color.clone();
      m.color.copy(m.userData.c0);
      if (color !== NOCHE) m.color.lerp(tint, 0.55);
    });
  });
}

export function initScene(el, skinColor, cam, q) {
  box = el;
  renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);

  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffd9b0, 0x1a2238, 0.8));
  const key = new THREE.DirectionalLight(0xffb06a, 2.6); key.position.set(3, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x7aa8ff, 2.2); rim.position.set(-3, 2, -2.5); scene.add(rim);

  holder = new THREE.Group();
  scene.add(holder);

  // sombra suave bajo los pies
  const cv = document.createElement('canvas'); cv.width = cv.height = 128;
  const g = cv.getContext('2d').createRadialGradient(64, 64, 4, 64, 64, 62);
  g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
  const x = cv.getContext('2d'); x.fillStyle = g; x.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6),
    new THREE.MeshBasicMaterial({map: new THREE.CanvasTexture(cv), transparent: true, depthWrite: false}));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.01;
  scene.add(shadow);

  new GLTFLoader().load(MODEL_URL, gltf => {
    model = gltf.scene;
    model.traverse(o => {
      if (o.isMesh) {
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.envMapIntensity = 0.55; });
      }
    });
    // escalar a ~1.8 m y poner los pies en y=0, centrado
    const b = new THREE.Box3().setFromObject(model);
    const size = b.getSize(new THREE.Vector3());
    const s = 1.8 / (size.y || 1);
    model.scale.multiplyScalar(s);
    const b2 = new THREE.Box3().setFromObject(model);
    const c = b2.getCenter(new THREE.Vector3());
    model.position.x -= c.x; model.position.z -= c.z; model.position.y -= b2.min.y;
    holder.add(model);
    if (pendingSkin !== null) setSkin(pendingSkin);
  }, undefined, err => {
    console.error('No se pudo cargar el soldado', err);
    el.insertAdjacentHTML('beforeend',
      '<p style="position:absolute;top:45%;width:100%;text-align:center;color:#fff">No se pudo cargar el soldado (revisa assets/scene.gltf)</p>');
  });

  // girar arrastrando
  const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { drag = true; lastX = e.clientX; cvs.setPointerCapture(e.pointerId); });
  cvs.addEventListener('pointermove', e => { if (drag) { rotY += (e.clientX - lastX) * 0.01; lastX = e.clientX; } });
  const up = () => { drag = false; };
  cvs.addEventListener('pointerup', up); cvs.addEventListener('pointercancel', up);

  addEventListener('resize', resize);
  pendingSkin = skinColor;
  setQuality(q || quality);
  setCam(cam || camMode);

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    if (!drag) rotY *= 0.96; // vuelve poco a poco al frente
    holder.rotation.y = FACE + rotY + Math.sin(t * 0.6) * 0.08;
    renderer.render(scene, camera);
  })();
}
