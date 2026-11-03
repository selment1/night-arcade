import {BOARD} from './board.js?v=expansion-1';
const check=(ok,message)=>{if(!ok)throw Error(message)};
export function tradable(state,id,owner){const b=BOARD[id],v=state.properties[id];return !!(b&&v&&v.owner===owner&&!v.mortgaged&&!v.houses&&(b.type!=='property'||BOARD.filter(t=>t.group===b.group).every(t=>!state.properties[t.id].houses)));}
export function validateOffer(s,t){
 const from=s.players.find(p=>p.id===t.from),to=s.players.find(p=>p.id===t.to);
 check(from&&to&&from.id!==to.id&&!from.bankrupt&&!to.bankrupt,'交渉相手が不正です');
 for(const [list,owner] of [[t.give,t.from],[t.take,t.to]]){check(Array.isArray(list)&&list.length<=28&&new Set(list).size===list.length,'物件の指定が不正です');for(const id of list)check(Number.isInteger(id)&&tradable(s,id,owner),'相手や自分の抵当なし・同色に建物なしの物件を選んでください');}
 for(const amount of [t.giveCash,t.takeCash])check(Number.isSafeInteger(amount)&&amount>=0&&amount<=1e9,'金額は0以上の整数€です');
 check(t.giveCash===0||t.takeCash===0,'差額はどちらか一方が支払います');
 check(t.give.length+t.take.length>0,'少なくとも1つ物件を選んでください');
 check(from.money>=t.giveCash&&to.money>=t.takeCash,'支払う側の所持金が足りません');
}
export function tradeAction(s,id,a){
 const t=s.trade,respond=['acceptTrade','rejectTrade','cancelTrade','counterTrade'].includes(a.type);
 if(respond){check(s.phase==='trade'&&t&&a.tradeId===t.id,'この交渉は更新または終了しています');check(a.type==='cancelTrade'?id===t.from:id===t.to,'この交渉には応答できません');}
 if(a.type==='offerTrade'||a.type==='counterTrade'){
  if(a.type==='offerTrade')check(['roll','end'].includes(s.phase)&&s.players[s.turn].id===id,'自分の手番の開始時・終了前に交渉できます');
  const offer={id:s.revision+1,from:id,to:a.type==='counterTrade'?t.from:a.to,give:a.give,take:a.take,giveCash:a.giveCash,takeCash:a.takeCash,resume:t?.resume||s.phase};
  validateOffer(s,offer);s.trade=offer;s.phase='trade';return a.type==='counterTrade'?'条件を変更して再提案しました。':'物件の交渉を提案しました。';
 }
 if(a.type==='acceptTrade'){
  validateOffer(s,t);const from=s.players.find(p=>p.id===t.from),to=s.players.find(p=>p.id===t.to);
  for(const id of t.give)s.properties[id].owner=to.id;for(const id of t.take)s.properties[id].owner=from.id;
  from.money+=t.takeCash-t.giveCash;to.money+=t.giveCash-t.takeCash;
 }
 s.phase=t.resume;s.trade=null;return a.type==='acceptTrade'?'交渉成立。物件と差額を交換しました。':a.type==='cancelTrade'?'交渉を取り下げました。':'交渉を見送りました。';
}
export function cpuTrade(s,id){
 const t=s.trade;if(!t||t.to!==id)return null;
 const value=ids=>ids.reduce((n,id)=>n+BOARD[id].price,0);
 const incoming=value(t.give)+t.giveCash,outgoing=value(t.take)+t.takeCash;
 // Public price-based policy: no hidden dice/deck information, no free giveaways.
 const p=s.players.find(p=>p.id===id);
 return {type:incoming>=outgoing&&p.money-t.takeCash+t.giveCash>=100?'acceptTrade':'rejectTrade',tradeId:t.id};
}
