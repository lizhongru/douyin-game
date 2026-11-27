// 玩法三：密码滚轮锁 —— 上下拨动数字轮，对照剧情线索
const { C } = require('../config.js');
const { text, panel, Particles, rr, clamp } = require('../utils.js');
const assets = require('../assets.js');

const DH = 88; // 数字间距

class Puzzle {
  constructor(game, cfg, done) {
    this.game = game; this.cfg = cfg; this.doneCb = done;
    this.code = cfg.code || [8, 1, 5];
    this.wheels = this.code.map(() => ({ v: Math.floor(Math.random() * 10), off: 0 }));
    this.t = 0; this.finishing = 0; this.shake = 0; this.msg = ''; this.msgT = 0;
    this.parts = new Particles();
    this.drag = -1; this.lastY = 0; this.btn = null;
  }
  enter(game) { this.W = game.W; this.H = game.H; this.cy = 460; }
  wheelX(i) { return this.W / 2 + (i - 1) * 170; }
  onStart(x, y) {
    if (this.finishing) return;
    if (this.btn && x >= this.btn.x && x <= this.btn.x + this.btn.w && y >= this.btn.y && y <= this.btn.y + this.btn.h) {
      this.tryOpen(); return;
    }
    for (let i = 0; i < this.wheels.length; i++) {
      if (Math.abs(x - this.wheelX(i)) < 75) { this.drag = i; this.lastY = y; return; }
    }
  }
  onMove(x, y) {
    if (this.drag < 0) return;
    const w = this.wheels[this.drag];
    const v0 = w.v;
    w.off += (this.lastY - y);
    this.lastY = y;
    while (w.off >= DH) { w.off -= DH; w.v = (w.v + 9) % 10; }
    while (w.off <= -DH) { w.off += DH; w.v = (w.v + 1) % 10; }
    if (w.v !== v0) this.game.audio.sfx('tick', 0.5);
  }
  onEnd() {
    if (this.drag >= 0) {
      const w = this.wheels[this.drag];
      w.off = clamp(w.off, -DH, DH);
      if (Math.abs(w.off) > DH * 0.5) { w.v = (w.v + (w.off > 0 ? 9 : 1)) % 10; this.game.audio.sfx('tick', 0.5); }
      w.off = 0;
      this.drag = -1;
    }
  }
  tryOpen() {
    const vals = this.wheels.map(w => w.v);
    if (vals.join(',') === this.code.join(',')) {
      this.finishing = 1.8;
      this.parts.burst(this.W / 2, this.cy, 30, C.gold, { life: 1.1, speed: 240, size: 9 });
      this.msg = '咔哒。暗格弹开了。';
      this.game.audio.sfx('click');
      this.game.audio.sfx('chime', 0.7);
    } else {
      this.shake = 0.4;
      this.msg = '滚轮纹丝不动……再想想盒底的刻字。';
      this.game.audio.sfx('wrong', 0.7);
    }
    this.msgT = 3;
  }
  update(dt) {
    this.t += dt; this.parts.update(dt);
    if (this.shake > 0) this.shake -= dt;
    if (this.msgT > 0) this.msgT -= dt;
    if (this.finishing > 0) { this.finishing -= dt; if (this.finishing <= 0) this.doneCb(); }
  }
  render(ctx, W, H) {
    assets.drawCover(ctx, 'bg_work', 0, 0, W, H, C.wood, '工作台');
    ctx.fillStyle = 'rgba(24,15,9,0.55)'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.sin(this.shake * 80) * 10, 0);

    text(ctx, '音筒上的密码滚轮', W / 2, 90, 44, C.cream, 'center', true);

    // 线索牌
    panel(ctx, 80, 150, W - 160, 120, 18, 'rgba(246,234,214,0.92)', C.amber);
    text(ctx, '盒底刻字', 110, 185, 26, C.deep, 'left', true);
    text(ctx, '「致呀呀 · 8·15」', 110, 232, 38, C.ink, 'left', true);

    // 密码滚轮特写背景
    ctx.globalAlpha = 0.5;
    assets.drawFit(ctx, 'puzzle_lock', W / 2 - 230, 290, 460, 150, C.wood, 'puzzle_lock');
    ctx.globalAlpha = 1;

    // 滚轮
    for (let i = 0; i < this.wheels.length; i++) {
      const w = this.wheels[i], x = this.wheelX(i);
      ctx.save();
      rr(ctx, x - 70, this.cy - 160, 140, 320, 18); ctx.clip();
      ctx.fillStyle = 'rgba(59,47,42,0.9)'; ctx.fillRect(x - 70, this.cy - 160, 140, 320);
      for (let d = -3; d <= 3; d++) {
        const val = ((w.v - d) % 10 + 10) % 10;
        const yy = this.cy + d * DH + w.off;
        const fade = clamp(1 - Math.abs(yy - this.cy) / 170, 0.15, 1);
        ctx.globalAlpha = fade;
        text(ctx, String(val), x, yy, 64, d === 0 && Math.abs(w.off) < 4 ? C.gold : C.paper, 'center', true);
      }
      ctx.globalAlpha = 1;
      ctx.restore();
      rr(ctx, x - 70, this.cy - 160, 140, 320, 18);
      ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
    }
    // 中位指示线
    ctx.strokeStyle = C.rose; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(this.wheelX(0) - 90, this.cy); ctx.lineTo(this.wheelX(2) + 90, this.cy); ctx.stroke();

    text(ctx, '上下拨动滚轮', W / 2, this.cy + 210, 26, 'rgba(246,234,214,0.7)', 'center');

    // 确认按钮
    const bw = 320, bh = 88, bx = (W - bw) / 2, by = this.cy + 260;
    panel(ctx, bx, by, bw, bh, bh / 2, this.finishing ? C.ok : C.amber, C.cream);
    text(ctx, this.finishing ? '开！' : '转动它', bx + bw / 2, by + bh / 2, 36, C.cream, 'center', true);
    this.btn = { x: bx, y: by, w: bw, h: bh };

    if (this.msgT > 0) {
      panel(ctx, 90, H - 220, W - 180, 90, 16, 'rgba(246,234,214,0.92)');
      text(ctx, this.msg, W / 2, H - 175, 30, C.ink, 'center');
    }
    this.parts.render(ctx);
    ctx.restore();
  }
}

module.exports = Puzzle;
