// Offline diagnostic only: never imported by the game or the iOS bundle.
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { ROUNDS, SPACES, createGame, reduce, score } from './engine.mjs';

export function choose(state, cutoff) {
  const p = state.players[state.active], space = SPACES[p.position];
  const wantsInvestment = state.round <= cutoff && !p.investments.includes(space.id);
  const investmentShortfall = wantsInvestment && p.cash < space.investment;
  if (wantsInvestment && !investmentShortfall) return { type: 'invest', shortfall: false, investmentShortfall: false, visitShortfall: false };
  const wantsVisit = !p.visited.includes(space.id);
  const visitShortfall = wantsVisit && p.cash < 6;
  return { type: wantsVisit && !visitShortfall ? 'visit' : 'end', shortfall: investmentShortfall || visitShortfall, investmentShortfall, visitShortfall };
}

export function simulate(count, seed, cutoff) {
  assert.ok(Number.isInteger(cutoff) && cutoff >= 0 && cutoff <= ROUNDS);
  let state = createGame(count, seed), steps = 0;
  const turns = Array(count).fill(0), shortfalls = Array(count).fill(0), investmentShortfalls = Array(count).fill(0), visitShortfalls = Array(count).fill(0);
  while (state.phase !== 'finished') {
    assert.ok(++steps <= count * ROUNDS * 3, 'bounded full match');
    let type = 'end';
    if (state.phase === 'move') { turns[state.active]++; type = 'move'; }
    if (state.phase === 'choose') {
      const choice = choose(state, cutoff);
      type = choice.type;
      if (choice.shortfall) shortfalls[state.active]++;
      if (choice.investmentShortfall) investmentShortfalls[state.active]++;
      if (choice.visitShortfall) visitShortfalls[state.active]++;
    }
    const next = reduce(state, { type });
    assert.notEqual(next, state, 'policy must select a legal action');
    state = next;
  }
  assert.deepEqual(turns, Array(count).fill(ROUNDS));
  return state.players.map((p, seat) => ({ seat, ...score(p), uniqueVisits: p.visited.length, shortfalls: shortfalls[seat], investmentShortfalls: investmentShortfalls[seat], visitShortfalls: visitShortfalls[seat] }));
}

export function runDiagnostic(seedCount = 100) {
  assert.ok(Number.isInteger(seedCount) && seedCount >= 1 && seedCount <= 1000, 'seeds must be an integer from 1 to 1000');
  const rows = [];
  for (const count of [2, 3, 4]) {
    const baselines = Array.from({ length: seedCount }, (_, seed) => simulate(count, seed, 0));
    for (let cutoff = 0; cutoff <= ROUNDS; cutoff++) {
      const sums = { total: 0, visits: 0, culture: 0, assets: 0, uniqueVisits: 0, shortfalls: 0, investmentShortfalls: 0, visitShortfalls: 0, delta: 0, better: 0, tied: 0, worse: 0 };
      for (let seed = 0; seed < seedCount; seed++) {
        const players = cutoff === 0 ? baselines[seed] : simulate(count, seed, cutoff);
        for (const p of players) {
          for (const key of ['total', 'visits', 'culture', 'assets', 'uniqueVisits', 'shortfalls', 'investmentShortfalls', 'visitShortfalls']) sums[key] += p[key];
          const delta = p.total - baselines[seed][p.seat].total;
          sums.delta += delta;
          sums[delta > 0 ? 'better' : delta < 0 ? 'worse' : 'tied']++;
        }
      }
      rows.push({ count, cutoff, samples: seedCount * count, ...sums });
    }
  }
  return rows;
}

export function renderReport(rows, seedCount) {
  const lines = [
    '# 出資締切のオフライン診断', '',
    `再現コマンド: \`node ios/rights/candidate/strategy-diagnostic.mjs --seeds ${seedCount}\``, '',
    `seed 0〜${seedCount - 1}、2/3/4人、締切0〜12。各人数・seed・席を全方策で一致させ、各プレイヤー12手番を比較する。人数間の乱数列・席は同一軌跡ではないため、比較は同じ人数内で行う。`, '',
    '方策: 締切ラウンド以下なら未出資の着地拠点へ出資（支払可能時）。それ以外・出資不能時は未訪問なら訪問（支払可能時）、残りは何もしない。締切0は出資しない訪問優先。全席に同じ方策を適用する。現エンジンにはプレイヤー間の経済干渉がない。', '',
    '資金不足手番: 出資を希望するが資金不足、または代替訪問を希望するが資金不足だった拠点手番を1回と数える。訪問へ代替できた場合も含み、両方不足しても重複計上しない。出資不足・訪問不足も別列に記録する（両列には同一手番が入り得る）。イベント費用・非拠点の残高低下は含まない。', '',
    '得点・内訳・訪問数・不足手番・Δは1プレイヤー1試合あたり平均。訪問数は固有拠点数。Δと上/同/下は同じ人数・seed・席の締切0に対する総得点差と件数（対戦勝敗ではない）。', '',
    '|人数|締切|標本数|総得点|訪問点|交流点|資産点|訪問数|不足手番|出資不足|訪問不足|Δ対0|上/同/下|',
    '|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|:---|',
  ];
  for (const r of rows) {
    const mean = key => (r[key] / r.samples).toFixed(3);
    lines.push(`|${r.count}|${r.cutoff}|${r.samples}|${['total', 'visits', 'culture', 'assets', 'uniqueVisits', 'shortfalls', 'investmentShortfalls', 'visitShortfalls', 'delta'].map(mean).join('|')}|${r.better}/${r.tied}/${r.worse}|`);
  }
  lines.push('', '## 解釈と制約', '');
  for (const count of [2, 3, 4]) {
    const group = rows.filter(r => r.count === count);
    const best = Math.max(...group.map(r => r.total));
    lines.push(`- ${count}人: この標本で平均総得点が最大の締切は ${group.filter(r => r.total === best).map(r => r.cutoff).join(', ')}。`);
  }
  lines.push('', 'これは限定した決定的方策・有限seedによる診断であり、優越戦略の証明、対人バランス保証、統計的な独立標本の主張ではない。同じ試合の席は共通の乱数列を使う。現状の指標だけでは混合方策・状況適応方策を評価できない。エンジン・経済・公開版・保存・UI・通信は変更しない。', '', '次の具体的な実験: エンジンを変更せず、訪問優先後に余剰資金だけ出資する方策と、最低残高€6を確保する方策を同じseed・席で比較し、訪問機会損失と資産点の差を分離する。', '');
  return lines.join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const args = process.argv.slice(2);
  assert.ok(args.length === 0 || (args.length === 2 && args[0] === '--seeds' && /^\d+$/.test(args[1])), 'usage: node strategy-diagnostic.mjs [--seeds 1..1000]');
  const seeds = args.length ? Number(args[1]) : 100;
  console.log(renderReport(runDiagnostic(seeds), seeds));
}
