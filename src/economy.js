// 轻经营规则：奖励、工作台升级与店铺装饰
const { hasItem } = require('./state.js');

const FURNITURE = {
  warm_lamp: { name: '暖光台灯', price: 60, description: '让工作台更明亮' },
  green_plant: { name: '窗边绿植', price: 45, description: '给修理铺添一点生气' }
};

function completeRepair(state, itemId, reward) {
  if (hasItem(state.story.completedItems, itemId)) return false;
  state.story.completedItems.push(itemId);
  state.collection.items.push(itemId);
  state.player.coins += (reward && reward.coins) || 80;
  state.player.materials += (reward && reward.materials) || 5;
  state.player.reputation += (reward && reward.reputation) || 5;
  return true;
}

function completeFirstChapter(state) {
  if (hasItem(state.story.completedChapters, 1)) return false;
  state.story.completedChapters.push(1);
  // 第一章通关奖励：用于体验第一次经营升级
  state.player.coins += 120;
  state.player.materials += 8;
  state.player.reputation += 10;
  state.story.completedItems.push('music_box');
  if (!hasItem(state.collection.items, 'music_box')) state.collection.items.push('music_box');
  return true;
}

function upgradeWorkbench(state) {
  const level = state.shop.workbenchLevel;
  if (level >= 3) return { ok: false, reason: '工作台已经达到最高等级' };
  const costs = [{ coins: 80, materials: 3 }, { coins: 140, materials: 6 }];
  const cost = costs[level - 1];
  if (state.player.coins < cost.coins || state.player.materials < cost.materials) {
    return { ok: false, reason: '金币或材料不足' };
  }
  state.player.coins -= cost.coins;
  state.player.materials -= cost.materials;
  state.shop.workbenchLevel++;
  state.shop.level = Math.max(state.shop.level, state.shop.workbenchLevel);
  return { ok: true, reason: '工作台升级成功' };
}

function buyFurniture(state, id) {
  const item = FURNITURE[id];
  if (!item) return { ok: false, reason: '没有找到这件装饰' };
  if (hasItem(state.shop.furniture, id)) return { ok: false, reason: '已经拥有这件装饰' };
  if (state.player.coins < item.price) return { ok: false, reason: '金币不足' };
  state.player.coins -= item.price;
  state.shop.furniture.push(id);
  return { ok: true, reason: '店铺装饰已添置' };
}

module.exports = { FURNITURE, completeRepair, completeFirstChapter, upgradeWorkbench, buyFurniture };
