/**
 * 工具库
 */
import {
  Vue
} from './env';
import axios from 'axios';
import {
  merge
} from 'lodash';

const BASE_PATH = '/'; // 总是相对于html
const c2s = (() => {
  var ajaxSources = []; // 存储ajax取消token存储
  return (ajaxOptions, {
    mask = true,
    ajaxType = 'ignore', // 防止二次提交 ignore(等上次请求完才能发请求)/abort(直接中断上次请求)/none(可发多个相同请求)
    withData = true, // 在ajaxType不等于none时起作用
    autoApplyUrlPrefix = true, // 自动附加请求前缀
    silentError = false, // 默认提示错误
    forceMock = false, // 是否强制走本地mock服务
    autoTry = false, // 是否是自动发起的请求尝试
    customCallback = false // 是否自定义callback
  } = {}) => {
    const app = window.__app__;
    const alert = app.methods.alert; // 业务层存储alert引用
    const showIndicator = app.methods.showIndicator || (() => {}); // 显示加载指示器
    const hideIndicator = app.methods.hideIndicator || (() => {}); // 隐藏加载指示器
    const url = ajaxOptions.url;
    if (autoApplyUrlPrefix) {
      ajaxOptions.url = BASE_PATH + url;
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
      action: ajaxOptions.method,
      user: '',
      token: '',
      fields: [],
      sort: [],
      filter: [],
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
          maskElement.style.display = 'none'
          hideIndicator();
        } else {
          if (maskElement.parentNode) { // Fuck flow
            maskElement.parentNode.removeChild(maskElement)
          }
          // 恢复static定位
          if (isRefStatic && refElement) {
            refElement.style.position = 'static'
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
          const data = response.data || {
            header: {
              message: response.status + ' ' + response.statusText
            }
          };
          const header = data.header;
          if (isDevelop() && pathPrefixOnDebug !== 'mock') {
            console.error('提示', '测试服务期接口返回500错误，尝试走本地mock服务重调一次');
            c2s({
              ...ajaxOptions,
              url
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
            if (alert) {
              alert({
                message: header.message,
                iconType: 'error'
              });
            } else {
              window.alert(header.message);
            }
          } else {
            // if (header.code === 50001 || header.code === '50001') { // 业务错误
            if (alert) {
              alert({
                message: header.message,
                iconType: 'error'
              });
            } else {
              window.alert(header.message);
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
        clearAjaxSource();
        clearMask();
      });
    });
  }
})();
/**
 * 获取对应key的查询参数
 */
const getUrlQueryValue = function (key) {
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
 * 根据query params获取平台名
 */
const getPlatformName = function () {
  const platformName = getUrlQueryValue('platformName') || 'pc'; // 默认pc平台
  return platformName;
};

/**
 * 根据query params获取页面title
 */
const getDocumentTitle = function () {
  const title = getUrlQueryValue('title') || ''; // Document title
  return title;
};

/**
 * 设置document title
 * @param {string} title 文档名
 */
const setDocumentTitle = function (title) {
  document.getElementsByTagName('title')[0].innerHTML = title;
};

/**
 * 根据query params获取请求需要忽略的访问路径
 */
const getRequestIgnorePrefix = function () {
  const pathPrefix = getUrlQueryValue('ignorePrefix') || ''; // 二级目录路径
  return pathPrefix;
};

/**
 * 根据请求参数或者访问地址判断是否处于develop状态
 */
const isDevelop = function () {
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
 */
const getProxyPrefix = function () {
  const prefix = getUrlQueryValue('proxy') || 'mock'; // 代理前缀
  return prefix;
};
/**
 * 手动地址跳转
 */
const jumpTo = function (options) {
  const app = window.__app__;
  const router = app.router;
  router.push(options);
};

/**
 * session storage操作
 */
const sessionStorage = function (key, value) {
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
 * 获取app store
 * @param {string} key 要获取的key
 */
const getAppStore = function (key) {
  const app = window.__app__;
  return app[key];
};

/**
 * 设置app store， deep merge方式
 * @param {string} key
 * @param {Mix} value
 */
const setAppStore = function (key, value) {
  const app = window.__app__;
  app[key] = value;
  return value;
};

/**
 * 获取app data
 * @param {string} key
 */
const getAppData = function (key) {
  const appData = getAppStore('data');
  return appData[key];
};

/**
 * 设置app data
 * @param {string} key
 * @param {Mix} value
 */
const setAppData = function (key, value) {
  const appData = getAppStore('data');
  const newValue = merge(appData[key] || {}, value || {});
  appData[key] = newValue;
  setAppStore('data', newValue);
  return newValue;
};
/**
 * 生成唯一id
 */
const generateID = function () {
  return 'x' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
export {
  BASE_PATH,
  c2s,
  getUrlQueryValue,
  getPlatformName,
  getDocumentTitle,
  setDocumentTitle,
  getProxyPrefix,
  isDevelop,
  jumpTo,
  sessionStorage,
  getAppStore,
  setAppStore,
  getAppData,
  setAppData,
  generateID
};
