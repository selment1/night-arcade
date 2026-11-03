import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const store=new Map();let now=new Date('2026-11-03T08:00:00+09:00').valueOf();
process.env.TZ='Asia/Tokyo';
function load(){const c=vm.createContext({structuredClone,Date:class extends Date{constructor(...a){super(...(a.length?a:[now]))}static now(){return now}},localStorage:{getItem:k=>store.get(k)||null,setItem:(k,v)=>store.set(k,v)}});for(const file of ['pet-core.js','id-care.js'])vm.runInContext(readFileSync(new URL('../public/'+file,import.meta.url),'utf8'),c);return c;}
let c=load();assert.equal(c.NightPet.spendCare('__proto__').ok,false);c.IDCare.snapshot();now+=16*60000;const hunger=c.IDCare.snapshot().hunger;assert.equal(c.IDCare.act('meal').ok,false);assert.equal(c.IDCare.snapshot().hunger,hunger);assert.equal(c.IDCare.act('lights',false).ok,false);assert.equal(c.IDCare.snapshot().lights,true);
c.NightPet.reward({game:'quiz',id:'paid-care-test',coins:10});assert.equal(c.IDCare.act('meal').ok,true);assert.equal(c.NightPet.snapshot().coins,7);assert.equal(c.IDCare.act('meal').ok,false);assert.equal(c.NightPet.snapshot().coins,7);
assert.equal(c.IDCare.act('lights',false).ok,true);assert.equal(c.NightPet.snapshot().coins,5);assert.equal(c.IDCare.act('lights',false).ok,false);assert.equal(c.NightPet.snapshot().coins,5);assert.equal(c.IDCare.act('lights',true).ok,true);assert.equal(c.NightPet.snapshot().coins,5);
assert.equal(c.IDCare.act('snack').ok,true);assert.equal(c.NightPet.snapshot().coins,3);c=load();assert.equal(c.NightPet.snapshot().coins,3);assert.equal(c.IDCare.snapshot().hunger,4);assert.equal(c.NightPet.care('rest').ok,true);assert.equal(c.NightPet.snapshot().coins,1);assert.equal(c.NightPet.care('feed').ok,false);assert.equal(c.NightPet.snapshot().coins,1);console.log('PASS paid care: exact costs, insufficient funds no care mutation, rejected/repeated actions no charge, lights-on free, reload persistence, both modes.');
