import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
process.env.TZ='Asia/Tokyo';
const code=readFileSync(new URL('../public/id-care.js',import.meta.url),'utf8');
const start=new Date('2026-11-03T08:00:00+09:00').valueOf(), MIN=60000,HOUR=60*MIN;
function harness({stage=0,at=start,store=new Map(),fail=false}={}){let now=at,selected='mori';const original=JSON.stringify({coins:313,stage});store.set('night-pet-v1',original);const context={Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},localStorage:{getItem:k=>{if(fail)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(fail)throw Error('blocked');store.set(k,v);}},NightPet:{snapshot:()=>({selected,characters:{mori:{stage},kitsune:{stage:2}}})}};vm.runInNewContext(code,context);return{api:context.IDCare,advance:ms=>now+=ms,store,now:()=>now,select:id=>selected=id,original};}
let h=harness();assert.equal(h.api.snapshot().phase,'egg');assert.equal(h.api.act('meal').ok,false);h.advance(MIN);assert.equal(h.api.snapshot().phase,'baby');h.advance(HOUR);assert.equal(h.api.snapshot().phase,'child');h.advance(24*HOUR);assert.equal(h.api.snapshot().phase,'teen');h.advance(24*HOUR);assert.equal(h.api.snapshot().phase,'friend');assert.ok(['sunny','dreamy','wild'].includes(h.api.snapshot().variant));assert.equal(h.store.get('night-pet-v1'),h.original);
h=harness({stage:2});assert.equal(h.api.snapshot().phase,'friend');assert.equal(h.api.act('meal').ok,false);h.advance(90*MIN);assert.equal(h.api.snapshot().hunger,3);assert.equal(h.api.snapshot().waste,1);assert.equal(h.api.act('meal').ok,true);assert.equal(h.api.snapshot().hunger,4);assert.equal(h.api.act('toilet').ok,true);assert.equal(h.api.snapshot().waste,0);h.advance(4*HOUR);assert.equal(h.api.snapshot().dirty,true);assert.equal(h.api.act('bath').ok,true);assert.equal(h.api.snapshot().dirty,false);h.advance(5*HOUR);assert.equal(h.api.snapshot().sick,true);assert.ok(h.api.snapshot().careMisses>0);assert.equal(h.api.act('medicine').ok,true);assert.equal(h.api.snapshot().sick,false);
h=harness({stage:2,at:new Date('2026-11-03T21:59:00+09:00').valueOf()});h.api.snapshot();h.advance(MIN);assert.equal(h.api.snapshot().asleep,true);assert.equal(h.api.act('meal').ok,false);h.api.act('lights',false);const before=h.api.snapshot();h.advance(8*HOUR);assert.equal(h.api.snapshot().hunger,before.hunger);assert.equal(h.api.snapshot().careMisses,before.careMisses);h.advance(HOUR);assert.equal(h.api.snapshot().asleep,false);
h=harness({stage:2});h.api.snapshot();h.advance(90*MIN);h.api.act('meal');h.api.act('snack');h.api.act('toy');assert.deepEqual(Array.from(h.api.snapshot().friendship),[true,true,true,false]);h.advance(48*HOUR);assert.equal(h.api.snapshot().friendship[3],true);h.api.act('room','cloud');assert.equal(h.api.snapshot().room,'cloud');const reload=harness({stage:2,store:h.store,at:h.now()});assert.equal(reload.api.snapshot().room,'cloud');assert.equal(reload.api.snapshot().friendship[3],true);h.select('kitsune');assert.equal(h.api.snapshot().room,'meadow');h.select('mori');assert.equal(h.api.snapshot().room,'cloud');
h=harness({stage:1,fail:true});assert.equal(h.api.snapshot().storageOK,false);h.api.act('room','sunset');assert.equal(h.api.snapshot().room,'sunset');assert.equal(h.api.snapshot().storageOK,false);
const corrupt=new Map([['night-pet-id-v1','not JSON']]);h=harness({store:corrupt});assert.equal(h.api.snapshot().storageOK,false);h.api.act('room','cloud');assert.equal(corrupt.get('night-pet-id-v1'),'not JSON');
// Bounded offline catchup is deterministic, chronological growth never needs a visible UI timer.
const a=harness(),b=harness();a.api.snapshot();b.api.snapshot();a.advance(3*HOUR);b.advance(HOUR);b.api.snapshot();b.advance(2*HOUR);assert.equal(a.api.snapshot().hunger,b.api.snapshot().hunger);assert.equal(a.api.snapshot().waste,b.api.snapshot().waste);a.advance(365*24*HOUR);assert.equal(a.api.snapshot().phase,'friend');
// No CustomEvent global required; no mutation of legacy ledger.
assert.equal(a.store.get('night-pet-v1'),a.original);
console.log('ID care: growth, migration, sleep/wake, care, sickness, friendship, per-character save, offline simulation and storage protection passed.');

// Malformed containers/entries must never be silently replaced or report durable saves.
for (const pets of [[], {mori:'corrupted'}, {mori:null}, {mori:[]}, {kitsune:42}]) {
  const raw=JSON.stringify({version:1,pets}),store=new Map([['night-pet-id-v1',raw]]);
  const broken=harness({store});
  assert.equal(broken.api.snapshot().storageOK,false);
  assert.ok(broken.api.snapshot().notice);
  assert.equal(broken.api.act('room','cloud').persistent,false);
  assert.equal(broken.api.snapshot().room,'cloud');
  assert.equal(store.get('night-pet-id-v1'),raw);
  assert.equal(store.get('night-pet-v1'),broken.original);
}
const empty=harness({store:new Map([['night-pet-id-v1',JSON.stringify({version:1,pets:{}})]])});
assert.equal(empty.api.act('room','sunset').persistent,true);
assert.equal(harness({store:empty.store}).api.snapshot().room,'sunset');
console.log('ID care malformed save protection and valid empty-save persistence passed.');
