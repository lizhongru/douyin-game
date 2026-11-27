// 互动小说对话引擎：打字机、头像、选项分支
const { C } = require('../config.js');
const { panel, text, wrapText, cut, rr } = require('../utils.js');
const assets = require('../assets.js');

const TYPE_SPEED = 42; // 字/秒
// 各背景的雨声大小：室内远、门口近；节点可用 rain 字段覆盖
const RAIN = { shelf: 0.18, letter: 0.15, rain: 0.5, work: 0.15, shop: 0.1 };

class Dialogue {
  constructor(game, nodes, done) {
    this.game = game;
    this.nodes = nodes;
    this.done = done;
    this.i = 0;
    this.charN = 0;
    this.t = 0;
    this.btns = [];
  }
  enter() { this.cur = this.nodes[0]; this.charN = 0; this.ambience(this.cur); }
  ambience(n) {
    const au = this.game.audio;
    au.rain(n.rain !== undefined ? n.rain : (RAIN[n.bg || 'shop'] !== undefined ? RAIN[n.bg || 'shop'] : 0.15));
    if (n.sfx) au.sfx(n.sfx);
  }
  typing() { return this.charN < this.cur.tx.length; }
  update(dt) {
    this.t += dt;
    if (this.typing()) this.charN += dt * TYPE_SPEED;
  }
  onStart(x, y) {
    const n = this.cur;
    if (this.typing()) { this.charN = n.tx.length; return; }
    if (n.ch) {
      for (const b of this.btns) {
        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
          if (b.set) for (const k in b.set) this.game.flags[k] = (this.game.flags[k] || 0) + b.set[k];
          this.jump(b.go);
          return;
        }
      }
      return;
    }
    this.jump(n.go !== undefined ? n.go : this.i + 1);
  }
  jump(idx) {
    this.game.audio.sfx('tap', 0.45);
    if (idx >= this.nodes.length) { this.done(); return; }
    this.i = idx;
    this.cur = this.nodes[idx];
    this.charN = 0;
    this.btns = [];
    this.ambience(this.cur);
  }
  render(ctx, W, H) {
    const n = this.cur;
    const bgName = 'bg_' + (n.bg || 'shop');
    assets.drawCover(ctx, bgName, 0, 0, W, H, C.deep, bgName);
    ctx.fillStyle = 'rgba(28,18,10,0.28)';
    ctx.fillRect(0, 0, W, H);
    // 暗角氛围
    const vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.32, W / 2, H / 2, H * 0.82);
    vg.addColorStop(0, 'rgba(20,12,6,0)');
    vg.addColorStop(1, 'rgba(20,12,6,0.45)');
    ctx.fillStyle = vg;
    ctx.fillRect(0, 0, W, H);

    // 头像（左下，圆形裁切）
    let px = 0;
    if (n.po) {
      const poName = 'p_' + n.po;
      const r = 96, cx = 110, cy = H - 470;
      ctx.save();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.clip();
      assets.drawCover(ctx, poName, cx - r, cy - r, r * 2, r * 2, C.teal, poName);
      ctx.restore();
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.strokeStyle = C.cream; ctx.lineWidth = 5; ctx.stroke();
      px = 230;
    }

    // 文本面板
    const py = H - 330, ph = 270;
    const isLetter = n.sp === '信';
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 22;
    if (isLetter) {
      const g = ctx.createLinearGradient(0, py, 0, py + ph);
      g.addColorStop(0, '#f2dcae'); g.addColorStop(1, '#e6c894');
      rr(ctx, 30, py, W - 60, ph, 18);
      ctx.fillStyle = g; ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = 'rgba(138,90,59,0.7)'; ctx.lineWidth = 3; ctx.stroke();
      // 装饰角
      ctx.fillStyle = 'rgba(138,90,59,0.6)';
      for (const [cx, cy] of [[46, py + 16], [W - 46, py + 16], [46, py + ph - 16], [W - 46, py + ph - 16]]) {
        ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      panel(ctx, 30, py, W - 60, ph, 24, 'rgba(246,234,214,0.94)', 'rgba(138,90,59,0.8)');
    }
    ctx.restore();

    if (n.sp) {
      panel(ctx, px || 50, py - 26, Math.max(150, n.sp.length * 34 + 40), 56, 28, n.sp === '信' ? C.gold : C.amber);
      text(ctx, n.sp, (px || 50) + (Math.max(150, n.sp.length * 34 + 40)) / 2, py + 2, 30, C.cream, 'center', true);
    }

    ctx.font = 32 + 'px ' + require('../config.js').FONT;
    ctx.fillStyle = C.ink;
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    wrapText(ctx, cut(n.tx, this.charN), (px || 50) + 26, py + 62, W - (px || 50) - 100, 48);

    // 选项
    this.btns = [];
    if (n.ch && !this.typing()) {
      const bw = W - 140, bh = 84;
      let by = py - 40 - n.ch.length * (bh + 22);
      for (let k = 0; k < n.ch.length; k++) {
        const c = n.ch[k];
        panel(ctx, 70, by, bw, bh, 20, 'rgba(255,248,236,0.95)', C.amber);
        text(ctx, '「' + c.t + '」', 70 + 28, by + bh / 2, 30, C.ink);
        this.btns.push({ x: 70, y: by, w: bw, h: bh, go: c.go, set: c.set });
        by += bh + 22;
      }
    } else if (!n.ch && !this.typing()) {
      if (Math.sin(this.t * 6) > -0.3) text(ctx, '▼', W - 70, py + ph - 24, 30, C.amber, 'center', true);
    }
  }
}

module.exports = Dialogue;
