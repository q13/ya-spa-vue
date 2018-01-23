### 一、文件目录和路径命名

- 代码缩进2个空格，除非对应的语言规范中有特别指明;

- 文件资源名中不允许出现特殊字符，大小写敏感；多单词命名一般推荐全小写，中划线 **-** 分割，具体依据各项目命名约定。

### 二、JS编码规范

>遵循 [standardjs](https://standardjs.com/) 标准

#### 特别的

- 支持ES2015[规范](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf)，参照[Babel](https://babeljs.io/)支持的polyfill实现；
- 可选择使用 [flow](https://flow.org/) 约束；
- 可选择使用语句结尾分号（要求项目一致）。

### 三、CSS(sass/less/stylus)编码规范

>遵循 [BEM](https://en.bem.info/) 命名规范

#### 特别的

##### 1、根据颜色命名

```stylus
@black-bg: #333333;
@gray-bg: #ebebeb;
```

##### 2、抽象命名

```stylus
@primary-color: @main-color;
@info-color: #2db7f5;
```

##### 3、业务命名

```stylus
@desk__normal: @primary-color; //空闲
@desk__used: @red-bg; //占用
```

##### 4、视觉元素命名

```stylus
@text-color: #495060;
@font-size-base: 14px;
```

### 四、html

#### DTD方式
采用html5的头声明方式 `<!DOCTYPE html>`，DTD声明前不能有任何输出。

#### Meta标签
需要引入的几个标签：
- `<meta charset="utf-8">`；
- `<meta http-equiv="X-UA-Compatible" content="IE=edge">`；
- `<meta name="viewport" content="width=device-width, initial-scale=1">`。

#### 特别的
- 标签名(Tag name)、属性名(Attribute name)、属性值(Attribute value)采用小写字母，多单词属性(名/值)用`-`（中划线）连接；
- 保证页面内`id`值唯一；
- button标签需要指定对应的`type`值，image标签需要指定对应的`alt`值；
- 用于控制间隔的空格字符用`&nbsp;`实体字符代替；
- 属性值(Attribute value)用`"`（双引号）引用方式，不允许出现`'`（单引号）引用；

#### Template
以下为一个html模版示例：

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>页面标题</title>
    <meta name="description" content="">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Place favicon.ico and apple-touch-icon(s) in the root directory -->

    <link rel="stylesheet" href="#">
    <script src="#"></script>
  </head>
  <body>
      页面内容区
  </body>
</html>
```


