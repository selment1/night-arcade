// Dormant, dependency-injected persistence boundary. No localStorage access on import.
import {BOARD} from './board.js?v=expansion-1';
import {CARD_DECKS} from './cards.js?v=expansion-1';
import {validateOffer} from './trading.js?v=trade-1';
export const SOLO_SAVE_KEY='night-arcade.estates.solo.v1';
export const SOLO_RULES_VERSION='estates-expansion-trade-1';
const check=(ok,why)=>{if(!ok)throw Error(why);};
const integer=(v,min=0,max=Number.MAX_SAFE_INTEGER)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
const string=(v,max)=>typeof v==='string'&&v.length>0&&v.length<=max;
function keys(o,required,optional=[]){check(o&&typeof o==='object'&&!Array.isArray(o),'object');check(required.every(k=>Object.hasOwn(o,k))&&Object.keys(o).every(k=>required.includes(k)||optional.includes(k)),'fields');}
function unique(a){return Array.isArray(a)&&new Set(a).size===a.length;}
export function validateSoloState(s){
 try{
 keys(s,['players','turn','phase','properties','dice','doubles','log','pending','auction','winner','revision','lastCard','cardEvents','cardSequence','decks'],['trade']);
 check(Array.isArray(s.players)&&s.players.length>=2&&s.players.length<=4,'players');
 const ids=s.players.map(p=>p.id);check(unique(ids)&&ids[0]==='human'&&ids.slice(1).every((id,i)=>id===(i===0?'cpu':'cpu'+(i+1))),'solo identities');
 const alive=id=>s.players.some(p=>p.id===id&&!p.bankrupt);
 const held=new Set();
 for(const p of s.players){
 keys(p,['id','name','money','position','jail','bankrupt','cards','heldCards']);
 check(string(p.name,20)&&p.name.trim()===p.name&&integer(p.money)&&integer(p.position,0,39)&&integer(p.jail,0,3)&&typeof p.bankrupt==='boolean'&&integer(p.cards,0,2)&&Array.isArray(p.heldCards)&&p.cards===p.heldCards.length,'player');
 check(!p.bankrupt||(p.money===0&&p.cards===0),'bankrupt assets');check(!p.jail||p.position===10,'jail');
 for(const c of p.heldCards){keys(c,['type','id']);check(CARD_DECKS[c.type]?.some(d=>d.id===c.id&&d.kind==='escape'),'held card');const key=c.type+':'+c.id;check(!held.has(key),'duplicate held card');held.add(key);}
 }
 check(integer(s.turn,0,s.players.length-1)&&integer(s.revision)&&integer(s.cardSequence)&&integer(s.doubles,0,2),'counters');
 check(['roll','buy','auction','debt','end','trade','over'].includes(s.phase),'phase');
 check(s.phase==='over'||!s.players[s.turn].bankrupt,'active turn');
 check(s.phase==='over'?(alive(s.winner)&&s.players.filter(p=>!p.bankrupt).length===1):s.winner===null&&s.players.filter(p=>!p.bankrupt).length>=2,'winner');
 check(Array.isArray(s.dice)&&s.dice.length===2&&s.dice.every(d=>integer(d,0,6))&&(s.dice.every(d=>d===0)||s.dice.every(d=>d>0)),'dice');
 check(Array.isArray(s.log)&&s.log.length<=80&&s.log.every(x=>string(x,2000)),'log');
 const tiles=BOARD.filter(b=>b.price);keys(s.properties,tiles.map(b=>String(b.id)));
 for(const b of tiles){const p=s.properties[b.id];keys(p,['owner','houses','mortgaged']);check((p.owner===null||alive(p.owner))&&integer(p.houses,0,b.type==='property'?5:0)&&typeof p.mortgaged==='boolean','property');check(p.owner!==null||(!p.houses&&!p.mortgaged),'bank property');if(p.houses){const group=tiles.filter(t=>t.type==='property'&&t.group===b.group).map(t=>s.properties[t.id]);check(group.every(v=>v.owner===p.owner&&!v.mortgaged)&&Math.max(...group.map(v=>v.houses))-Math.min(...group.map(v=>v.houses))<=1,'buildings');}}
 const current=s.players[s.turn];
 if(['buy','auction'].includes(s.phase)){keys(s.pending,['property']);check(integer(s.pending.property,0,39)&&s.properties[s.pending.property]?.owner===null&&current.position===s.pending.property,'pending buy');}
 else if(s.phase==='debt'){keys(s.pending,['amount','creditor','reason'],['resume']);check(integer(s.pending.amount,1)&&s.pending.amount>current.money&&(s.pending.creditor===null||(alive(s.pending.creditor)&&s.pending.creditor!==current.id))&&string(s.pending.reason,2000),'debt');if(s.pending.resume){keys(s.pending.resume,['type','steps']);check(s.pending.resume.type==='jailMove'&&integer(s.pending.resume.steps,2,12)&&current.jail===1,'debt resume');}}
 else check(s.pending===null,'unexpected pending');
 if(s.phase==='auction'){const a=s.auction;keys(a,['property','highestBid','highestBidder','active']);check(a.property===s.pending.property&&unique(a.active)&&a.active.length>0&&a.active.every(alive)&&integer(a.highestBid),'auction');check(a.highestBidder===null?a.highestBid===0:a.active.includes(a.highestBidder)&&a.highestBid>0&&a.highestBid<=s.players.find(p=>p.id===a.highestBidder).money&&a.active.length>1,'bid');}else check(s.auction===null,'unexpected auction');
 if(s.phase==='trade'){keys(s.trade,['id','from','to','give','take','giveCash','takeCash','resume']);check(integer(s.trade.id,1,s.revision)&&['roll','end'].includes(s.trade.resume)&&[s.trade.from,s.trade.to].includes(current.id),'trade');validateOffer(s,s.trade);}else check(s.trade==null,'unexpected trade');
 keys(s.decks,['chance','chest']);for(const type of ['chance','chest']){keys(s.decks[type],['remaining']);const remaining=s.decks[type].remaining;check(unique(remaining)&&remaining.every(id=>CARD_DECKS[type].some(c=>c.id===id)&&!held.has(type+':'+id)),'deck');}
 const event=e=>{keys(e,['type','id','title','text','sequence','playerId']);const c=CARD_DECKS[e.type]?.find(c=>c.id===e.id);check(c&&e.title===c.title&&e.text===c.text&&integer(e.sequence,1,s.cardSequence)&&ids.includes(e.playerId),'card event');};
 check(Array.isArray(s.cardEvents)&&s.cardEvents.length<=24,'card events');s.cardEvents.forEach(event);check(s.cardEvents.every((e,i)=>!i||e.sequence===s.cardEvents[i-1].sequence+1),'event order');
 if(s.lastCard===null)check(s.cardSequence===0&&s.cardEvents.length===0,'last card');else{event(s.lastCard);check(s.lastCard.sequence===s.cardSequence,'sequence');if(s.cardEvents.length)check(JSON.stringify(s.cardEvents.at(-1))===JSON.stringify(s.lastCard),'last event');}
 return {ok:true};
 }catch(e){return {ok:false,error:e.message};}
}
export function validateSoloSave(value){
 try{
 keys(value,['version','rulesVersion','gameId','saveRevision','state','presentationState']);
 check(value.version===1&&value.rulesVersion===SOLO_RULES_VERSION,'unsupported version');check(string(value.gameId,128)&&integer(value.saveRevision,1),'save identity');
 for(const s of [value.state,value.presentationState]){const r=validateSoloState(s);check(r.ok,r.error);}
 check(value.state.revision-value.presentationState.revision<=1&&value.presentationState.revision<=value.state.revision&&value.presentationState.cardSequence<=value.state.cardSequence,'presentation ahead');
 check(value.state.players.every((p,i)=>p.id===value.presentationState.players[i]?.id&&p.name===value.presentationState.players[i]?.name)&&value.state.players.length===value.presentationState.players.length,'presentation identities');
 if(value.state.revision===value.presentationState.revision)check(JSON.stringify(value.state)===JSON.stringify(value.presentationState),'same revision mismatch');
 return {ok:true};
 }catch(e){return {ok:false,error:e.message};}
}
// presentationState must be the last FULLY acknowledged reducer snapshot, never
// At most one unacknowledged transition is supported; a queued multi-step history
// must be drained before saving. Never pass JourneyEffects.previous (advanced before receipts finish) or interpolated displayState.
export function createSoloSave({gameId,saveRevision,state,presentationState}){
 const value={version:1,rulesVersion:SOLO_RULES_VERSION,gameId,saveRevision,state:structuredClone(state),presentationState:structuredClone(presentationState)};const result=validateSoloSave(value);if(!result.ok)throw Error(result.error);return value;
}
export function readSoloSave(storage){
 try{const raw=storage.getItem(SOLO_SAVE_KEY);if(raw===null)return {ok:true,value:null};const value=JSON.parse(raw),result=validateSoloSave(value);return result.ok?{ok:true,value}:{...result,value:null};}catch(e){return {ok:false,error:e.message,value:null};}
}
export function writeSoloSave(storage,value){
 try{
 // Serialize first so only the actually stored JSON representation is validated.
 const raw=JSON.stringify(value),parsed=JSON.parse(raw),result=validateSoloSave(parsed);if(!result.ok)return result;
 const previous=readSoloSave(storage);if(!previous.ok)return previous;
 if(previous.value){check(previous.value.gameId===parsed.gameId,'different game requires explicit replacement policy');check(parsed.saveRevision>previous.value.saveRevision&&parsed.state.revision>=previous.value.state.revision&&parsed.presentationState.revision>=previous.value.presentationState.revision,'stale save');}
 // Web Storage setItem is atomic on failure; do not remove or rewrite any old key.
 storage.setItem(SOLO_SAVE_KEY,raw);return {ok:true};
 }catch(e){return {ok:false,error:e.message};}
}
