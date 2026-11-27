// 标题场景
const { C } = require('../config.js');
const { panel, text, Particles } = require('../utils.js');
const assets = require('../assets.js');

class Title {
  constructor(game) {
    this.game = game;
    this.t = 0;
    this.parts = new Particles();
    this.btns = [];
  }
  enter(game) {
    this.hasProgress = !!game.state.story.started;
    this.savedStep = game.state.story.currentStep || 0;
    game.audio.bgm(0.5);
    game.audio.rain(0.4);
  }
  update(dt) {
    this.t += dt;
    this.parts.update(dt);
    if (Math.random() < 0.06) {
      this.parts.burst(Math.random() * game_W(this), Math.random() * game_H(this) * 0.5, 1, C.gold, { life: 2.2, speed: 20, size: 5, lift: -10 });
    }
  }
  onStart(x, y) {
    for (const b of this.btns) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.parts.burst(x, y, 10, C.gold, { life: 0.6 });
        this.game.audio.sfx('tap', 0.6);
        b.fn();
        return;
      }
    }
  }
  render(ctx, W, H) {
    assets.drawCover(ctx, 'bg_title', 0, 0, W, H, C.deep, '旧物低语者');
    ctx.fillStyle = 'rgba(30,20,12,0.4)';
    ctx.fillRect(0, 0, W, H);
    const vg = ctx.createRadialGradient(W / 2, H * 0.4, H * 0.25, W / 2, H * 0.4, H * 0.85);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);

    const ty = H * 0.24;
    const tg = ctx.createLinearGradient(0, ty - 50, 0, ty + 40);
    tg.addColorStop(0, '#fff3d0'); tg.addColorStop(0.5, '#f2c66d'); tg.addColorStop(1, '#d99a3f');
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 24;
    ctx.font = 'bold 88px ' + require('../config.js').FONT;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = tg;
    ctx.fillText('旧物低语者', W / 2, ty);
    ctx.restore();
    ctx.strokeStyle = 'rgba(242,198,109,0.8)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(W / 2 - 240, ty + 58); ctx.lineTo(W / 2 - 30, ty + 58); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(W / 2 + 30, ty + 58); ctx.lineTo(W / 2 + 240, ty + 58); ctx.stroke();
    ctx.fillStyle = C.gold;
    ctx.save(); ctx.translate(W / 2, ty + 58); ctx.rotate(Math.PI / 4); ctx.fillRect(-8, -8, 16, 16); ctx.restore();
    text(ctx, 'WHISPERS OF OLD THINGS', W / 2, ty + 96, 24, 'rgba(246,234,214,0.8)', 'center');
    text(ctx, '第一章 · 八音盒与失踪的店主', W / 2, ty + 138, 30, C.gold, 'center');

    this.btns = [];
    const bw = 420, bh = 92, bx = (W - bw) / 2;
    let by = H * 0.56;
    if (this.hasProgress) {
      this.mkBtn(ctx, '继续昨夜', bx, by, bw, bh, C.amber, () => this.game.startChapter(this.savedStep));
      by += bh + 34;
    }
    this.mkBtn(ctx, this.hasProgress ? '重新开始' : '推开那扇门', bx, by, bw, bh, C.teal, () => {
      this.game.resetProgress();
      this.game.startChapter(0);
    });

    const sx = W - 80, sy = 80, sm = this.game.audio.muted;
    ctx.beginPath(); ctx.arc(sx, sy, 36, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(30,20,12,0.45)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,248,236,0.6)'; ctx.lineWidth = 3; ctx.stroke();
    text(ctx, '♪', sx, sy + 2, 38, sm ? 'rgba(255,248,236,0.45)' : C.gold, 'center', true);
    if (sm) { ctx.strokeStyle = C.rose; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(sx - 24, sy + 24); ctx.lineTo(sx + 24, sy - 24); ctx.stroke(); }
    this.btns.push({ x: sx - 44, y: sy - 44, w: 88, h: 88, fn: () => this.game.audio.setMuted(!this.game.audio.muted) });

    this.parts.render(ctx);
    text(ctx, '修复旧物 · 倾听秘密', W / 2, H - 70, 26, 'rgba(246,234,214,0.6)', 'center');
  }
  mkBtn(ctx, label, x, y, w, h, color, fn) {
    panel(ctx, x, y, w, h, h / 2, color, 'rgba(255,248,236,0.6)');
    text(ctx, label, x + w / 2, y + h / 2, 36, C.cream, 'center', true);
    this.btns.push({ x, y, w, h, fn });
  }
}

function game_W(t) { return t.game.W; }
function game_H(t) { return t.game.H; }

module.exports = Title;
