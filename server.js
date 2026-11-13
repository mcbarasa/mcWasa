try{require('fs').readFileSync(require('path').join(__dirname,'.env'),'utf8').split(/\r?\n/).forEach(l=>{const m=l.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);if(m&&!(m[1] in process.env))process.env[m[1]]=m[2].replace(/^["']|["']$/g,'')})}catch{}
const express=require('express'),multer=require('multer'),crypto=require('crypto'),fs=require('fs'),path=require('path');
const TOWNS=require('./public/towns.js');
const DATA=process.env.DATA_DIR||path.join(__dirname,'data'),UP=path.join(DATA,'uploads'),DB=path.join(DATA,'db.json');
// Storage: Postgres when DATABASE_URL is set (free-tier friendly), otherwise files in DATA_DIR (needs a persistent disk on Render)
const PG=process.env.DATABASE_URL?new (require('pg').Pool)({connectionString:process.env.DATABASE_URL,ssl:/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)?false:{rejectUnauthorized:false},max:4}):null;
if(!PG)fs.mkdirSync(UP,{recursive:true});
let db={items:[],users:[]},pending=Promise.resolve();const clients=new Set();
const save=()=>{const j=JSON.stringify(db,null,1);
 if(PG)pending=pending.then(()=>PG.query("INSERT INTO kv(k,v) VALUES('db',$1::jsonb) ON CONFLICT(k) DO UPDATE SET v=EXCLUDED.v",[j])).catch(e=>console.error('DB save failed:',e.message));
 else fs.writeFileSync(DB,j);
 for(const c of clients)c.write('data: '+Date.now()+'\n\n');};
const hash=(p,s=crypto.randomBytes(8).toString('hex'))=>s+':'+crypto.scryptSync(p,s,32).toString('hex');
const AU=String(process.env.ADMIN_USERNAME||process.env.ADMIN_EMAIL||'admin').trim().toLowerCase();
const SECRET=process.env.SECRET||process.env.JWT_SECRET||crypto.randomBytes(16).toString('hex');
const sign=s=>crypto.createHmac('sha256',SECRET).update(s).digest('hex');
function auth(req,res,next){const m=(req.headers.cookie||'').match(/tk=([^;]+)/);
 if(m){const [id,exp,sig]=m[1].split('.');if(sig===sign(id+'.'+exp)&&+exp>Date.now())req.user=db.users.find(u=>u.id===id);}
 if(!req.user)return res.status(401).json({error:'Please log in'});next();}
const admin=(q,r,n)=>q.user.role==='admin'?n():r.status(403).json({error:'Admins only'});
const EXT={'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp','image/gif':'.gif'};
const up=multer({storage:PG?multer.memoryStorage():multer.diskStorage({destination:UP,filename:(q,f,cb)=>cb(null,crypto.randomBytes(8).toString('hex')+EXT[f.mimetype])}),
 limits:{fileSize:PG?4e6:6e6},fileFilter:(q,f,cb)=>cb(null,!!EXT[f.mimetype])});
const store=async(q,r,n)=>{if(PG&&q.file){q.file.filename=crypto.randomBytes(8).toString('hex')+EXT[q.file.mimetype];
 try{await PG.query('INSERT INTO images(name,mime,data) VALUES($1,$2,$3)',[q.file.filename,q.file.mimetype,q.file.buffer])}catch(e){return r.status(500).json({error:'Could not save the image'})}}n()};
const rm=img=>{if(!img)return;const n=path.basename(img);if(PG)PG.query('DELETE FROM images WHERE name=$1',[n]).catch(()=>{});else fs.unlink(path.join(UP,n),()=>{})};
const cut=(s,n)=>String(s||'').trim().slice(0,n);
const hex=(s,d)=>/^#[0-9a-f]{6}$/i.test(String(s))?String(s).toLowerCase():d;
const FONTS=['Anton','Bebas Neue','Bungee','Righteous','Pacifico','Playfair Display','Permanent Marker'],PSS=['classic','neon','ticket','sunburst','gradient','spot','frame'];
const url=s=>{s=cut(s,500);if(s&&!/^https?:\/\//i.test(s))s='https://'+s;return /^https?:\/\/[^\s\/]+\.[^\s]+$/i.test(s)?s:''};
function build(b,f,old={}){const type=['news','event','gig'].includes(b.type)?b.type:'news',ev=type!=='news',t=TOWNS[b.town];
 return{...old,type,title:cut(b.title,90),kick:cut(b.kick,30)||'News',pts:[b.p1,b.p2,b.p3].map(s=>cut(s,80)).filter(Boolean),body:String(b.body||'').slice(0,8000),
 bg:hex(b.bg,'#39ff14'),fg:hex(b.fg,'#000000'),ac:hex(b.ac,'#000000'),font:FONTS.includes(b.font)?b.font:'Anton',ps:PSS.includes(b.ps)?b.ps:'classic',
 artist:ev?cut(b.artist,80):'',act:ev&&['solo','band'].includes(b.act)?b.act:'',venue:ev?cut(b.venue,80):'',town:ev&&t?b.town:'',date:ev?cut(b.date,10):'',time:ev?cut(b.time,5):'',
 price:ev?cut(b.price,40):'',ticketUrl:ev?url(b.ticketUrl):'',lat:ev&&t?t[0]:null,lng:ev&&t?t[1]:null,image:f?'/uploads/'+f.filename:old.image||''};}
const bad=it=>!it.title?'Headline/title is required':it.type!=='news'&&(!it.date||!it.venue)?'Events need a date and a venue':'';
const app=express();app.set('trust proxy',1);app.disable('x-powered-by');
app.use((q,r,n)=>{r.setHeader('X-Content-Type-Options','nosniff');r.setHeader('Referrer-Policy','strict-origin-when-cross-origin');n()});
app.use(express.json());
app.get('/healthz',(q,r)=>r.send('ok'));
app.get(['/','/index.html'],(q,r)=>{const site=(process.env.SITE_URL||q.protocol+'://'+q.get('host')).replace(/\/$/,'');
 r.type('html').send(fs.readFileSync(path.join(__dirname,'public','index.html'),'utf8').replace(/\{\{SITE\}\}/g,site))});
if(PG)app.get('/uploads/:name',async(q,r)=>{try{const x=await PG.query('SELECT mime,data FROM images WHERE name=$1',[q.params.name]);if(!x.rows[0])return r.sendStatus(404);
 r.set({'Content-Type':x.rows[0].mime,'Cache-Control':'public, max-age=604800, immutable'}).send(x.rows[0].data)}catch{r.sendStatus(500)}});
else app.use('/uploads',express.static(UP,{maxAge:'7d'}));
app.use(express.static(path.join(__dirname,'public')));
// live updates: browsers listen here and re-fetch when anything changes
app.get('/api/stream',(q,r)=>{r.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache, no-transform',Connection:'keep-alive','X-Accel-Buffering':'no'});
 r.write('retry: 3000\n\n');clients.add(r);q.on('close',()=>clients.delete(r))});
setInterval(()=>{for(const c of clients)c.write(': ping\n\n')},25000);
const tries=new Map();
const limited=ip=>{const n=Date.now(),a=(tries.get(ip)||[]).filter(t=>n-t<9e5);tries.set(ip,a);return a.length>=10};
app.post('/api/login',(q,r)=>{if(limited(q.ip))return r.status(429).json({error:'Too many attempts. Try again in 15 minutes.'});
 const n=String(q.body.username||'').trim().toLowerCase(),u=db.users.find(u=>u.username===n);
 if(!u||hash(q.body.password||'',u.pass.split(':')[0])!==u.pass){tries.get(q.ip).push(Date.now());return r.status(401).json({error:'Wrong username or password'});}
 const b=u.id+'.'+(Date.now()+6048e5);r.setHeader('Set-Cookie',`tk=${b}.${sign(b)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=604800${q.secure?'; Secure':''}`);r.json({ok:1});});
app.post('/api/logout',(q,r)=>{r.setHeader('Set-Cookie','tk=; Path=/; Max-Age=0');r.json({ok:1});});
app.get('/api/me',auth,(q,r)=>r.json({id:q.user.id,username:q.user.username,role:q.user.role}));
app.get('/api/items',(q,r)=>{r.set('Cache-Control','no-store');r.json(db.items)});
app.get('/api/storage',auth,admin,(q,r)=>{let p=false;try{p=!!process.env.DATA_DIR&&fs.statSync(DATA).dev!==fs.statSync('/').dev}catch{}
 r.json({mode:PG?'postgres':'disk',persistent:PG?true:p,onRender:!!process.env.RENDER,items:db.items.length})});
app.post('/api/items',auth,up.single('image'),store,(q,r)=>{const it=build(q.body,q.file),e=bad(it);
 if(e){if(q.file)rm('/'+q.file.filename);return r.status(400).json({error:e});}
 Object.assign(it,{id:crypto.randomBytes(4).toString('hex'),author:q.user.username,authorId:q.user.id,created:Date.now()});
 db.items.unshift(it);save();r.json(it);});
const can=(q,i)=>i&&(q.user.role==='admin'||i.authorId===q.user.id);
app.put('/api/items/:id',auth,up.single('image'),store,(q,r)=>{const i=db.items.find(x=>x.id===q.params.id);
 if(!can(q,i)){if(q.file)rm('/'+q.file.filename);return r.status(403).json({error:'Not allowed'});}
 const n=build(q.body,q.file,i),e=bad(n);if(e){if(q.file)rm('/'+q.file.filename);return r.status(400).json({error:e});}
 if(q.file)rm(i.image);Object.assign(i,n);save();r.json(i);});
app.delete('/api/items/:id',auth,(q,r)=>{const i=db.items.find(x=>x.id===q.params.id);if(!can(q,i))return r.status(403).json({error:'Not allowed'});
 rm(i.image);db.items=db.items.filter(x=>x!==i);save();r.json({ok:1});});
app.get('/api/users',auth,admin,(q,r)=>r.json(db.users.map(({id,username,role})=>({id,username,role}))));
app.post('/api/users',auth,admin,(q,r)=>{const un=String(q.body.username||'').trim().toLowerCase();
 if(!un||(q.body.password||'').length<6||db.users.some(u=>u.username===un))return r.status(400).json({error:'Need a unique username and a password of 6+ characters'});
 db.users.push({id:crypto.randomBytes(4).toString('hex'),username:un,role:'writer',pass:hash(q.body.password)});save();r.json({ok:1});});
app.delete('/api/users/:id',auth,admin,(q,r)=>{db.users=db.users.filter(u=>u.id!==q.params.id||u.role==='admin');save();r.json({ok:1});});
app.get('/api/export',auth,admin,(q,r)=>{r.setHeader('Content-Disposition','attachment; filename=mcwasa-backup.json');r.json({items:db.items,users:db.users.map(({id,username,role})=>({id,username,role}))});});
app.use((q,r)=>q.path.startsWith('/api/')?r.status(404).json({error:'Not found'}):r.status(404).sendFile(path.join(__dirname,'public','404.html')));
app.use((e,q,r,n)=>r.status(400).json({error:e.message}));
async function init(){
 if(PG){await PG.query('CREATE TABLE IF NOT EXISTS kv(k text PRIMARY KEY,v jsonb NOT NULL)');await PG.query('CREATE TABLE IF NOT EXISTS images(name text PRIMARY KEY,mime text NOT NULL,data bytea NOT NULL)');
  const r=await PG.query("SELECT v FROM kv WHERE k='db'");if(r.rows[0])db=r.rows[0].v;}
 else if(fs.existsSync(DB))db=JSON.parse(fs.readFileSync(DB));
 let adm=db.users.find(u=>u.role==='admin');
 if(!adm){adm={id:'u1',username:AU,role:'admin',pass:hash(process.env.ADMIN_PASSWORD||'changeme')};db.users.push(adm);save();}
 else if(process.env.ADMIN_PASSWORD){adm.username=AU;adm.pass=hash(process.env.ADMIN_PASSWORD);save();}
 console.log('Storage:',PG?'Postgres database':'files in '+DATA,'|',db.items.length,'posts');}
const PORT=process.env.PORT||3000;
init().then(()=>app.listen(PORT,()=>console.log('McWaSa Updates running on port '+PORT))).catch(e=>{console.error('Startup failed:',e.message);process.exit(1)});
