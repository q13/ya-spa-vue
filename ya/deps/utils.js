/**
 * 工具库
 * 引入方式 import utils from '@/deps/utils';
 * @module utils
 */
import {
  Vue
} from './env';
import axios from 'axios';
import {
  merge
} from 'lodash';
import clientStore from 'store';

/**
 * @constant
 * @type {String}
 * @default
 */
export const BASE_PATH = '/'; // 总是相对于html
let apiDomain = window.API_DOMAIN || '/';
if (apiDomain.slice(-1) !== '/') {
  apiDomain = apiDomain + '/';
}
if (apiDomain !== '/') {
  // 考虑附加请求协议
  if (apiDomain.slice(0, 4) !== 'http') {
    apiDomain = location.protocol + '//' + apiDomain;
  }
}
export const API_DOMAIN = apiDomain; // 接口域名
/**
 * 前后端异步通信接口
 * @param {Object} ajaxOptions - axios config
 * @param {Object} options - 自定义配置项
 * @param {Boolean} [options.mask = true] - 请求是否带遮罩
 * @param {String} [options.ajaxType = 'ignore'] - 防止二次提交 ignore(等上次请求完才能发请求)/abort(直接中断上次请求)/none(可发多个相同请求)
 * @param {Boolean} [options.withData = true] - 在ajaxType不等于none时起作用，作为二次提交的判定条件，是否连带提交参数判定
 * @param {Boolean} [options.autoApplyUrlPrefix = true] - 自动附加请求前缀
 * @param {Boolean} [options.silentError = false] - 默认提示错误
 * @param {Boolean} [options.forceMock = false] - 是否强制走本地mock服务
 * @param {Boolean} [options.autoTry = false] - 是否是自动发起的请求尝试
 * @param {Boolean} [options.customCallback = false] - 是否自定义callback
 * @param {Boolean} [options.callbackCoverServer = false] - onError/onCallback是否覆盖server error
 * @return {Promise} Ajax handler
 */
