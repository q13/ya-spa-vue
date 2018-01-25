## Hooks

引入方式

```javascript
import hook from '+/deps/hook';
```

### <code>prepare@app</code>
准备数据阶段，返回App初始化数据
```javascript
/**
 * 回调
 * 
 * @callback HookCallback
 * @param {Object} options - 接收的参数
 * @param {Store} options.store - vuex store
 * @return {Object} value - 返回初始化数据
 * @return {Object} value.appData - 项目级别公共数据，返回的数据会自动调用utils.setAppData存储，可以通过utils.getAppData索回
 * @return {Object} value.routerOptions - vue-router 路由创建自定义配置项
 */
/**
 * prepare@app
 * 
 * @param {HookCallback} callback
 */
hook('prepare@app', function ({ store }) {
  return {
    appData: {  // 项目级别数据，比如登录用户个人信息，用户权限, 商户信息等
      permission: ['1', '2', '3'],
      user: { // 用户信息
        name: '13'
      }
    },
    routerOptions: {} // vue-router 路由创建配置项
  };
});

```

### <code>create@app</code>
创建App应用，返回Vue component配置项
```javascript
/**
 * 回调
 * 
 * @callback HookCallback
 * @param {Object} options - 接收的参数
 * @param {Store} options.store - vuex store
 * @param {Router} options.router - vue router
 * @param {Object} options.sitmap - 根据sitmap配置文件生成的配置树
 * @param {Object} options.appData - 项目级别公共数据
 * @return {Object}  - 返回Vue component配置对象
 */
/**
 * create@app
 * 
 * @param {HookCallback} callback
 */
hook('create@app', function (options) {
  return {
    template,
    created() {
      console.log('App component created!');
    }
  };
});

```

### <code>validate@route</code>
验证路由配置有效性，通过验证的路由才会被初始化
```javascript
/**
 * 回调
 * 
 * @callback HookCallback
 * @param {Object} options - 接收的参数
 * @param {Store} options.store - vuex store
 * @param {Object} options.record - sitmap配置项
 * @return {Object} value - 返回值
 * @return {Boolean} [value.isValid = true] - 返回为true表示通用验证，否则未通过
 * @return {Object} value.props - 未通过验证额外需要的meta数据，用于信息提示
 * @return {String} value.props.type = 'nil' - 默认值一般不需要改动
 * @return {Sting} value.props.tip - 未通过验证提示
 */
/**
 * validate@route
 * 
 * @param {HookCallback} callback
 */
hook('validate@route', function ({ record, store }) {
  let isValid = true;
  let props = {
    type: 'nil',
    tip: '权限不足'
  };

  // 默认返回isValid === true
  return {
    isValid,
    props
  }
});

```

### <code>switch@route</code>
用于页面切换拦截，返回为false页面不会响应切换行为

**目前只支持activity路由切换模式**
```javascript
/**
 * 回调
 * 
 * @callback HookCallback
 * @param {Object} options - 接收的参数
 * @param {Store} options.store - vuex store
 * @param {Object} options.route - 对应的vue router配置项
 * @param {Page} options.activePage - 对应的页面Vue component
 * @param {Object} options.record - sitmap设置中对应配置记录
 * @return {Boolean} 返回为false中断切换操作
 */
/**
 * switch@route
 * 
 * @param {HookCallback} callback
 */
hook('switch@route', function (options) {
  const { store } = options;
  const state = store.state;
  const activePage = options.activePage;
  if (state.activePage && state.activePage !== activePage) {
    console.log('Switch', 'Switch success');
  }
  // hook支持异步返回
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, 30);
  });
});

```
