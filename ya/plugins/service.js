/**
 * Like angular Service ? 蛤
 * Singleton process whole app scope
 * 前期只当成state container使用
 * @author 13
 */
import {
  camelCase
} from 'lodash';

var Service = {};
var serviceStore = new Map();
const SERVICE_KEY_PREFIX = 'service';

Service.install = function (Vue) {
  // const extend = Vue.extend
  Vue.mixin({
    beforeCreate: function () {
      const getServices = () => {
        const $options = this.$options;
        let services = null;
        if (Array.isArray($options.services)) {
          services = $options.services.reduce((pv, cv, ci) => {
            const key = cv.name ? camelCase(cv.name) : SERVICE_KEY_PREFIX + ci
            return {
              ...pv,
              [key]: cv
            };
          }, {});
        } else {
          services = $options.services;
        }
        return services;
      };
      let services = getServices();
      if (services) {
        this._services = Object.keys(services).map((key) => {
          const Ctor = services[key];
          const serviceIns = serviceStore.get(Ctor) || new Vue(Ctor);
          // 重新指回
          serviceStore.set(Ctor, serviceIns);
          // 暴露给this引用
          this[key] = serviceIns;
          return key;
        });
      }
    },
    beforeDestroy: function () {
      const services = this._services;
      if (services) {
        services.forEach((key) => {
          delete this[key]; // 释放索引
        });
        this._services = null;
      }
    }
  });
};
export default Service;
