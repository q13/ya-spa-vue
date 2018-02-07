/**
 * 删除所有use strict flag
 */
function Plugin() {
}

Plugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    const jsFiles = Object.keys(compilation.assets).filter(fileName => /\.js$/.test(fileName));
    jsFiles.forEach(fileName => {
      compilation.assets[fileName].children.forEach(child => {
        if (child._value) {
          child._value = child._value.replace(/"use\sstrict"/g, '');
        }
      });
    });
    callback();
  });
};

module.exports = Plugin;