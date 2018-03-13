/**
 * debug模式初始化
 * 便于调试查看
 */
import {
  localStorage
} from './utils';
import hook from './hook';

export default function () {
  let debugMode = localStorage('debugMode') || 'off'; // 默认关闭
  // 开启debug模式
  var clicks = [];
  // 注册开启动作
  document.addEventListener('mousedown', (evt) => {
    const clientX = evt.clientX;
    const clientY = evt.clientY;
    if (clientX <= 32 && clientY <= 32) {
      clicks.push(new Date() / 1);
    }
    clicks = clicks.slice(-5); // 取最后五次点击
    // 计算最后一次点击和第一次点击间隔不超过2s，则为开启信号
    if (clicks.length === 5 && (clicks[4] - clicks[0]) <= 2000) {
      debugMode = 'on';
      // 本地存储标识
      localStorage('debugMode', debugMode);
      // 提示已开启debug提示
      // window.alert('已开启通信错误监测面板');
    }
  });
  // 注册hook
  hook('response@ajax', function ({
    data,
    type
  }) {
  });
};