export const c2s = (() => {
  var ajaxSources = []; // 存储ajax取消token存储
  // https://github.com/axios/axios/issues/265 IE 8-9
  axios.interceptors.response.use((response) => {
    if (response.data == null && response.config.responseType === 'json' && response.request.responseText != null) {
      try {
        // eslint-disable-next-line no-param-reassign
        response.data = JSON.parse(response.request.responseText);
      } catch (e) {
        // ignored
      }
    }
    return response;
  });

  return (ajaxOptions, {
    mask = true,
    ajaxType = 'ignore',
    withData = true,
    autoApplyUrlPrefix = true,
    silentError = false,
    forceMock = false,
    autoTry = false,
    customCallback = false,
    callbackCoverServer = false
  } = {}) => {
    const appMethods = getAppStore('methods');
    const alert = appMethods.alert; // 业务层存储alert引用
    const showIndicator = appMethods.showIndicator || (() => {}); // 显示加载指示器
    const hideIndicator = appMethods.hideIndicator || (() => {}); // 隐藏加载指示器
    let url = ajaxOptions.url;
    const originUrl = url; // 保存原始请求地址
    if (autoApplyUrlPrefix) {
      let apiPrefix = window.__api_prefix__; // 附加自定义前缀
      if (apiPrefix) {
        if (apiPrefix.slice(-1) !== '/') {
          apiPrefix = apiPrefix + '/';
        }
        url = apiPrefix + url;
      }
      ajaxOptions.url = API_DOMAIN + url;
    }
    if (ajaxOptions.url.slice(0, 4) === 'http' && typeof ajaxOptions.withCredentials === 'undefined') {
      ajaxOptions.withCredentials = true; // 默认支持跨域cookie
    }
    // 默认post方式
    ajaxOptions.method = ajaxOptions.method || 'post';
    // 返回值默认json
    ajaxOptions.responseType = ajaxOptions.responseType || 'json';
    // ajaxOptions.headers = {
    //   'Content-Type': 'application/x-www-form-urlencoded'
    // }
    let data = ajaxOptions.data || {
      header: null,
      body: null
    };
    data.header = {
      app: '',
      // pageSize: 20,
      // pageNum: 1,
      ...(data.header || {})
    };
    if (typeof data.body === 'undefined') {
      data.body = {};
    }
    // data过滤string参数类型的前后空格
    const dataMainKeys = ['header', 'body'];
    dataMainKeys.forEach((k) => {
      const typeofStr = Object.prototype.toString.call(data[k]);
      if (typeofStr === '[object Object]') { // 只过滤第一层对象
        data[k] = Object.keys(data[k]).reduce((pv, cv) => {
          let value = data[k][cv]
          if (typeof value === 'string') {
            value = value.trim()
          }
          pv = {
            ...pv,
            [cv]: value
          }
          return pv;
        }, {});
      }
    });
    const pathPrefixOnDebug = forceMock ? 'mock' : getProxyPrefix(); // 测试环境下的请求路径前缀
    // 带有ignoreMock字段的接口不添加mock前缀 zhaoyao
    if (isDevelop() && !ajaxOptions.ignoreMock) {
      // 默认从rap上拉数据
      ajaxOptions.url = '/' + pathPrefixOnDebug + '/' + url;
      //
      let pathPrefix = getRequestIgnorePrefix();
      if (pathPrefix) {
        pathPrefix = pathPrefix.split(',');
        let tempUrl = ajaxOptions.url.split('/');
        tempUrl = tempUrl.filter((flagment) => {
          if (pathPrefix.indexOf(flagment) === -1) {
            return true;
          }
        });
        ajaxOptions.url = tempUrl.join('/');
      }
    } else {
      delete ajaxOptions.ignoreMock
      delete data.projectId;
    }
    // 重新指回
    ajaxOptions.data = data;

    let maskElement = null;
    let isRefStatic = false;
    let refElement = null;
    const cancelSource = axios.CancelToken.source();
    // 遮罩处理
    if (mask === true) { // 全局遮罩共用一个遮罩
      // 全屏遮罩
      showIndicator();
      maskElement = document.getElementById('app-ajax-global-mask');
      if (!maskElement) {
        maskElement = document.createElement('div');
        maskElement.id = 'app-ajax-global-mask';
        maskElement.className = 'app-ajax-mask app-ajax-global-mask';
        maskElement.style.display = 'none';
        maskElement.style.position = 'fixed';
        maskElement.style.top = '0';
        maskElement.style.left = '0';
        maskElement.style.width = '100%';
        maskElement.style.height = '100%';
        // maskElement.style.background = 'red';
        maskElement.innerHTML = '<div class="app-ajax-mask-inner"></div>';
        if (document.body) { // Fuck flow
          document.body.appendChild(maskElement);
        }
      }
    } else if (mask instanceof Vue) { // 局部遮罩，要求root element拥有定位，否则给予警告
      refElement = mask.$el;
      const style = window.getComputedStyle(refElement);
      if (style.position === 'static') {
        console.warn('被定位element position === static，数据请求过程中可能会产生布局错乱');
        refElement.style.position = 'relative';
        isRefStatic = true;
      }
      maskElement = document.createElement('div');
      maskElement.className = 'app-ajax-mask app-ajax-part-mask';
      maskElement.style.display = 'none';
      maskElement.style.position = 'absolute';
      maskElement.style.width = refElement.offsetWidth;
      maskElement.style.height = refElement.offsetHeight;
      refElement.appendChild(maskElement);
      // 关联vue component，destroy后abort请求
      mask.$once('destroyed', () => {
        cancelSource.cancel('abort');
      })
    }
    if (maskElement) {
      maskElement.style.display = 'block';
    }
    // 重复请求处理
    ajaxOptions.cancelToken = cancelSource.token;
    if (ajaxType === 'abort' || ajaxType === 'ignore') {
      let isIgnore = false;
      ajaxSources.some((source) => {
        if (ajaxOptions.url === source.url &&
          (!withData || (withData && JSON.stringify(ajaxOptions.data) === JSON.stringify(source.data)))) { // 带请求参数判定和不带请求参数判定
          if (ajaxType === 'abort') {
            source.cancel('abort');
          } else {
            isIgnore = true;
          }
          return true;
        }
      })
      if (isIgnore) { // 需要等待的请求直接返回，不做任何操作
        return Promise.reject('ignore');
      }
    }
    // 存储ajax资源
    ajaxSources.push({
      cancel: cancelSource.cancel,
      url: ajaxOptions.url,
      data: ajaxOptions.data,
      cancelToken: ajaxOptions.cancelToken
    });
    // 清理ajax source
    const clearAjaxSource = function () {
      ajaxSources = ajaxSources.filter((source) => {
        return source.cancelToken !== ajaxOptions.cancelToken
      });
    };
    // 清理mask
    const clearMask = function () {
      if (maskElement) {
        if (mask === true) {
          if (!ajaxSources.length) { // 没有进行中的xhr才取消遮罩
            maskElement.style.display = 'none';
            hideIndicator();
          }
        } else {
          if (maskElement.parentNode) { // Fuck flow
            maskElement.parentNode.removeChild(maskElement);
          }
          // 恢复static定位
          if (isRefStatic && refElement) {
            refElement.style.position = 'static';
          }
        }
      }
    };
    let onSuccess = ajaxOptions.onSuccess || (() => {});
    let onError = ajaxOptions.onError || (() => {});
    let onCallback = ajaxOptions.onCallback || (() => {});
    if (autoTry) { // 自动发起的尝试请求不响应用户逻辑
      onSuccess = onError = () => {};
    }
    return new Promise((resolve, reject) => {
      /**
       * axios resolve回调处理
       */
      const axiosResolveCallback = function (response) {
        const data = response.data;
        if (customCallback) {
          onCallback(data);
          clearAjaxSource();
          clearMask();
        } else {
          if (ajaxOptions.responseType === 'json') {
            const header = data.header;
            if (header.code !== 20000 && header.code !== '0000') {
              if (header.code === '1000' || header.code === 1000 || header.code === 40000 || header.code === '40000') { // 未登录
                // 跳转到首页
                location.href = '/';
                return;
              }
              if (!silentError) { // 业务错误自动提示
                if (alert) {
                  alert({
                    message: header.message,
                    iconType: 'error'
                  });
                } else {
                  window.alert(header.message);
                }
              }
              header.success = false;
              onError(data);
              reject(data);
            } else {
              header.success = true;
              onSuccess(data);
              resolve(data);
            }
          } else {
            onSuccess(data);
            resolve(data);
          }
          clearAjaxSource();
          clearMask();
        }
      };
      axios(ajaxOptions).then((response) => {
        axiosResolveCallback(response);
      }).catch((err) => {
        if (err.response) {
          const response = err.response;
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          // debug模式下尝试走一遍本地mock服务，用于应对远程服务接口不全的情况
          let data = null;
          if (typeof response.data === 'string') {
            data = {
              header: {
                message: response.data
              }
            };
          } else {
            data = response.data || {
              header: {
                message: response.status + ' ' + response.statusText
              }
            };
          }
          const header = data.header;
          if (isDevelop() && pathPrefixOnDebug !== 'mock') {
            console.error('提示', '测试服务期接口返回500错误，尝试走本地mock服务重调一次');
            c2s({
              ...ajaxOptions,
              url: originUrl
            }, {
              mask,
              ajaxType,
              withData,
              autoApplyUrlPrefix,
              silentError,
              forceMock: true,
              autoTry: true
            }).then((response) => {
              axiosResolveCallback({
                data: response
              });
            });
            if (!silentError) {
              if (alert) {
                alert({
                  message: header.message,
                  iconType: 'error'
                });
              } else {
                window.alert(header.message);
              }
            }
          } else {
            // if (header.code === 50001 || header.code === '50001') { // 业务错误
            if (!silentError) {
              if (alert) {
                alert({
                  message: header.message,
                  iconType: 'error'
                });
              } else {
                window.alert(header.message);
              }
            }
            // }
          }
        } else if (err.request) {
          // The request was made but no response was received
          // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
          // http.ClientRequest in node.js
          console.log(err);
        } else {
          // Something happened in setting up the request that triggered an Error
          console.log('Error', err);
        }
        if (callbackCoverServer) {
          if (customCallback) {
            onCallback(err);
          } else {
            onError(err);
          }
        }
        clearAjaxSource();
        clearMask();
      });
    });
  }
})();
/**
 * 获取地址对应查询参数值
 * @param {String} key - Query key
 * @return {String} Value
 */
