// 修理铺经营主界面：第一阶段可用版本
const { C } = require('../config.js');
const { panel, text, rr } = require('../utils.js');
const assets = require('../assets.js');
const economy = require('../economy.js');

class Shop {
  constructor(game) {
    this.game = game;
    this.buttons = [];
    this.notice = '';
    this.noticeT = 0;
    this.t = 0;
  }

  enter() {
    this.state = this.game.state;
    this.game.audio.bgm(0.28);
    this.game.audio.rain(0.08);
  }

  persist() {
    this.game.persist();
    this.state = this.game.state;
  }

  notify(message) {
    this.notice = message;
    this.noticeT = 2.2;
  }

  onStart(x, y) {
    for (const b of this.buttons) {
      if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
        this.game.audio.sfx('tap', 0.6);
        b.action();
        return;
      }
    }
  }

  update(dt) {
    this.t += dt;
    if (this.noticeT > 0) this.noticeT -= dt;
  }

  render(ctx, W, H) {
    const s = this.state;
    // 短屏设备按纵向等比压缩布局，避免底部经营按钮被裁切
    this.sy = Math.min(1, Math.max(0.72, (H - 150) / 1354));
    ctx.save();
    ctx.scale(1, this.sy);
    assets.drawCover(ctx, 'bg_shop', 0, 0, W, H / this.sy, C.deep, '我的修理铺');
    ctx.fillStyle = 'rgba(25,16,10,0.38)';
    ctx.fillRect(0, 0, W, H / this.sy);

    text(ctx, '我的修理铺', W / 2, 72, 48, C.cream, 'center', true);
    text(ctx, '一点一点，把这里变成真正的家', W / 2, 120, 25, 'rgba(255,248,236,0.82)', 'center');

    // 资源栏
    panel(ctx, 34, 158, W - 68, 82, 18, 'rgba(246,234,214,0.94)', C.amber);
    text(ctx, '金币  ' + s.player.coins, 62, 199, 27, C.deep, 'left', true);
    text(ctx, '材料  ' + s.player.materials, 290, 199, 27, C.deep, 'left', true);
    text(ctx, '声望  ' + s.player.reputation, 520, 199, 27, C.deep, 'left', true);

    // 工作台展示区
    panel(ctx, 42, 276, W - 84, 340, 24, 'rgba(55,36,25,0.72)', C.gold);
    text(ctx, '修复工作台', 78, 320, 31, C.gold, 'left', true);
    text(ctx, '等级 ' + s.shop.workbenchLevel + ' / 3', W - 78, 320, 27, C.cream, 'right');
    rr(ctx, 90, 370, W - 180, 150, 18);
    ctx.fillStyle = 'rgba(116,78,49,0.9)'; ctx.fill();
    ctx.strokeStyle = 'rgba(242,198,109,0.7)'; ctx.lineWidth = 3; ctx.stroke();
    // 工作台上的八音盒
    ctx.save();
    ctx.translate(W / 2, 445);
    ctx.fillStyle = '#9a653e';
    rr(ctx, -92, -46, 184, 92, 12); ctx.fill();
    ctx.strokeStyle = C.gold; ctx.lineWidth = 4; ctx.stroke();
    ctx.fillStyle = '#e6bd70';
    ctx.beginPath(); ctx.arc(0, 0, 25, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#80502f'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.arc(0, 0, 13, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    text(ctx, '已修复旧物  ' + s.story.completedItems.length + ' 件', W / 2, 566, 25, C.cream, 'center');

    // 收藏架
    panel(ctx, 42, 648, W - 84, 190, 22, 'rgba(246,234,214,0.94)', C.amber);
    text(ctx, '旧物收藏架', 72, 688, 30, C.deep, 'left', true);
    if (s.collection.items.length) {
      const labels = { music_box: '八音盒', photo: '老照片', watch: '怀表', porcelain_cat: '瓷猫' };
      const shown = s.collection.items.slice(-4);
      for (let i = 0; i < shown.length; i++) {
        const x = 112 + i * 150;
        panel(ctx, x - 48, 716, 96, 82, 14, '#dfc59a', '#a77a4c');
        text(ctx, shown[i] === 'music_box' ? '♫' : '✦', x, 744, 34, C.deep, 'center', true);
        text(ctx, labels[shown[i]] || '旧物', x, 780, 19, C.deep, 'center');
      }
    } else {
      text(ctx, '修复完成的旧物会陈列在这里', W / 2, 760, 24, C.deep, 'center');
    }

    // 经营操作
    panel(ctx, 42, 872, W - 84, 300, 22, 'rgba(246,234,214,0.95)', C.amber);
    text(ctx, '店铺经营', 72, 914, 30, C.deep, 'left', true);
    this.buttons = [];
    const upgradeCost = s.shop.workbenchLevel === 1 ? '80金币 + 3材料' : '140金币 + 6材料';
    const maxed = s.shop.workbenchLevel >= 3;
    this.mkButton(ctx, 72, 950, W - 144, 78,
      maxed ? '工作台已满级' : '升级工作台（' + upgradeCost + '）',
      maxed ? '#8b8b80' : C.teal,
      () => {
        const result = economy.upgradeWorkbench(this.game.state);
        this.notify(result.reason);
        if (result.ok) this.persist();
      }, !maxed);

    const hasLamp = s.shop.furniture.indexOf('warm_lamp') >= 0;
    this.mkButton(ctx, 72, 1042, 292, 82,
      hasLamp ? '已拥有暖光台灯' : '添置暖光台灯 · 60金币',
      hasLamp ? '#8b8b80' : C.amber,
      () => {
        const result = economy.buyFurniture(this.game.state, 'warm_lamp');
        this.notify(result.reason);
        if (result.ok) this.persist();
      }, !hasLamp);

    const hasPlant = s.shop.furniture.indexOf('green_plant') >= 0;
    this.mkButton(ctx, 386, 1042, 292, 82,
      hasPlant ? '已拥有窗边绿植' : '添置窗边绿植 · 45金币',
      hasPlant ? '#8b8b80' : C.amber,
      () => {
        const result = economy.buyFurniture(this.game.state, 'green_plant');
        this.notify(result.reason);
        if (result.ok) this.persist();
      }, !hasPlant);

    // 下一位客人的预告
    panel(ctx, 42, 1204, W - 84, 150, 20, 'rgba(43,31,23,0.78)', C.gold);
    text(ctx, '门外似乎又传来了风铃声……', W / 2, 1245, 28, C.cream, 'center', true);
    text(ctx, '下一位客人，正在路上。', W / 2, 1295, 24, 'rgba(255,248,236,0.78)', 'center');

    this.mkButton(ctx, 170, H / this.sy - 112, W - 340, 76, '返回标题', C.deep, () => {
      this.game.setScene(() => new (require('./title.js'))(this.game));
    }, true);

    if (this.noticeT > 0) {
      panel(ctx, 100, H / this.sy - 205, W - 200, 64, 16, 'rgba(246,234,214,0.96)', C.gold);
      text(ctx, this.notice, W / 2, H / this.sy - 173, 25, C.deep, 'center', true);
    }
    ctx.restore();
  }

  mkButton(ctx, x, y, w, h, label, color, action, enabled) {
    panel(ctx, x, y, w, h, h / 2, color, 'rgba(255,248,236,0.7)');
    text(ctx, label, x + w / 2, y + h / 2, 25, C.cream, 'center', true);
    if (enabled) this.buttons.push({ x, y: y * this.sy, w, h: h * this.sy, action });
  }
}

module.exports = Shop;
