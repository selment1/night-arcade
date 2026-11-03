import assert from 'node:assert/strict';
import {createGame,act} from '../public/estates/engine.js';
import {CARD_DECKS} from '../public/estates/cards.js';
const make=()=>createGame(['a','b','c','d'].map(id=>({id,name:id})));
const apply=(s,action,rng)=>{const before=JSON.stringify(s),r=act(s,s.players[s.turn].id,action,rng);assert.ok(r.ok,r.error);assert.equal(JSON.stringify(s),before);return r.state;};
function draw(s,type,id,position=type==='chance'?7:17){
 s.players[s.turn].position=position-3;s.phase='roll';s.decks[type].remaining=[id];
 const v=[.01,.18,0];let i=0;return apply(s,{type:'roll'},()=>v[i++]??0);
}
let count=0;function test(name,fn){fn();count++;console.log(`✓ ${name}`);}
test('each of 24 original cards resolves its declared money/movement/jail effect in four-player games',()=>{
 for(const [type,cards]of Object.entries(CARD_DECKS))for(const c of cards){
  let s=make();s.properties[1]={owner:'a',houses:2,mortgaged:false};s.properties[3]={owner:'a',houses:5,mortgaged:false};
  s=draw(s,type,c.id);const p=s.players[0];assert.equal(s.lastCard.id,c.id);assert.equal(s.lastCard.type,type);assert.equal(s.lastCard.sequence,1);assert.equal(s.cardEvents.length,1);
  if(c.kind==='income')assert.equal(p.money,1500+c.amount);
  if(c.kind==='payment')assert.equal(p.money,1500-c.amount);
  if(c.kind==='repairs')assert.equal(p.money,1500-2*c.house-c.hotel);
  if(c.kind==='jail'){assert.equal(p.jail,3);assert.equal(p.position,10);assert.equal(p.money,1500);}
  if(c.kind==='escape'){assert.equal(p.cards,1);assert.deepEqual(p.heldCards,[{type,id:c.id}]);}
  if(c.kind==='destination'){assert.equal(p.position,c.target);assert.equal(p.money,c.target===0?1700:1500);assert.equal(s.phase,c.target===0?'end':'buy');}
  if(c.kind==='nearest'){assert.equal(p.position,15);assert.equal(s.phase,'buy');}
  if(c.kind==='back'){assert.equal(p.position,4);assert.equal(p.money,1300);}
 }
});
test('finite independent decks, no repeated draw before exhaustion, held escape excluded at refill',()=>{
 let s=make();const seen=new Set();
 for(let i=0;i<12;i++){
  s.players[0].position=14;s.players[0].jail=0;s.phase='roll';let n=0;s=apply(s,{type:'roll'},()=>[.01,.18,0][n++]??0);
  assert.ok(!seen.has(s.lastCard.id));seen.add(s.lastCard.id);
 }
 assert.equal(s.decks.chest.remaining.length,0);assert.equal(s.decks.chance.remaining.length,12);
 s.players[0].jail=0;s.players[0].position=14;s.phase='roll';let n=0;s=apply(s,{type:'roll'},()=>[.01,.18,0][n++]??0);
 assert.equal(s.decks.chest.remaining.length,10);assert.ok(!s.decks.chest.remaining.includes('escape'));
});
test('using held escape returns it to correct deck; no duplicated card on further action',()=>{
 let s=draw(make(),'chance','escape');s.players[0].jail=3;s.phase='roll';s=apply(s,{type:'useCard'});
 assert.equal(s.players[0].cards,0);assert.equal(s.players[0].heldCards.length,0);assert.deepEqual(s.decks.chance.remaining,['escape']);assert.equal(s.cardEvents.length,0);
});
test('backward movement does not earn GO, but destination tax and chained letter resolve',()=>{
 let s=draw(make(),'chance','detour');assert.equal(s.players[0].money,1300);
 s=make();s.decks.chest.remaining=['refund'];s=draw(s,'chance','detour',36);
 assert.equal(s.players[0].position,33);assert.equal(s.players[0].money,1600);assert.deepEqual(s.cardEvents.map(c=>c.type),['chance','chest']);assert.equal(s.lastCard.sequence,2);
});
test('nearest station passes GO exactly once; movement resolves rent and unowned destination',()=>{
 let s=make();s.properties[5].owner='b';s=draw(s,'chance','rail',36);assert.equal(s.players[0].position,5);assert.equal(s.players[0].money,1675);assert.equal(s.players[1].money,1525);
 s=make();s.properties[39].owner='b';s=draw(s,'chance','paris');assert.equal(s.players[0].money,1450);assert.equal(s.players[1].money,1550);
});
test('card payment debt settles only once after mortgage and blocks end',()=>{
 let s=make();s.players[0].money=0;s.properties[5].owner='a';s=draw(s,'chance','ticket');assert.equal(s.phase,'debt');assert.equal(s.pending.amount,50);assert.equal(act(s,'a',{type:'end'}).ok,false);
 s=apply(s,{type:'mortgage',property:5});assert.equal(s.phase,'end');assert.equal(s.players[0].money,50);s=apply(s,{type:'end'});assert.equal(s.players[0].money,50);
});
test('repair counts hotel once, debt amount fixed before house sale, no charge for zero buildings',()=>{
 let s=make();s.players[0].money=0;s.properties[1]={owner:'a',houses:2,mortgaged:false};s.properties[3]={owner:'a',houses:2,mortgaged:false};
 s=draw(s,'chance','repairs');assert.equal(s.pending.amount,100);
 for(const property of [1,3,1,3])s=apply(s,{type:'sell',property});assert.equal(s.phase,'end');assert.equal(s.players[0].money,0);
 s=draw(make(),'chest','maintenance');assert.equal(s.players[0].money,1500);assert.equal(s.phase,'end');
});
test('bankruptcy returns held cards to bank deck, or transfers exact deck identity to creditor',()=>{
 let s=draw(make(),'chest','escape');s.players[0].money=0;s=draw(s,'chance','conservation');s=apply(s,{type:'bankrupt'});assert.equal(s.players[0].bankrupt,true);assert.ok(s.decks.chest.remaining.includes('escape'));assert.equal(s.turn,1);
 s=draw(make(),'chance','escape');s.players[0].money=0;s.players[0].position=36;s.properties[39]={owner:'b',houses:5,mortgaged:false};s.phase='roll';let n=0;s=apply(s,{type:'roll'},()=>[.01,.18][n++]);s=apply(s,{type:'bankrupt'});
 assert.equal(s.players[1].cards,1);assert.deepEqual(s.players[1].heldCards,[{type:'chance',id:'escape'}]);assert.ok(!s.decks.chance.remaining.includes('escape'));
 s.players[1].jail=3;s=apply(s,{type:'useCard'});assert.ok(s.decks.chance.remaining.includes('escape'));
});
console.log(`${count} card test groups passed (all 24 effects, four players).`);
