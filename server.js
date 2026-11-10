const http=require('http'),fs=require('fs'),path=require('path');
const {WebSocketServer}=require('ws');
const html=fs.readFileSync(path.join(__dirname,'index.html'));
const server=http.createServer((q,r)=>{r.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});r.end(html)});
const wss=new WebSocketServer({server});
const SZ=[6,5,4,3,2,1],POSN=['ST','LW','RW','CM','LB','RB','CB','GK'];
const norm=s=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim();
const DB="Messi:1987:F,Cristiano Ronaldo:1985:F,Neymar:1992:F,Mbappé:1998:F,Haaland:2000:F,Salah:1992:F,Modrić:1985:M,De Bruyne:1991:M,Lewandowski:1988:F,Benzema:1987:F,Kane:1993:F,Vinícius Júnior:2000:F,Bellingham:2003:M,Lamine Yamal:2007:F,Pedri:2002:M,Rodri:1996:M,Griezmann:1991:F,Son:1992:F,Mané:1992:F,Kroos:1990:M,Iniesta:1984:M,Xavi:1980:M,Zidane:1972:M,Ronaldinho:1980:F,Ronaldo Nazário:1976:F,Henry:1977:F,Rooney:1985:F,Ibrahimović:1981:F,Buffon:1978:G,Pirlo:1979:M,Maldini:1968:D,Cantona:1966:F,Beckham:1975:M,Totti:1976:F,Raúl:1977:F,Casillas:1981:G,Neuer:1986:G,Courtois:1992:G,Alisson:1992:G,Van Dijk:1991:D,Sergio Ramos:1986:D,Piqué:1987:D,Suárez:1987:F,Agüero:1988:F,Di María:1988:F,Lautaro Martínez:1997:F,Saka:2001:F,Foden:2000:M,Rashford:1997:F,Müller:1989:F,Özil:1988:M,Hazard:1991:F,Pogba:1993:M,Kanté:1991:M,Dybala:1993:F,Chiesa:1997:F,Osimhen:1998:F".split(',').map(s=>{const[n,y,p]=s.split(':');return{n,y:+y,p,k:norm(n)}});
const canon=k=>{const m=DB.filter(d=>d.k===k||d.k.split(' ').includes(k));return m.length===1?m[0]:null};
const REG=[['pos','CB','CENTRE BACK',6],['pos','GK','GOALKEEPER',6],['pos','ST','STRIKER',6],['pos','MID','MIDFIELDER CM/AM/DM',6],['pos','WING','WINGER RW/LW',6],
['ach','UCL','UCL WINNER',6],['ach','BDO',"BALLON D'OR WINNER",4],['ach','GB','GOLDEN BOOT WINNER',4],['ach','WC','WORLD CUP WINNER',5],['ach','LT','LEAGUE TITLES 2+',6],['ach','TR','WON TREBLE',5],['ach','EU3','WON 3+ EUROPEAN TROPHIES',5],
['eur','E5',"PLAYED IN 3+ EUROPE'S BEST 5",6],['foot','R','RIGHT FOOTED',5],['foot','L','LEFT FOOTED',5],
['age','30P','AT LEAST 30+ YEARS OLD',6],['age','U30','UNDER 30 YEARS OLD',6],
['league','PL','PLAYED IN PREMIER LEAGUE',5],['league','L1','PLAYED IN LIGUE 1',5],['league','SA','PLAYED IN SERIE A',5],['league','BL','PLAYED IN BUNDESLIGA',5],['league','LL','PLAYED IN LA LIGA',5],
['with','RON','PLAYED WITH RONALDO',2],['with','MES','PLAYED WITH MESSI',2],
['goals','G200','SCORED 200+ GOALS',5],['final','FIN','SCORED IN AN IMPORTANT FINAL',4],['ret','RET','RETIRED',5]];
[['ES','SPAIN'],['EN','ENGLAND'],['FR','FRANCE'],['AR','ARGENTINA'],['PT','PORTUGAL'],['IT','ITALY'],['DE','GERMANY']].forEach(([v,n])=>REG.push(['born',v,'BORN IN '+n,3]));
['REAL MADRID','MAN CITY','JUVENTUS','AC MILAN','PSG','LIVERPOOL','MAN UTD','BARCELONA'].forEach(n=>REG.push(['club',n,'PLAYED IN '+n,3]));
const PUN=[
['בדיקת כשירות רפואית פתאומית','אם לקח לך יותר מ-10 שניות להגיד שחקן שמתאים לקלפים על השולחן, שלוף 2 קלפי עונש מהקופה.'],
['וואן דייק עשה עליך גליץ׳','קרעת את הצולבת ואתה לא כשיר לשחק במחזור הקרוב (התור הבא שלך מבוטל).',{skip:1}],
['סקאוטים טעו','אמרת שחקן שלא באמת עונה על אחת הקטגוריות? אתה פוסל את עצמך, מקבל צהוב ושולף קלף נוסף.'],
['חילוף דקה 90','תפסו אותך לא מוכן. עליך לזרוק תוך 5 שניות שם של שחקן עבר אגדי מלפני שנת 2000. נתקעת? שלוף קלף.'],
['שחקן בית של המועדון','אם אחד הקלפים הוא קבוצה, אסור לך להגיד שחקן רכש יקר. עליך למצוא שחקן שגדל במחלקת הנוער של אותה קבוצה, אחרת שלוף קלף.'],
['סרחיו ראמוס נכנס בך מאחורה','קרעת את הצולבת, ולכן שני התורים הבאים שלך מבוטלים.',{skip:2}],
['פפ גווארדיולה עשה רוטציה מוגזמת','כל השחקנים בשולחן מעבירים את כל הקלפים שבידם לשחקן שיושב משמאלם.','rot'],
['השופט שלף אדום ישיר','זרוק את הקלף שהכי קרוב לריאל מדריד שיש לך ביד, והסבר איך הוא מתקשר אליה.'],
['זלאטן איברהימוביץ׳ חושב שאתה שחקן חלש','אסור לך לדבר או להעיר הערות במשך סיבוב שלם (בתור הבא אינך יכול להגיד שם של שחקן).',{mute:1}],
['אנצ׳לוטי שלף את הגבה המפורסמת','בחר שחקן אחר בשולחן שידבר במקומך בתור הזה.'],
['הצעה ערבית הזויה מחוץ לחלון ההעברות','החלף את כל הקלפים שלך עם השחקן שיש לו הכי הרבה קלפים ביד, בלי להסתכל על הקלפים שלו.'],
['חדר ההלבשה','כל השחקנים מעבירים לך קלף אחד לבחירתם מידם.'],
['מוריניו מחנה את האוטובוס','בתור הבא אסור לך לומר שם של חלוץ או קשר, רק מגנים ושוערים.',{ban:'FM'}],
['יובנטוס החלה לשחק התקפי','בתור הבא אסור לך לומר שחקן הגנה או שוער, רק קשרים וחלוצים.',{ban:'DG'}],
['רונאלדו גנב לך גול','תגנוב לשחקן שאחריך קלף.'],
['קפטן עם סרט','אתה הקפטן עד שמישהו אחר מקבל כרטיס. כל מחלוקת בין שחקנים מוכרעת על ידך, ומי שמערער על החלטתך שולף קלף.'],
['קונטה עובר לשלוש בלמים','בתור הבא אתה חייב לומר שחקן שיכול לשחק גם בהגנה וגם בהתקפה (כמו מגן שמבקיע). לא הצלחת? שלוף קלף.'],
['הנדסת פרוטוקול של פיפ״א','בחר כלל חדש שיחול על כולם בסיבוב הבא (למשל: אסור לומר שם פרטי). מי שהפר, שולף קלף.'],
['ונגר מסתכל על השעון','כל השחקנים עוצמים עיניים. אתה אומר שחקן, והם צריכים לנחש את הקבוצה שלו. כל מי שטעה שולף קלף, ואתה שולף קלף על כל טועה.'],
['בקשת מחילה ממשפחה של שחקן','שחקן לבחירתך אומר שם של שחקן, ואתה חייב לומר שתי קבוצות שהוא שיחק בהן. לא הצלחת? שלוף קלף.'],
['מסי מתנדב לבעוט פנדל','מי שיש לו הכי פחות קלפים ביד נבחר לשחק מולך בסיבוב אבן-נייר-ומספריים. המפסיד שולף 2.']];
let cid=0,G;
const sh=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
function mk(){const d=[];REG.forEach(([cat,v,l,n])=>{for(let i=0;i<n;i++)d.push({id:'c'+(++cid),k:'reg',cat,v,l})});
 for(let i=0;i<6;i++)d.push({id:'c'+(++cid),k:'red',l:'RED CARD'});for(let i=0;i<5;i++)d.push({id:'c'+(++cid),k:'var',l:'VAR'});return sh(d)}
