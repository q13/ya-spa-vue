/**
 * Dll抽取
 */
const path = require('path');
const webpack = require('webpack');
const fsExtra = require('fs-extra');
const UglifyJsParallelPlugin = require('webpack-uglify-parallel');
const os = require('os');

const DLL_PATH = path.resolve(__dirname, '../dll');
fsExtra.ensureDirSync(DLL_PATH); // DLL目录，开发阶段存储打包dll文件
fsExtra.emptyDirSync(DLL_PATH);

const dlls = [
  'vue-router',
  'vuex',
  'lodash',
  'moment',
  'vue-beauty',
  'iview',
  'element-ui',
  'mint-ui',
  'axios',
  'store',
  'antd',
  'antd-mobile',
  '@antv',
  'ya-ui-vue'
];

module.exports = {
  output: {
    path: DLL_PATH,
    filename: '[name].js',
    library: '[name]_[hash]',
    libraryTarget: 'umd',
    umdNamedDefine: true
  },
  entry: {
    "dll": dlls
  },
  devtool: 'source-map', // chrome devtool更友好
  externals: {
    'react': 'React',
    'react-dom': 'ReactDOM'
  },
  plugins: [
    new UglifyJsParallelPlugin({
      workers: os.cpus().length,
      mangle: true,
      exclude: /\.min\.js$/,
      output: { comments: false },
      compressor: {
        warnings: false,
        drop_console: true,
        drop_debugger: true
      }
    }),
    new webpack.DllPlugin({
      path: path.resolve(DLL_PATH, '[name]-manifest.json'),
      name: '[name]_[hash]'
    })
  ]
};


