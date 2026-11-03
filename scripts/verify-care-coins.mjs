import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const store=new Map();let failLedger=false;let now=new Date('2026-11-03T08:00:00+09:00').valueOf();
process.env.TZ='Asia/Tokyo';
function load(){const c=vm.createContext({structuredClone,Date:class extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>{if(failLedger&&k==='night-pet-v1')throw Error('quota');store.set(k,v)}}});for(const file of ['pet-core.js','id-care.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),c);return c;}
let c=load();assert.equal(c.NightPet.spendCare('__proto__').ok,false);c.IDCare.snapshot();now+=16*60000;const hunger=c.IDCare.snapshot().hunger;assert.equal(c.IDCare.act('meal').ok,false);assert.equal(c.IDCare.snapshot().hunger,hunger);assert.equal(c.IDCare.act('lights',false).ok,false);assert.equal(c.IDCare.snapshot().lights,true);
c.NightPet.reward({game:'quiz',id:'paid-care-test',coins:10});assert.equal(c.IDCare.act('meal').ok,true);assert.equal(c.NightPet.snapshot().coins,7);assert.equal(c.IDCare.act('meal').ok,false);assert.equal(c.NightPet.snapshot().coins,7);
assert.equal(c.IDCare.act('lights',false).ok,true);assert.equal(c.NightPet.snapshot().coins,5);assert.equal(c.IDCare.act('lights',false).ok,false);assert.equal(c.NightPet.snapshot().coins,5);assert.equal(c.IDCare.act('lights',true).ok,true);assert.equal(c.NightPet.snapshot().coins,5);
assert.equal(c.IDCare.act('snack').ok,true);assert.equal(c.NightPet.snapshot().coins,3);c=load();assert.equal(c.NightPet.snapshot().coins,3);assert.equal(c.IDCare.snapshot().hunger,4);assert.equal(c.NightPet.care('rest').ok,true);assert.equal(c.NightPet.snapshot().coins,1);assert.equal(c.NightPet.care('feed').ok,false);assert.equal(c.NightPet.snapshot().coins,1);console.log('PASS paid care: exact costs, insufficient funds no care mutation, rejected/repeated actions no charge, lights-on free, reload persistence, both modes.');

// The ledger may fail independently while the care sidecar still saves.
store.clear();c=load();c.IDCare.snapshot();c.NightPet.reward({game:'quiz',id:'selective-failure',coins:3});
now+=16*60000;const savedLedger=store.get(c.NightPet.key);failLedger=true;
const meal=c.IDCare.act('meal');assert.equal(meal.ok,true);assert.equal(meal.persistent,false,'a saved sidecar must not hide an unsaved payment');
assert.equal(c.NightPet.snapshot().coins,0);assert.equal(c.NightPet.snapshot().storageOK,false);assert.equal(c.IDCare.snapshot().storageOK,true);assert.equal(store.get(c.NightPet.key),savedLedger);
const before=JSON.stringify(c.IDCare.snapshot());
for(const [type,value] of [['meal'],['snack'],['lights',false]]){assert.equal(c.IDCare.act(type,value).ok,false);assert.equal(c.NightPet.snapshot().coins,0);assert.equal(JSON.stringify(c.IDCare.snapshot()),before,'rejected care must not mutate the sidecar');assert.equal(store.get(c.NightPet.key),savedLedger);}
assert.match(c.NightPet.snapshot().notice,/この画面を閉じると/);
failLedger=false;c.NightPet.reward({game:'quiz',id:'retry-ledger',coins:2});assert.equal(c.NightPet.snapshot().coins,2);c=load();assert.equal(c.NightPet.snapshot().coins,2,'recovery persists the in-memory debit without refunding it');
console.log('PASS selective coin-save failure: honest persistence, rejected care unchanged, retry preserves debit.');
