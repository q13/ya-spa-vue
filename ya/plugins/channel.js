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
 * 所有在channel传递的信息都为指令，类似http请求无状态模式，短接握手
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
const SIGNAL_SHARE = '_share'; // 共享数据信号
const SIGNAL_DIRECTIVE = 'directive'; // 指令信号
const FLAG_RECEIVE = 'receive'; // share 接收方
const FLAG_PROVIDE = 'provide'; // share提供方
const FLAG_REPLACE = Symbol('R'); // replace
const FLAG_UPDATE = Symbol('U'); // update
const FLAG_REMOVE = Symbol('C'); // remove
const FLAG_ADD = Symbol('A'); // add
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
        /**
         * [{
         *  key: '',
         *  channel: '',
         *  depCtor: null,
         *  channelType: 'receive/provide' receive是share接收方，provide是提供方
         * }]
         */
        const shareChannels = this._shareChannels || []; // 共享信息update/replace专用通道
        // console.log('originChannel', propsData)
        // 支持逗号字符串和array
        let result = (
          propsData &&
          propsData.channel &&
          [].concat(
            typeof (propsData.channel) === 'string' ? propsData.channel.split(',') : (Array.isArray(propsData.channel) ? propsData.channel : Object.values(propsData.channel))
          )
        ) || [];

        // Add share channel
        result = result.concat(shareChannels.map(({ channel }) => {
          return channel;
        }));
        return result;
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
       * @param {Boolean} createOnNill - 空则创建
       */
      const getGlobalName = (name, createOnNill = true) => {
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
            if (createOnNill) {
              existChannel = {
                localName: name,
                globalName: Symbol(name)
              };
              localChannels.push(existChannel);
              hostCtor._localChannels = localChannels;
              return existChannel.globalName;
            } else {
              return null;
            }
          }
        }
      };
      // 暴露到ctor上
      this.$getGlobalChannelName = (name) => {
        return getGlobalName(name, false);
      };
      /**
       * 判断name是否为有效信道
       * @param {String} name - 信道名
       */
      this.$isValidChannel = (name) => {
        const currentChannels = [UP, DOWN].concat(getChannel()); // 获取当前信道名，包括up/down两个特殊通道
        return currentChannels.some((name2) => {
          return name2 === name;
        });
      };
      /**
       * 根据key获取共享channel信息
       * @param {String} key - 共享key值
       */
      this.$getShareChannelByKey = (key, channelType) => {
        const shareChannels = this._shareChannels;
        return shareChannels.filter((item) => {
          return item.key === key && (channelType ? (item.channelType === channelType) : true);
        });
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
        const { callbackMap } = channel;
        if (!callbackMap.has(this)) {
          callbackMap.set(this, {
            shared: [], // 共享state
            handlers: [] // 注册回调
          });
        }
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
        ctx,
        handler,
        payload,
        name,
        // 可阻断up/down传递，但不阻断同级handler执行
        stopPropagation,
        // 可阻断up/down传递，同时阻断同级handler执行
        stopImmediatePropagation
      }) => {
        if (!handler.isBroadcastRecorder) { // 不考虑广播记录员
          // 只响应特定类别的消息
          const supportPayloadTypes = handler.payloadType === '_' ? [SIGNAL_SHARE, SIGNAL_DIRECTIVE] : [handler.payloadType];
          const currentPayloadType = isSharePayload(payload) ? SIGNAL_SHARE : SIGNAL_DIRECTIVE;
          if (supportPayloadTypes.some((item) => {
            return item === currentPayloadType;
          })) {
            const handlerResult = handler.subscribe.call(ctx, {
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
          matcher: 'closest', // 缓存捕获的来源，'closest'表示来自于信道最近一个，'Component Name'来自于对应组件名的accumulator，多个相同name会使来源变的不确定，支持filter function，参数为vm, TODO: 不安全的方式
          payloadType: SIGNAL_DIRECTIVE, // 消息类型，directive: 指令，_share: 共享数据，_：所有类型
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
          matcher,
          payloadType
        }) => {
          const channel = setupChannel(name);
          const callbackMap = channel.callbackMap;
          // 获取对应组件的注册信息
          const currentCallbackItem = callbackMap.get(this);
          // 防重
          let { handlers } = currentCallbackItem;
          if (!handlers.some((handler) => {
            return handler.subscribe === subscribe;
          })) {
            // 存储 callback handler
            let newHandler = {
              accumulator: undefined,
              scan,
              subscribe,
              payloadType
            };
            handlers.push(newHandler);
            // 标准化匹配器
            const newMatcher = normalizeMatcher(matcher);
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
              if (matcher === 'closest') {
                // payload = channel.lastPayload;
                applyWithMatcherOnChannel.call(this, {
                  channel: name,
                  matcher: newMatcher,
                  runner: (callbackItem) => {
                    const { handlers } = callbackItem;
                    payload = getProperPayload(handlers);
                    if (typeof payload !== 'undefined') {
                      return true;
                    }
                  }
                });
              } else if (typeof (matcher) === 'string' || isFunction(matcher)) {
                /**
                 * name/filter 匹配
                 */
                applyWithMatcherOnChannel.call(this, {
                  channel: name,
                  matcher: newMatcher,
                  runner: (callbackItem) => {
                    const { handlers } = callbackItem;
                    payload = getProperPayload(handlers);
                    return true;
                  }
                });

                // for (let [ctor, value] of callbackMap) {
                //   if (ctor.$options.name === matcher) {
                //     const { handlers } = value;
                //     payload = getProperPayload(handlers);
                //     break;
                //   }
                // }
              }
              if (typeof payload !== 'undefined') { // 找到有效值才执行
                // 执行动作
                doHandler({
                  ctx: this,
                  handler: newHandler,
                  payload,
                  name,
                  stopPropagation: () => {},
                  stopImmediatePropagation: () => {}
                });
              }
            }
            // 存储matcher
            newHandler.matcher = newMatcher;
          }
          // console.log('$chan', channelStore);
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
            if (this.$isValidChannel(name)) {
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
            const callbackMap = channel.callbackMap;
            const currentCallbackItem = callbackMap.get(this);
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
        if (!componentName && !isShareReflectPayload(payload)) {
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
            const callbackMap = channel.callbackMap;
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
                      if (handler.matcher(this, payload)) {
                        await doHandler({
                          ctx: ctor,
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
                        if (handler.matcher(this, payload)) {
                          await doHandler({
                            ctx: ctor,
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
      // 信道状态共享
      const channelShare = this.$options.channelShare;
      this._initShare = () => {};
      this._destroyShare = () => {};
      if (channelShare) {
        let tempShareRecords = [];
        Object.keys(channelShare).forEach((name) => {
          const channel = setupChannel(name);
          const optionShared = normalizeOption(channelShare[name], 'key', () => { // 被共享的状态key值(包含所有绑定在ctor上的响应数据，如props、data、computed等)
            return {
              reflect: false, // 是否开启被动响应模式，共享接受方可以通过$shareChange方法变更share state
              watchDeep: false, // 是否深度监控
              onChange: ({
                changeValue,
                mode,
                currentValue
              }) => { // replace模式
                if (mode === FLAG_REPLACE) {
                  return changeValue;
                }
              }
            };
          });
          const { callbackMap } = channel;
          const currentCallbackItem = callbackMap.get(this);
          const { shared } = currentCallbackItem;
          optionShared.forEach(({
            key,
            watchDeep,
            reflect,
            onChange
          }) => {
            if (isPlainObject(onChange)) { // 支持对象按增改查罗列
              const originOnChange = onChange;
              onChange = (args) => {
                return originOnChange[args['mode']](args);
              };
            }
            let item = { // 存储共享状态key
              key,
              watchDeep,
              watch: () => {
                // 监控value值变化，自动emit
                item.unwatch = this.$watch(key, (value) => {
                  this.$broadcast({ // 广播共享changed值
                    dispatch: name,
                    payload: {
                      action: SIGNAL_SHARE,
                      key,
                      value // TODO: 不可变数据？
                    }
                  });
                }, {
                  deep: watchDeep
                });
              },
              /**
               * 注册被动变更handler
               */
              registreflectHandler: (channel) => {
                // 根据reflect判定是否能被动触发变更
                if (reflect) {
                  this.$chan({
                    subscribe: {
                      [channel](args) {
                        const { payload } = args;
                        const shareChannelItems = this.$getShareChannelByKey(key, FLAG_PROVIDE); // 动态变更的，需及时判定
                        if (shareChannelItems.some((item) => {
                          return item.channel === args.channel;
                        })) {
                          const { action, value } = payload;
                          const currentValue = this[key];
                          const newValue = onChange({
                            mode: action,
                            changeValue: value,
                            currentValue
                          });
                          if (typeof (newValue) !== 'undefined') {
                            this[key] = newValue;
                          } else {
                            console.warn(`${key} shared state received change signal,but no valid mutation handler`);
                          }
                        }
                      }
                    }
                  });
                }
              }
            };
            shared.push(item);
            // 临时记录
            tempShareRecords.push(item);
          });
        });
        // 定义shareInit方法, created后执行，beforeCreated时state还没准备好
        this._initShare = () => {
          tempShareRecords.forEach((item) => {
            item.watch(); // 执行watch
          });
          this._initShare = null; // 只执行一次
        };
        // 定义shareDestroy方法, beforeDestroy时执行
        this._destroyShare = () => {
          tempShareRecords.forEach((item) => {
            item.unwatch(); // 执行unwatch
            item.watch = null; // 防止内存泄漏
          });
          this._destroyShare = null; // 只执行一次
          tempShareRecords = null; // 防止内存泄漏
        };
      }
    },
    created: function () {
      // this.$watch('channel', function (nv, ov) {
      //   console.info(`Channel prop ${ov} change to ${nv} may lead to $chan bind failure`);
      // });
      // watch shared key，broadcast change
      this._initShare();
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
      this._destroyShare(); // 销毁共享状态存在
      const shareChannels = this._shareChannels || [];
      // 清理provide类型的共享channel
      shareChannels.forEach(({ channel, channelType }) => {
        if (channelType === FLAG_PROVIDE) {
          const channelName = this.$getGlobalChannelName(channel);
          if (channelName) { // 直接干掉信道
            delete channelStore[channelName];
          }
        }
      });
      this._shareChannels = null; // 释放

      // 销毁channel绑定函数，防内存泄漏
      this.$setBroadcastRecorder = null;
      this.$broadcast = null;
      this.$chan = null;
      this.$getGlobalChannelName = null;
      this.$isValidChannel = null;
      console.log('beforeDestory', channelStore);
    }
  });
  // 定义合并逻辑
  var strategies = Vue.config.optionMergeStrategies;
  const originDataStrategy = strategies.data;
  strategies.data = function (...args) {
    // 交换位置，保证stateShareMixin里data插入优先级大
    if (args[0] && args[0].flag === 'channel') {
      const arg1 = args[1];
      args[1] = args[0];
      args[0] = arg1;
    }
    const fn = originDataStrategy.apply(this, args);
    return fn;
  };
};

/**
 * 共享状态mixin
 * 响应式的
 * 强关联和弱关联，强关联指那些能在初始化过程中找到绑定值的，建立起和ctor直接对应关系，对应的ctor销毁后关系随之断裂
 * 弱关联指那些在初始化过程中没找到绑定值的，模糊关联，后期建立的ctor信息绑定关系可被替换
 * 只有强关联才会自动绑定update/replace change方法
 */
export function stateShareMixin({
  channel = '', // 信道名，只能指定一个
  inject = '', // 完整格式{ from: key, default: undefined }
  // matcher === 'closest'的情况下，获取家族树最近一个符合规则的payload
  matcher = 'closest' // closest/name/filter 最贴合的，支持String特殊匹配和Function精准匹配
}) {
  var data = function () {
    return {};
  };
  var created = function () {};
  var methods = {};
  // channel和inject必须有值
  if (channel && inject) {
    const injectNormalized = normalizeOption(inject, 'from');
    data = function () {
      var result = {};
      const isValidChannel = this.$isValidChannel(channel);
      if (isValidChannel) {
        // from：共享来源key，to：当前接收key
        injectNormalized.forEach(({ from, to, defaultValue }) => { // 每个key值单独寻找，多个key可能分布在多个ctor中存在
          applyWithMatcherOnChannel.call(this, {
            channel: channel,
            matcher: normalizeMatcher(matcher),
            runner: (callbackItem, ctor) => {
              const { shared } = callbackItem;
              return shared.some(({ key, registreflectHandler }) => {
                if (key === from) {
                  to = to || from;
                  result[to] = ctor[key]; // TODO: // 不可变数据？
                  // 建立共享信道
                  const shareChannel = setShareChannel({
                    provider: ctor,
                    receiver: this,
                    key: from
                  });
                  // 强关联auto change
                  registreflectHandler(shareChannel);
                  return true; // 返回true中止遍历
                }
              });
            }
          });
          // 设置默认值
          if (typeof result[from] === 'undefined' && typeof defaultValue !== 'undefined') {
            result[from] = isFunction(defaultValue) ? defaultValue() : defaultValue;
          }
        });
      }
      console.log('result', result);
      return result;
    };
    created = function () {
      const isValidChannel = this.$isValidChannel(channel);
      if (isValidChannel) {
        this.$chan({
          subscribe: {
            [channel]({
              payload
            }) {
              if (isSharePayload(payload)) { // 如果是共享消息体
                const { key, value } = payload;
                if (injectNormalized.some(({ from }) => { // 控制来源消息包含在插入key字段信息内
                  return from === key;
                })) {
                  if (typeof (this[key]) !== 'undefined') {
                    this[key] = value; // 同步到本地data里
                  }
                }
              }
            }
          },
          payloadType: SIGNAL_SHARE, // 只响应共享消息体
          matcher: (ctor, payload) => {
            if (isSharePayload(payload)) { // 如果是共享消息体
              const { key } = payload; // 判断是否强关联，如果是，必须严格响应来自绑定组件的共享信息传递
              const shareChannelItems = this.$getShareChannelByKey(key, FLAG_RECEIVE);
              if (shareChannelItems.length) { // 在有共享信道条件下判断来源是否和前面绑定一致
                if (shareChannelItems[0].relCtorId === ctor._uid) {
                  return true;
                } else {
                  return false;
                }
              } else {
                return true;
              }
            } else {
              return true;
            }
          }
        });
      }
    };
    // 附加auto change方法，只针对强关联有效，且分享key开启了reflect === true模式(默认不开启)
    Object.assign(methods, {
      /**
       * 共享状态变更
       * @param {String} key - 共享key
       * @param {Mix} value - 变更共享值
       * @param {Object|String} [opts = 'R'] - 控制参数，R === replace(直接替换) / U === update(Merge方式)
       */
      $shareStateChange(key, value, opts = FLAG_REPLACE) {
        const shareChannelItems = this.$getShareChannelByKey(key, FLAG_RECEIVE);
        if (shareChannelItems.length) { // 强关联
          let changeMode = opts;
          if (!isShareReflectFlag(changeMode)) {
            changeMode = opts.changeMode; // 认为是Object
          }
          this.$broadcast({
            dispatch: shareChannelItems[0].channel, // 关联唯一信道
            payload: {
              action: changeMode,
              value
            }
          });
        }
      }
    });
  }

  data.flag = 'channel';
  created.flag = 'channel';

  return {
    data,
    created,
    methods
  };
}
/**
 * 判断a/b类型是否一致
 */
// function isTypeIdentity(a, b) {
//   return Object.prototype.toString.call(a) === Object.prototype.toString.call(b);
// }

const SHARE_CHANNEL_PREFIX = '#_share';
let shareChannelCounts = 0;
/**
 * 设置共享信道信息
 */
function setShareChannel({
  receiver = null,
  provider = null,
  key = ''
}) {
  shareChannelCounts++;
  const channel = SHARE_CHANNEL_PREFIX + '_' + shareChannelCounts;
  // 设置receiver
  let shareChannels = receiver._shareChannels || [];
  shareChannels.push({
    channel,
    key,
    channelType: FLAG_RECEIVE,
    relCtorId: provider._uid // 关联ctorId
  });
  receiver._shareChannels = shareChannels;
  // 设置provider
  shareChannels = provider._shareChannels || [];
  shareChannels.push({
    channel,
    key,
    channelType: FLAG_PROVIDE,
    relCtorId: receiver._uid // 关联ctorId
  });
  provider._shareChannels = shareChannels;
  return channel; // 返回channel信道名
}
/**
 * 标准化matcher
 * @param {Mix} matcher - 待标准化matcher
 */
function normalizeMatcher(matcher) {
  if (matcher === 'closest') {
    return () => true;
  } else if (typeof matcher === 'string') {
    return (ctor) => {
      return ctor.$options.name === matcher;
    };
  } else if (isFunction(matcher)) {
    return (ctor, ...matcherArgs) => {
      return matcher(ctor, ...matcherArgs) === true;
    };
  }
  return () => false;
}
/**
 * 符合matcher执行runner
 * UP/DOWN自带二层含义(限定UP/DOWN传播方向 UP: self -> childern/DOWN: parent -> self)
 * this指向当前ctor
 */
function applyWithMatcherOnChannel({
  channel = '',
  matcher = () => true,
  runner = () => {}
}) {
  if (channel) {
    const channelName = this.$getGlobalChannelName(channel);
    if (channelName) {
      const channelItem = channelStore[channelName];
      const { callbackMap } = channelItem;
      if (channel === UP || channel === DOWN) {
        const walk = (name, ctors) => {
          for (const ctor of ctors) {
            if (matcher(ctor) === true) {
              const currentCallbackItem = callbackMap.get(ctor);
              if (currentCallbackItem) { // 在UP/DOWN上有注册
                if (runner(currentCallbackItem, ctor) === true) {
                  break;
                }
              }
            }
            let nextCtors = [];
            if (name === UP) {
              if (ctor.$children) {
                nextCtors = nextCtors.concat(ctor.$children);
              }
            } else if (name === DOWN) {
              if (ctor.$parent) {
                nextCtors.push(ctor.$parent);
              }
            }
            if (nextCtors.length) {
              walk(name, nextCtors);
            }
          }
        };
        let ctors = [];
        if (channel === UP) {
          if (this.$children) {
            ctors = ctors.concat(this.$children);
          }
        } else if (channel === DOWN) {
          if (this.$parent) {
            ctors.push(this.$parent);
          }
        }
        // 家族树间执行
        if (ctors.length) {
          walk(channel, ctors);
        }
      } else { // 信道点间执行
        for (const [ctor, callbackItem] of callbackMap.entries()) {
          if (ctor !== this) { // 自己就别找自己了
            if (matcher(ctor) === true) {
              if (runner(callbackItem, ctor) === true) {
                break;
              }
            }
          }
        }
      }
    }
  }
}
/**
 * 判断是否为函数
 * @param {Mix} args - 待判定的参数
 */
function isFunction(args) {
  if (Object.prototype.toString.call(args) === '[object Function]') {
    return true;
  }
  return false;
}
/**
 * 判断是否为普通对象
 * @param {Mix} args - 待判定的参数
 */
function isPlainObject(args) {
  if (Object.prototype.toString.call(args) === '[object Object]') {
    return true;
  }
  return false;
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
/**
 * 判断value是否为share reflect flag
 */
function isShareReflectFlag(value) {
  return [FLAG_ADD, FLAG_REMOVE, FLAG_REPLACE, FLAG_UPDATE].some((value2) => {
    return value2 === value;
  });
}
/**
 * payload是否为共享反射指令
 */
function isShareReflectPayload(payload) {
  let isTrue = false;
  try {
    isTrue = isShareReflectFlag(payload['action']);
  } catch (evt) {}
  return isTrue;
}

/**
 * payload是否为共享指令
 */
function isSharePayload(payload) { // eslint-disable-line
  let isShare = false;
  try {
    isShare = (payload['action'] === SIGNAL_SHARE);
  } catch (evt) {}
  return isShare;
}
/**
 * 标准化参数选项
 * @param {Mix} args - 带格式化参数
 * @param {Function} normalizer - 格式器
 */
function normalizeOption(args, key = 'key', normalizer = (value) => {
  return value;
}) {
  let options = [];
  if (typeof (args) === 'string') {
    if (args) {
      options = options.concat(args.split(',').map((value) => {
        const item = {
          [key]: value
        };
        return {
          ...normalizer(item),
          ...item
        };
      }));
    }
  } else if (Array.isArray(args)) {
    options = options.concat(args.map((value) => {
      if (typeof (value) === 'string') {
        const item = {
          [key]: value
        };
        return {
          ...normalizer(item),
          ...item
        };
      } else {
        return {
          ...normalizer(value),
          value
        };
      }
    }));
  } else { // Object类型
    options.push({
      ...normalizer(args),
      ...args
    });
  }
  return options;
}

export default Channel;
/**
 * UP/DOWN有两层概念，第一层是信道名，第二层是传播方向
 * $broadcast里的dispatch如果设定为UP/DOWN除了指定信道名，还指定了传播方向
 * 类似的还包括stateShareMixin里的channel指定
 */
export {
  UP,
  DOWN,
  SIGNAL_SHARE,
  SIGNAL_DIRECTIVE,
  FLAG_ADD,
  FLAG_REPLACE,
  FLAG_REMOVE,
  FLAG_UPDATE
};
