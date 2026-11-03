import assert from 'node:assert/strict';
import {createGame,act} from '../public/estates/engine.js';
import {cpuAction} from '../public/estates/solo.js';
const fresh=()=>{const s=createGame([{id:'a',name:'A'},{id:'b',name:'B'},{id:'c',name:'C'}]);s.properties[1].owner='a';s.properties[3].owner='b';return s};
const offer={type:'offerTrade',to:'b',give:[1],take:[3],giveCash:10,takeCash:0};
const ok=(s,id,a)=>{const r=act(s,id,a);assert(r.ok,r.error);return r.state};
const no=(s,id,a)=>{const before=JSON.stringify(s),r=act(s,id,a);assert(!r.ok,JSON.stringify(a));assert.equal(r.state,s);assert.equal(JSON.stringify(s),before)};
let s=fresh(),t=ok(s,'a',offer);assert.equal(t.phase,'trade');assert.equal(t.players[0].money,1500);assert.equal(t.properties[1].owner,'a');
for(const [id,a] of [['a',{type:'acceptTrade',tradeId:t.trade.id}],['c',{type:'acceptTrade',tradeId:t.trade.id}],['b',{type:'cancelTrade',tradeId:t.trade.id}],['a',{type:'roll'}],['b',{type:'acceptTrade',tradeId:999}]])no(t,id,a);
const accepted=ok(t,'b',{type:'acceptTrade',tradeId:t.trade.id});assert.equal(accepted.phase,'roll');assert.equal(accepted.turn,0);assert.equal(accepted.properties[1].owner,'b');assert.equal(accepted.properties[3].owner,'a');assert.deepEqual(accepted.players.map(p=>p.money),[1490,1510,1500]);no(accepted,'b',{type:'acceptTrade',tradeId:t.trade.id});
for(const type of ['rejectTrade','cancelTrade']){const r=ok(t,type==='rejectTrade'?'b':'a',{type,tradeId:t.trade.id});assert.deepEqual(r.properties,s.properties);assert.deepEqual(r.players,s.players);assert.equal(r.phase,'roll')}
let counter=ok(t,'b',{type:'counterTrade',tradeId:t.trade.id,to:'c',give:[3],take:[1],giveCash:0,takeCash:30});assert.equal(counter.trade.to,'a');no(counter,'a',{type:'acceptTrade',tradeId:t.trade.id});let done=ok(counter,'a',{type:'acceptTrade',tradeId:counter.trade.id});assert.equal(done.players[0].money,1470);assert.equal(done.players[1].money,1530);assert.equal(done.turn,0);
for(const patch of [{to:'a'},{to:'missing'},{give:[1,1]},{give:[3]},{give:[-1]},{give:['1']},{give:null},{give:[],take:[]},{giveCash:-1},{giveCash:.5},{giveCash:NaN},{giveCash:1e12},{giveCash:1600},{giveCash:10,takeCash:10}])no(s,'a',{...offer,...patch});
for(const phase of ['buy','debt','auction','over']){const f=fresh();f.phase=phase;no(f,'a',offer)}no(s,'b',offer);
for(const change of [f=>f.properties[1].mortgaged=true,f=>f.properties[3].houses=1,f=>f.players[1].bankrupt=true]){const f=fresh();change(f);no(f,'a',offer)}
const changed=structuredClone(t);changed.players[0].money=0;no(changed,'b',{type:'acceptTrade',tradeId:t.trade.id});
assert.equal(cpuAction(t,'b').type,'acceptTrade');t=ok(s,'a',{...offer,give:[],take:[3],giveCash:1});assert.equal(cpuAction(t,'b').type,'rejectTrade');assert.equal(cpuAction(t,'c'),null);
console.log('PASS trades: atomic cash/deeds exchange, owner/actor/phase/funds/building/mortgage guards, malformed offers, counter/reject/cancel, stale/double acceptance, CPU fair/unfair decisions.');
