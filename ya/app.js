/**
 * App component
 */
import {
  Vuex,
  VueRouter,
  mapState
} from './deps/env';
import './deps/base.css';
import {
  init as initRouter
} from './deps/sitmap';
import {
  init as initStore
} from './deps/store';
import hook from './deps/hook';
import {
  setAppStore
} from './deps/utils';
import PageTransition from './page-transition';
import '../src/app/index'; // 挂载业务框架

export default (resolve) => {
  create();
  /**
   * 骨架预设值
   */
  async function create() {
    const appData = await hook.exe('prepare@app');
    // 设置全局引用
    setAppStore('data', appData);
    const store = new Vuex.Store(initStore());
    // 设置全局引用
    setAppStore('store', store);
    // 初始化router
    const sitmap = await initRouter();
    const router = new VueRouter({
      routes: sitmap.routes
    });
    // 设置全局引用
    setAppStore('router', router);

    // app hook
    await hook.exe('app@app', {
      resolve,
      store,
      router,
      sitmap,
      appData,
      componentOptions: {
        name: 'app',
        template: '<div></div>',
        router,
        store,
        computed: {
          ...mapState({
            activePage: state => state.activePage,
            pageTransitionName: state => state.pageTransitionName,
            domClass(state) {
              return {
                'app': true,
                'app-only-page': state.onlyPage
              };
            },
            cachePages(state) {
              const cachePages = state.cachePages;
              if (!cachePages.length) {
                return '_'; // 占位，否则include为空默认缓存全部，WTF
              }
              return cachePages.join(',');
              // return new RegExp('(?!' + cachePages.map(pageName => '.*' + pageName).join('|') + ')^.*$');
            }
          })
        },
        components: {
          PageTransition
        }
      }
    });
  }
};

