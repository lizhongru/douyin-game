// 本地存档：章节进度与选择倾向
const KEY = 'whisper_save_v1';

function load() {
  try { return tt.getStorageSync(KEY) || null; } catch (e) { return null; }
}

function save(data) {
  try { tt.setStorageSync(KEY, data); } catch (e) { /* 忽略 */ }
}

function clear() {
  try { tt.removeStorageSync(KEY); } catch (e) { /* 忽略 */ }
}

module.exports = { load, save, clear };
