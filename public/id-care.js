/* iD-inspired original care simulation; independent of the existing coin/save ledger. */
(function(root){'use strict';
const KEY='night-pet-id-v1',MIN=60000,HOUR=60*MIN,DAY=24*HOUR;
const phases=['egg','baby','child','teen','friend'],growth=[MIN,61*MIN,25*HOUR,49*HOUR];
const favorites={mori:{meal:'おにぎり',snack:'いちご',toy:'積み木'},kitsune:{meal:'オムライス',snack:'プリン',toy:'ボール'},sora:{meal:'サンドイッチ',snack:'ドーナツ',toy:'絵本'}};
const rooms={meadow:'木漏れびのお部屋',cloud:'雲のお部屋',sunset:'夕やけのお部屋'};
let data=null,storageOK=true,notice='',protectedRaw=null;
const clone=v=>JSON.parse(JSON.stringify(v));
const finite=(v,d,min=0,max=1e15)=>Number.isFinite(v)?Math.max(min,Math.min(max,v)):d;
function fresh(now,stage){const offset=stage>=2?49*HOUR:stage===1?61*MIN:0;return{bornAt:now-offset,lastTick:now,phase:phases[stage>=2?4:stage===1?2:0],hunger:4,happiness:4,weight:stage?12:5,waste:0,dirty:false,sick:false,lights:true,careMisses:0,friendship:[false,false,false,false],room:'meadow',variant:stage>=2?'sunny':'bud',activeMinutes:0,foodMinutes:0,joyMinutes:0,wasteMinutes:0,dirtyMinutes:0,neglectMinutes:0,missLatched:false,sleepMinutes:0,sleepMiss:false,friendSince:stage>=2?now:null,lastAction:{}};}
function normalize(v,now,stage){const p=fresh(now,stage);if(!v||typeof v!=='object')return p;for(const k of ['bornAt','lastTick','hunger','happiness','weight','waste','careMisses','activeMinutes','foodMinutes','joyMinutes','wasteMinutes','dirtyMinutes','neglectMinutes','sleepMinutes'])p[k]=finite(v[k],p[k]);p.bornAt=Math.min(now,p.bornAt);p.lastTick=Math.max(p.bornAt,Math.min(now,p.lastTick));p.hunger=Math.min(4,p.hunger);p.happiness=Math.min(4,p.happiness);p.waste=Math.min(3,Math.floor(p.waste));p.weight=Math.min(99,Math.max(5,p.weight));p.phase=phases.includes(v.phase)?v.phase:p.phase;for(const k of ['dirty','sick','lights','missLatched','sleepMiss'])if(typeof v[k]==='boolean')p[k]=v[k];p.friendship=Array.from({length:4},(_,i)=>v.friendship?.[i]===true);p.room=Object.hasOwn(rooms,v.room)?v.room:'meadow';p.variant=['bud','sunny','dreamy','wild'].includes(v.variant)?v.variant:'bud';p.friendSince=Number.isFinite(v.friendSince)?Math.min(now,v.friendSince):p.friendSince;if(v.lastAction&&typeof v.lastAction==='object')for(const k of ['meal','snack','toy','outside'])p.lastAction[k]=finite(v.lastAction[k],0,0,now);return p;}
function read(){if(data)return;data={version:1,pets:{}};try{const raw=root.localStorage.getItem(KEY);if(raw){try{const v=JSON.parse(raw);if(v?.version!==1||!v.pets||typeof v.pets!=='object'||Array.isArray(v.pets)||Object.values(v.pets).some(p=>!p||typeof p!=='object'||Array.isArray(p)))throw Error('format');data=v;}catch{protectedRaw=raw;notice='読み取れない育成記録は保護し、この画面では新しくお世話を始めます。';storageOK=false;}}}catch{storageOK=false;notice='保存が使えません。この画面を閉じると今回のお世話は失われます。';}}
function save(){if(protectedRaw!==null)return;try{root.localStorage.setItem(KEY,JSON.stringify(data));storageOK=true;notice='';}catch{storageOK=false;notice='保存が使えません。この画面を閉じると今回のお世話は失われます。';}}
function phaseAt(p,time){const age=Math.max(0,time-p.bornAt);let n=0;while(n<growth.length&&age>=growth[n])n++;return phases[n];}
function sleeping(p,time){if(p.phase==='egg'||p.phase==='baby')return false;const hour=new Date(time).getHours(),bed=p.phase==='child'?20:p.phase==='teen'?21:22;return hour>=bed||hour<7;}
function mature(p,time){const next=phaseAt(p,time);if(next!==p.phase){p.phase=next;if(next==='friend'){p.friendSince=p.bornAt+growth[3];p.variant=p.careMisses<=2?'sunny':p.careMisses<=6?'dreamy':'wild';}}if(p.phase==='friend'&&p.friendSince===null)p.friendSince=time;if(p.phase==='friend'&&time-p.friendSince>=48*HOUR&&p.friendship.slice(0,3).every(Boolean))p.friendship[3]=true;}
function tick(p,now){/* Bound unattended simulation to seven days, but preserve chronological growth. */
if(now<p.lastTick)return;let from=Math.max(p.lastTick,now-7*DAY);const steps=Math.floor((now-from)/MIN);
for(let i=0;i<steps;i++){const t=from+(i+1)*MIN;mature(p,t);if(p.phase==='egg')continue;if(sleeping(p,t)){if(p.lights&&!p.sleepMiss){p.sleepMinutes++;if(p.sleepMinutes>=30){p.careMisses++;p.sleepMiss=true;}}continue;}
p.sleepMinutes=0;p.sleepMiss=false;p.activeMinutes++;p.foodMinutes++;p.joyMinutes++;p.wasteMinutes++;p.dirtyMinutes++;
const foodRate=p.phase==='baby'?15:90,joyRate=p.phase==='baby'?20:120;
if(p.foodMinutes>=foodRate){p.hunger=Math.max(0,p.hunger-1);p.foodMinutes=0;}if(p.joyMinutes>=joyRate){p.happiness=Math.max(0,p.happiness-1);p.joyMinutes=0;}if(p.wasteMinutes>=90){p.waste=Math.min(3,p.waste+1);p.wasteMinutes=0;}if(p.dirtyMinutes>=240)p.dirty=true;
if(p.hunger===0||p.happiness===0||p.waste===3){p.neglectMinutes++;if(p.neglectMinutes>=15&&!p.missLatched){p.careMisses++;p.missLatched=true;}if(p.neglectMinutes>=60)p.sick=true;}else{p.neglectMinutes=0;p.missLatched=false;}
}p.lastTick=from+steps*MIN;mature(p,now);}
function current(){read();const now=Date.now(),base=root.NightPet?.snapshot?.()||{selected:'mori',characters:{mori:{stage:0}}};const id=Object.hasOwn(favorites,base.selected)?base.selected:'mori';if(!data.pets[id])data.pets[id]=fresh(now,base.characters?.[id]?.stage||0);else data.pets[id]=normalize(data.pets[id],now,base.characters?.[id]?.stage||0);const p=data.pets[id];tick(p,now);return {p,id,now};}
function snapshot(){const {p,id,now}=current();save();return {...clone(p),selected:id,ageDays:Math.floor(Math.max(0,now-p.bornAt)/DAY),asleep:sleeping(p,now),nextGrowthAt:p.phase==='friend'?0:p.bornAt+growth[phases.indexOf(p.phase)],favorites:clone(favorites[id]),storageOK,notice};}
function act(type,value){const {p,id,now}=current();let message='';if(!['meal','snack','toilet','bath','medicine','lights','toy','outside','room'].includes(type))return{ok:false,message:'このお世話はまだありません。'};
if(type==='room'){if(!Object.hasOwn(rooms,value))return{ok:false,message:'お部屋を選んでね。'};p.room=value;message=rooms[value]+'に模様替え！';}
else if(type==='lights'){p.lights=typeof value==='boolean'?value:!p.lights;message=p.lights?'電気をつけました。':'電気を消しました。おやすみなさい。';}
else{if(p.phase==='egg')return{ok:false,message:'もうすぐ生まれるよ。たまごを見守ってね。'};if(sleeping(p,now))return{ok:false,message:'すやすや眠っています。朝7時に起きるよ。'};
if(['meal','snack','toy','outside'].includes(type)&&p.lastAction[type]!==undefined&&now-p.lastAction[type]<5000)return{ok:false,message:'少し待ってから、またお世話してね。'};
if(type==='meal'){if(p.hunger>=4)return{ok:false,message:'おなかいっぱい！またあとでね。'};p.hunger=Math.min(4,p.hunger+1);p.weight=Math.min(99,p.weight+1);message='もぐもぐ、ごちそうさま！';}
if(type==='snack'){p.happiness=Math.min(4,p.happiness+1);p.weight=Math.min(99,p.weight+2);if(p.weight>=30)p.sick=true;message='甘いおやつでにっこり！';}
if(type==='toy'){p.happiness=Math.min(4,p.happiness+1);p.weight=Math.max(5,p.weight-1);message='おもちゃで遊んで、ごきげん！';}
if(type==='outside'){p.happiness=Math.min(4,p.happiness+1);p.weight=Math.max(5,p.weight-1);message='公園でおさんぽしてきました！';}
if(type==='toilet'){p.waste=0;message='すっきり！お部屋をきれいにしました。';}
if(type==='bath'){p.dirty=false;p.dirtyMinutes=0;message='あわあわ、おふろでぴかぴか！';}
if(type==='medicine'){if(!p.sick)return{ok:false,message:'元気だから、お薬はいらないよ。'};p.sick=false;p.neglectMinutes=0;message='お薬で元気になりました。おなかとお部屋も見てね。';}
const favIndex={meal:0,snack:1,toy:2}[type];if(p.phase==='friend'&&favIndex!==undefined&&(value===undefined||value===favorites[id][type])){const first=!p.friendship[favIndex];p.friendship[favIndex]=true;if(first)message+=' 大好きなもの発見！なかよしの印が増えたよ。';}
if(['meal','snack','toy','outside'].includes(type))p.lastAction[type]=now;
if(p.hunger>0&&p.happiness>0&&p.waste<3){p.neglectMinutes=0;p.missLatched=false;}
}mature(p,now);save();if(typeof root.dispatchEvent==='function'&&typeof root.CustomEvent==='function')root.dispatchEvent(new root.CustomEvent('idcare:change',{detail:{type,message}}));return{ok:true,message,persistent:storageOK};}
root.IDCare={snapshot,act,key:KEY,rooms:clone(rooms),favorites:clone(favorites)};
})(globalThis);
