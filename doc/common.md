### 文件目录和路径命名

多单词小写，中划线连接

### javascript编码规范

遵循 [standardjs](https://standardjs.com/) 标准

#### 特别的

* 可选择使用 [flow](https://flow.org/) 约束
* 可选择使用语句结尾分号（要求项目一致）

### css编码规范

遵循 [BEM](https://en.bem.info/) 命名规范

### 特别的

#### 根据颜色命名

```stylus
@black-bg:    #333333;
@gray-bg:    #ebebeb;
```

#### 抽象命名

```stylus
@primary-color          : @main-color;
@info-color             : #2db7f5;
```

#### 业务命名

```stylus
@desk__normal      : @primary-color;  //空闲
@desk__used      : @red-bg;    //占用
```

#### 视觉元素命名

```stylus
@text-color             : #495060;
@font-size-base         : 14px;
```
