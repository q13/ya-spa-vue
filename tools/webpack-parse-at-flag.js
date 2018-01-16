/**
 * 解析node_modules下@引用问题，从自身包位置src目录作为基准替换
 */
function ParseAtPlugin() {
}

ParseAtPlugin.prototype.apply = function(compiler) {
  compiler.plugin('normal-module-factory', function(compilation) {
    compilation.plugin("before-resolve", function (result, callback) {
      let { context, request,  dependencies} = result;
      if (request.slice(0, 2) === '@/') {
        context = context.split('\\');
        let baseIndex = -1;
        // 默认从第一个遇到的src位置处替换，有较小概率遇到替换不正确现象（src重名）
        context.some((temp, index) => {
          if (temp === 'src') {
            baseIndex = index;
            return true;
          }
        });
        if (baseIndex >= 0) {
          let basePathArr = context.slice(0, baseIndex + 1);
          let fullPathArr = basePathArr.concat(request.slice(2).split('/'));
          result.request = fullPathArr.join('\\');
        }
      }
      callback(null, result);
    });
  });
};

module.exports = ParseAtPlugin;