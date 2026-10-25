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

let renderer, scene, camera, holder, model, box, status, pendingSkin = null,
    camMode = 'FPP', rotY = 0, drag = false, last = 0, quality = 'alta';

function say(t) {
  if (!status) return;
  status.textContent = t;
  status.style.display = t ? 'block' : 'none';
}

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

const wait = ms => new Promise(r => setTimeout(r, ms));
const limit = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('tardó demasiado')), ms))]);

// textura mínima de relleno si alguna no se puede reducir
function tiny(name) {
  const c = document.createElement('canvas');
  c.width = c.height = 4;
  const x = c.getContext('2d');
  x.fillStyle = /normal/i.test(name) ? 'rgb(128,128,255)' : /metallic/i.test(name) ? 'rgb(0,170,0)' : 'rgb(90,90,90)';
  x.fillRect(0, 0, 4, 4);
  return c.toDataURL('image/png');
}

// Descarga cada textura, la reduce y la entrega ya liviana al cargador
async function shrinkTextures(mgr) {
  const map = {};
  try {
    const base = MODEL_URL.slice(0, MODEL_URL.lastIndexOf('/') + 1);
    const json = await (await fetch(MODEL_URL)).json();
    const imgs = json.images || [];
    for (let i = 0; i < imgs.length; i++) {
      const uri = imgs[i].uri;
      if (!uri || uri.startsWith('data:')) continue;
      const name = decodeURIComponent(uri.split('/').pop());
      say('Optimizando ' + (i + 1) + ' de ' + imgs.length + ': ' + name);
      await wait(40);
      try {
        const blob = await limit(fetch(base + uri).then(r => r.blob()), 20000);
        const full = await limit(createImageBitmap(blob), 20000);
        const max = /baseColor/i.test(name) ? 1024 : 512;
        const k = Math.min(1, max / Math.max(full.width, full.height));
        const cvs = document.createElement('canvas');
        cvs.width = Math.max(1, Math.round(full.width * k));
        cvs.height = Math.max(1, Math.round(full.height * k));
        cvs.getContext('2d').drawImage(full, 0, 0, cvs.width, cvs.height);
        full.close();
        const small = await limit(new Promise(r => cvs.toBlob(r, 'image/jpeg', 0.9)), 20000);
        cvs.width = cvs.height = 0;
        map[name] = small ? URL.createObjectURL(small) : tiny(name);
      } catch (e) {
        console.error('Textura no reducida', name, e);
        map[name] = tiny(name);
      }
    }
  } catch (e) {
    console.error('No se pudieron reducir las texturas', e);
  }
  mgr.setURLModifier(url => map[decodeURIComponent(url.split('/').pop())] || url);
  say('Armando el soldado…');
  await wait(60);
}

function placeModel(gltf) {
  try {
    model = gltf.scene;
    model.traverse(o => {
      if (o.isMesh) {
        o.frustumCulled = false;
        (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { m.envMapIntensity = 0.55; });
      }
    });
    const b = new THREE.Box3().setFromObject(model);
    const size = b.getSize(new THREE.Vector3());
    const h = size.y > 0 && isFinite(size.y) ? size.y : 1;
    model.scale.multiplyScalar(1.8 / h);
    const b2 = new THREE.Box3().setFromObject(model);
    const c = b2.getCenter(new THREE.Vector3());
    model.position.x -= c.x;
    model.position.z -= c.z;
    model.position.y -= b2.min.y;
    holder.add(model);
    if (pendingSkin !== null) setSkin(pendingSkin);
    say('');
  } catch (e) {
    console.error(e);
    say('Error al colocar el soldado: ' + e.message);
  }
}

export function initScene(el, skinColor, cam, q) {
  box = el;
  status = document.createElement('div');
  status.style.cssText = 'position:absolute;left:50%;top:45%;transform:translateX(-50%);z-index:2;background:rgba(0,0,0,.7);color:#fff;padding:8px 14px;font:600 18px sans-serif;text-align:center;border-radius:6px;max-width:80%';
  el.appendChild(status);
  say('Preparando…');

  try {
    renderer = new THREE.WebGLRenderer({antialias: true, alpha: true});
  } catch (e) {
    say('Tu navegador no pudo iniciar el 3D');
    return;
  }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  el.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;

  scene.add(new THREE.HemisphereLight(0xffd9b0, 0x1a2238, 0.8));
  const key = new THREE.DirectionalLight(0xffb06a, 2.6);
  key.position.set(3, 3, 3);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0x7aa8ff, 2.2);
  rim.position.set(-3, 2, -2.5);
  scene.add(rim);

  holder = new THREE.Group();
  scene.add(holder);

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

  // cargador: primero achica las texturas (si no, el celular se queda sin memoria)
  const mgr = new THREE.LoadingManager();
  mgr.onProgress = (url, n, t) => say('Cargando ' + n + ' de ' + t + ': ' + url.split('/').pop());
  mgr.onError = url => say('FALTA O FALLÓ: ' + url.split('/').pop());

  (async () => {
    await shrinkTextures(mgr);
    new GLTFLoader(mgr).load(
      MODEL_URL,
      placeModel,
      undefined,
      err => {
        console.error('No se pudo cargar el soldado', err);
        say('No se pudo cargar assets/scene.gltf');
      }
    );
  })();

  const pos = e => (matchMedia('(orientation:portrait)').matches ? e.clientY : e.clientX);
  const cvs = renderer.domElement;
  cvs.addEventListener('pointerdown', e => { drag = true; last = pos(e); cvs.setPointerCapture(e.pointerId); });
  cvs.addEventListener('pointermove', e => { if (drag) { rotY += (pos(e) - last) * 0.01; last = pos(e); } });
  const up = () => { drag = false; };
  cvs.addEventListener('pointerup', up);
  cvs.addEventListener('pointercancel', up);

  addEventListener('resize', resize);
  pendingSkin = skinColor;
  setQuality(q || quality);
  setCam(cam || camMode);

  const clock = new THREE.Clock();
  (function loop() {
    requestAnimationFrame(loop);
    const t = clock.getElapsedTime();
    if (!drag) rotY *= 0.96;
    holder.rotation.y = FACE + rotY + Math.sin(t * 0.6) * 0.08;
    renderer.render(scene, camera);
  })();
}