// @flow
/**
 * 建立组件或模块间通信渠道机制
 * 通过自定义指令方式
 * 响应式通信
 */
// import 'element-dataset'
var Channel = {};
var handlerStore = new Map(); // handler存储
// 无通道
const nilChan = {
  on: () => {},
  off: () => {},
  cache: () => {}
};
Channel.install = function (Vue: any) {
  // const extend = Vue.extend
  /**
   * 扩展extend方法，给每个Component添加__
   */
  // Vue.extend = function (...arg) {
  //   var Cpt = extend.apply(this, arg)
  //   Cpt.__cpt_uid__ = 'cpt' + counts++
  //   return Cpt
  // }
  Vue.mixin({
    props: {
      channel: [String, Array]
    },
    beforeCreate: function () {
      /**
       * 获取有效channel值
       */
      const getChannel = () => {
        const $options = this.$options;
        const propsData = $options.propsData;
        // console.log('originChannel', propsData)
        return propsData && propsData.channel && [].concat(propsData.channel);
      };
      // 重载$emit，支持渠道信息发送
      const $emit = this.$emit;
      this.$emit = function (evt, ...args) {
        const ctor = this.constructor;
        if (evt === '::') {
          const originChannel = getChannel();
          // console.log('originChannel', originChannel)
          if (!originChannel) {
            return;
          }
          // const currentChannel = [].concat(channelDirective.value)
          const currentChannel = originChannel;
          // 找到对应的channel apply callback
          // let handlers = [...handlerStore]
          let handlers = Array.from(handlerStore);
          // 筛选出对应channel的handler
          handlers = handlers.filter(([k, v]) => {
            return currentChannel.some((v2) => {
              return v.channel.find((v3) => v3 === v2)
            });
          });
          // callback处理
          handlers.forEach(([cpt, v]) => {
            // let entries = [...v.store]
            let entries = Array.from(v.store);
            // 筛选ctor对应的callback
            entries = entries.filter(([k2, v2]) => {
              return k2 === ctor;
            });
            // callbacksList [[cb, cb, ...]]
            let callbacksList = entries.map(([k3, v3]) => {
              v3.cache = args; // 更新缓存emit数据
              return v3.callbacks;
            });
            // 带上*
            if (v.store.has('*')) {
              let starValue = v.store.get('*');
              if (starValue) {
                starValue.cache = args; // 全局作用同样更新
                callbacksList.push(starValue.callbacks);
              }
            }
            // 执行对应的callback
            callbacksList.forEach((callbacks) => {
              callbacks.forEach((callback) => {
                callback.apply(cpt, args);
              });
            });
          })
        } else {
          return $emit.apply(this, [evt].concat(args));
        }
      }
      // 建立一条通道
      this.$chan = function (...args) {
        const cpt = this;
        let handler = handlerStore.get(this);
        const originChannel = getChannel();
        if (!originChannel) {
          return nilChan;
        }
        handler = handler || {
          channel: [],
          store: new Map()
        };
        // 重新设置渠道
        handler.channel = originChannel;
        // patch, ugly, For指令更新重写channel
        this.$vnode.__channel__ = handler.channel;
        // 重设handler引用
        handlerStore.set(this, handler);

        let items = [];
        const store = handler.store;
        if (!args.length) { // 全局监听挂在自己class下
          args = ['*'];
        }
        /**
         * 获取最近一次emit出来的arguments
         * @param { VueComponent } ctor
         */
        const getCacheCopy = (ctor) => {
          let result = null;
          // console.log(handlerStore);
          // [...handlerStore].some(([k, v]) => {
          Array.from(handlerStore).some(([k, v]) => {
            if (k !== this) { // 排除自身
              if (originChannel.some((v2) => { // 找到同channel
                return v.channel.find((v3) => v3 === v2);
              })) {
                const store = v.store;
                // return [...store].some(([k2, v2]) => {
                return Array.from(store).some(([k2, v2]) => {
                  if (k2 === ctor) {
                    result = v2.cache; // 获取最近cache的emit值
                    return true;
                  }
                });
              }
            }
          })
          return result;
        }
        // 设置callback容器
        args.forEach((arg) => {
          // 提取ctor
          const ctor = arg === '*' ? '*' : (arg._Ctor ? arg._Ctor['0'] : (typeof (arg) === 'function' ? arg : arg.constructor));
          const item = store.get(ctor) || {
            on: registCallback,
            off: unregistCallback,
            cache: getCacheCopy(ctor), // 存储最后一次emit出来的arguments
            callbacks: []
          }; // 存储callback list
          items.push(item);
          store.set(ctor, item);
        });
        // 输出代理对象
        return {
          on: function (callback) {
            items.forEach((item) => {
              item.on(callback);
            });
          },
          off: function (callback) {
            items.forEach((item) => {
              item.off(callback);
            });
          },
          cache: function (callback) {
            items.forEach((item) => {
              if (item.cache) { // 有缓存先执行再注册
                callback.apply(cpt, item.cache);
              }
              item.on(callback);
            });
          }
        }
      }
    },
    created: function () {
      this.$watch('channel', function (nv, ov) {
        let handler = handlerStore.get(this);
        if (handler) {
          handler.channel = [].concat(nv);
          handlerStore.set(this, handler);
        }
      })
    },
    beforeDestroy: function () {
      // 删除保存的callback句柄
      handlerStore.delete(this);
    }
  })
}
/**
 * 注册callback
 * @param {function (*)} callback
 */
function registCallback (callback: () => void) {
  let callbacks = this.callbacks;
  // 防止重复注册
  if (!callbacks.some((v) => {
    return v === callback;
  })) {
    callbacks.push(callback);
  }
  return this.callbacks;
}
/**
 * 取消注册callback
 * @param {function (*)} callback
 */
function unregistCallback (callback: () => void) {
  let callbacks = this.callbacks;
  this.callbacks = callbacks.filter((v) => {
    return v !== callback;
  });
  return this.callbacks;
}
export default Channel;
