/**
 * 删除所有use strict flag
 */
function Plugin() {
}

Plugin.prototype.apply = function(compiler) {
  compiler.plugin('emit', function(compilation, callback) {
    const jsFiles = Object.keys(compilation.assets).filter(fileName => /\.js$/.test(fileName));
    if (jsFiles) {
      jsFiles.forEach(fileName => {
        if (compilation.assets[fileName].children) {
          compilation.assets[fileName].children.forEach(child => {
            if (child._value) {
              child._value = child._value.replace(/"use\sstrict"/g, '');
            }
          });
        } else {
          // console.log(compilation.assets[fileName]);
        }
      });
    }
    callback();
  });
};

module.exports = Plugin;