function fresh(){G={phase:'lobby',pl:G?G.pl:[],deck:[],pun:[],disc:[],pdisc:[],piles:[[],[],[]],turn:0,left:45000,choose:false,vote:null,modal:null,mq:[],said:[],rank:[],msg:'',last:null,ref:''};G.pl.forEach(p=>{p.ready=false;p.hand=[];p.out=false;p.skip=0;p.ri=0;p.mega=true;delete p.pen})}
fresh();
const pm=m=>{G.mq.push(m);if(!G.modal)G.modal=G.mq.shift()};
const top=i=>G.piles[i][G.piles[i].length-1];
function clash(c,pi){for(let j=0;j<3;j++){if(j===pi)continue;const t=top(j);if(!t||t.cat!==c.cat)continue;if((c.cat==='league'||c.cat==='club')&&t.v!==c.v)continue;return true}return false}
function refresh(){G.piles.forEach(p=>{while(p.length>1)G.deck.push(p.shift())});sh(G.deck);G.ref+='הקופה התרוקנה: הקלפים שנצברו מתחת לערימות הערבבו וחזרו לקופה. '}
function draw(){if(!G.deck.length)refresh();if(!G.deck.length){G.deck=sh(G.disc.filter(c=>c.k!=='pun'));G.disc=G.disc.filter(c=>c.k==='pun')}return G.deck.pop()}
function drawPun(){if(!G.pun.length){G.pun=sh(G.pdisc);G.pdisc=[];G.ref+='קופת העונשים התרוקנה וחודשה מקלפי העונש ששימשו. '}return G.pun.pop()}
function fillPile(i){const aside=[];for(let n=0;n<90;n++){const c=draw();if(!c)break;if(c.k==='reg'&&!clash(c,i)){G.piles[i].push(c);break}aside.push(c)}G.deck.push(...aside);sh(G.deck)}
function start(){G.phase='play';G.deck=mk();G.pun=sh(PUN.map(([t,d,fx])=>({id:'c'+(++cid),k:'pun',t,d,fx})));G.disc=[];G.pdisc=[];G.piles=[[],[],[]];G.said=[];G.rank=[];G.msg='';G.vote=null;G.modal=null;G.mq=[];G.last=null;G.ref='';
 G.pl.forEach(p=>{p.ri=0;p.out=false;p.skip=0;p.mega=true;delete p.pen;p.hand=[];for(let i=0;i<6;i++)p.hand.push(draw())});for(let i=0;i<3;i++)fillPile(i);G.turn=0;G.left=45000;G.choose=false;G.ref=''}
