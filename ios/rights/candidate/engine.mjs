// Incomplete, isolated rules prototype. No storage, transport or UI integration.
export const SAVE_KEY = 'travel-candidate-v1';
export const NETWORK_PREFIX = 'travel-candidate-v1-';
export const ROUNDS = 12;
const layout = ['rest','hub','event','hub','route','hub','event','hub','rest','event','hub','route','hub','event','hub','hub','rest','hub','route','event','hub','hub','event','hub','rest','hub','event','route','hub','event','hub','hub'];
const names = ['朝の出発','風の案内所','小さな発見','水辺の案内所','川の路線','丘の案内所','旅の便り','森の案内所','木陰の休息','道の寄り道','石畳の案内所','高原の路線','広場の案内所','交流のひととき','灯りの案内所','庭の案内所','昼の休息','橋の案内所','海辺の路線','旅程の調整','窓辺の案内所','工房の案内所','聞き取りの時間','小径の案内所','夕べの休息','港の案内所','地域の催し','谷の路線','門の案内所','帰路の発見','泉の案内所','展望の案内所'];
export const SPACES = Object.freeze(layout.map((kind, id) => Object.freeze({ id, kind, name: names[id], ...(kind === 'hub' ? { investment: 18 + (id % 4) * 3 } : {}) })));
// RNG is explicit state in/out, so reducer calls never consume hidden mutable state.
export function seededDraw(seed) {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { seed: next, value: next / 4294967296 };
}
export function createGame(count, seed = 1) {
  if (!Number.isInteger(count) || count < 2 || count > 4) throw new Error('2–4 players required');
  if (!Number.isInteger(seed) || seed < 0 || seed > 0xffffffff) throw new Error('uint32 seed required');
  return { version: 1, seed, round: 1, active: 0, phase: 'move', players: Array.from({ length: count }, (_, id) => ({ id, position: 0, cash: 60, culture: 0, visited: [], investments: [] })) };
}
export function score(player) {
  const assets = player.cash + player.investments.reduce((sum, id) => sum + SPACES[id].investment, 0);
  return { visits: player.visited.length * 4, culture: player.culture * 3, assets: Math.floor(assets / 10), total: player.visited.length * 4 + player.culture * 3 + Math.floor(assets / 10) };
}
export function winners(state) {
  if (state.phase !== 'finished') return [];
  const top = Math.max(...state.players.map(p => score(p).total));
  return state.players.filter(p => score(p).total === top).map(p => p.id);
}
export function reduce(state, action, draw = seededDraw) {
  if (!action || state.phase === 'finished') return state;
  if (action.actor !== undefined && action.actor !== state.active) return state;
  const allowed = (state.phase === 'move' && action.type === 'move') || (state.phase === 'choose' && ['visit','invest','end'].includes(action.type)) || (state.phase === 'end' && action.type === 'end');
  if (!allowed) return state;
  const player = state.players[state.active];
  const space = SPACES[player.position];
  if (action.type === 'invest' && (space.kind !== 'hub' || player.investments.includes(space.id) || player.cash < space.investment)) return state;
  if (action.type === 'visit' && (space.kind !== 'hub' || player.visited.includes(space.id) || player.cash < 6)) return state;
  const next = structuredClone(state);
  const p = next.players[next.active];
  if (action.type === 'move') {
    const result = draw(state.seed);
    if (!result || !Number.isFinite(result.value) || result.value < 0 || result.value >= 1 || !Number.isInteger(result.seed) || result.seed < 0 || result.seed > 0xffffffff) throw new Error('Invalid RNG result');
    next.seed = result.seed;
    p.position = (p.position + 1 + Math.floor(result.value * 6)) % SPACES.length;
    const landed = SPACES[p.position];
    // All benefits come from the expedition budget, never another player's rent.
    if (landed.kind === 'rest') p.cash += 10;
    if (landed.kind === 'route') { p.cash += 4; p.culture += 1; }
    if (landed.kind === 'event') {
      if (landed.id % 3 === 0) { p.cash = Math.max(0, p.cash - 5); p.culture += 2; }
      else { p.cash += 3; p.culture += 1; }
    }
    next.phase = landed.kind === 'hub' ? 'choose' : 'end';
  } else if (action.type === 'visit') {
    p.cash -= 6; p.culture += 2; p.visited.push(space.id); next.phase = 'end';
  } else if (action.type === 'invest') {
    p.cash -= space.investment; p.investments.push(space.id); next.phase = 'end';
  } else {
    next.active++;
    if (next.active === next.players.length) {
      next.active = 0;
      if (next.round === ROUNDS) { next.phase = 'finished'; return next; }
      next.round++;
      for (const member of next.players) member.cash += 8 + member.investments.length * 2;
    }
    next.phase = 'move';
  }
  return next;
}
