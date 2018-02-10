/**
 * 基于vuex的状态管理仓库
 */
import {
  merge
} from 'lodash';
import getStore from '../../src/app/store';

const state = function () {
  return {
    activePage: null, // 存储当前激活page
    cachePages: [], // 保存被缓存的page name
    onlyPage: false, // page是否独占整个页面
    pageTransitionName: 'opacity', // 默认opacity效果
    fromRoute: null, // 存储上一个路由信息
    route: null, // 存储当前路由信息
    appData: null // 存储app级别数据
  };
};
const mutations = {
  pageChange(state, activePage) {
    state.activePage = activePage;
  },
  cachePageAdd(state, pageName) {
    let cachePages = state.cachePages;
    const pageNames = [].concat(pageName);
    pageNames.forEach((pageName) => {
      if (!cachePages.some((value) => {
        return value === pageName;
      })) {
        cachePages.push(pageName);
      }
    });
  },
  onlyPageChange(state, onlyPage) {
    state.onlyPage = onlyPage;
  },
  pageTransitionNameChange(state, pageTransitionName) {
    state.pageTransitionName = pageTransitionName;
  },
  routeChange(state, route) {
    state.route = route;
  },
  fromRouteChange(state, route) {
    state.fromRoute = route;
  },
  // 突变改变appData
  appDataChange(state, value) {
    const appData = state.appData;
    state.appData = {
      ...appData,
      ...value
    };
  }
};

/**
 * Deep merge default options
 */
export function init() {
  return merge({
    state: {
      ...state()
    },
    getters: {
    },
    actions: {},
    mutations: {
      ...mutations
    },
    modules: {
    }
  }, getStore());
};
