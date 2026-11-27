// 通用绘制/数学工具
const { C, FONT } = require('./config.js');

function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function dist(x1, y1, x2, y2) { const dx = x1 - x2, dy = y1 - y2; return Math.sqrt(dx * dx + dy * dy); }

function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function panel(ctx, x, y, w, h, r, fill, stroke) {
  rr(ctx, x, y, w, h, r);
  ctx.fillStyle = fill || C.paper;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 3; ctx.stroke(); }
}

// 自动换行文本，返回占用的行数
function wrapText(ctx, text, x, y, maxW, lineH) {
  let line = '', ly = y, used = 0;
  for (const ch of text) {
    if (ch === '\n') { ctx.fillText(line, x, ly); line = ''; ly += lineH; used++; continue; }
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, ly); line = ch; ly += lineH; used++;
    } else line = test;
  }
  if (line) { ctx.fillText(line, x, ly); used++; }
  return used;
}

// 截断显示（打字机用）
function cut(text, n) { return text.slice(0, Math.max(0, Math.floor(n))); }

// 简易粒子（星光/尘埃）
class Particles {
  constructor() { this.list = []; }
  burst(x, y, n, color, opt) {
    opt = opt || {};
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, sp = (opt.speed || 120) * (0.4 + Math.random());
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (opt.lift || 40),
        life: 0, max: (opt.life || 0.8) * (0.6 + Math.random() * 0.8),
        size: (opt.size || 6) * (0.5 + Math.random()), color
      });
    }
  }
  update(dt) {
    for (const p of this.list) { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; }
    this.list = this.list.filter(p => p.life < p.max);
  }
  render(ctx) {
    for (const p of this.list) {
      const t = 1 - p.life / p.max;
      ctx.globalAlpha = t;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      // 四角星
      const s = p.size * t;
      ctx.moveTo(p.x, p.y - s); ctx.quadraticCurveTo(p.x, p.y, p.x + s, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y + s); ctx.quadraticCurveTo(p.x, p.y, p.x - s, p.y);
      ctx.quadraticCurveTo(p.x, p.y, p.x, p.y - s);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  get empty() { return this.list.length === 0; }
}

// 抖屏
function shakeApply(ctx, shakeT, amp) {
  if (shakeT <= 0) return;
  const k = shakeT * amp;
  ctx.translate(Math.sin(shakeT * 60) * k, Math.cos(shakeT * 53) * k * 0.6);
}

function text(ctx, str, x, y, size, color, align, bold) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px ' + FONT;
  ctx.fillStyle = color || C.ink;
  ctx.textAlign = align || 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

module.exports = { clamp, lerp, easeOut, dist, rr, panel, wrapText, cut, Particles, shakeApply, text };