const cur=()=>G.pl[G.turn];
function next(){if(G.phase!=='play')return;const lp=cur();if(lp&&lp.pen&&--lp.pen.turns<=0)delete lp.pen;const n=G.pl.length;let i=G.turn;for(let k=0;k<n*3;k++){i=(i+1)%n;const x=G.pl[i];if(x.out)continue;if(x.skip>0){x.skip--;continue}break}G.turn=i;G.left=45000;G.choose=false}
function checkEmpty(p){if(p.hand.length)return;p.ri++;if(p.ri>=6){p.out=true;G.rank.push(p.name);pm({kind:'info',title:'ניצחון!',text:p.name+' רוקן/ה את כל הקלפים ויוצא/ת מהמשחק כמנצח/ת.'});const a=G.pl.filter(x=>!x.out);if(a.length<=1){if(a[0]){a[0].out=true;G.rank.push(a[0].name)}G.phase='over'}}else for(let i=0;i<SZ[p.ri];i++)p.hand.push(draw())}
function applyFx(p,c,own){const f=c.fx;if(!f)return;if(f==='rot'){const a=G.pl.filter(x=>!x.out),h=a.map(x=>x.hand);a.forEach((x,i)=>x.hand=h[(i-1+a.length)%a.length])}
 else{if(f.skip)p.skip+=f.skip;if(f.ban||f.mute)p.pen={ban:f.ban||'',mute:!!f.mute,turns:own?2:1,txt:c.t+': '+c.d}}}
