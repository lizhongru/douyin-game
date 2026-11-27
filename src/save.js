// 本地存档：完整玩家状态；state.js 负责旧版本迁移与数据校验
const KEY = 'whisper_save_v1';

function load() {
  try { return tt.getStorageSync(KEY) || null; } catch (e) { return null; }
}

function save(data) {
  try { tt.setStorageSync(KEY, data); return true; } catch (e) { return false; }
}

function clear() {
  try { tt.removeStorageSync(KEY); } catch (e) { /* 忽略 */ }
}

module.exports = { load, save, clear };
