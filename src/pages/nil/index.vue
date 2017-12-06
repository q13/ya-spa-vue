<template>
  <div class="page-nil clearfix">
    <div class="icon-page"></div>
    <div class="message">{{ message }}</div>
  </div>
</template>
<script>
export default {
  props: {
    type: { // 默认nil-空白路由，noaccess-无权访问
      type: String,
      default: 'nil'
    },
    tip: String
  },
  computed: {
    message: function () {
      const $route = this.$route;
      let params = $route.params;
      let props = null;
      if (params.props) {
        props = JSON.parse(decodeURIComponent(params.props));
      } else { // 通过属性控制
        props = {
          type: this.type,
          tip: this.tip
        };
      }
      const type = props.type;
      const tip = props.tip;
      let message = '未知原因';
      if (type === 'nil') {
        message = '您可能是迷路了-_-!';
      } else if (type === 'noaccess') {
        message = '当前用户无权限访问';
      } else if (type === 'noorgType') {
        message = '当前域（请查看“' + tip + '”菜单项域设置）下无权限操作';
      } else if (type === 'nopermission') {
        message = '当前用户无权限（请查看“' + tip + '”菜单项权限设置）操作';
      } else if (type === 'nomaintain') { // 属于运营人员
        message = tip;
      }
      return message;
    }
  }
};
</script>
<style scoped>
.page-nil {
  padding: 90px 0 0 160px;
}
.icon-page {
  float: left;
  width: 262px;
  height: 170px;
}
.message {
  font-size: 14px;
  margin-left: 270px;
  margin-top: 64px;
}
</style>