function resolveVote(){const v=G.vote,a=G.pl.filter(x=>!x.out);if(!a.every(x=>x.id in v.v))return;const y=a.filter(x=>v.v[x.id]).length;G.vote=null;
 if(v.type==='cat'){if(y/a.length>=0.6){for(let i=0;i<3;i++)fillPile(i);pm({kind:'info',title:'החלפת קטגוריות',text:'רוב השחקנים הסכימו. הקטגוריות הוחלפו.'})}else pm({kind:'info',title:'החלפת קטגוריות',text:'ההצבעה נדחתה. הקטגוריות לא הוחלפו.'});return}
 const ch=G.pl.find(x=>x.id===v.by),t=G.pl.find(x=>x.id===v.target);
 if((a.length-y)/a.length>=0.6){pm({kind:'info',title:'הערעור התקבל',text:`"${v.name}" של ${t.name} לא מתאים. ${t.name} שולף/ת 2 קלפים רגילים או קלף עונש אחד. המגפון של ${ch.name} נשאר זמין.`});if(!t.out)pm({kind:'chalpick',title:'בחר/י עונש',text:'שלוף 2 קלפים רגילים או קלף עונש אחד',by:t.id})}
 else{ch.mega=false;ch.hand.push(draw(),draw());pm({kind:'info',title:'הערעור נדחה',text:`"${v.name}" אושר. ${ch.name} שולף/ת 2 קלפים והמגפון שלו/ה נחסם.`})}}
function view(p){const v=G.vote,c=cur();return{me:p.id,phase:G.phase,pl:G.pl.map(x=>({id:x.id,name:x.name,ready:x.ready,av:x.av,pos:x.pos,n:x.hand.length,out:x.out})),hand:p.hand,
 piles:G.piles.map(a=>({top:a[a.length-1]||null,n:a.length})),deck:G.deck.length,pun:G.pun.length,disc:G.disc[G.disc.length-1]||null,
 turn:G.phase==='play'&&c?c.id:null,left:G.left,choose:G.choose,vote:v?{type:v.type,byName:v.byName,name:v.name,reason:v.reason,tn:v.tn,mine:p.id in v.v}:null,
 modal:G.modal?{kind:G.modal.kind,title:G.modal.title,text:G.modal.text,by:G.modal.by||null}:null,rank:G.rank,msg:G.msg,
 pen:p.pen?p.pen.txt:null,mega:!!p.mega,canChal:!!(p.mega&&G.last&&G.last.by!==p.id&&!G.last.ch&&!G.vote&&!G.modal&&G.phase==='play'),last:G.last?G.last.bn+': '+G.last.name:''}}
function bcast(){if(G.ref&&G.phase!=='lobby'){pm({kind:'info',title:'חידוש קופה',text:G.ref});G.ref=''}
 wss.clients.forEach(c=>{if(c.readyState!==1||!c.pid)return;const p=G.pl.find(x=>x.id===c.pid)||{id:c.pid,hand:[]};c.send(JSON.stringify(view(p)))})}
