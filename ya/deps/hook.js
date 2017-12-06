/**
 * hook机制
 * 用于app业务与project template关联
 */
var store = {}; // 存储所有挂钩的hook
function hook(name, handler) {
  let handlers = store[name] || [];
  if (!handlers.some((item) => { // 不重复添加
    return item === handler;
  })) {
    handlers.push(handler);
  }
  store[name] = handlers;
  // 返回dispose handler
  return function () {
    store[name] = handlers.filter((item) => {
      return item !== handler;
    });
  };
}
/**
 * 异步执行handler
 * @param {string} name
 * @param {Array} args
 */
async function exe(name, ...args) {
  const handlers = store[name] || [];
  let result = [];
  // handlers.forEach(async (handler) => {
  for (let i = 0; i < handlers.length; i++) {
    const handler = handlers[i];
    let value = handler.apply(this, args);
    let isPromise = true;
    // 判断是否为promise
    try {
      const then = value.then;
      const catch_ = value.catch;
      if (Object.prototype.toString.call(then) === '[object Function]' && Object.prototype.toString.call(catch_) === '[object Function]') {
        isPromise = true;
      }
    } catch (evt) {
    }
    if (isPromise) {
      result.push(await value);
    } else {
      result.push(value);
    }
  }
  if (!result.length) {
    result = null;
  } else if (result.length === 1) {
    result = result[0];
  }
  return result;
}
hook.exe = exe; // 暴露引用
export default hook;
