import {BOARD,createGame,act} from './engine.js';
// Decisions use only public state and the same rule validator as human moves.
export function cpuAction(s,id){
 const p=s.players.find(p=>p.id===id);if(!p||p.bankrupt||s.phase==='over')return null;
 if(s.phase==='auction'){const a=s.auction;if(!a.active.includes(id)||a.highestBidder===id)return null;const limit=Math.min(p.money,Math.floor(BOARD[a.property].price*1.15),Math.max(0,p.money-100));return a.highestBid+10<=limit?{type:'bid',amount:a.highestBid+10}:{type:'pass'};}
 if(s.players[s.turn].id!==id)return null;
 const legal=a=>act(s,id,a,()=>0.3).ok;
 const assets=BOARD.filter(b=>s.properties[b.id]?.owner===id);
 if(s.phase==='debt'){
  for(const type of ['sell','mortgage'])for(const b of assets){const a={type,property:b.id};if(legal(a))return a;}
  return {type:'bankrupt'};
 }
 if(s.phase==='buy')return {type:p.money>=BOARD[s.pending.property].price+100?'buy':'decline'};
 if(s.phase==='roll'){if(p.jail&&p.cards)return {type:'useCard'};return {type:'roll'};}
 if(s.phase==='end'){
  for(const b of assets){const a={type:'build',property:b.id};if(p.money>=(b.houseCost||Infinity)+250&&legal(a))return a;}
  for(const b of assets){const a={type:'redeem',property:b.id};if(p.money>=Math.ceil(b.mortgage*1.1)+250&&legal(a))return a;}
  return {type:'end'};
 }
 return null;
}
export class EstateSolo{
 constructor(update,name){this.update=update;this.id='human';this.room='';this.host=true;this.solo=true;this.members=[{id:'human',name:(name.trim()||'あなた').slice(0,20),connected:true},{id:'cpu',name:'CPU トラベラー',connected:true}];this.state=createGame(this.members);this.status='1人プレイ · CPU対戦';this.closed=false;}
 emit(){this.update();this.schedule();}
 fail(message){this.status=message;this.emit();}
 action(action){this.dispatch(this.id,action);}
 dispatch(id,action){if(this.closed)return;const r=act(this.state,id,action);if(!r.ok){this.status=r.error;this.update();return;}this.state=r.state;this.status=this.state.phase==='over'?'対戦終了':'1人プレイ · CPU対戦';this.emit();}
 schedule(){clearTimeout(this.timer);if(this.closed)return;const a=cpuAction(this.state,'cpu');if(a)this.timer=setTimeout(()=>{if(!this.closed)this.dispatch('cpu',a);},650);}
 leave(){this.closed=true;clearTimeout(this.timer);location.href=location.pathname;}
}
