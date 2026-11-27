// 音频管理：BGM / 环境雨声（带淡入淡出）/ 短音效
// 资源在 audio/ 目录，均为 mp3；静音状态存本地，下次进来保持
const KEY = 'whisper_audio_v1';
const BASE = 'audio/';

let muted = false;
try { const s = tt.getStorageSync(KEY); if (s && s.muted) muted = true; } catch (e) { /* 忽略 */ }

const loops = {
  bgm:  { file: 'bgm_box',  ctx: null, cur: 0, target: 0, playing: false },
  rain: { file: 'amb_rain', ctx: null, cur: 0, target: 0, playing: false }
};

function loopCtx(l) {
  if (!l.ctx) {
    const c = tt.createInnerAudioContext();
    c.src = BASE + l.file + '.mp3';
    c.loop = true;
    c.volume = 0;
    if (c.onError) c.onError(e => console.warn('[audio]', l.file, e));
    l.ctx = c;
  }
  return l.ctx;
}

// 每帧调用：音量向目标渐变（约 1.2 秒），归零后暂停以省电
function update(dt) {
  for (const k in loops) {
    const l = loops[k];
    const eff = muted ? 0 : l.target;
    if (l.cur === eff && (eff > 0) === l.playing) continue;
    const step = dt * 0.85;
    l.cur += Math.max(-step, Math.min(step, eff - l.cur));
    if (l.cur > 0.001) {
      const c = loopCtx(l);
      c.volume = Math.min(1, l.cur);
      if (!l.playing) { try { c.play(); } catch (e) { /* 忽略 */ } l.playing = true; }
    } else if (eff === 0 && l.playing) {
      l.cur = 0;
      try { l.ctx.pause(); } catch (e) { /* 忽略 */ }
      l.playing = false;
    }
  }
}

function bgm(v) { loops.bgm.target = v; }
function rain(v) { loops.rain.target = v; }

// 部分平台首次触摸后才允许出声：这时把应在播放的循环再 play 一次
let unlocked = false;
function unlock() {
  if (unlocked) return;
  unlocked = true;
  for (const k in loops) {
    const l = loops[k];
    if (l.playing && l.ctx) { try { l.ctx.play(); } catch (e) { /* 忽略 */ } }
  }
}

function pauseAll() {
  for (const k in loops) {
    const l = loops[k];
    if (l.ctx && l.playing) { try { l.ctx.pause(); } catch (e) { /* 忽略 */ } }
    l.playing = false;   // update() 会在回到前台后自动续播
  }
}

const pool = {};
function sfx(name, vol) {
  if (muted) return;
  let c = pool[name];
  if (!c) {
    c = pool[name] = tt.createInnerAudioContext();
    c.src = BASE + 'sfx_' + name + '.mp3';
    if (c.onError) c.onError(e => console.warn('[audio]', name, e));
  }
  c.volume = vol === undefined ? 0.8 : vol;
  try { c.stop(); } catch (e) { /* 忽略 */ }
  try { c.play(); } catch (e) { /* 忽略 */ }
}

// 擦拭沙沙声：限频，避免滑动时刷屏
let lastScrub = 0;
function scrub() {
  const now = Date.now();
  if (now - lastScrub < 170) return;
  lastScrub = now;
  sfx('wipe', 0.5);
}

function setMuted(m) {
  muted = !!m;
  try { tt.setStorageSync(KEY, { muted }); } catch (e) { /* 忽略 */ }
}

module.exports = {
  update, bgm, rain, sfx, scrub, unlock, pauseAll, setMuted,
  get muted() { return muted; }
};
