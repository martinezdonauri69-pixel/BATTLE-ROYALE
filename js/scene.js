import * as THREE from 'three';
const scene=new THREE.Scene();
let R,cam,soldier,rotor,head;
let goal=4.6,dist=4.6,zoom=1,k=1,yaw=-.25,drag=null;const cloth=[];
const M=(c,o={})=>new THREE.MeshStandardMaterial({color:c,roughness:.85,metalness:.1,flatShading:true,...o});
const box=(w,h,d,m,x,y,z,p)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);(p||scene).add(o);return o};

function buildSoldier(color){
 const g=new THREE.Group(),cl=M(color),dk=M(0x15181c),sk=M(0xc99a76),bl=M(0x0b0c0e),gm=M(0x1a1c20);cloth.push(cl);
 [-1,1].forEach(s=>{box(.28,.85,.3,cl,s*.18,.6,0,g);box(.3,.16,.4,bl,s*.18,.08,.04,g);box(.3,.2,.32,dk,s*.18,.62,.03,g)});
 box(.62,.25,.34,cl,0,1.12,0,g);box(.68,.62,.4,cl,0,1.55,0,g);box(.74,.55,.46,dk,0,1.55,0,g);
 [-.2,0,.2].forEach(x=>box(.16,.2,.1,gm,x,1.42,.27,g));
 box(.14,.12,.14,sk,0,1.92,0,g);
 head=new THREE.Group();head.position.y=2.08;g.add(head);
 head.add(new THREE.Mesh(new THREE.SphereGeometry(.2,14,10),sk));
 const hm=new THREE.Mesh(new THREE.SphereGeometry(.26,16,10,0,Math.PI*2,0,Math.PI/1.9),dk);hm.position.y=.02;head.add(hm);
 box(.36,.1,.12,M(0xffa21a,{emissive:0xff8a00,emissiveIntensity:.6}),0,.02,.2,head);
 box(.32,.16,.2,bl,0,-.1,.12,head);
 [-1,1].forEach(s=>{
  const a=box(.17,.45,.2,cl,s*.46,1.5,.1,g);a.rotation.set(-.7,0,-s*.15);
  const f=box(.15,.4,.17,cl,s*.34,1.28,.4,g);f.rotation.set(-1.25,s*.3,0);
  box(.17,.15,.17,bl,s*.28,1.18,.62,g)});
 const r=new THREE.Group();r.position.set(0,1.3,.55);r.rotation.set(.05,.12,0);g.add(r);
 box(.1,.16,.85,gm,0,0,0,r);box(.04,.04,.6,bl,0,.02,.7,r);box(.09,.28,.12,bl,0,-.2,.1,r);
 box(.09,.14,.3,gm,0,-.03,-.55,r);box(.06,.07,.18,bl,0,.13,0,r);
 return g}

