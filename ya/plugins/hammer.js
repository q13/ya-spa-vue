/**
 * Hammer.js directive binding.
 */
import Hammer from 'hammerjs';
import 'element-dataset';

var Binding = {};

Binding.install = function (Vue, options) {
  Vue.directive('hammer', {
    // 卸载组件时解绑
    unbind (el, binding, vnode, oldVnode) {
      el.hammer.destroy();
      el.hammer = null;
    },
    bind (el, binding, vnode, oldVnode) {
      const eventName = binding.arg; // 参数为事件名
      const handler = binding.value; // 事件句柄
      const options = el.dataset.hammerOptions; // hammer配置项
      const hammer = new Hammer(el, options);
      hammer.on(eventName, handler);
      el.hammer = hammer;
    }
  })
}
export default Binding;
