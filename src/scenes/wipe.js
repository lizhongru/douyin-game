// 玩法一：擦拭清洁 —— 离屏 Canvas 灰尘遮罩 + 手指擦除 + 覆盖率进度
const { C } = require('../config.js');
const { panel, text, Particles, rr, clamp } = require('../utils.js');
const assets = require('../assets.js');

const CARD = 520;
const BRUSH = 58;
const GOAL = 0.85;
const GN = 26; // 覆盖率网格

class Wipe {
  constructor(game, cfg, done) {
    this.game = game; this.cfg = cfg; this.doneCb = done;
    this.drawing = false; this.finishing = 0; this.t = 0;
    this.midHintT = 0; this.midHintShown = false;
    this.parts = new Particles();
    this.cells = new Set(); this.progress = 0;
    this.last = { x: 0, y: 0 };
  }
  enter(game) {
    this.W = game.W; this.H = game.H;
    this.cardX = (this.W - CARD) / 2;
    this.cardY = 210;
    const off = tt.createCanvas();
    off.width = CARD; off.height = CARD;
    this.off = off; this.octx = off.getContext('2d');
    const o = this.octx;
    o.fillStyle = 'rgba(146,116,82,0.95)';
    o.fillRect(0, 0, CARD, CARD);
    // 灰尘噪点
    for (let i = 0; i < 700; i++) {
      o.fillStyle = i % 3 ? 'rgba(110,86,60,0.5)' : 'rgba(190,160,120,0.5)';
      o.beginPath();
      o.arc(Math.random() * CARD, Math.random() * CARD, 2 + Math.random() * 7, 0, Math.PI * 2);
      o.fill();
    }
    // 大块污渍
    for (let i = 0; i < 8; i++) {
      o.fillStyle = 'rgba(90,68,46,0.45)';
      o.beginPath();
      o.arc(Math.random() * CARD, Math.random() * CARD, 30 + Math.random() * 60, 0, Math.PI * 2);
      o.fill();
    }
  }
  erase(x, y) {
    const lx = x - this.cardX, ly = y - this.cardY;
    if (lx < -BRUSH || ly < -BRUSH || lx > CARD + BRUSH || ly > CARD + BRUSH) return;
    this.game.audio.scrub();
    const o = this.octx;
    o.globalCompositeOperation = 'destination-out';
    o.beginPath(); o.arc(lx, ly, BRUSH, 0, Math.PI * 2); o.fill();
    // 连线，快速滑动不断笔
    const dl = Math.hypot(lx - this.last.x, ly - this.last.y);
    if (dl > 10) {
      const steps = Math.min(8, dl / 14);
      for (let s = 1; s <= steps; s++) {
        o.beginPath();
        o.arc(this.last.x + (lx - this.last.x) * s / steps, this.last.y + (ly - this.last.y) * s / steps, BRUSH, 0, Math.PI * 2);
        o.fill();
      }
    }
    o.globalCompositeOperation = 'source-over';
    this.last = { x: lx, y: ly };
    // 覆盖格
    const cs = CARD / GN;
    const r = Math.ceil(BRUSH / cs);
    const gx = Math.floor(lx / cs), gy = Math.floor(ly / cs);
    for (let i = -r; i <= r; i++) for (let j = -r; j <= r; j++) {
      const cx = gx + i, cy = gy + j;
      if (cx >= 0 && cy >= 0 && cx < GN && cy < GN && (i * i + j * j) <= r * r) this.cells.add(cy * GN + cx);
    }
    this.progress = this.cells.size / (GN * GN);
    if (Math.random() < 0.3) this.parts.burst(x, y, 2, C.cream, { life: 0.5, speed: 60, size: 5 });
  }
  onStart(x, y) { this.drawing = true; this.last = { x: x - this.cardX, y: y - this.cardY }; this.erase(x, y); }
  onMove(x, y) { if (this.drawing) this.erase(x, y); }
  onEnd() { this.drawing = false; }
  update(dt) {
    this.t += dt;
    this.parts.update(dt);
    if (this.cfg.midHint && this.progress >= 0.5 && !this.midHintShown) {
      this.midHintShown = true;
      this.midHintT = 2.5;
    }
    if (this.midHintT > 0) this.midHintT -= dt;
    if (!this.finishing && this.progress >= GOAL) {
      this.finishing = 1.6;
      this.game.audio.sfx('chime', 0.8);
      this.parts.burst(this.cardX + CARD / 2, this.cardY + CARD / 2, 26, C.gold, { life: 1, speed: 220, size: 9 });
    }
    if (this.finishing > 0) {
      this.finishing -= dt;
      if (this.finishing <= 0) this.doneCb();
    }
  }
  render(ctx, W, H) {
    assets.drawCover(ctx, 'bg_work', 0, 0, W, H, C.wood, '工作台');
    ctx.fillStyle = 'rgba(28,18,10,0.35)'; ctx.fillRect(0, 0, W, H);

    text(ctx, this.cfg.title || '擦拭旧物', W / 2, 90, 44, C.cream, 'center', true);
    text(ctx, this.cfg.hint || '用手指慢慢擦去灰尘，别着急', W / 2, 145, 28, 'rgba(246,234,214,0.8)', 'center');

    // 卡片：物品 + 灰尘遮罩
    ctx.save();
    rr(ctx, this.cardX, this.cardY, CARD, CARD, 26); ctx.clip();
    assets.drawCover(ctx, this.cfg.item || 'item_broken', this.cardX, this.cardY, CARD, CARD, C.dust, this.cfg.item || 'item_broken');
    ctx.drawImage(this.off, this.cardX, this.cardY, CARD, CARD);
    if (this.finishing > 0) {
      ctx.fillStyle = 'rgba(255,248,236,' + (0.25 * Math.sin(this.t * 10) + 0.25) + ')';
      ctx.fillRect(this.cardX, this.cardY, CARD, CARD);
    }
    ctx.restore();
    rr(ctx, this.cardX, this.cardY, CARD, CARD, 26);
    ctx.strokeStyle = C.cream; ctx.lineWidth = 6; ctx.stroke();

    // 进度条
    const bw = 460, bx = (W - bw) / 2, by = this.cardY + CARD + 46;
    panel(ctx, bx, by, bw, 26, 13, 'rgba(246,234,214,0.35)');
    rr(ctx, bx + 3, by + 3, (bw - 6) * clamp(this.progress / GOAL, 0, 1), 20, 10);
    ctx.fillStyle = C.gold; ctx.fill();
    text(ctx, Math.round(clamp(this.progress / GOAL, 0, 1) * 100) + '%', bx + bw + 40, by + 13, 26, C.cream, 'center');

    if (this.finishing > 0) text(ctx, '擦干净了！', W / 2, this.cardY + CARD / 2, 56, C.cream, 'center', true);
    if (this.midHintT > 0) {
      const a = Math.min(1, this.midHintT);
      ctx.globalAlpha = a;
      panel(ctx, W / 2 - 200, this.cardY + CARD + 8, 400, 52, 14, 'rgba(246,234,214,0.92)');
      text(ctx, this.cfg.midHint, W / 2, this.cardY + CARD + 34, 26, C.deep, 'center', true);
      ctx.globalAlpha = 1;
    }
    this.parts.render(ctx);
  }
}

module.exports = Wipe;
