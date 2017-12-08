/**
 * App hook
 */
import hook from '+/deps/hook';
import template from './template.html';

// 数据挂钩
hook('prepare@app', function () {
  return {
    appData: null,
    routerOptions: {}
  };
});
// App component挂钩，将component configs传递给resolve完成初始化
hook('app@app', function (options) {
  const resolve = options.resolve;
  const componentOptions = {
    ...options.componentOptions,
    template
  };
  resolve(componentOptions);
});
