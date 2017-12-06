/**
 * App hook
 */
import hook from '+/deps/hook';
import template from './template.html';
import {
  setDocumentTitle
} from './utils'

// 数据挂钩
hook('prepare@app', function () {
  return { a: 1 };
});
// App component挂钩，将component configs传递给resolve完成初始化
hook('app@app', function (options) {
  const resolve = options.resolve;
  const componentOptions = options.componentOptions;
  console.log('appData', options.appData);
  // 设置document title
  setDocumentTitle('Test');
  setTimeout(() => {
    resolve({
      ...componentOptions,
      template
    });
  }, 0);
});
