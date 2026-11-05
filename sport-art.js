/* Sport artwork for the sport tiles: a shaded scene per league (floor, turf, ice, court, ring) with a 3D-rendered ball,
   puck or glove (ball-*.webp, rendered offline from our own models, 2026). SportArt.el(league) -> <svg>. */
(()=>{
let uid=0;
const pennant=(c1,c2)=>`<path d="M44 6h14l-4 5 4 5H44Z" fill="${c1}"/><path d="M44 6v10" stroke="${c2}" stroke-width="1.6"/><circle cx="50" cy="11" r="1.6" fill="${c2}"/>`;
const SCENES={
  wood:['#c98a4b','#8a5427','<path d="M0 22h64M0 38h64M0 54h64M18 0v22M44 22v16M10 38v16M36 54v10" stroke="#5e3514" stroke-width=".8" opacity=".5"/><path d="M-6 64a38 38 0 0 1 76 0" fill="none" stroke="#fff" stroke-width="1.4" opacity=".35"/>'],
  navy:['#1e2c6b','#0c1233','<path d="M0 46h64" stroke="#e8c44a" stroke-width="2" opacity=".7"/><path d="M-6 64a38 38 0 0 1 76 0" fill="none" stroke="#fff" stroke-width="1.4" opacity=".3"/>'],
  plum:['#5b2a7a','#25103a','<path d="M-6 64a38 38 0 0 1 76 0" fill="none" stroke="#ff9be9" stroke-width="1.4" opacity=".45"/>'],
  turf:['#2f8f3a','#145a1f','<path d="M0 12h64M0 28h64M0 44h64M0 60h64" stroke="#fff" stroke-width=".8" opacity=".35"/><path d="M0 0h64v8H0Zm0 16h64v8H0Zm0 16h64v8H0Zm0 16h64v8H0Z" fill="#000" opacity=".08"/>'],
  college:['#7a1f2b','#2f0a10','<path d="M0 46h64M0 30h64" stroke="#fff" stroke-width=".8" opacity=".3"/>'],
  ice:['#eef6fb','#b9d4e6','<path d="M0 40h64" stroke="#2b5fc4" stroke-width="2.4" opacity=".6"/><path d="M6 12l20 6M40 50l18-4M14 54l10-3M44 10l12 5" stroke="#8fb3cc" stroke-width=".6"/>'],
  diamond:['#2f7d3a','#16481e','<path d="M32 30 62 60H2Z" fill="#b5713d" opacity=".9"/><path d="M32 30 62 60H2Z" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/>'],
  hard:['#2a6bc4','#123c78','<path d="M6 0v64M58 0v64M0 50h64" stroke="#fff" stroke-width="1.2" opacity=".6"/>'],
  clay:['#d2693a','#8e3a17','<path d="M6 0v64M58 0v64M0 50h64" stroke="#fff" stroke-width="1.2" opacity=".75"/>'],
  ring:['#5c0f17','#22060a','<path d="M0 16h64M0 26h64M0 36h64" stroke="#e8e2d6" stroke-width="1.6" opacity=".55"/><path d="M0 16h64" stroke="#d0151f" stroke-width="1.6"/>'],
  cage:['#2a2a33','#0c0c10','<path d="M0 0l64 64M16 0l48 48M32 0l32 32M0 16l48 48M0 32l32 32M64 0 0 64M48 0 0 48M32 0 0 32M64 16 16 64M64 32 32 64" stroke="#8a8a99" stroke-width=".5" opacity=".45"/>'],
  pitch:['#2f8f3a','#155c20','<circle cx="32" cy="64" r="16" fill="none" stroke="#fff" stroke-width="1" opacity=".5"/><path d="M0 0h64v10H0Zm0 20h64v10H0Zm0 20h64v10H0Z" fill="#000" opacity=".07"/>']};
// 3D renders (ray-marched offline, ball-*.webp next to this file) on a shaded scene per league
const ball=(img,y=0)=>()=>`<ellipse cx="32" cy="52" rx="19" ry="4" fill="#000" opacity=".5"/><image href="ball-${img}.webp" x="-5" y="${-7+y}" width="74" height="74"/>`;
const LEAGUE={NBA:['wood',ball('basketball')],WNBA:['plum',ball('basketball2')],NCAAB:['navy',ball('basketball'),pennant('#e8c44a','#1e2c6b')],
  NFL:['turf',ball('football')],NCAAF:['college',ball('football_ncaa'),pennant('#f6efe6','#7a1f2b')],NHL:['ice',ball('puck',4)],MLB:['diamond',ball('baseball')],
  ATP:['hard',ball('tennis')],WTA:['clay',ball('tennis')],BOXING:['ring',ball('glove')],UFC:['cage',ball('glove_mma')],MMA:['cage',ball('glove_mma')]};
function el(league,label){
  const id='sa'+(++uid);const L=LEAGUE[league]||['pitch',ball('soccer')];const sc=SCENES[L[0]];
  const s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 64 64');s.setAttribute('class','sport-art');
  if(label){s.setAttribute('role','img');s.setAttribute('aria-label',label);}else s.setAttribute('aria-hidden','true');
  s.innerHTML=`<defs><linearGradient id="${id}bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${sc[0]}"/><stop offset="1" stop-color="${sc[1]}"/></linearGradient>
   <radialGradient id="${id}v" cx=".5" cy=".45" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
   <clipPath id="${id}r"><rect width="64" height="64" rx="15"/></clipPath></defs>
   <g clip-path="url(#${id}r)"><rect width="64" height="64" fill="url(#${id}bg)"/>${sc[2]}<rect width="64" height="64" fill="url(#${id}v)"/>${L[1](id)}${L[2]||''}</g>
   <rect x=".5" y=".5" width="63" height="63" rx="14.5" fill="none" stroke="#fff" stroke-opacity=".18"/>`;
  return s;
}
window.SportArt={el,leagues:Object.keys(LEAGUE)};
})();
