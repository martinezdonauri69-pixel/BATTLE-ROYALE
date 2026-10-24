import {MAPS,MODES,WEAPONS,SKINS,SHOP,MISSIONS,EVENTS,RANKS,PASS_TIERS,MAILS} from './data.js';
import {initScene,setSkin,setCam,setQuality} from './scene.js';
const KEY='zona-final-lobby-v1';
const DEF={name:'DonauriYT',lvl:12,xp:480,coins:4250,gems:820,map:'caos',mode:'solo',cam:'FPP',weapon:'m4',skin:'noche',owned:['noche'],ownedW:['m4'],done:[],claimed:[],joined:[],clan:'',sens:50,sound:true,quality:'alta'};
let S;try{S={...structuredClone(DEF),...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){S=structuredClone(DEF)}
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const skinColor=id=>(SKINS.find(s=>s.id===id)||SKINS[0]).color;
let cur=null,tm=null;
function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('on'),1800)}
function addXp(n){S.xp+=n;while(S.xp>=1000){S.xp-=1000;S.lvl++;toast('¡Subiste al nivel '+S.lvl+'!')}}

const row=(t,s,r)=>`<div class="row"><div><b>${t}</b><small>${s}</small></div>${r}</div>`;
const btn=(a,v,t,c='')=>`<button class="b ${c}" data-a="${a}" data-v="${v}">${t}</button>`;
const bar=v=>`<div class="bar"><i style="width:${v}%"></i></div>`;
const rank=()=>[...RANKS].reverse().find(r=>S.lvl>=r.min);
const empty=t=>`<p style="opacity:.75">${t}</p>`;

const SCREENS={
 pass:{t:'Pase de batalla',r:()=>PASS_TIERS.map(n=>{const ok=S.lvl>=n+9,cl=S.claimed.includes('p'+n);
  return row('Nivel '+n,'Recompensa: '+n*100+' monedas',cl?'<em>Reclamado</em>':ok?btn('claim','p'+n,'Reclamar','y'):'<em>Requiere nv. '+(n+9)+'</em>')}).join('')},
 shop:{t:'Tienda',r:()=>SHOP.map(i=>{const own=i.type==='skin'?S.owned.includes(i.ref):S.ownedW.includes(i.ref);
  return row(i.name,(i.type==='skin'?'Skin':'Arma')+' · '+i.price+(i.cur==='gems'?' 💎':' 🪙'),own?'<em>Comprado</em>':btn('buy',i.id,'Comprar','y'))}).join('')},
 events:{t:'Eventos',r:()=>EVENTS.map(e=>row(e.n,e.d,btn('join',e.id,S.joined.includes(e.id)?'Salir':'Participar',S.joined.includes(e.id)?'off':''))).join('')},
 missions:{t:'Misiones',r:()=>MISSIONS.map(m=>row(m.text,'+'+m.xp+' XP · +'+m.coins+' monedas',S.done.includes(m.id)?'<em>Completada</em>':btn('mission',m.id,'Completar (demo)'))).join('')},
 clan:{t:'Clan',r:()=>S.clan?row(esc(S.clan),'Eres el único miembro por ahora',btn('leave','','Salir','off')):
  empty('No perteneces a ningún clan.')+row('Crear clan','Máximo 16 caracteres','<input type="text" id="clanin" maxlength="16" placeholder="Nombre">'+btn('clan','','Crear','y'))},
 friends:{t:'Amigos',r:()=>empty('Aún no tienes amigos agregados. Cuando exista el servidor podrás buscarlos aquí.')+btn('invite','','Copiar enlace de invitación','y')},
 mail:{t:'Mensajes',r:()=>MAILS.map(m=>row(m.t,m.d,'')).join('')},
 weapons:{t:'Armas',r:()=>WEAPONS.map(w=>{const own=S.ownedW.includes(w.id);
  return `<div class="row"><div><b>${w.name}</b><small>Daño ${w.dmg} · Cadencia ${w.rate} · Alcance ${w.rng}</small>${bar(w.dmg)}</div>${own?(S.weapon===w.id?'<em>Equipada</em>':btn('weapon',w.id,'Equipar','y')):'<em>Bloqueada: Tienda</em>'}</div>`}).join('')},
 character:{t:'Personaje',r:()=>row('Nombre','Se guarda al salir del campo','<input type="text" data-i="name" maxlength="14" value="'+esc(S.name)+'">')+
  SKINS.map(s=>{const own=S.owned.includes(s.id);return row(s.name,'Cambia el uniforme del soldado en 3D',own?(S.skin===s.id?'<em>Equipado</em>':btn('skin',s.id,'Equipar','y')):'<em>Bloqueado: Tienda</em>')}).join('')},
 inventory:{t:'Inventario',r:()=>S.owned.map(id=>row(SKINS.find(s=>s.id===id).name,'Skin'+(S.skin===id?' · equipada':''),'')).join('')+
  S.ownedW.map(id=>row(WEAPONS.find(w=>w.id===id).name,'Arma'+(S.weapon===id?' · equipada':''),'')).join('')},
 rank:{t:'Rango',r:()=>{const r=rank(),n=RANKS[RANKS.indexOf(r)+1];
  return row(r.n,'Nivel '+S.lvl+(n?' · siguiente: '+n.n+' en nv. '+n.min:' · rango máximo'),'')+(n?bar((S.lvl-r.min)/(n.min-r.min)*100):'')}},
 settings:{t:'Ajustes',r:()=>row('Sensibilidad','Valor: '+S.sens,'<input type="range" min="1" max="100" data-i="sens" value="'+S.sens+'">')+
  row('Sonido','Se usará en la Parte 2',btn('sound','',S.sound?'Activado':'Desactivado',S.sound?'':'off'))+
  row('Calidad gráfica','Afecta al 3D del lobby',['alta','media','baja'].map(q=>btn('quality',q,q,S.quality===q?'y':'off')).join(' '))+
  row('Reiniciar progreso','Borra los datos guardados',btn('reset','','Reiniciar','off'))}
};
function render(){const s=SCREENS[cur];$('#ptitle').textContent=s.t;$('#pbody').innerHTML=s.r()}
function open(k){cur=k;render();$('#panel').hidden=false}
function close(){cur=null;$('#panel').hidden=true}

