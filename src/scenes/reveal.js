// 玩法四：前后对比滑杆 + 线索卡（解压的高光时刻）
const { C } = require('../config.js');
const { text, panel, rr, clamp, Particles } = require('../utils.js');
const assets = require('../assets.js');

const CARD = 500;

class Reveal {
  constructor(game, cfg, done) {
    this.game = game; this.cfg = cfg; this.doneCb = done;
    this.slider = 0.5; this.t = 0; this.dragging = false;
    this.parts = new Particles();
    this.notes = [];
    this.btn = null;
  }
  enter(game) {
    this.W = game.W; this.H = game.H;
    this.cardX = (this.W - CARD) / 2;
    this.cardY = 150;
    game.audio.sfx('jingle');
  }
  sx() { return this.cardX + CARD * this.slider; }
  onStart(x, y) {
    if (Math.abs(x - this.sx()) < 60 && y > this.cardY && y < this.cardY + CARD) { this.dragging = true; return; }
    if (this.btn && x >= this.btn.x && x <= this.btn.x + this.btn.w && y >= this.btn.y && y <= this.btn.y + this.btn.h) {
      this.parts.burst(x, y, 12, C.gold, { life: 0.7 });
      this.game.audio.sfx('tap', 0.6);
      this.doneCb();
    }
  }
  onMove(x) { if (this.dragging) this.slider = clamp((x - this.cardX) / CARD, 0, 1); }
  onEnd() { this.dragging = false; }
  update(dt) {
    this.t += dt; this.parts.update(dt);
    if (Math.random() < 0.05) {
      this.notes.push({ x: this.cardX + Math.random() * CARD, y: this.cardY + CARD, vy: -50 - Math.random() * 40, life: 0, max: 2.5 + Math.random() * 2, ch: Math.random() < 0.5 ? '♪' : '♫', rot: (Math.random() - 0.5) * 0.6 });
    }
    for (const n of this.notes) { n.life += dt; n.y += n.vy * dt; n.x += Math.sin(n.life * 2.2) * 18 * dt; }
    this.notes = this.notes.filter(n => n.life < n.max);
  }
  render(ctx, W, H) {
    assets.drawCover(ctx, 'bg_work', 0, 0, W, H, C.wood, '工作台');
    ctx.fillStyle = 'rgba(28,18,10,0.45)'; ctx.fillRect(0, 0, W, H);

    text(ctx, '修复完成', W / 2, 80, 46, C.gold, 'center', true);
    text(ctx, '左右拖动光带，看看它的从前与现在', W / 2, 125, 26, 'rgba(246,234,214,0.8)', 'center');

    // 对比卡片：左=修复前 右=修复后
    ctx.save();
    rr(ctx, this.cardX, this.cardY, CARD, CARD, 22); ctx.clip();
    assets.drawCover(ctx, 'item_fixed', this.cardX, this.cardY, CARD, CARD, C.teal, '修复后');
    ctx.save();
    ctx.beginPath();
    ctx.rect(this.cardX, this.cardY, CARD * this.slider, CARD);
    ctx.clip();
    assets.drawCover(ctx, 'item_broken', this.cardX, this.cardY, CARD, CARD, C.dust, '修复前');
    ctx.restore();
    ctx.restore();
    rr(ctx, this.cardX, this.cardY, CARD, CARD, 22);
    ctx.strokeStyle = C.cream; ctx.lineWidth = 5; ctx.stroke();

    // 光带
    const x = this.sx();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(x, this.cardY + 8); ctx.lineTo(x, this.cardY + CARD - 8); ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.beginPath(); ctx.arc(x, this.cardY + CARD / 2, 30 + Math.sin(this.t * 4) * 3, 0, Math.PI * 2); ctx.fill();
    text(ctx, '‹ ›', x, this.cardY + CARD / 2, 30, C.ink, 'center', true);
    text(ctx, '从前', this.cardX + 70, this.cardY + 40, 28, 'rgba(255,248,236,0.9)');
    text(ctx, '现在', this.cardX + CARD - 70, this.cardY + 40, 28, C.gold, 'right', true);

    // 飘浮音符
    for (const n of this.notes) {
      const a = Math.sin(Math.min(1, n.life / n.max) * Math.PI) * 0.8;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(n.x, n.y); ctx.rotate(n.rot);
      ctx.fillStyle = C.gold;
      ctx.font = 'bold 40px ' + require('../config.js').FONT;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(n.ch, 0, 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;

    // 线索卡
    const ly = this.cardY + CARD + 40;
    panel(ctx, 60, ly, W - 120, 250, 20, 'rgba(246,234,214,0.95)', C.amber);
    assets.drawFit(ctx, 'clue_key', 90, ly + 30, 170, 170, C.dust, '线索');
    text(ctx, '发现的线索', 300, ly + 60, 28, C.deep, 'left', true);
    text(ctx, '黄铜小钥匙 · 柄上刻着「1/7」', 300, ly + 110, 30, C.ink, 'left');
    text(ctx, '字条：「老地方，等你数到七。」', 300, ly + 155, 30, C.ink, 'left');
    text(ctx, '笔迹——和陈师傅的信一模一样。', 300, ly + 200, 26, C.rose, 'left');

    // 按钮
    const bw = 360, bh = 84, bx = (W - bw) / 2, by = H - 120;
    panel(ctx, bx, by, bw, bh, bh / 2, C.teal, C.cream);
    text(ctx, '把线索收好 →', bx + bw / 2, by + bh / 2, 32, C.cream, 'center', true);
    this.btn = { x: bx, y: by, w: bw, h: bh };
    this.parts.render(ctx);
  }
}

module.exports = Reveal;
