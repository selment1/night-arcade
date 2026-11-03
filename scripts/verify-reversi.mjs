import assert from 'node:assert/strict';import{initial,moves,flips,play,directions}from'../public/games/reversi-engine.js';
assert.deepEqual(moves(initial(),1),[19,26,37,44]);
const all=Array(64).fill(0);for(const[dr,dc]of directions){all[(3+dr)*8+3+dc]=2;all[(3+2*dr)*8+3+2*dc]=1}assert.equal(flips(all,27,1).length,8);assert.equal(play(all,27,1).board.filter(v=>v===1).length,17);assert.equal(play(initial(),0,1),null);
const end=Array(64).fill(1);end[0]=0;end[1]=2;assert.equal(play(end,0,1).ended,true);
const pass=[1,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,1,1,2,2,1,1,2,0,1,1,1,2,2,1,2,1,1,1,1,2,2,1,2,0,1,2,1,1,2,1,2,1,1,1,1,1,1,1,2,2,1,1,2,2,1,1,0];const p=play(pass,24,2);assert.equal(p.pass,true);assert.equal(p.turn,2);assert.equal(p.ended,false);
console.log('Reversi fixtures passed: initial, eight directions, illegal, pass, end');
