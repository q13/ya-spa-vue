/**
 * 建立组件或模块间通信渠道机制
 * 支持家族树内和被指定管理的组件间传递信息
 * 家族树中传递可以随时被return false中断
 * 通过自定义指令方式
 * 响应式通信
 * 优雅使用方式封装，类似v-model方案
 * payload推荐immutable style，不强行约束
 * channel props可动态改变，所有相关信道注册在beforeDestroy生命周期中统一销毁
 * 可同时绑定多种方式信息传播路径
 * channel命名支持局部作用域，绑定到parent component上，遵循parent生命周期, 带#号是的是全局作用域
 * @author 13
 */

var Channel = {};
var channelStore = {}; // 信道存储仓库
/* 以channel name为key索引信道信息
  name值为Symbol类型，所有前缀不是#的子组件的channel name都会被注册到父组件上，跟随父组件生命周期销毁
  有两个特殊的channel name: #up/#down默认附加，用于组件家族树信息传播
  带#的channel name为全局信道，一处注册多处生效
  lastPayload为最近一次信道payload，可能来自多方，最近一次broadcast触发
  callbackMap为回调映射, ctor为组件示例，结构如下
  name: {
    lastPayload: undefined,
    callbackMap: new Map([[ctor, {
      handlers: [{
        isBroadcastRecorder: true/false, // true表示这个handler的存在纯粹是为了记录历次broadcast发出的payload，不参与handler执行
        accumulator: undefined, // 基于历次payload的累加结果
        scan: ({ accumulator, currentValue }) => { // 折叠函数
          return currentValue;
        },
        subscribe: () => {} // 注册callback
      }]
    }]])
  }
*/
const UP = '#up';
const DOWN = '#down';
/**
 * Install method
 * @param {Vue} Vue - Vue
 */
