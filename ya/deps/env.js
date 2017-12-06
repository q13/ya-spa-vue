/**
 * App环境预设
 */
import 'babel-polyfill';
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import clientStore from 'store';
import storeExpirePlugin from 'store/plugins/expire';
import Channel from '../plugins/channel';
import Mapping from '../plugins/mapping';
Vue.use(Channel);
Vue.use(Mapping);
Vue.use(VueRouter);
Vue.use(Vuex);

const { mapMutations, mapGetters, mapActions, mapState, createNamespacedHelpers } = Vuex;
clientStore.addPlugin(storeExpirePlugin);

// 设置app命名空间占用
window.__app__ = {
  methods: {}, // 存储不同平台同一方法实现
  data: null, // 业务数据存储
  store: null, // vuex
  router: null // vue-router
};

export {
  Vue,
  VueRouter,
  Vuex,
  mapMutations,
  mapGetters,
  mapActions,
  mapState,
  createNamespacedHelpers,
  clientStore
}
