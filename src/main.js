// 引擎核心：画布、主循环、输入分发、场景切换（带黑场过渡）
const cfg = require('./config.js');
const save = require('./save.js');
const stateModel = require('./state.js');
const audio = require('./audio.js');
const Title = require('./scenes/title.js');
const Flow = require('./scenes/flow.js');

const canvas = tt.createCanvas();
const info = tt.getSystemInfoSync();
canvas.width = Math.round(info.windowWidth * info.pixelRatio);
canvas.height = Math.round(info.windowHeight * info.pixelRatio);
const ctx = canvas.getContext('2d');

const SCALE = canvas.width / cfg.DESIGN_W;
const IN_SCALE = cfg.DESIGN_W / info.windowWidth;
const W = cfg.DESIGN_W;
const H = canvas.height / SCALE;

const game = {
  W, H, ctx, canvas, info, save, audio,
  state: stateModel.create(save.load()),
  flags: null,
  scene: null,
  persist() { save.save(this.state); },
  resetProgress() {
    this.state = stateModel.create(null);
    this.flags = this.state.story.flags;
    this.persist();
  },
  setScene(makeFn) { pending = makeFn; fadeDir = 1; fadeT = 0; },
  startChapter(startStep) {
    const step = Math.max(0, Number(startStep) || 0);
    this.state.story.currentChapter = 1;
    this.state.story.currentStep = step;
    this.state.story.started = true;
    this.flags = this.state.story.flags;
    this.persist();
    this.setScene(() => new Flow(game, step));
  }
};
game.flags = game.state.story.flags;

let cur = null;
let pending = null;
let fadeT = 0, fadeDir = 0;

function applyScene() {
  cur = pending ? pending() : null;
  pending = null;
  game.scene = cur;
  if (cur && cur.enter) cur.enter(game);
}

let last = 0;
function frame(ts) {
  const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
  last = ts;
  audio.update(dt);

  if (fadeDir === 1) {
    fadeT += dt * 3.2;
    if (fadeT >= 1) { fadeT = 1; applyScene(); fadeDir = -1; }
  } else if (fadeDir === -1) {
    fadeT -= dt * 3.2;
    if (fadeT <= 0) { fadeT = 0; fadeDir = 0; }
  }

  if (cur && cur.update) { try { cur.update(dt); } catch (e) { console.error('[update]', e); } }

  ctx.setTransform(SCALE, 0, 0, SCALE, 0, 0);
  ctx.clearRect(0, 0, W, H);
  if (cur && cur.render) { try { cur.render(ctx, W, H); } catch (e) { console.error('[render]', e); ctx.fillStyle = '#2a1d14'; ctx.fillRect(0, 0, W, H); } }
  if (fadeT > 0) { ctx.fillStyle = 'rgba(22,15,9,' + Math.min(1, fadeT) + ')'; ctx.fillRect(0, 0, W, H); }

  requestAnimationFrame(frame);
}

function pt(t) { return { x: t.clientX * IN_SCALE, y: t.clientY * IN_SCALE }; }

function dispatch(name, e) {
  if (!cur || fadeDir !== 0) return;
  const fn = cur[name];
  if (!fn) return;
  const t = (e.touches && e.touches[0]) || (e.changedTouches && e.changedTouches[0]);
  if (!t) return;
  const p = pt(t);
  try { fn.call(cur, p.x, p.y); } catch (err) { console.error('[input]', err); }
}

tt.onTouchStart(e => { audio.unlock(); dispatch('onStart', e); });
if (tt.onHide) tt.onHide(() => { audio.pauseAll(); game.persist(); });
if (tt.onShow) tt.onShow(() => { if (cur && cur.enterAudio) cur.enterAudio(); });
tt.onTouchMove(e => dispatch('onMove', e));
tt.onTouchEnd(e => dispatch('onEnd', e));

cur = new Title(game);
game.scene = cur;
cur.enter(game);
requestAnimationFrame(frame);

if (typeof globalThis !== 'undefined') globalThis.__whisper_game = game;
