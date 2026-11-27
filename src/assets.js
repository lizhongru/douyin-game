// 图片资源加载器：tt.createImage + 未加载/失败时的 Canvas 兜底绘制
const { C, FONT } = require('./config.js');
const { rr } = require('./utils.js');

const cache = {};

function get(name) {
  let e = cache[name];
  if (!e) {
    const img = tt.createImage();
    e = cache[name] = { img, loaded: false, failed: false };
    img.onload = () => { e.loaded = true; };
    img.onerror = () => { e.failed = true; };
    img.src = 'images/' + name + '.jpg';
  }
  return e;
}

function ready(name) { const e = get(name); return e.loaded; }

// 等比裁切铺满（cover）
function drawCover(ctx, name, x, y, w, h, fallbackColor, label) {
  const e = get(name);
  if (e.loaded && e.img.width > 0) {
    const ir = e.img.width / e.img.height, br = w / h;
    let sx = 0, sy = 0, sw = e.img.width, sh = e.img.height;
    if (ir > br) { sw = e.img.height * br; sx = (e.img.width - sw) / 2; }
    else { sh = e.img.width / br; sy = (e.img.height - sh) / 2; }
    ctx.drawImage(e.img, sx, sy, sw, sh, x, y, w, h);
  } else {
    ctx.fillStyle = fallbackColor || C.deep;
    ctx.fillRect(x, y, w, h);
    if (!e.failed) {
      ctx.font = 24 + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label || name, x + w / 2, y + h / 2);
    }
  }
}

// 适配绘制（contain，居中）
function drawFit(ctx, name, x, y, w, h, fallbackColor, label) {
  const e = get(name);
  if (e.loaded && e.img.width > 0) {
    const s = Math.min(w / e.img.width, h / e.img.height);
    const dw = e.img.width * s, dh = e.img.height * s;
    ctx.drawImage(e.img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
  } else {
    rr(ctx, x + 10, y + 10, w - 20, h - 20, 18);
    ctx.fillStyle = fallbackColor || C.dust; ctx.fill();
    if (!e.failed) {
      ctx.font = 24 + 'px ' + FONT; ctx.fillStyle = 'rgba(255,255,255,0.6)';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(label || name, x + w / 2, y + h / 2);
    }
  }
}

module.exports = { get, ready, drawCover, drawFit };
