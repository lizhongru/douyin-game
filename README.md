# 旧物低语者

抖音小游戏 · 原生 Canvas · 竖屏。第一章：八音盒与失踪的店主。

## 目录
- `src/scenes/`  场景：title / dialogue / wipe(擦拭) / sort(归位) / puzzle(密码锁) / reveal(对比)
- `src/story/`   章节脚本（steps 数组；对话节点可带 `sfx` 音效、`rain` 雨声大小）
- `src/audio.js` 音频：`bgm(v)` `rain(v)` 渐变循环；`sfx(name)` 短音效；`scrub()` 擦拭限频
- `images/`      插画（矢量风格，由脚本生成）
- `audio/`       音频（mp3）：bgm_box、amb_rain、sfx_{tap,click,snap,wrong,tick,wipe,chime,bell,jingle}

## 加音效
对话节点：`{ tx: '...', sfx: 'bell' }`；雨声：`{ rain: 0 }` 关闭，不写则按背景取默认值（见 dialogue.js 顶部 RAIN 表）。
