import * as THREE from 'three';
import { crearSoldado } from './crearSoldado.js';

const escena = new THREE.Scene();
escena.background = new THREE.Color(0x202630);

const camara = new THREE.PerspectiveCamera(
    50,
    window.innerWidth / window.innerHeight,
    0.1,
    100
);

camara.position.set(2.5, 1.8, 3.8);
camara.lookAt(0, 0.9, 0);

const renderizador = new THREE.WebGLRenderer({
    antialias: true
});

renderizador.setSize(window.innerWidth, window.innerHeight);
renderizador.shadowMap.enabled = true;
renderizador.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderizador.domElement);

escena.add(new THREE.HemisphereLight(0xffffff, 0x343b30, 2));

const luz = new THREE.DirectionalLight(0xffffff, 3);
luz.position.set(3, 5, 4);
luz.castShadow = true;
escena.add(luz);

const suelo = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x42483f })
);

suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
escena.add(suelo);

const soldado = crearSoldado();
escena.add(soldado);

function animar() {
    requestAnimationFrame(animar);
    renderizador.render(escena, camara);
}

animar();