/**
 * App环境预设
 */
import Vue from 'vue';
import VueRouter from 'vue-router';
import Vuex from 'vuex';
import clientStore from 'store';
import storeExpirePlugin from 'store/plugins/expire';
import Channel from '../plugins/channel';
import Mapping from '../plugins/mapping';
import Service from '../plugins/service';
Vue.use(Channel);
Vue.use(Mapping);
Vue.use(Service);
Vue.use(VueRouter);
Vue.use(Vuex);

const { mapMutations, mapGetters, mapActions, mapState, createNamespacedHelpers } = Vuex;
clientStore.addPlugin(storeExpirePlugin);

// Gobal error handler
window.addEventListener('error', function () {
  if (window.console && window.console.error) {
    window.console.error('Global error', arguments);
  }
});

// 设置app命名空间占用
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