export const getUrlQueryValue = function (key) {
  const search = location.search;
  var value;
  if (search) {
    search.slice(1).split('&').some((fragment) => {
      const arr = fragment.split('=');
      if (arr[0] === key) {
        value = arr[1];
        return true;
      }
    });
  }
  return value;
};

/**
 * 获取平台名（内部根据platformName参数值判定）
 * @return {String} 平台名
 */
export const getPlatformName = function () {
  const platformName = getUrlQueryValue('platformName') || 'pc'; // 默认pc平台
  return platformName;
};

/**
 * 获取页面title（内部根据title query param返回）
 * @return {Stirng} 页面title
 */
export const getDocumentTitle = function () {
  const title = getUrlQueryValue('title') || ''; // Document title
  return title;
};

/**
 * 设置Document title
 * @param {String} title Document title
 */
export const setDocumentTitle = function (title) {
  document.getElementsByTagName('title')[0].innerHTML = title;
  window.AlipayJSBridge && window.AlipayJSBridge.call('setTitle', { // 支付宝修改title的方式
    title: title
  });
};

/**
 * 根据ignorePrefix查询参数获取请求需要忽略的访问路径
 * @return {String} 路径
 */
export const getRequestIgnorePrefix = function () {
  const pathPrefix = getUrlQueryValue('ignorePrefix') || ''; // 二级目录路径
  return pathPrefix;
};