const err=(ws,e)=>ws.readyState===1&&ws.send(JSON.stringify({err:e}));
wss.on('connection',ws=>{
 ws.on('message',d=>{let m;try{m=JSON.parse(d)}catch(e){return}
  if(m.pid)ws.pid=String(m.pid).slice(0,20);
  if(m.t==='hi')ws.send(JSON.stringify({ply:DB.map(x=>[x.n,2026-x.y])}));
  let p=G.pl.find(x=>x.id===ws.pid);
  if(p)p.ws=ws;
  if(m.t==='join'&&!p&&G.phase==='lobby'&&G.pl.length<8&&String(m.name||'').trim()){p={id:ws.pid,name:String(m.name).trim().slice(0,12),ready:false,av:Math.floor(Math.random()*1e6),pos:POSN[G.pl.length],hand:[],ri:0,out:false,skip:0,mega:true,ws};G.pl.push(p);G.pl.forEach((x,i)=>x.pos=POSN[i])}
  else if(!p){}
  else if(m.t==='ready'&&G.phase==='lobby'){p.ready=!p.ready;if(G.pl.length>=2&&G.pl.every(x=>x.ready))start()}
  else if(m.t==='again'&&G.phase==='over')fresh();
  else if(G.phase==='play'){
   const my=cur()===p&&!G.modal&&!G.vote,md=G.modal;
   if(m.t==='cat'&&!G.vote&&!md){G.vote={type:'cat',by:p.id,byName:p.name,v:{}}}
   else if(m.t==='chal'&&p.mega&&G.last&&G.last.by!==p.id&&!G.last.ch&&!G.vote&&!md){G.last.ch=true;G.vote={type:'chal',by:p.id,byName:p.name,reason:String(m.reason||'').slice(0,80),target:G.last.by,tn:G.last.bn,name:G.last.name,v:{}}}
   else if(m.t==='vote'&&G.vote&&!(p.id in G.vote.v)){G.vote.v[p.id]=!!m.y;resolveVote()}
   else if(m.t==='ok'&&md&&md.kind!=='chalpick'&&(md.by==null||md.by===p.id)){G.modal=G.mq.shift()||null;
    if(md.kind==='pun'){applyFx(G.pl.find(x=>x.id===md.by),md.card,md.turn);G.pdisc.push(md.card);G.disc.push(md.card);if(md.turn)next()}}
   else if(m.t==='cpick'&&md&&md.kind==='chalpick'&&md.by===p.id){G.modal=G.mq.shift()||null;
    if(m.k==='pun'){const c=drawPun();pm({kind:'pun',title:c.t,text:c.d,by:p.id,card:c,turn:false})}else p.hand.push(draw(),draw())}
   else if(my&&m.t==='pass'&&!G.choose){G.choose=true}
   else if(my&&m.t==='pen'&&G.choose){if(m.kind==='pun'){const c=drawPun();pm({kind:'pun',title:c.t,text:c.d,by:p.id,card:c,turn:true})}else{p.hand.push(draw());next()}}
   else if(my&&!G.choose&&(m.t==='play'||m.t==='red')){
    const c=p.hand.find(x=>x.id===m.card);if(!c)return;
    if(m.t==='red'){if(c.k!=='red')return;p.hand=p.hand.filter(x=>x!==c);G.disc.push(c);let j=G.turn;do{j=(j+1)%G.pl.length}while(G.pl[j].out);const t=G.pl[j];
     const v=t.hand.find(x=>x.k==='var');
     if(v){t.hand=t.hand.filter(x=>x!==v);G.disc.push(v);pm({kind:'info',title:'קלף אדום + VAR',text:`${p.name} שלף/ה אדום ל${t.name}, אבל ${t.name} השתמש/ה ב-VAR וממשיך/ה במשחק.`})}
     else{t.skip++;pm({kind:'info',title:'קלף אדום!',text:`${p.name} שלף/ה אדום ל${t.name}. התור של ${t.name} מדולג.`})}
     checkEmpty(p);next()}
    else{const pi=+m.pile,raw=String(m.name||'').trim(),key=norm(raw);if(c.k!=='reg'||!(pi>=0&&pi<3))return;
     if(!key)return err(ws,'כתוב שם של שחקן');
     if(clash(c,pi))return err(ws,'אסור להניח קלף מקטגוריה שכבר על השולחן');
     const cn=canon(key),k2=cn?cn.k:key;
     if(p.pen){if(p.pen.mute)return err(ws,'עונש פעיל: '+p.pen.txt+' (אי אפשר להגיד שם, לחץ "אין לי מה לשחק")');if(cn&&p.pen.ban.includes(cn.p))return err(ws,'עונש פעיל: '+p.pen.txt)}
     if(G.said.includes(k2))return err(ws,'השחקן הזה כבר נאמר במשחק!');
     G.said.push(k2);G.piles[pi].push(c);p.hand=p.hand.filter(x=>x!==c);G.last={by:p.id,bn:p.name,name:raw.slice(0,30)};checkEmpty(p);next()}}
  }
  bcast()});
 ws.on('close',()=>{const p=G.pl.find(x=>x.ws===ws);if(p&&G.phase==='lobby'){G.pl=G.pl.filter(x=>x!==p);G.pl.forEach((x,i)=>x.pos=POSN[i]);if(G.pl.length>=2&&G.pl.every(x=>x.ready))start();bcast()}});
});
let tk=0;
setInterval(()=>{if(G.phase==='play'){const p=cur();
 if(!G.choose&&!G.modal&&!G.vote){G.left-=500;if(G.left<=0){G.left=0;G.choose=true;G.msg='נגמר הזמן ל'+p.name}}
 if(G.choose&&!G.modal&&!G.vote&&(!p.ws||p.ws.readyState!==1)){p.hand.push(draw());next()}
 if(++tk%2===0)bcast()}},500);
server.listen(process.env.PORT||3000);
