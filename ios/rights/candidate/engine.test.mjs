import test from 'node:test';
import assert from 'node:assert/strict';
import { SPACES, createGame, reduce, score, winners } from './engine.mjs';
const one = seed => ({ seed, value: 0 });
function freeze(value) { Object.freeze(value); for (const v of Object.values(value)) if (v && typeof v === 'object') freeze(v); return value; }
test('independent 32-space composition and four equally spaced rests', () => {
  assert.equal(SPACES.length, 32);
  for (const [kind, count] of Object.entries({ hub:16, route:4, event:8, rest:4 })) assert.equal(SPACES.filter(s => s.kind === kind).length, count);
  assert.deepEqual(SPACES.filter(s => s.kind === 'rest').map(s => s.id), [0,8,16,24]);
  for (const count of [1,5,2.5]) assert.throws(() => createGame(count));
});
test('pure transition, actor/phase guards, visit fee and duplicate guards', () => {
  const start = freeze(createGame(2));
  assert.equal(reduce(start, { type:'move', actor:1 }), start);
  assert.equal(reduce(start, { type:'visit' }), start);
  const landed = freeze(reduce(start, { type:'move', actor:0 }, one));
  assert.equal(start.players[0].position, 0);
  const visited = reduce(landed, { type:'visit' });
  assert.equal(visited.players[0].cash, 54);
  assert.equal(visited.players[0].culture, 2);
  assert.deepEqual(visited.players[0].visited, [1]);
  assert.equal(reduce(visited, { type:'visit' }), visited);
  const revisit = { ...visited, phase:'choose' };
  assert.equal(reduce(revisit, { type:'visit' }), revisit);
  const poor = structuredClone(landed); poor.players[0].cash = 5;
  assert.equal(reduce(poor, { type:'visit' }), poor);
  assert.equal(reduce(poor, { type:'invest' }), poor);
});
test('investments are nonexclusive, preserve principal and pay only between rounds', () => {
  let s = createGame(2);
  for (let i=0;i<2;i++) { s = reduce(s,{type:'move'},one); s = reduce(s,{type:'invest'}); s = reduce(s,{type:'end'}); }
  assert.equal(s.round, 2);
  for (const p of s.players) { assert.deepEqual(p.investments,[1]); assert.equal(p.cash,49); assert.equal(score(p).assets,7); }
  const dup = structuredClone(s); dup.phase='choose';
  assert.equal(reduce(dup,{type:'invest'}), dup);
});
test('invalid RNG cannot mutate input; events never create debt', () => {
  const start = freeze(createGame(2));
  for (const result of [{seed:1,value:1},{seed:1,value:-1},{seed:1,value:NaN},{seed:-1,value:0},{seed:1.5,value:0}]) assert.throws(() => reduce(start,{type:'move'},()=>result));
  const s=createGame(2); s.players[0].position=8; s.players[0].cash=2;
  const next=reduce(s,{type:'move'},one);
  assert.equal(next.players[0].cash,0); assert.equal(next.players[0].culture,2);
});
function simulate(count, seed) {
  let s=createGame(count,seed); const turns=Array(count).fill(0); let steps=0;
  while (s.phase!=='finished') {
    assert.ok(++steps<=count*12*3);
    if(s.phase==='move') { turns[s.active]++; s=reduce(s,{type:'move'}); }
    else if(s.phase==='choose') {
      const p=s.players[s.active], spot=SPACES[p.position];
      const type=s.round<=4 && p.cash>=spot.investment && !p.investments.includes(spot.id) ? 'invest' : p.cash>=6 && !p.visited.includes(spot.id) ? 'visit' : 'end';
      s=reduce(s,{type});
    } else s=reduce(s,{type:'end'});
    for(const p of s.players) {
      assert.ok(Number.isInteger(p.cash)&&p.cash>=0);
      assert.ok(p.position>=0&&p.position<32);
      assert.equal(new Set(p.visited).size,p.visited.length);
      assert.equal(new Set(p.investments).size,p.investments.length);
    }
  }
  assert.deepEqual(turns,Array(count).fill(12)); assert.equal(s.round,12);
  assert.ok(winners(s).length>=1); assert.equal(reduce(s,{type:'move'}),s);
  return s;
}
test('300 seeded full matches terminate with exact equal turns and replay deterministically', () => {
  for(let count=2;count<=4;count++) for(let seed=0;seed<100;seed++) assert.deepEqual(simulate(count,seed),simulate(count,seed));
});
test('score formula, shared ties, no final-round subsidy', () => {
  assert.deepEqual(score({cash:23,investments:[1],culture:3,visited:[1,3]}),{visits:8,culture:9,assets:4,total:21});
  let s=createGame(2); assert.deepEqual(winners(s),[]);
  s.round=12; s.active=1; s.phase='end';
  s=reduce(s,{type:'end'});
  assert.deepEqual(s.players.map(p=>p.cash),[60,60]); assert.deepEqual(winners(s),[0,1]);
});