/**
 * 根据请求参数或者访问地址判断是否处于develop状态
 * 开发环境包括127.0.0.1/localhost/192.168.x.x（不包括192.168.49.61）
 * @return {Boolean} true/false
 */
export const isDevelop = function () {
  const debugValue = getUrlQueryValue('develop') || '';
  if (debugValue !== '') {
    return !!(debugValue / 1);
  } else { // 根据访问地址判断
    const hostname = location.hostname;
    // 本地或者非61的局域网段都认为是开发模式
    if (hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      (hostname.slice(0, 7) === '192.168' && hostname !== '192.168.49.61')
    ) {
      return true;
    } else {
      return false;
    }
  }
};

/**
 * 获取当前代理数据请求地址前缀
 * @return {String} ?proxy="返回值"
 */
export const getProxyPrefix = function () {
  const prefix = getUrlQueryValue('proxy') || 'mock'; // 代理前缀
  return prefix;
};
/**
 * 手动地址跳转
 * @param {Object} options - $router.push(options)
 */
export const jumpTo = function (options) {
  const router = getAppStore('router');
  router.push(options);
};

/**
 * sessionStorage操作
 * @param {String} key - key
 * @param {*} value - value，当value为undefined时为getter操作，否则为setter
 * @return {*} value
 */
export const sessionStorage = function (key, value) {
  var result;
  if (window.sessionStorage) {
    const sessionStorage = window.sessionStorage;
    if (value === undefined) {
      let temp = sessionStorage.getItem(key);
      try {
        const firstChar = temp.slice(0, 1);
        if (firstChar === '{' || firstChar === '[') {
          result = JSON.parse(temp);
        } else {
          result = temp;
        }
      } catch (evt) {
        result = temp;
      }
    } else {
      if (typeof value === 'string') {
        result = sessionStorage.setItem(key, value);
      } else {
        result = sessionStorage.setItem(key, JSON.stringify(value));
      }
    }
  }
  return result;
};

