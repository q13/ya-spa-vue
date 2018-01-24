### 图表库

通过**ya-ui-vue**封装[AntV](https://antv.alipay.com/zh-cn/index.html)数据可视化解决方案，**G2、G6、F2**统一接口约定，对外输出Vue component。

#### 使用方法

已封装的图形组件如下：

* **\<g2-chart /\>** 对应 **[G2.Chart](https://antv.alipay.com/zh-cn/g2/3.x/api/chart.html)** ；
* **\<g6-net /\>** 对应 **[G6.Net](https://antv.alipay.com/zh-cn/g6/1.x/api/net.html)** ；
* **\<g6-tree /\>** 对应 **[G6.Tree](https://antv.alipay.com/zh-cn/g6/1.x/api/tree.html)** ；
* **\<f2-chart /\>** 对应 **[F2.Chart](https://antv.alipay.com/zh-cn/f2/3.x/api/chart.html)** ；

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
  import 'ya-ui-vue/graph/g2';

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