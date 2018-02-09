var path = require('path');
var fs = require('fs');
var utils = require('./utils')
var webpack = require('webpack')
var config = require('./config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin')
var ParseAtFlagPlugin = require('./webpack-parse-at-flag')
var RemoveStrictFlagPlugin = require('./webpack-remove-strict-flag')

// add hot-reload related code to entry chunks
Object.keys(baseWebpackConfig.entry).forEach(function (name) {
  baseWebpackConfig.entry[name] = ['./tools/dev-client'].concat(baseWebpackConfig.entry[name])
})

// 判断dll文件是否存在
const isDllExists = fs.existsSync(path.resolve(__dirname, '../dll/dll.js'));

module.exports = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({ sourceMap: true }).concat({
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'plus/fonts/[hash].[ext]'
      }
    })
  },
  // devtool: 'cheap-module-eval-source-map',
  devtool: 'source-map', // chrome devtool更友好
  plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    // https://github.com/glenjamin/webpack-hot-middleware#installation--usage
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoEmitOnErrorsPlugin(),
    // https://github.com/ampedandwired/html-webpack-plugin
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: 'index.ejs',
      inject: false,
      scripts: isDllExists ? ['/dll/dll.js'] : []
    }),
  ].concat(isDllExists ? [
    new webpack.DllReferencePlugin({
      manifest: require('../dll/dll-manifest.json'),
    })
  ] : []).concat([
    new FriendlyErrorsPlugin(),
    new ParseAtFlagPlugin(),
    new RemoveStrictFlagPlugin()
  ])
})
