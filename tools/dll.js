/**
 * 启动dll打包
 */

const webpack = require('webpack');
var webpackDllConfig = require('./webpack.dll.conf');

var dllCompiler = webpack(webpackDllConfig);
console.log('开始构建Dll');
dllCompiler.run((err, stats) => {
  if (err) {
    console.log(err);
  } else {
    console.log('Dll构建成功！');
  }
});