import { BOARD } from './board.js';
export { BOARD };
const fail=message=>{throw new Error(message);};
const requireRule=(condition,message)=>{if(!condition)fail(message);};
const current=s=>s.players[s.turn];
const note=(s,message)=>{s.log.push(message);s.log=s.log.slice(-80);};
const groupOf=b=>BOARD.filter(x=>x.type==='property'&&x.group===b.group);
const ownsSet=(s,p,b)=>groupOf(b).every(x=>s.properties[x.id].owner===p.id);
const randomIndex=(rng,n)=>{const v=rng();requireRule(Number.isFinite(v)&&v>=0&&v<1,'乱数が不正です');return Math.floor(v*n);};
export function createGame(players){
 requireRule(Array.isArray(players)&&players.length>=2&&players.length<=4,'2〜4人で始めてください');
 const ids=new Set();
 const list=players.map(p=>{requireRule(p&&typeof p.id==='string'&&p.id.length>0&&p.id.length<=128&&!ids.has(p.id),'プレイヤーIDが不正です');requireRule(typeof p.name==='string'&&p.name.trim().length>0&&p.name.trim().length<=20,'名前は1〜20文字です');ids.add(p.id);return{id:p.id,name:p.name.trim(),money:1500,position:0,jail:0,bankrupt:false,cards:0};});
 return{players:list,turn:0,phase:'roll',properties:Object.fromEntries(BOARD.filter(b=>b.price).map(b=>[b.id,{owner:null,houses:0,mortgaged:false}])),dice:[0,0],doubles:0,log:['世界遺産をめぐる旅が始まりました。各自 €1500 です。'],pending:null,auction:null,winner:null,revision:0};
}
function nextTurn(s){do{s.turn=(s.turn+1)%s.players.length;}while(current(s).bankrupt);s.phase='roll';s.pending=null;s.doubles=0;}
function jail(s){const p=current(s);p.position=10;p.jail=3;s.doubles=0;s.phase='end';note(s,`${p.name} は拘留所へ。`);}
function charge(s,amount,creditor,reason,resume=null){
 const p=current(s);
 if(p.money<amount){s.phase='debt';s.pending={amount,creditor,reason,...(resume?{resume}:{})};note(s,`${reason}: €${amount} が必要です。建物売却・抵当により清算してください。`);return false;}
 p.money-=amount;if(creditor)s.players.find(x=>x.id===creditor).money+=amount;note(s,`${p.name}: ${reason} €${amount}`);return true;
}
function move(s,steps,rng){const p=current(s);if(p.position+steps>=40){p.money+=200;note(s,`${p.name} は出発点を通過、€200。`);}p.position=(p.position+steps+40)%40;land(s,rng);}
function draw(s,rng,type){
 const p=current(s),card=randomIndex(rng,8);
 const names=type==='chance'?['旅の写真が入賞。€100 を受け取る。','交通券を追加購入。€50 を支払う。','旅程を組み直して出発点へ。€200 を受け取る。','手続き確認で拘留所へ。','案内人から脱出カードをもらう。','景観整備への協力金。€100 を支払う。','三歩戻って寄り道しよう。','観光ガイドの謝礼。€50 を受け取る。']:['旅先から返金。€100 を受け取る。','荷物の修理に €50 を支払う。','次の旅は出発点から。€200 を受け取る。','忘れ物の手続きで拘留所へ。','旅人仲間から脱出カード。','資料の寄付に €100 を支払う。','三歩前の景色をもう一度。','旅の記録への謝礼。€50 を受け取る。'];
 note(s,names[card]);
 if(card===0)p.money+=100;
 if(card===1)charge(s,50,null,'旅の費用');
 if(card===2){p.position=0;p.money+=200;}
 if(card===3)jail(s);
 if(card===4)p.cards++;
 if(card===5)charge(s,100,null,'旅の協力金');
 if(card===6)move(s,-3,rng);
 if(card===7)p.money+=50;
}
function land(s,rng){
 const p=current(s),b=BOARD[p.position];s.phase='end';s.pending=null;
 note(s,`${p.name} は ${b.name} に到着。`);
 if(b.price){const prop=s.properties[b.id];if(prop.owner===null){s.phase='buy';s.pending={property:b.id};return;}
 if(prop.owner!==p.id&&!prop.mortgaged){let rent;if(b.type==='station'){const n=BOARD.filter(x=>x.type==='station'&&s.properties[x.id].owner===prop.owner).length;rent=b.rent[n-1];}else if(b.type==='utility'){const n=BOARD.filter(x=>x.type==='utility'&&s.properties[x.id].owner===prop.owner).length;rent=(s.dice[0]+s.dice[1])*b.rent[n-1];}else{rent=b.rent[prop.houses];if(!prop.houses&&ownsSet(s,{id:prop.owner},b))rent*=2;}charge(s,rent,prop.owner,`${b.name} の利用料`);}}
 if(b.type==='tax')charge(s,b.amount,null,b.name);
 if(b.type==='gotojail')jail(s);
 if(b.type==='chance'||b.type==='chest')draw(s,rng,b.type);
}
function settleDebt(s,rng){if(s.phase!=='debt'||current(s).money<s.pending.amount)return;const d=s.pending;s.pending=null;s.phase='end';charge(s,d.amount,d.creditor,d.reason);if(d.resume?.type==='jailMove'){current(s).jail=0;move(s,d.resume.steps,rng);}}
function settleAuction(s){const a=s.auction;if(a.highestBidder&&a.active.every(id=>id===a.highestBidder)){const p=s.players.find(x=>x.id===a.highestBidder);p.money-=a.highestBid;s.properties[a.property].owner=p.id;note(s,`${p.name} が ${BOARD[a.property].name} を €${a.highestBid} で落札。`);s.auction=null;s.pending=null;s.phase='end';}else if(a.active.length===0){note(s,'入札なし。土地は銀行に残ります。');s.auction=null;s.pending=null;s.phase='end';}}
export function act(state,playerId,action,rng=Math.random){
 try{
 requireRule(state&&Array.isArray(state.players),'ゲーム状態が不正です');
 requireRule(action&&typeof action.type==='string','操作が不正です');
 requireRule(state.phase!=='over','ゲームは終了しています');
 const actor=state.players.find(p=>p.id===playerId);requireRule(actor&&!actor.bankrupt,'参加していないプレイヤーです');
 if(state.phase==='auction')requireRule(['bid','pass'].includes(action.type),'競売の入札・パスを選んでください');
 else requireRule(current(state).id===playerId,'あなたの手番ではありません');
 const s=structuredClone(state),p=s.players.find(x=>x.id===playerId),type=action.type;
 if(type==='roll'){
  requireRule(s.phase==='roll','今はサイコロを振れません');s.dice=[randomIndex(rng,6)+1,randomIndex(rng,6)+1];const [a,b]=s.dice,steps=a+b;note(s,`${p.name} のサイコロ: ${a}・${b}`);
  if(p.jail){s.doubles=0;if(a===b){p.jail=0;move(s,steps,rng);}else if(p.jail>1){p.jail--;s.phase='end';note(s,'拘留中。次の手番で再挑戦。');}else{if(charge(s,50,null,'拘留解除',{type:'jailMove',steps})){p.jail=0;move(s,steps,rng);}}}
  else{if(a===b)s.doubles++;else s.doubles=0;if(s.doubles===3)jail(s);else move(s,steps,rng);}
 }else if(type==='buy'){
  requireRule(s.phase==='buy','購入できる土地はありません');const b=BOARD[s.pending.property];requireRule(p.money>=b.price,'所持金が足りません。競売へ進めます');p.money-=b.price;s.properties[b.id].owner=p.id;s.phase='end';s.pending=null;note(s,`${p.name} が ${b.name} を €${b.price} で購入。`);
 }else if(type==='decline'){
  requireRule(s.phase==='buy','今は競売を始められません');s.auction={property:s.pending.property,highestBid:0,highestBidder:null,active:s.players.filter(x=>!x.bankrupt).map(x=>x.id)};s.phase='auction';note(s,`${BOARD[s.pending.property].name} の競売開始。€1 以上、所持金以内で入札。`);
 }else if(type==='bid'||type==='pass'){
  requireRule(s.phase==='auction'&&s.auction.active.includes(p.id),'競売には参加できません');const a=s.auction;requireRule(a.highestBidder!==p.id,'最高入札者はほかの参加者を待ってください');
  if(type==='bid'){requireRule(Number.isSafeInteger(action.amount)&&action.amount>a.highestBid&&action.amount<=p.money,'現在額を超え、所持金以内の整数 € で入札してください');a.highestBid=action.amount;a.highestBidder=p.id;note(s,`${p.name} が €${action.amount} を入札。`);}else{a.active=a.active.filter(id=>id!==p.id);note(s,`${p.name} は競売をパス。`);}settleAuction(s);
 }else if(type==='end'){
  requireRule(s.phase==='end','先に購入・競売・支払いを解決してください');if(s.doubles>0&&!p.jail){s.phase='roll';note(s,'ゾロ目なので、もう一度振れます。');}else nextTurn(s);
 }else if(type==='payJail'||type==='useCard'){
  requireRule(s.phase==='roll'&&p.jail>0,'拘留中の手番開始時に使えます');if(type==='useCard'){requireRule(p.cards>0,'脱出カードがありません');p.cards--;}else{requireRule(p.money>=50,'拘留解除には €50 が必要です');p.money-=50;}p.jail=0;note(s,`${p.name} は拘留を解除。`);
 }else if(['build','sell','mortgage','redeem'].includes(type)){
  requireRule(['roll','end','debt','buy'].includes(s.phase),'今は資産を操作できません');requireRule(Number.isInteger(action.property),'土地番号が不正です');const b=BOARD[action.property],v=s.properties[action.property];requireRule(b&&v&&v.owner===p.id,'自分の土地を選んでください');
  if(type==='build'){requireRule(s.phase!=='debt','まず債務を清算してください');requireRule(b.type==='property'&&ownsSet(s,p,b),'同じ色の土地をすべて集めてください');const group=groupOf(b).map(x=>s.properties[x.id]);requireRule(group.every(x=>!x.mortgaged),'同色に抵当中の土地があります');requireRule(v.houses<5&&v.houses===Math.min(...group.map(x=>x.houses)),'均等に建設してください（最大ホテル1軒）');requireRule(p.money>=b.houseCost,'建設費が足りません');p.money-=b.houseCost;v.houses++;note(s,`${b.name} を ${v.houses===5?'ホテル':`家${v.houses}軒`} に増築。`);}
  if(type==='sell'){requireRule(b.type==='property'&&v.houses>0,'売却する建物がありません');requireRule(v.houses===Math.max(...groupOf(b).map(x=>s.properties[x.id].houses)),'建物は均等に売却してください');v.houses--;p.money+=b.houseCost/2;note(s,`${b.name} の建物を1段階売却、€${b.houseCost/2}。`);}
  if(type==='mortgage'){requireRule(!v.mortgaged,'すでに抵当中です');requireRule(b.type!=='property'||groupOf(b).every(x=>s.properties[x.id].houses===0),'同色の建物をすべて売却してください');v.mortgaged=true;p.money+=b.mortgage;note(s,`${b.name} を抵当に入れ、€${b.mortgage}。`);}
  if(type==='redeem'){requireRule(s.phase!=='debt','まず債務を清算してください');requireRule(v.mortgaged,'抵当中ではありません');const cost=Math.ceil(b.mortgage*110/100);requireRule(p.money>=cost,'解除費用が足りません');p.money-=cost;v.mortgaged=false;note(s,`${b.name} の抵当を €${cost} で解除。`);}
  settleDebt(s,rng);
 }else if(type==='bankrupt'){
  requireRule(s.phase==='debt','支払い不能のときだけ破産できます');const debt=s.pending;const assets=BOARD.filter(b=>s.properties[b.id]?.owner===p.id);const liquidation=p.money+assets.reduce((n,b)=>{const v=s.properties[b.id];return n+(v.mortgaged?0:b.mortgage)+(v.houses*(b.houseCost||0)/2);},0);requireRule(liquidation<debt.amount,'建物の売却と抵当で支払えます');
  const creditor=debt.creditor?s.players.find(x=>x.id===debt.creditor):null;
  if(creditor){creditor.money+=p.money+assets.reduce((n,b)=>n+s.properties[b.id].houses*(b.houseCost||0)/2,0);creditor.cards+=p.cards;}
  for(const b of assets){const v=s.properties[b.id];v.owner=creditor?.id||null;v.houses=0;if(!creditor)v.mortgaged=false;}
  p.money=0;p.cards=0;p.bankrupt=true;s.pending=null;s.doubles=0;note(s,`${p.name} は破産しました。`);const alive=s.players.filter(x=>!x.bankrupt);if(alive.length===1){s.phase='over';s.winner=alive[0].id;note(s,`${alive[0].name} の勝利！`);}else nextTurn(s);
 }else fail('未対応の操作です');
 s.revision++;return{ok:true,state:s};
 }catch(error){return{ok:false,state,error:error.message||'操作できません'};}
}
