/**
 * Component method proxy mechanism
 */
var Mapping = {};

Mapping.install = function (Vue, options) {
  /**
   * 添加弃用接口
   */
  const addDeprecatedApi = function (options) {
    const ctor = this.constructor;
    options = [].concat(options);
    let deprecatedList = ctor.__deprecated_list__ || [];
    options.forEach((option) => {
      // 防重复添加
      if (!deprecatedList.some((option2) => {
        return option2.oldName === option.name && option2.newName === option.newName;
      })) {
        deprecatedList.push({
          oldName: option.oldName,
          newName: option.newName,
          description: option.description
        });
      }
    });
    ctor.__deprecated_list__ = deprecatedList;
  }
  Vue.mixin({
    methods: {
      /**
       * 添加弃用接口
       * @param {{ oldName: string, newName: string, description: string}|[]} options
       */
      $addDeprecatedApi: addDeprecatedApi
    }
  })
  Vue.directive('mapping', {
    // 卸载组件时解绑
    unbind (el, binding, vnode, oldVnode) {
      const hostCpt = vnode.context
      let hostMethodName = binding.arg
      if (hostMethodName) {
        delete hostCpt[hostMethodName]
        // or set it to undefined
        // hostCpt[hostMethodName] = undefined
      }
    },
    bind (el, binding, vnode, oldVnode) {
      // something logic ...
      const guestCpt = vnode.componentInstance; // 客
      const hostCpt = vnode.context; // 主
      let hostMethodName = binding.arg; // 主代理方法名
      const modifiers = binding.modifiers;
      const guestMethodName = binding.value; // 客代理方法名
      if (!hostMethodName) {
        hostMethodName = guestMethodName;
      }
      // 对于宿主中已存在的方法强制覆盖不提示
      if (hostCpt[hostMethodName] && !modifiers.w) {
        console.warn(hostMethodName + ' 方法在所属组件上下文中已存在，请确认是开发者主动行为（在测试？）');
      } else {
        hostCpt[hostMethodName] = function (...args) {
          const deprecatedList = guestCpt.constructor.__deprecated_list__ || [];
          let newMethodData = null;
          if (deprecatedList.some((item) => {
            if (item.oldName === guestMethodName) {
              newMethodData = item;
              return true;
            }
          })) {
            console.warn(guestMethodName + ' 方法在被代理组件中已被弃用，请替换为 ' + newMethodData.newName + ' 方法。新方法描述如下：\n' + newMethodData.description);
            return guestCpt[newMethodData.newName].apply(guestCpt, args);
          } else {
            if (!guestCpt[guestMethodName]) {
              console.warn(guestMethodName + ' 方法在被代理组件上下文中不存在，静默返回');
            } else {
              return guestCpt[guestMethodName].apply(guestCpt, args);
            }
          }
        }
      }
    }
  })
}
export default Mapping;
