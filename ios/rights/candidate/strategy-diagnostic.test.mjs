import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from './engine.mjs';
import { choose, simulate, runDiagnostic, renderReport } from './strategy-diagnostic.mjs';

test('shortfalls distinguish investment fallback, visit failure and duplicate exclusion', () => {
  const state = createGame(2);
  state.phase = 'choose'; state.players[0].position = 1;
  const p = state.players[0];
  p.cash = 6;
  assert.deepEqual(choose(state, 1), { type: 'visit', shortfall: true, investmentShortfall: true, visitShortfall: false });
  p.cash = 5;
  assert.deepEqual(choose(state, 1), { type: 'end', shortfall: true, investmentShortfall: true, visitShortfall: true });
  assert.deepEqual(choose(state, 0), { type: 'end', shortfall: true, investmentShortfall: false, visitShortfall: true });
  p.investments = [1]; p.visited = [1];
  assert.deepEqual(choose(state, 1), { type: 'end', shortfall: false, investmentShortfall: false, visitShortfall: false });
});

test('matched diagnostic covers every cutoff/count and baseline pairs are exact ties', () => {
  const rows = runDiagnostic(2);
  assert.equal(rows.length, 39);
  for (const count of [2, 3, 4]) {
    const group = rows.filter(r => r.count === count);
    assert.deepEqual(group.map(r => r.cutoff), Array.from({ length: 13 }, (_, i) => i));
    for (const r of group) {
      assert.equal(r.samples, count * 2);
      assert.equal(r.better + r.tied + r.worse, r.samples);
      assert.equal(r.total, r.visits + r.culture + r.assets);
      assert.equal(r.visits, r.uniqueVisits * 4);
      assert.ok(r.shortfalls >= Math.max(r.investmentShortfalls, r.visitShortfalls));
      assert.ok(r.shortfalls <= r.investmentShortfalls + r.visitShortfalls);
    }
    assert.equal(group[0].delta, 0);
    assert.equal(group[0].tied, count * 2);
  }
  assert.deepEqual(simulate(4, 42, 12), simulate(4, 42, 12));
  assert.equal(renderReport(rows, 2), renderReport(runDiagnostic(2), 2));
  for (const invalid of [0, -1, 1.5, 1001]) assert.throws(() => runDiagnostic(invalid));
});
