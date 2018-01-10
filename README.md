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

### Page

目录位置 **/src/pages/**

<img alt="app" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/page.png" />

页面逻辑放置位置，以目录划分页面功能，多目录层级组织方式，文件组织方式如下：

* 逻辑、结构、样式拆分组织（适合业务功能复杂的实现），对应文件命名**index.js、template.html、style.styl**，编写方式参考**demo1**
* 逻辑、结构、样式组织成单文件（适合轻业务逻辑实现），对应文件命名**index.vue**，编写方式参考**demo2**

### module

目录位置 **/src/modules/**

业务功能模块放置位置，可能在项目范围内被多个页面逻辑多次引用，以目录划分模块功能，多目录扁平化组织方式，便于引用，文件组织方式参考**page**约定。

<img alt="app" src="https://raw.githubusercontent.com/q13/ya-spa-vue/master/example/images/module.png" />

### widgets

通用组件库放置位置，不和业务逻辑产生强耦合，可跨项目使用。组件和主题样式组织方式如下图：




