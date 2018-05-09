/**
 * 建立组件或模块间通信渠道机制
 * 通过自定义指令方式
 * 响应式通信
 */
// import 'element-dataset'
var Channel = {};
var channelStore = {}; // 信道存储
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
      const setupChannel = (name) => {
        const channel = channelStore[name] || {
          value: void(0), // eslint-disable-line
          callbacks: new Map()
        };
        // 指回
        channelStore[name] = channel;
        return channel;
      };
      /**
       * 注册信道回调
       */
      this.$chan = function (arg, autoCapture = false) {
        const currentChannels = getChannel(); // 获取当前信道名
        if (currentChannels) { // 信道有效才能注册
          /**
           * 注册信道
           * @param {String} name - 信道名
           */
          const regCallback = (name, callback) => {
            const channel = setupChannel(name);
            // 防重
            const callbacks = channel.callbacks;
            if (![...callbacks.values()].some((fns) => {
              return fns.some((fn) => {
                return fn === arg;
              });
            })) {
              // 自动捕获立即执行
              console.log('jfiwjfiw', channelStore);
              if (autoCapture && typeof (channel.value) !== 'undefined') {
                callback.call(this, channel.value, name);
              }
              // 存储callback
              callbacks.set(this, (callbacks.get(this) || []).concat(callback));
            }
          };
          if (typeof (arg) === 'function') { // 注册到当前信道上
            currentChannels.forEach((name) => {
              regCallback(name, arg);
            });
          } else {
            // 文本方式注册
            Object.keys(arg).forEach((name) => {
              if (currentChannels.some((name2) => {
                return name === name2;
              })) {
                regCallback(name, arg[name]);
              } else {
                console.error(name + ' channel can\'t find in this component.');
              }
            });
          }
        }
      };
      // $broadcast
      this.$broadcast = function (payload) {
        const currentChannels = getChannel();
        if (currentChannels) {
          currentChannels.forEach((name) => {
            const channel = setupChannel(name);
            channel.value = payload; // 保存payload
            const callbacks = channel.callbacks || [];
            callbacks.forEach((fns) => {
              fns.forEach((fn) => {
                fn.call(this, payload, name);
              });
            });
          });
        }
      };
      // 重载$emit，支持渠道信息发送
      const $emit = this.$emit;
      this.$emit = function (evt, ...args) {
        if (evt === '::') {
          return this.$broadcast(args[0]);
        } else {
          return $emit.apply(this, [evt].concat(args));
        }
      }
    },
    created: function () {
      // this.$watch('channel', function (nv, ov) {
      //   console.info(`Channel prop ${ov} change to ${nv} may lead to $chan bind failure`);
      // });
    },
    beforeDestroy: function () {
      // 删除保存的callback句柄
      Object.keys(channelStore).forEach((name) => {
        const channel = channelStore[name];
        const callbacks = channel.callbacks;
        callbacks.delete(this);
      });
      console.log('sss', channelStore);
    }
  });
}

export default Channel;
