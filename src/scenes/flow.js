// 章节流程编排：把 对话/擦拭/归位/密码锁/对比 串成一条可存档的关卡流
const chapter = require('../story/chapter1.js');
const Dialogue = require('./dialogue.js');
const Wipe = require('./wipe.js');
const Sort = require('./sort.js');
const Puzzle = require('./puzzle.js');
const Reveal = require('./reveal.js');
const Title = require('./title.js');

const MAKERS = {
  dlg: (game, cfg, done) => new Dialogue(game, cfg.nodes, done),
  wipe: (game, cfg, done) => new Wipe(game, cfg, done),
  sort: (game, cfg, done) => new Sort(game, cfg, done),
  puzzle: (game, cfg, done) => new Puzzle(game, cfg, done),
  reveal: (game, cfg, done) => new Reveal(game, cfg, done)
};

class Flow {
  constructor(game, startStep) {
    this.game = game;
    this.steps = chapter.steps;
    this.i = Math.max(0, Math.min(startStep || 0, this.steps.length - 1));
  }
  enter() { this.game.audio.bgm(0.3); this.load(); }
  load() {
    const s = this.steps[this.i];
    const done = () => this.next();
    const mk = MAKERS[s.t];
    if (!mk) { this.next(); return; }
    if (s.t !== 'dlg') this.game.audio.rain(0.15); // 对话场景由节点自己控制环境声
    this.cur = mk(this.game, s, done);
    if (this.cur.enter) this.cur.enter(this.game);
  }
  next() {
    this.i++;
    if (this.i >= this.steps.length) {
      this.game.save.save({ step: 0, done: true });
      this.game.setScene(() => new Title(this.game));
      return;
    }
    this.game.save.save({ step: this.i });
    this.load();
  }
  update(dt) { if (this.cur && this.cur.update) this.cur.update(dt); }
  render(ctx, W, H) { if (this.cur && this.cur.render) this.cur.render(ctx, W, H); }
  onStart(x, y) { if (this.cur && this.cur.onStart) this.cur.onStart(x, y); }
  onMove(x, y) { if (this.cur && this.cur.onMove) this.cur.onMove(x, y); }
  onEnd(x, y) { if (this.cur && this.cur.onEnd) this.cur.onEnd(x, y); }
}

module.exports = Flow;
