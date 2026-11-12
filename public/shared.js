const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const iso=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fd=t=>new Date(t).toLocaleDateString('en-KE');
const km=(a,b,c,d)=>{const r=x=>x*Math.PI/180,h=Math.sin(r(c-a)/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(r(d-b)/2)**2;return 12742*Math.asin(Math.sqrt(h))};
// font name -> 1 if shown UPPERCASE
const FONTS={'Anton':1,'Bebas Neue':1,'Bungee':1,'Righteous':1,'Pacifico':0,'Playfair Display':0,'Permanent Marker':0};
const STYLES={classic:'Classic block',neon:'Neon glow',ticket:'Ticket stub',sunburst:'Sunburst rays',gradient:'Gradient',spot:'Spotlight',frame:'Framed'};
const THEME={'t-green':['#39ff14','#000000','#000000'],'t-yellow':['#ffe600','#000000','#000000'],'t-black':['#000000','#f4f4ef','#39ff14']};
// [name, background, text, accent(bubble+button)]
const PRESETS=[['Neon Green','#39ff14','#000000','#000000'],['Sunshine','#ffe600','#000000','#000000'],['Midnight','#000000','#f4f4ef','#39ff14'],['Royal Purple','#5b21b6','#ffffff','#ffe600'],
['Ocean Blue','#0b3d91','#ffffff','#00e5ff'],['Hot Pink','#ff2e93','#ffffff','#000000'],['Sunset','#ff6a00','#000000','#ffe600'],['Pure White','#ffffff','#000000','#111111'],
['Crimson','#b3122e','#ffffff','#ffe600'],['Teal','#00c2b8','#001a18','#ffffff'],['Gold','#d4a017','#1a1200','#000000'],['Deep Forest','#06281a','#e8ffe8','#39ff14']];
const fmtT=t=>{if(!t)return'';const[h,m]=t.split(':');return((+h+11)%12+1)+':'+m+(+h<12?' AM':' PM')};
const fmtD=d=>new Date(d+'T00:00:00').toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'});
// One poster for everything: news stories AND gig/event "tickets"
function posterHTML(p,full){
 const th=THEME[p.theme]||[],bg=p.bg||th[0]||'#39ff14',fg=p.fg||th[1]||'#000000',ac=p.ac||th[2]||'#000000',f=FONTS[p.font]===undefined?'Anton':p.font,ev=p.type&&p.type!=='news';
 const kick=ev?(p.type=='gig'?'🎤 Gig':'📅 Event')+(p.act?' · '+(p.act=='band'?'Band':'Solo'):''):(p.kick||'News');
 return `<article class="poster ps-${esc(p.ps||'classic')}" style="--bg:${esc(bg)};--fg:${esc(fg)};--ac:${esc(ac)};--hf:'${esc(f)}';--tc:${FONTS[f]?'uppercase':'none'}" ${full?'':`data-open="${esc(p.id)}" tabindex="0" role="button" aria-label="Open ${esc(p.title)}"`}>
<span class="kick">${esc(kick)}</span>${ev?`<span class="bubble">${esc(p.price||'Free')}</span>`:''}${p.image?`<img class="pimg" src="${esc(p.image)}" alt="">`:''}<h3>${esc(p.title)}</h3>
${ev?`<div class="pinfo">${p.artist?`<b class="pact">${esc(p.artist)}</b>`:''}<span>📅 ${p.date?fmtD(p.date):''}${p.time?' · '+fmtT(p.time):''}</span><span>📍 ${esc(p.venue)}${p.town?', '+esc(p.town):''}${p.dist!=null?' · '+Math.round(p.dist)+' km':''}</span></div>${p.ticketUrl?`<a class="buy" href="${esc(p.ticketUrl)}" target="_blank" rel="noopener">🎟️ Get tickets</a>`:''}`
:`<ul>${(p.pts||[]).filter(Boolean).map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`}
<footer><span>${ev?(full?'':'Read more →'):`By ${esc(p.author)}<br>${fd(p.created)}`}</span><span class="mark">McWaSa Updates</span></footer></article>`}