function act(a,v){
 if(a==='claim'){if(S.claimed.includes(v))return;S.claimed.push(v);const c=+v.slice(1)*100;S.coins+=c;toast('+'+c+' monedas')}
 else if(a==='buy'){const i=SHOP.find(x=>x.id===v);if(S[i.cur]<i.price)return toast('No tienes suficiente');S[i.cur]-=i.price;(i.type==='skin'?S.owned:S.ownedW).push(i.ref);toast('Comprado: '+i.name)}
 else if(a==='skin'){S.skin=v;setSkin(skinColor(v))}
 else if(a==='weapon')S.weapon=v;
 else if(a==='join')S.joined=S.joined.includes(v)?S.joined.filter(x=>x!==v):[...S.joined,v];
 else if(a==='mission'){S.done.push(v);const m=MISSIONS.find(x=>x.id===v);addXp(m.xp);S.coins+=m.coins;toast('+'+m.xp+' XP')}
 else if(a==='clan'){const n=$('#clanin').value.trim();if(!n)return toast('Escribe un nombre');S.clan=n}
 else if(a==='leave')S.clan='';
 else if(a==='invite'){try{navigator.clipboard.writeText(location.href);toast('Enlace copiado')}catch(e){toast('Copia la dirección del navegador')}}
 else if(a==='sound')S.sound=!S.sound;
 else if(a==='quality'){S.quality=v;setQuality(v)}
 else if(a==='reset'){S=structuredClone(DEF);setSkin(skinColor(S.skin));setCam(S.cam);setQuality(S.quality)}
 save();paint();if(cur)render()}

function paint(){
 $('#pname').textContent=S.name;$('#plvl').textContent='Nv. '+S.lvl;$('#xpbar').style.width=S.xp/10+'%';
 $('#coins').textContent=S.coins.toLocaleString('es');$('#gems').textContent=S.gems;$('#av').textContent=S.name.slice(0,2).toUpperCase();
 $$('.map').forEach(b=>b.classList.toggle('sel',b.dataset.map===S.map));
 $$('[data-mode]').forEach(b=>b.classList.toggle('sel',b.dataset.mode===S.mode));
 $$('[data-cam]').forEach(b=>b.classList.toggle('sel',b.dataset.cam===S.cam))}

$('#maps').innerHTML=MAPS.map(m=>`<button class="map" data-map="${m.id}" style="--a:${m.c[0]};--b:${m.c[1]};--c:${m.c[2]}"><span class="mt">${m.name}</span><span class="md">${m.desc}</span></button>`).join('');
$('#modes').innerHTML=MODES.map(m=>`<button data-mode="${m.id}">${m.name}</button>`).join('');
$$('.map').forEach(b=>b.onclick=()=>{S.map=b.dataset.map;save();paint()});
$$('[data-mode]').forEach(b=>b.onclick=()=>{S.mode=b.dataset.mode;save();paint()});
$$('[data-cam]').forEach(b=>b.onclick=()=>{S.cam=b.dataset.cam;setCam(S.cam);save();paint()});
$$('[data-open]').forEach(b=>b.onclick=()=>open(b.dataset.open));
$('#invite').onclick=()=>act('invite');
$('#pclose').onclick=close;
$('#panel').addEventListener('click',e=>{if(e.target.id==='panel')return close();const b=e.target.closest('[data-a]');if(b)act(b.dataset.a,b.dataset.v)});
$('#pbody').addEventListener('input',e=>{if(e.target.dataset.i==='sens'){S.sens=+e.target.value;save()}});
$('#pbody').addEventListener('change',e=>{if(e.target.dataset.i==='name'){S.name=e.target.value.trim()||DEF.name;save();paint()}});
addEventListener('keydown',e=>{if(e.key==='Escape'){close();stop()}});

function stop(){clearInterval(tm);$('#loading').hidden=true}
$('#play').onclick=()=>{
 const m=MAPS.find(x=>x.id===S.map),mo=MODES.find(x=>x.id===S.mode);
 if(!m||!mo)return toast('Elige un mapa y un modo');
 $('#ltitle').textContent=mo.name+' · '+m.name+' · '+S.cam;$('#lbar').style.width='0';$('#lmsg').textContent='Comprobando selección…';
 $('#lnote').hidden=true;$('#lcancel').textContent='Cancelar';$('#loading').hidden=false;
 const steps=[[20,'Comprobando selección…'],[50,'Buscando partida (simulación local)…'],[80,'Preparando el mapa…'],[100,'Listo']];let i=0;
 clearInterval(tm);tm=setInterval(()=>{const[p,t]=steps[i++];$('#lbar').style.width=p+'%';$('#lmsg').textContent=t;
  if(i>=steps.length){clearInterval(tm);$('#lnote').hidden=false;$('#lcancel').textContent='Volver al lobby'}},900)};
$('#lcancel').onclick=stop;

initScene($('#scene'),skinColor(S.skin),S.cam,S.quality);paint();