function buildWorld(){
 const cv=document.createElement('canvas');cv.width=4;cv.height=256;const x=cv.getContext('2d'),gr=x.createLinearGradient(0,0,0,256);
 [[0,'#162447'],[.25,'#4a4a85'],[.38,'#b8657a'],[.46,'#ffa65a'],[.52,'#ffd98a'],[1,'#ffd98a']].forEach(([o,c])=>gr.addColorStop(o,c));
 x.fillStyle=gr;x.fillRect(0,0,4,256);
 const t=new THREE.CanvasTexture(cv);t.colorSpace=THREE.SRGBColorSpace;scene.background=t;scene.fog=new THREE.Fog(0xd9935f,22,100);
 scene.add(new THREE.HemisphereLight(0xffd2a8,0x1b2030,.9));
 const sun=new THREE.DirectionalLight(0xffb070,3);sun.position.set(-10,6,-30);scene.add(sun);
 const fill=new THREE.DirectionalLight(0x7f9bff,1.3);fill.position.set(4,4,8);scene.add(fill);
 const gp=new THREE.Mesh(new THREE.PlaneGeometry(300,300),M(0x23262b,{roughness:1,flatShading:false}));gp.rotation.x=-Math.PI/2;scene.add(gp);
 box(.15,.02,60,M(0xd9a400),0,.01,-20);box(.15,.02,60,M(0xd9a400),-3,.01,-20);
 const sd=new THREE.Mesh(new THREE.CircleGeometry(6,32),new THREE.MeshBasicMaterial({color:0xffe2a0,fog:false}));sd.position.set(-10,6,-85);scene.add(sd);
 for(let i=0;i<12;i++){const r=10+(i*7)%6,h=8+(i*5)%9,m=new THREE.Mesh(new THREE.ConeGeometry(r,h,5),M(0x3b3556));m.position.set(-70+i*13,h/2-.5,-70-(i%3)*8);scene.add(m)}
 const cm=M(0x4d5637),cm2=M(0x3d4529);
 [[-6,0,-3,1.1,.3],[-4.6,0,-3.6,1,-.2],[-5.4,.9,-3.3,.9,.1],[-7.5,0,-6,1.2,.5],[6,0,-2,1,-.4],[7.4,0,-3,1.1,.2],[6.6,.95,-2.4,.9,.6],[-3.5,0,-9,1.3,0]]
  .forEach(([a,b,c,s,r],i)=>{const o=box(s*1.5,s*.9,s,i%2?cm:cm2,a,b+s*.45,c);o.rotation.y=r});
 const st=M(0x3a3f44);
 [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(([a,b])=>box(.3,8,.3,st,-9+a*1.2,4,-12+b*1.2));
 box(3.4,.3,3.4,st,-9,8,-12);box(2.6,1.6,2.6,M(0x2f353b),-9,9,-12);box(3.6,.25,3.6,st,-9,10,-12);
 const hc=new THREE.Group();hc.position.set(9,0,-8);hc.rotation.y=-.7;scene.add(hc);
 const hb=M(0x2d3338),body=new THREE.Mesh(new THREE.CapsuleGeometry(.9,2.6,6,12),hb);body.rotation.z=Math.PI/2;body.position.y=1.9;hc.add(body);
 box(3.8,.3,.3,hb,-3.4,2.1,0,hc);box(.2,1.1,.8,hb,-5.2,2.5,0,hc);
 box(1.3,.7,1.55,M(0x1f3a55,{emissive:0x112233}),1,2.25,0,hc);
 box(.2,.6,.2,hb,0,3.1,0,hc);
 const bk=M(0x111316);
 rotor=new THREE.Group();rotor.position.y=3.45;hc.add(rotor);box(8,.04,.3,bk,0,0,0,rotor);box(.3,.04,8,bk,0,0,0,rotor);
 [-.8,.8].forEach(z=>{box(3.4,.08,.1,hb,0,.35,z,hc);box(.08,.8,.08,hb,-.9,.8,z,hc);box(.08,.8,.08,hb,.9,.8,z,hc)})}

function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);cam.aspect=w/h;cam.updateProjectionMatrix();k=w/h<1?1.8:1}
export function setCam(mode){goal=mode==='TPP'?6:4.4}
export function setSkin(c){cloth.forEach(m=>m.color.setHex(c))}
export function setQuality(q){R.setPixelRatio(q==='alta'?Math.min(devicePixelRatio,2):q==='media'?1:.7);resize()}
export function initScene(canvas,color,mode,quality){
 R=new THREE.WebGLRenderer({canvas,antialias:true});
 cam=new THREE.PerspectiveCamera(38,1,.1,300);buildWorld();
 soldier=buildSoldier(color);soldier.rotation.y=yaw;scene.add(soldier);
 setCam(mode);dist=goal;setQuality(quality);
 addEventListener('resize',resize);
 addEventListener('pointerdown',e=>{if(e.target===canvas)drag=e.clientX});
 addEventListener('pointermove',e=>{if(drag!=null){yaw+=(e.clientX-drag)*.01;drag=e.clientX}});
 addEventListener('pointerup',()=>drag=null);addEventListener('pointercancel',()=>drag=null);
 addEventListener('wheel',e=>{if(e.target===canvas)zoom=Math.max(.6,Math.min(1.6,zoom+e.deltaY*.001))},{passive:true});
 let last=performance.now();
 (function loop(n){requestAnimationFrame(loop);const dt=Math.min(.05,(n-last)/1000);last=n;
  soldier.rotation.y+=(yaw-soldier.rotation.y)*.15;soldier.scale.y=1+Math.sin(n/600)*.004;
  rotor.rotation.y+=dt*6;dist+=(goal*k*zoom-dist)*.08;
  cam.position.set(0,1.5,dist);cam.lookAt(0,1.2,0);R.render(scene,cam)})(last)}