/**
 * localStorage操作
 * 基于 https://github.com/marcuswestin/store.js/ 实现
 * @param {String} key - key
 * @param {*} value - value，当value为undefined时为getter操作，否则为setter
 * @return {*} value
 */
export const localStorage = function (key, value) {
  var result;
  if (value === undefined) { // getter
    result = clientStore.get(key);
  } else {
    result = clientStore.set(key, value);
  }
  return result;
};

// 设置app命名空间占用
var appStore = {
  methods: {}, // 存储不同平台同一方法实现
  data: null, // 业务数据存储
  store: null, // vuex
  router: null // vue-router
};
/**
 * 获取app store
 * @param {String} key - 要获取的key
 * @return {*} value
 */
export const getAppStore = function (key) {
  return appStore[key];
};

/**
 * 设置app store， Deep merge方式
 * @param {String} key - key
 * @param {*} value - value
 * @return {*} value
 */
export const setAppStore = function (key, value) {
  appStore[key] = value;
  return value;
};

/**
 * 获取app data
 * @param {String} key - key
 * @return {*} value
 */
export const getAppData = function (key) {
  const appData = getAppStore('data');
  return appData[key];
};

/**
 * 设置app data
 * @param {String} key - key
 * @param {*} value - value
 * @return {*} value
 */
export const setAppData = function (key, value) {
  const appData = getAppStore('data');
  var newValue;
  if (Object.prototype.toString.call(appData[key]) === '[object Object]' && Object.prototype.toString.call(value) === '[object Object]') {
    newValue = merge(appData[key], value);
  } else if (Object.prototype.toString.call(appData[key]) === '[object Array]' && Object.prototype.toString.call(value) === '[object Array]') {
    newValue = appData[key].concat(value);
  } else {
    newValue = value;
  }
  appData[key] = newValue;
  setAppStore('data', appData);
  return newValue;
};
/**
 * 清除app data
 * @param {String} key - key
 * @return {*} value
 */
export const removeAppData = function (key) {
  const appData = getAppStore('data');
  const value = appData[key];
  delete appData[key];
  setAppStore('data', appData);
  return value;
};
/**
 * 生成唯一id
 * @return {String} uuid
 */
