# A Ya SPA template

一套基于vue搭建的项目模板，适应多终端平台（PC/Mobile），不同类型项目实现，如基于会员类型构建的管理系统，移动端功能webapp等等。

**关键字：职责分担，最小化关注范围，开箱即用，响应式重于命令式，懒加载加持**
## 安装

### 全局安装yz-cli脚手架

```sh
npm install -g yz-cli
```

### 使用ya命令创建项目（eg. 项目名为demo）

```sh
ya init demo
```

**执行过程如下，优先使用yarn安装：**

<img alt="执行过程" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/run.png" />

### 更新模板文件

```sh
cd demo
ya update
```


## 使用方法

### 项目启动

```sh
cd demo
npm run dev
npm run mock
```

### 开发 

<img alt="目录结构" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/dir.png" />

使用支持**eslint**的Editor或IDE进行开发，**.eslintrc.json**默认在项目根目录下

**业务类型的项目不要操作除src目录下以外的文件**

#### App

目录位置 **/src/app/**

<img alt="app" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/app.png" />

* **index.js：** App级别的公共逻辑放置位置，构建项目整体结构，粘合页面逻辑（page）和模块逻辑（module）
* **preset.styl：** App预设样式
* **sitmap.js：** 网站地图，配置路由和导航信息
* **store.js：** 配置vuex store
* **style.styl：** App框架样式
* **template.html：** App模板结构

#### Page

目录位置 **/src/pages/**

<img alt="page" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/page.png" />

页面逻辑放置位置，以目录划分页面功能，多目录层级组织方式，文件组织方式如下：

* 逻辑、结构、样式拆分组织（适合业务功能复杂的实现），对应文件命名**index.js、template.html、style.styl**，编写方式参考**demo1**
* 逻辑、结构、样式组织成单文件（适合轻业务逻辑实现），对应文件命名**index.vue**，编写方式参考**demo2**

#### module

目录位置 **/src/modules/**

业务功能模块放置位置，可能在项目范围内被多个页面逻辑多次引用，以目录划分模块功能，多目录扁平化组织方式，便于引用，文件组织方式参考**page**约定。

<img alt="module" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/module.png" />

#### widgets

通用组件库放置位置，不和业务逻辑产生强耦合，可跨项目使用。组件和主题样式组织方式如下图：

<img alt="widget" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/widget.png" />

**特别要注意的：** 优先采用**ya-ui-vue**对第三方库**element-ui**、**mint-ui**、**antV**的封装。

#### 其它

* **/src/mock/** 放置mock接口文件，参考 [mock官方文档](http://mockjs.com/)
* **/src/deps/** 放置项目依赖文件，包括静态资源文件如图片，svg，iconfont，工具库utils等等

### 特别的

#### 图表库

通过**ya-ui-vue**封装[AntV](https://antv.alipay.com/zh-cn/index.html)数据可视化解决方案，**G2、G6、F2**统一接口约定，对外输出Vue component。

##### 使用方法

已封装的图形组件如下：

* **\<y-chart /\>** 对应 **[G2.Chart](https://antv.alipay.com/zh-cn/g2/3.x/api/chart.html)** ；
* **\<y-net /\>** 对应 **[G6.Net](https://antv.alipay.com/zh-cn/g6/1.x/api/net.html)** ；
* **\<y-tree /\>** 对应 **[G6.Tree](https://antv.alipay.com/zh-cn/g6/1.x/api/tree.html)** ；
* **\<m-chart /\>** 对应 **[F2.Chart](https://antv.alipay.com/zh-cn/f2/3.x/api/chart.html)** ；

1、图形组件拥有的属性（props）

* 与被封装的AntV图形组件属性一一对应，如**width**、**height**、**background** 等等；
* 统一通过**configs** 属性对象设置所有图表配置项（优先级高于单独设置）。
* **onDraw** 绑定用于图形对象的绘制和渲染（具体参考[pc-demo-front](http://git.yazuosoft.com/ipos/pc-demo-front)项目）。

**特别要注意的：** 图形组件属性一旦被设置尽量不要再更改，突变属性值或者替换某一属性对象都将引起内部图形对象重新创建（Deep watch方式），性能低下，推荐采用API调用方式调整图形展现。

2、图形组件拥有的方法（methods）

所有图形组件对外暴露**graph** 方法，用于代理内部图形对象的API接口，使用方式如下：

```vue
<template> 
  <y-chart :configs="configs" on-draw="handleDraw" ref="chart"></y-chart>
<template>
<script>
  export default {
    data() {
      return {
        configs: {
          width: 500,
          height: 500
        }
      };
    },
    methods: {
      handleDraw(chart) {
        chart.interval().position('genre*sold').color('genre');
        chart.render();
      }
    },
    mounted() {
      const chart = this.$refs.chart;
      const data = [
        { genre: 'Sports', sold: 275 },
        { genre: 'Strategy', sold: 115 },
        { genre: 'Action', sold: 120 },
        { genre: 'Shooter', sold: 350 },
        { genre: 'Other', sold: 150 }
      ];
      // 调用source方法会自动触发onDraw回调
      chart.graph('source', data);
    }
  };
</script>
```