export const MAPS=[
 {id:'caos',name:'Isla del Caos',desc:'Costas, ruinas y una base militar. Hasta 100 jugadores.',c:['#2a7fb8','#0b2d4a','#f0a84a']},
 {id:'ceniza',name:'Valle Ceniza',desc:'Dunas abiertas y cañones para combate a larga distancia.',c:['#b8742a','#3a1d0b','#f5c46a']},
 {id:'helado',name:'Pico Helado',desc:'Montaña nevada con refugios y mucha niebla.',c:['#6aa0c8','#17304a','#dfeaf5']}];
export const MODES=[{id:'solo',name:'Individual',size:1},{id:'duo',name:'Dúo',size:2},{id:'squad',name:'Escuadrón',size:4}];
export const WEAPONS=[
 {id:'m4',name:'M4 Táctico',dmg:55,rate:70,rng:60},
 {id:'ak',name:'AK-47',dmg:70,rate:55,rng:55},
 {id:'sniper',name:'Francotirador',dmg:95,rate:20,rng:95}];
export const SKINS=[
 {id:'noche',name:'Camuflaje noche',color:0x20242b},
 {id:'bosque',name:'Bosque',color:0x3b4a2c},
 {id:'desierto',name:'Desierto',color:0x8a7650}];
export const SHOP=[
 {id:'s1',name:'Skin Bosque',type:'skin',ref:'bosque',price:400,cur:'coins'},
 {id:'s2',name:'Skin Desierto',type:'skin',ref:'desierto',price:600,cur:'coins'},
 {id:'s3',name:'AK-47',type:'weapon',ref:'ak',price:900,cur:'coins'},
 {id:'s4',name:'Francotirador',type:'weapon',ref:'sniper',price:60,cur:'gems'}];
export const MISSIONS=[
 {id:'m1',text:'Elimina a 5 enemigos',xp:200,coins:150},
 {id:'m2',text:'Sobrevive 10 minutos',xp:150,coins:100},
 {id:'m3',text:'Recoge 10 objetos',xp:100,coins:80}];
export const EVENTS=[
 {id:'e1',n:'Fin de semana de doble XP',d:'Gana el doble de experiencia.'},
 {id:'e2',n:'Torneo de escuadrones',d:'Inscripción abierta (demostración).'}];
export const RANKS=[{n:'Bronce',min:1},{n:'Plata',min:10},{n:'Oro',min:20},{n:'Platino',min:30},{n:'Diamante',min:40}];
export const PASS_TIERS=[1,2,3,4,5,6,7,8,9,10];
export const MAILS=[{t:'Bienvenido a Zona Final',d:'Este es el lobby. Armas, disparos y multijugador llegan en las siguientes partes.'}];