export const generateID = function () {
  return 'x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

/**
 * 自定义log屏幕打印
 * @param {String} message - log message
 * @param {String} [pattern = 'append'] - 信息显示方式：append（追加到上一条后面）; clear（先清屏）
 */
export const log = function (message, pattern) {
  pattern = pattern || 'append';
  let logDom = document.getElementById('app-log');
  let closeHandlerDom = null;
  if (!logDom) {
    logDom = document.createElement('div');
    logDom.id = 'app-log';
    Object.assign(logDom.style, {
      display: 'none',
      position: 'fixed',
      top: 0,
      left: 0,
      width: '80%',
      'margin-left': '10%',
      'max-height': '300px',
      overflow: 'auto',
      'z-index': '100000',
      background: 'white',
      border: '1px solid #000000',
      'box-shadow': '2px 2px 4px #333333',
      'font-size': '16px'
    });
    closeHandlerDom = document.createElement('span');
    Object.assign(closeHandlerDom.style, {
      position: 'absolute',
      top: '4px',
      right: '4px',
      'line-height': '1em'
    });
    closeHandlerDom.addEventListener('click', () => {
      logDom.style.display = 'none';
    });
    closeHandlerDom.innerHTML = '&times;';
    document.body.appendChild(logDom);
    logDom.appendChild(closeHandlerDom);
  }
  logDom.style.display = 'block';
  let messageDom = document.createElement('p');
  Object.assign(messageDom.style, {
    border: '1px solid #333333'
  });
  messageDom.innerHTML = message;
  if (pattern === 'clear') {
    logDom.innerHTML = '';
  }
  logDom.appendChild(messageDom);
};

/**
 * 获取window scrollTop
 * @return {Number} scrollTop值
 */
export const getWindowScrollTop = function () {
  return document.body.scrollTop + document.documentElement.scrollTop;
};

/**
 * 回到顶部
 */
export const gotoWinTop = function () {
  window.scrollTo(0, 0);
};
/**
 * 异步加载js
 * @param {(String|String[])} deps - 要加载的js列表
 * @param {Function} callback - 加载后回调
 */
export const asyncLoadJs = (function () {
  var store = []; // 存储加载后的依赖JS库信息
  return function (deps, callback) {
    // TODO: 考虑Async机制
    deps = [].concat(deps);
    run(function*() {
      let dep = deps.shift();
      let flag = true;
      while (dep && flag) {
        flag = yield create(dep);
        dep = deps.shift();
      }
    }, callback);
    /**
     * 执行器
     * @param  {*}   genFn
     * @param  {*} callback
     * @return {*}
     */
    function run(genFn, callback) {
      var gen = genFn();

      function next(data) {
        var r = gen.next(data);
        if (r.done) {
          callback && callback(true);
          return;
        }
        r.value.then(function (data) {
          next(data);
        }).catch(function (data) {
          next(false);
          callback && callback(false, data);
        });
      }
      next();
    }
    /**
     * 异步按序执行，返回一个Promise对象
     * @param  {*} url
     * @return {*}
     */
    function create(url) {
      if (url.slice(0, 1) !== '/' && url.slice(0, 4) !== 'http') {
        url = BASE_PATH + url;
      }
      var data = store.find((itemData) => {
        return itemData.url === url;
      });
      var p;
      if (!data) {
        p = new Promise(function (resolve, reject) {
          var scriptDom = document.createElement('script');
          scriptDom.src = url;
          scriptDom.onload = scriptDom.onreadystatechange = function () {
            if (!this.readyState || this.readyState === 'loaded' || this.readyState === 'complete') {
              this.onload = this.onreadystatechange = null;
              // 都成功执行回调
              resolve(url);
            }
          };
          scriptDom.onerror = function () {
            reject(url);
          };
          document.getElementsByTagName('head')[0].appendChild(scriptDom);
        });
        store.push({
          url: url,
          promise: p
        });
      } else {
        p = data.promise;
      }
      return p;
    }
  };
}());

/**
 * 异步加载css
 * @param {(String|String[])} deps - 要加载的js列表
 * @param {Function} callback - 加载后回调
 */
export const asyncLoadCss = (function () {
  var store = {};
  return function (deps, callback) {
    deps = [].concat(deps);
    Promise.all(deps.map((dep) => {
      let url = '';
      if (dep.slice(0, 1) !== '/' && dep.slice(0, 4) !== 'http') {
        url = BASE_PATH + dep;
      } else {
        url = dep;
      }
      let p = store[url];
      if (!p) {
        p = new Promise(function (resolve, reject) {
          let linkDom = document.createElement('link');
          linkDom.rel = 'stylesheet';
          linkDom.type = 'text/css';
          linkDom.href = url;
          document.getElementsByTagName('head')[0].appendChild(linkDom);
          linkDom.onload = function () {
            resolve();
          };
          linkDom.onerror = function () {
            reject();
          };
        });
        store[url] = p;
      }
      return p;
    })).then(function () {
      callback();
    }).catch(function (evt) {
      console.log(evt);
    });
  }
}());
