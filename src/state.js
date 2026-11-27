// 玩家统一状态：剧情、经营、收藏与委托共用一份数据
const VERSION = 2;

const DEFAULT_STATE = {
  version: VERSION,
  player: { level: 1, coins: 100, materials: 10, reputation: 0 },
  shop: {
    level: 1,
    workbenchLevel: 1,
    furniture: [],
    unlockedAreas: ['front']
  },
  story: {
    currentChapter: 1,
    currentStep: 0,
    started: false,
    completedChapters: [],
    completedItems: [],
    flags: {}
  },
  collection: { items: [], clues: [] },
  orders: { completed: [], active: null },
  settings: { music: true, sound: true }
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function mergeObject(base, value) {
  const out = Object.assign({}, base);
  if (!value || typeof value !== 'object') return out;
  for (const key in value) {
    const v = value[key];
    if (Array.isArray(v)) out[key] = v.slice();
    else if (v && typeof v === 'object') out[key] = mergeObject(base[key] || {}, v);
    else if (v !== undefined && v !== null) out[key] = v;
  }
  return out;
}

function create(raw) {
  const state = clone(DEFAULT_STATE);
  if (!raw || typeof raw !== 'object') return state;

  // 兼容旧版存档：{ step, done }
  if (typeof raw.step === 'number' && !raw.story) {
    state.story.currentStep = raw.done ? 0 : Math.max(0, raw.step);
    state.story.started = !raw.done && raw.step > 0;
    if (raw.done) state.story.completedChapters = [1];
    return state;
  }

  const merged = mergeObject(state, raw);
  merged.version = VERSION;
  merged.player.coins = Math.max(0, Number(merged.player.coins) || 0);
  merged.player.materials = Math.max(0, Number(merged.player.materials) || 0);
  merged.player.reputation = Math.max(0, Number(merged.player.reputation) || 0);
  merged.shop.workbenchLevel = Math.max(1, Number(merged.shop.workbenchLevel) || 1);
  merged.story.currentStep = Math.max(0, Number(merged.story.currentStep) || 0);
  return merged;
}

function hasItem(list, id) {
  return Array.isArray(list) && list.indexOf(id) >= 0;
}

module.exports = { VERSION, DEFAULT_STATE, create, hasItem };
