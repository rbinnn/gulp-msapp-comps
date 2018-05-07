// 所有游戏都需要引用的适配器
import 'minigame/weapp-adapter';

// 可以根据需要引用游戏引擎
import 'minigame/laya/laya.core.js';
import 'minigame/laya/laya.ui.js';

import { getData } from './runtime/api';

const width  = window.innerWidth;
const height = window.innerHeight;

const text = 'Hello World!';

let ctx = canvas.getContext('2d');

// 绘制白色矩形
ctx.fillStyle = "#fff";
ctx.fillRect(0, 0, width, height);

ctx.font      = "24px";
ctx.fillStyle = '#000';
ctx.fillText(
    text,
	(width - ctx.measureText(text).width) / 2,
	(height - 24) / 2
);
