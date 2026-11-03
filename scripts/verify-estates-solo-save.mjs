import assert from 'node:assert/strict';
import {createGame,act} from '../public/estates/engine.js';
import {cpuAction} from '../public/estates/solo.js';
import {SOLO_SAVE_KEY,createSoloSave,validateSoloSave,validateSoloState,readSoloSave,writeSoloSave} from '../public/estates/solo-save.js';
const fresh=()=>createGame([{id:'human',name:'あなた'},{id:'cpu',name:'CPU'}]);
const envelope=(state=fresh(),presentationState=state,saveRevision=1)=>createSoloSave({gameId:'test-game',saveRevision,state,presentationState});
const map=new Map([['pet-save','untouched'],['old-game-save','untouched']]);const storage={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
assert.deepEqual(readSoloSave(storage),{ok:true,value:null});assert(writeSoloSave(storage,envelope()).ok);assert.deepEqual(readSoloSave(storage).value,envelope());
const original=map.get(SOLO_SAVE_KEY);assert(!writeSoloSave(storage,envelope()).ok);assert.equal(map.get(SOLO_SAVE_KEY),original);
assert(!writeSoloSave({...storage,setItem(){throw Error('QuotaExceededError');}},envelope(fresh(),fresh(),2)).ok);assert.equal(map.get(SOLO_SAVE_KEY),original);
assert(!readSoloSave({getItem(){throw Error('SecurityError');}}).ok);let wrote=false;assert(!writeSoloSave({getItem(){throw Error('SecurityError');},setItem(){wrote=true;}},envelope()).ok);assert(!wrote);
const mutations=[e=>e.version=2,e=>e.rulesVersion='future',e=>e.state.players[1].id='human',e=>e.state.players[0].money=-1,e=>e.state.players[0].position=40,e=>e.state.properties[1].owner='stranger',e=>delete e.state.properties[1],e=>e.state.pending={property:1},e=>e.state.auction={},e=>e.state.trade={},e=>e.state.decks.chance.remaining.push('unknown'),e=>e.state.players[0].cards=1,e=>e.presentationState.revision=2,e=>e.state.revision=2,e=>e.state.extra=true,e=>e.saveRevision=0];
for(const mutate of mutations){const e=envelope();mutate(e);assert(!validateSoloSave(e).ok,mutate.toString());map.set(SOLO_SAVE_KEY,JSON.stringify(e));const raw=map.get(SOLO_SAVE_KEY);assert(!readSoloSave(storage).ok);assert(!writeSoloSave(storage,envelope()).ok);assert.equal(map.get(SOLO_SAVE_KEY),raw);}
for(const raw of ['{','null','[]']){map.set(SOLO_SAVE_KEY,raw);assert(!readSoloSave(storage).ok);assert(!writeSoloSave(storage,envelope()).ok);assert.equal(map.get(SOLO_SAVE_KEY),raw);}
assert.equal(map.get('pet-save'),'untouched');assert.equal(map.get('old-game-save'),'untouched');
const phases=new Set(),fixtures=new Map();let count=0;
for(const count of [3,4]){const state=createGame(Array.from({length:count},(_,i)=>({id:i===0?'human':i===1?'cpu':'cpu'+i,name:'Player '+i})));assert(validateSoloSave(envelope(state)).ok);}
for(let seed=1;seed<=12;seed++){
 let n=seed,s=fresh(),previous=s;const rng=()=>((n=(n*1664525+1013904223)>>>0)/4294967296);
 for(let i=0;i<3000;i++){
  const result=validateSoloState(s);assert(result.ok,`${result.error}: ${JSON.stringify(s)}`);assert.deepEqual(JSON.parse(JSON.stringify(envelope(s,previous))),envelope(s,previous));phases.add(s.phase);fixtures.set(s.phase,structuredClone(s));count++;if(s.phase==='over')break;
  const id=s.phase==='auction'?s.auction.active.find(id=>id!==s.auction.highestBidder):s.players[s.turn].id;
  const r=act(s,id,cpuAction(s,id),rng);assert(r.ok,r.error);previous=s;s=r.state;
 }
}
let t=fresh();t.properties[1].owner='human';const offered=act(t,'human',{type:'offerTrade',to:'cpu',give:[1],take:[],giveCash:0,takeCash:10});assert(offered.ok);assert(validateSoloSave(envelope(offered.state,t)).ok);phases.add('trade');
for(const change of [s=>s.trade.id=0,s=>s.trade.give=[1,1],s=>s.trade.from='nobody',s=>s.trade.resume='buy']){const bad=structuredClone(offered.state);change(bad);assert(!validateSoloState(bad).ok);}
for(const [phase,change] of [['debt',s=>s.pending.amount=0],['debt',s=>s.pending.creditor=s.players[s.turn].id],['auction',s=>s.auction.highestBid=-1],['auction',s=>s.auction.active=['unknown']],['over',s=>s.winner=null]]){const s=structuredClone(fixtures.get(phase));change(s);assert(!validateSoloState(s).ok);}
assert.equal(fixtures.get('over').pending,null);
const jailed=fresh();jailed.players[0].position=10;jailed.players[0].jail=1;jailed.players[0].money=0;
let die=0;const jailDebt=act(jailed,'human',{type:'roll'},()=>++die%2?0:0.2);assert(jailDebt.ok);assert.equal(jailDebt.state.phase,'debt');assert.equal(jailDebt.state.pending.resume.type,'jailMove');assert(validateSoloSave(envelope(jailDebt.state,jailed)).ok);
const badJail=structuredClone(jailDebt.state);badJail.pending.resume.steps=13;assert(!validateSoloState(badJail).ok);
const held=fresh();held.players[0].cards=1;held.players[0].heldCards=[{type:'chance',id:'escape'}];held.decks.chance.remaining=held.decks.chance.remaining.filter(id=>id!=='escape');assert(validateSoloSave(envelope(held)).ok);held.decks.chance.remaining.push('escape');assert(!validateSoloState(held).ok);
const gap=envelope();gap.state.revision=2;assert(!validateSoloSave(gap).ok);

assert.deepEqual([...phases].sort(),['roll','buy','auction','debt','end','trade','over'].sort());
console.log(`Estates dormant solo-save: ${count} roundtrips, all 7 phases; malformed/future/quota/read-denied isolation passed`);
