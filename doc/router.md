## 两种路由模式Activity/Fragment(嵌套路由)

>参考 https://github.com/vuejs/vue-router/issues/1507 

sitmap配置文件用于路由参数配置，具体如下：

### Activity模式
```javascript
const sitmap = [{
  isCache: false, // 是否被缓存
  navText: '页面导航', // 导航文字
  navLink: '/xx', // 导航链接
  navVisible: false, // 导航是否可见
  permission: 'all', // 权限控制，无具备权限将会被筛选掉
  route: {
    path: '/xx',
    component: () => import('../pages/xx/index') // Activity模式下对应路由组件（页面逻辑）
  }
}];
```
Activity模式下一个路由配置项只会对应一个Vue component页面逻辑，复用Vue router官方配置项中<code>component</code>参数。

### Fragment模式（嵌套路由）
```javascript
const sitmap = [{
  isCache: false, // 是否被缓存
  navText: '页面导航', // 导航文字
  navLink: '/xx', // 导航链接
  navVisible: false, // 导航是否可见
  permission: 'all', // 权限控制，无具备权限将会被筛选掉
  route: {
    path: '/xx',
    fragments: { // fragment值为object表示进入手动fragment方式，需要自组件本身管理<router-view />
      default: () => import('../pages/xx/fragment.vue'),
      other: () => import('../pages/xx/other-fragment.vue')
    }
  }
}];
```
Fragment模式下一个路由配置项可能对应多个Vue components页面逻辑，由<code>fragments</code>配置项索引页面逻辑文件位置，使用方式和vue router官方配置项中<code>components</code>一致，可简单理解为用<code>fragments</code>替换<code>components</code>。

### Mix模式（Activity和Fragment同时存在）
```javascript
const sitmap = [{
  isCache: false, // 是否被缓存
  navText: '页面导航', // 导航文字
  navLink: '/xx', // 导航链接
  navVisible: false, // 导航是否可见
  permission: 'all', // 权限控制，无具备权限将会被筛选掉
  route: {
    path: '/xx',
    component: () => import('../pages/xx/index'), // Activity模式下对应路由组件（页面逻辑）
    fragment: () => import('../pages/xx/fragment.vue') // Fragment模式下对应的路由组件（替换modules使用）
  }
}];
```
**不推荐使用Mix模式**

### 特别的

Activity模式下配合**modules**使用，比单纯采用Fragment模式的路由方案更具灵活性，**modules**可方便在多个Activity页面逻辑下多处渲染实例。