Channel.install = function (Vue) {
  // const extend = Vue.extend
  Vue.mixin({
    props: {
      channel: [String, Array, Object]
    },
    beforeCreate: function () {
      /**
       * 获取有效channel值
       */
      const getChannel = () => {
        const $options = this.$options;
        const propsData = $options.propsData;
        // console.log('originChannel', propsData)
        // 支持逗号字符串和array
        return (
          propsData &&
          propsData.channel &&
          [].concat(
            typeof (propsData.channel) === 'string' ? propsData.channel.split(',') : (Array.isArray(propsData.channel) ? propsData.channel : Object.values(propsData.channel))
          )
        ) || [];
      };
      /**
       * channel经过筛选后的结果
       * @param {Mix} channel - channel
       */
      const getProperChannel = (channel) => {
        const currentChannels = [UP, DOWN].concat(getChannel());
        let channels = []; // 有效信道
        // channel处理
        if (channel === '*') {
          channels = currentChannels;
        } else {
          channels = channels.concat(typeof (channel) === 'string' ? channel.split(',') : channel);
          // 滤掉未设定的信道
          channels = channels.filter((item) => {
            return currentChannels.some((item2) => {
              return item === item2;
            });
          });
        }
        return channels;
      };
      /**
       * 获取对应的global信道名
       * @param {String} name - 信道名
       */
      const getGlobalName = (name) => {
        if (name.slice(0, 1) === '#') { // 全局信道名
          return Symbol.for(name);
        } else {
          const hostCtor = this.$parent || this; // 如果是root组件，默认将信道注册到自己身上
          const localChannels = hostCtor._localChannels || [];
          let existChannel = localChannels.find(({
            localName
          }) => {
            return localName === name;
          });
          if (existChannel) {
            return existChannel.globalName;
          } else { // 生成新的全局信道名
            existChannel = {
              localName: name,
              globalName: Symbol(name)
            };
            localChannels.push(existChannel);
            hostCtor._localChannels = localChannels;
            return existChannel.globalName;
          }
        }
      };
      /**
       * 设置并返回对应的信道
       * @param {String} name - 信道名
       */
      const setupChannel = (name) => {
        name = getGlobalName(name);
        const channel = channelStore[name] || {
          lastPayload: undefined,
          callbackMap: new Map()
        };
        // 指回
        channelStore[name] = channel;
        return channel;
      };
      /**
       * 执行handler
       * 强大一点，同时支持同步和异步返回
       * @param {Object} { handler, payload }
       * @return {Mix} 返回Promise或其它同步数据类型
       */
      const doHandler = ({
        handler,
        payload,
        name,
        // 可阻断up/down传递，但不阻断同级handler执行
        stopPropagation,
        // 可阻断up/down传递，同时阻断同级handler执行
        stopImmediatePropagation
      }) => {
        if (!handler.isBroadcastRecorder) { // 不考虑广播记录员
          const handlerResult = handler.subscribe.call(this, {
            accumulator: handler.accumulator, // 历史累计结果
            payload: payload, // 当前负载
            channel: name, // 信道名
            stopPropagation,
            stopImmediatePropagation
          });
          let currentValue = payload; // 默认scan的当前值为payload，除非handler返回非undefined值了，这时候用返回值替换payload

          if (isPromise(handlerResult)) {
            return new Promise((resolve) => {
              handlerResult.then((value) => {
                if (typeof (value) !== 'undefined') {
                  currentValue = value;
                }
                // 重新计算accumulator
                handler.accumulator = handler.scan({
                  accumulator: handler.accumulator,
                  currentValue
                });
                // resolve状态
                resolve();
              }).catch(() => {
                // 自动阻断broadcast
                stopPropagation();
                stopImmediatePropagation();
                // resolve状态
                resolve();
              });
            });
          } else {
            return new Promise((resolve) => {
              if (typeof (handlerResult) !== 'undefined') {
                currentValue = handlerResult;
              }
              // 重新计算accumulator
              handler.accumulator = handler.scan({
                accumulator: handler.accumulator,
                currentValue
              });
              // resolve状态
              resolve();
            });
          }
        } else {
          return Promise.resolve();
        }
      };
      /**
       * 注册信道回调
       */
      // this.$chan = function (args, autoCapture = false) {
      this.$chan = function (args) {
        args = {
          subscribe: () => {},
          scan: (args) => {
            return args.currentValue;
          },
          autoCapture: false, // 是否立即执行
          matcher: '|', // 缓存捕获的来源，'|'表示来自于信道，'Component Name'来自于对应组件名的accumulator，多个相同name会使来源变的不确定，支持filter function，参数为vm, TODO: 不安全的方式
          ...args
        };
        const { subscribe, ...otherArgs } = args;

        const currentChannels = [UP, DOWN].concat(getChannel()); // 获取当前信道名，包括up/down两个特殊通道
        /**
         * 注册信道
         * @param {String} name - 信道名
         */
        const regCallback = (name, {
          subscribe,
          scan,
          autoCapture,
          matcher
        }) => {
          const channel = setupChannel(name);
          const callbackMap = channel.callbackMap;
          // 获取对应组件的注册信息
          const currentCallbackItem = callbackMap.get(this) || {
            handlers: []
          };
          // 防重
          let { handlers } = currentCallbackItem;
          if (!handlers.some((handler) => {
            return handler.subscribe === subscribe;
          })) {
            // 存储 callback handler
            let newHandler = {
              accumulator: undefined,
              scan,
              subscribe
            };
            handlers.push(newHandler);
            // 标准化matcher
            let normalizeMatcher = () => true;
            // 自动捕获立即执行
            // if (autoCapture && typeof (channel.lastPayload) !== 'undefined') {
            if (autoCapture) { // 自执行保证accumulator是空的，当前payload是上次缓存值
              // doHandler(newHandler, channel.lastPayload);
              let payload;
              /**
               * 获取合适的payload
               * @param {Array} handlers - handlers
               */
              const getProperPayload = (handlers) => {
                let result;
                const broadcastRecorder = handlers.find(({ isBroadcastRecorder }) => {
                  return isBroadcastRecorder;
                });
                if (broadcastRecorder) {
                  result = broadcastRecorder.accumulator;
                }
                return result;
              };

              if (matcher === '|') {
                payload = channel.lastPayload;
              } else if (typeof (matcher) === 'string') {
                /**
                 * name 匹配
                 */
                normalizeMatcher = function (ctor) {
                  return ctor.$options.name === matcher;
                };
                for (let [ctor, value] of callbackMap) {
                  if (ctor.$options.name === matcher) {
                    const { handlers } = value;
                    payload = getProperPayload(handlers);
                    break;
                  }
                }
              } else if (typeof (matcher) === 'function') {
                /**
                 * 自定义筛选器
                 */
                normalizeMatcher = function (ctor) {
                  return matcher(ctor) === true;
                };
                for (let [ctor, value] of callbackMap) {
                  if (matcher(ctor) === true) { // 冒险行为, ctor可能会被消费者篡改
                    const { handlers } = value;
                    payload = getProperPayload(handlers);
                    break;
                  }
                }
              }
              // 执行动作
              doHandler({
                handler: newHandler,
                payload,
                name,
                stopPropagation: () => {},
                stopImmediatePropagation: () => {}
              });
            }
            // 存储matcher
            newHandler.matcher = normalizeMatcher;
          }
          // 回写一遍
          callbackMap.set(this, currentCallbackItem);

          console.log('channelStore', channelStore);
        };
        // 支持多方式绑定
        if (typeof (subscribe) === 'function') { // 注册到当前信道上
          currentChannels.forEach((name) => {
            regCallback(name, {
              subscribe,
              ...otherArgs
            });
          });
        } else {
          // 文本方式注册
          Object.keys(subscribe).forEach((name) => {
            if (currentChannels.some((name2) => {
              return name === name2;
            })) {
              const channelSubscribe = subscribe[name];
              if (typeof (channelSubscribe) === 'function') {
                regCallback(name, {
                  subscribe: channelSubscribe,
                  ...otherArgs
                });
              } else {
                regCallback(name, {
                  ...otherArgs,
                  ...channelSubscribe // 当成单信道配置对象
                });
              }
            } else {
              console.error(name + ' channel can\'t find in this component.');
            }
          });
        }
      }
      /**
       * broadcast recorder register
       * 每个调用$broadcast方法的组件，如果没有broadcastRecorder，都要默认生成一个
       */
      this.$setBroadcastRecorder = function ({
        channel = '*',
        registMode = 'replace', // ignore/replace 有则忽略/直接取代
        recorder = ({
          accumulator = undefined,
          currentValue = undefined
        }) => {
          return currentValue; // 默认记录每次触发的负载
        }
      }) {
        let channels = getProperChannel(channel); // 有效信道
        if (channels.length) {
          channels.forEach((name) => {
            const channel = setupChannel(name);
            const callbackMap = channel.callbackMap || new Map();
            const currentCallbackItem = callbackMap.get(this) || {
              handlers: []
            };
            const { handlers } = currentCallbackItem;
            let position = -1;
            if (handlers.some((handler, i) => {
              if (handler.isBroadcastRecorder) {
                position = i;
                return true;
              }
            })) {
              if (registMode === 'replace') {
                handlers[position].scan = recorder;
              }
            } else {
              handlers.push({
                isBroadcastRecorder: true,
                accumulator: undefined,
                scan: recorder,
                matcher: () => true, // 占位
                subscribe: () => {} // 什么事都不干
              });
            }
            // 回写
            callbackMap.set(this, currentCallbackItem);
          });
        }
      };
      // $broadcast implementation
      this.$broadcast = function ({
        dispatch = '*', // 信道名，*表示向所有信道发送，包括up/down家族树中传递
        payload // 负载
      }) {
        // 只有具备name的组件才可以发送消息，强约束，便于debug
        const componentName = this.$options.name;
        if (!componentName) {
          console.error(this, 'The component should have name first before broadcast');
          return;
        }
        // 设置broadcastRecorder，有则忽略
        this.$setBroadcastRecorder({
          channel: dispatch,
          registMode: 'ignore'
        });
        // 广播开始
        let channels = getProperChannel(dispatch); // 有效信道
        if (channels.length) {
          channels.forEach((name) => {
            const channel = setupChannel(name);
            channel.lastPayload = payload; // 保存最近一次payload
            const callbackMap = channel.callbackMap || new Map();
            /**
             * 递归模式异步执行家族树
             * @param {String} name - 信道名
             * @param {Array} ctors - Vue组件列表
             */
            const asyncDeepDoer = async (name, ctors) => {
              for (const ctor of ctors) {
                const currentCallbackItem = callbackMap.get(ctor);
                let stop = false;
                if (currentCallbackItem) {
                  const { handlers } = currentCallbackItem;
                  for (let handler of handlers) {
                    let immStop = false;
                    if (!immStop) {
                      if (handler.matcher(ctor)) {
                        await doHandler({
                          handler,
                          payload,
                          name,
                          stopPropagation: () => {
                            stop = true; // 中止家族树传递
                          },
                          stopImmediatePropagation: () => {
                            immStop = true; // 中止同级handler执行
                            stop = true; // 中止家族树传递
                          }
                        });
                      }
                    } else {
                      break;
                    }
                  }
                }
                if (!stop) {
                  let nextCtors = [];
                  if (name === UP) {
                    if (ctor.$parent) {
                      nextCtors.push(ctor.$parent);
                    }
                  } else if (name === DOWN) {
                    if (ctor.$children) {
                      nextCtors = nextCtors.concat(ctor.$children);
                    }
                  }
                  if (nextCtors.length) {
                    // no await，多条分路间不需要等待
                    asyncDeepDoer(name, nextCtors);
                  }
                }
              }
            };
            if (name === UP || name === DOWN) { // 家族树间传递
              let ctors = [];
              if (name === UP) {
                if (this.$parent) {
                  ctors.push(this.$parent);
                }
              } else if (name === DOWN) {
                if (this.$children) {
                  ctors = ctors.concat(this.$children);
                }
              }
              asyncDeepDoer(name, ctors);
            } else {
              callbackMap.forEach(({ handlers }, ctor) => {
                if (ctor !== this) { // 自己就别响应自己了
                  // 咔咔整
                  const asyncDoer = async () => {
                    for (let handler of handlers) {
                      let immStop = false;
                      if (!immStop) {
                        if (handler.matcher(ctor)) {
                          await doHandler({
                            handler,
                            payload,
                            name,
                            stopPropagation: () => {}, // 定点通道互不影响
                            stopImmediatePropagation: () => {
                              immStop = true;
                            }
                          });
                        }
                      } else {
                        break;
                      }
                    }
                  };
                  // 不同ctor挂载点多线程执行handlers，互不影响
                  asyncDoer();
                }
              });
            }
            // 广播记录员单独处理，同步方式，不支持异步
            const selfCallbackItem = callbackMap.get(this);
            const { handlers } = selfCallbackItem;
            const broadcastRecordHandler = handlers.find(({ isBroadcastRecorder }) => {
              return isBroadcastRecorder;
            });
            broadcastRecordHandler.accumulator = broadcastRecordHandler.scan({
              accumulator: broadcastRecordHandler.accumulator,
              currentValue: payload
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
      const localChannels = this._localChannels || []; // 本地channel name集合
      // 删除保存的callback句柄
      Object.getOwnPropertySymbols(channelStore).forEach((name) => {
        if (localChannels.some(({
          globalName
        }) => {
          return globalName === name;
        })) {
          // 直接干掉channelCallbackItem
          delete channelStore[name];
        } else { // 干掉绑定的handler组
          const channel = channelStore[name];
          const callbackMap = channel.callbackMap;
          callbackMap.delete(this);
        }
      });
      delete this._localChannels;
    }
  });
};

/**
 * 状态mixin
 * 响应式的
 */
export function stateMixin({
  channel = '', // 信道名
  key = '' // payload格式{ action: 'state', value: undefined }，只筛选 action === state 的payload里的value
  // matcher === 'closest'的情况下，获取家族树最近一个符合规则的payload
  // matcher = 'closest' // 最贴合的，支持String特殊匹配和Function精准匹配
}) {
  var data = function () {
    return {};
  };
  var created = function () {};

  return {
    data,
    created
  };
}

/**
 * 判定mix是否为promise
 * @param {Mix} mix - 混合类型
 */
function isPromise(mix) {
  let isPromise = false;
  // 判断是否为promise
  try {
    const then = mix.then;
    const catch_ = mix.catch;
    if (Object.prototype.toString.call(then) === '[object Function]' && Object.prototype.toString.call(catch_) === '[object Function]') {
      isPromise = true;
    }
  } catch (evt) {}

  return isPromise;
}

export default Channel;
export {
  UP,
  DOWN
};
