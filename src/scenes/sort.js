// 玩法二：零件归位 —— 拖拽吸附 + 错位回弹
const { C } = require('../config.js');
const { text, panel, Particles, rr, dist } = require('../utils.js');
const assets = require('../assets.js');

const PARTS = [
  { id: 'gear', name: '齿轮' },
  { id: 'roll', name: '音筒' },
  { id: 'spring', name: '发条' },
  { id: 'crank', name: '摇柄' }
];

class Sort {
  constructor(game, cfg, done) {
    this.game = game; this.cfg = cfg; this.doneCb = done;
    this.t = 0; this.finishing = 0; this.shake = 0;
    this.parts = new Particles();
    this.drag = null;
  }
  enter(game) {
    this.W = game.W; this.H = game.H;
    // 八音盒主体区域
    this.box = { x: (this.W - 500) / 2, y: 190, w: 500, h: 400 };
    const b = this.box;
    this.slots = [
      { id: 'gear', x: b.x + b.w * 0.24, y: b.y + b.h * 0.30, r: 52 },
      { id: 'roll', x: b.x + b.w * 0.58, y: b.y + b.h * 0.58, r: 66 },
      { id: 'spring', x: b.x + b.w * 0.82, y: b.y + b.h * 0.28, r: 46 },
      { id: 'crank', x: b.x + b.w * 0.16, y: b.y + b.h * 0.74, r: 44 }
    ];
    // 零件散落在下方托盘
    const ty = b.y + b.h + 150;
    this.items = PARTS.map((p, i) => ({
      ...p,
      x: 130 + i * 160, y: ty + (i % 2 ? 90 : 0),
      r: 56, placed: false
    }));
  }
  hitPart(x, y) {
    for (let i = this.items.length - 1; i >= 0; i--) {
      const it = this.items[i];
      if (!it.placed && dist(x, y, it.x, it.y) < it.r + 14) return it;
    }
    return null;
  }
  onStart(x, y) { if (this.finishing) return; this.drag = this.hitPart(x, y); }
  onMove(x, y) { if (this.drag) { this.drag.x = x; this.drag.y = y; } }
  onEnd(x, y) {
    const d = this.drag; this.drag = null;
    if (!d) return;
    const slot = this.slots.find(s => dist(d.x, d.y, s.x, s.y) < 84);
    if (slot && slot.id === d.id) {
      d.x = slot.x; d.y = slot.y; d.placed = true;
      this.parts.burst(slot.x, slot.y, 14, C.gold, { life: 0.7, speed: 160, size: 7 });
      if (this.items.every(it => it.placed)) {
        this.finishing = 1.4;
        this.game.audio.sfx('click');
        this.game.audio.sfx('chime', 0.6);
      } else {
        this.game.audio.sfx('snap');
      }
    } else if (slot && slot.id !== d.id) {
      this.shake = 0.35;
      this.game.audio.sfx('wrong', 0.7);
      d.placed = false; // 回弹到原位
      const i = this.items.indexOf(d);
      d.x = 130 + i * 160;
      d.y = this.box.y + this.box.h + 150 + (i % 2 ? 90 : 0);
    }
  }
  update(dt) {
    this.t += dt; this.parts.update(dt);
    if (this.shake > 0) this.shake -= dt;
    if (this.finishing > 0) { this.finishing -= dt; if (this.finishing <= 0) this.doneCb(); }
  }
  render(ctx, W, H) {
    assets.drawCover(ctx, 'bg_work', 0, 0, W, H, C.wood, '工作台');
    ctx.fillStyle = 'rgba(28,18,10,0.4)'; ctx.fillRect(0, 0, W, H);
    ctx.save();
    if (this.shake > 0) ctx.translate(Math.sin(this.shake * 70) * 8, 0);

    text(ctx, '把零件放回八音盒的身体', W / 2, 90, 44, C.cream, 'center', true);
    text(ctx, '拖到虚线的位置，听那一声“咔哒”', W / 2, 145, 28, 'rgba(246,234,214,0.8)', 'center');

    // 盒体
    const b = this.box;
    rr(ctx, b.x, b.y, b.w, b.h, 22);
    ctx.fillStyle = 'rgba(107,74,50,0.9)'; ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 5; ctx.stroke();
    rr(ctx, b.x + 14, b.y + 14, b.w - 28, b.h - 28, 14);
    ctx.strokeStyle = 'rgba(242,198,109,0.4)'; ctx.lineWidth = 2; ctx.stroke();

    // 插槽
    for (const s of this.slots) {
      ctx.setLineDash([10, 8]);
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(246,234,214,0.55)'; ctx.lineWidth = 3; ctx.stroke();
      ctx.setLineDash([]);
      if (!this.items.find(i => i.id === s.id).placed) {
        ctx.globalAlpha = 0.35;
        drawIcon(ctx, s.id, s.x, s.y, s.r * 0.8, 0);
        ctx.globalAlpha = 1;
      }
    }

    // 零件
    for (const it of this.items) drawIcon(ctx, it.id, it.x, it.y, it.r, this.t);

    if (this.finishing > 0) text(ctx, '咔哒——刚刚好', W / 2, b.y + b.h + 90, 52, C.gold, 'center', true);
    this.parts.render(ctx);
    ctx.restore();
  }
}

function drawIcon(ctx, id, x, y, r, t) {
  ctx.save(); ctx.translate(x, y);
  if (id === 'gear') {
    ctx.rotate(t * 0.4);
    ctx.fillStyle = C.gold; ctx.strokeStyle = C.deep; ctx.lineWidth = 3;
    ctx.beginPath();
    const teeth = 8;
    for (let i = 0; i < teeth * 2; i++) {
      const a = (i / (teeth * 2)) * Math.PI * 2;
      const rad = i % 2 ? r * 0.78 : r;
      ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fillStyle = C.wood; ctx.fill(); ctx.stroke();
  } else if (id === 'spring') {
    ctx.strokeStyle = C.teal; ctx.lineWidth = 6; ctx.lineCap = 'round';
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 6; a += 0.2) {
      const rad = 6 + a * (r / 19);
      ctx.lineTo(Math.cos(a + t) * rad, Math.sin(a + t) * rad);
    }
    ctx.stroke();
  } else if (id === 'crank') {
    ctx.strokeStyle = C.gold; ctx.lineWidth = 10; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-r * 0.6, 0); ctx.lineTo(r * 0.2, 0); ctx.lineTo(r * 0.2, -r * 0.7); ctx.stroke();
    ctx.fillStyle = C.deep; ctx.beginPath(); ctx.arc(r * 0.2, -r * 0.85, r * 0.22, 0, Math.PI * 2); ctx.fill();
  } else if (id === 'roll') {
    ctx.fillStyle = C.paper; ctx.strokeStyle = C.deep; ctx.lineWidth = 3;
    rr(ctx, -r * 0.5, -r * 0.8, r, r * 1.6, r * 0.3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.deep;
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      if ((i + j) % 2) continue;
      ctx.beginPath(); ctx.arc(-r * 0.28 + j * r * 0.28, -r * 0.5 + i * r * 0.25, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

module.exports = Sort;
