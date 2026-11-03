import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
process.env.TZ='Asia/Tokyo';
const code=readFileSync(new URL('../public/id-care.js',import.meta.url),'utf8');
const start=new Date('2026-11-03T08:00:00+09:00').valueOf(), MIN=60000,HOUR=60*MIN;
function harness({stage=0,at=start,store=new Map(),fail=false,readFailure=false}={}){let now=at,selected='mori';const original=JSON.stringify({coins:313,stage});store.set('night-pet-v1',original);const context={Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},localStorage:{getItem:k=>{if(fail||readFailure)throw Error('blocked');return store.get(k)||null;},setItem:(k,v)=>{if(fail)throw Error('blocked');store.set(k,v);}},NightPet:{spendCare:action=>({ok:true,cost:action==='meal'?3:2}),snapshot:()=>({selected,characters:{mori:{stage},kitsune:{stage:2}}})}};vm.runInNewContext(code,context);return{api:context.IDCare,setReadFailure:value=>readFailure=value,advance:ms=>now+=ms,store,now:()=>now,select:id=>selected=id,original};}
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

// Clock rollback must not replay elapsed care, regress growth or rewrite friendship age.
const clockPet=harness({stage:1});
clockPet.api.snapshot();clockPet.advance(90*MIN);
const clockBefore=clockPet.api.snapshot();
clockPet.advance(-60*MIN);
const clockBack=clockPet.api.snapshot();
assert.equal(clockBack.lastTick,clockBefore.lastTick);
assert.equal(clockBack.hunger,clockBefore.hunger);
clockPet.api.act('room','cloud');
clockPet.advance(60*MIN);
assert.equal(clockPet.api.snapshot().activeMinutes,clockBefore.activeMinutes);
assert.equal(clockPet.api.snapshot().hunger,clockBefore.hunger);
const maturePet=harness({stage:2});
const matureBefore=maturePet.api.snapshot();
maturePet.advance(-72*HOUR);
assert.equal(maturePet.api.snapshot().phase,'friend');
maturePet.api.act('room','cloud');
const matureReload=harness({stage:2,store:maturePet.store,at:maturePet.now()});
assert.equal(matureReload.api.snapshot().phase,'friend');
assert.equal(matureReload.api.snapshot().bornAt,matureBefore.bornAt);
assert.equal(matureReload.api.snapshot().friendSince,matureBefore.friendSince);
const cooldownPet=harness({stage:2});
assert.equal(cooldownPet.api.act('toy').ok,true);
const actionAt=cooldownPet.api.snapshot().lastAction.toy;
cooldownPet.advance(-MIN);cooldownPet.api.snapshot();cooldownPet.advance(5000);
assert.equal(cooldownPet.api.act('toy').ok,false);
assert.equal(cooldownPet.api.snapshot().lastAction.toy,actionAt);
cooldownPet.advance(MIN);
assert.equal(cooldownPet.api.act('toy').ok,true);
console.log('ID care clock rollback: no replayed decay, growth regression, friendship timestamp rewrite or cooldown bypass.');

// A failed primary read must protect unknown existing bytes for the whole session,
// even when writes work and the read restriction is later lifted.
const savedPet=harness({stage:2});
savedPet.api.act('toy');savedPet.api.act('room','cloud');
const savedState=savedPet.api.snapshot();
const savedRaw='  '+savedPet.store.get('night-pet-id-v1')+'\n';
savedPet.store.set('night-pet-id-v1',savedRaw);
const unreadable=harness({store:savedPet.store,readFailure:true});
assert.equal(unreadable.api.snapshot().storageOK,false);
assert.ok(unreadable.api.snapshot().notice);
assert.equal(unreadable.api.act('room','sunset').persistent,false);
assert.equal(unreadable.api.snapshot().room,'sunset');
assert.equal(savedPet.store.get('night-pet-id-v1'),savedRaw);
unreadable.setReadFailure(false);
unreadable.advance(MIN);
assert.equal(unreadable.api.act('room','meadow').persistent,false);
assert.equal(unreadable.api.snapshot().storageOK,false);
assert.ok(unreadable.api.snapshot().notice);
assert.equal(savedPet.store.get('night-pet-id-v1'),savedRaw);
assert.equal(savedPet.store.get('night-pet-v1'),unreadable.original);
const recovered=harness({store:savedPet.store});
const recoveredState=recovered.api.snapshot();
assert.equal(recoveredState.storageOK,true);
assert.equal(recoveredState.phase,savedState.phase);
assert.equal(recoveredState.bornAt,savedState.bornAt);
assert.deepEqual(Array.from(recoveredState.friendship),Array.from(savedState.friendship));
assert.equal(recoveredState.room,'cloud');
assert.equal(recovered.api.act('room','sunset').persistent,true);
assert.equal(harness({store:savedPet.store}).api.snapshot().room,'sunset');
console.log('ID care primary read failure: session-long byte preservation and reload recovery passed.');
