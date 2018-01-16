var path = require('path')
var utils = require('./utils')
var config = require('./config')
var packageData = require('../package.json');

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}
var isProduction = process.env.NODE_ENV === 'production'

module.exports = {
  entry: {
    app: './ya/index.js'
  },
  output: {
    path: config.build.assetsRoot,
    filename: '[name].js',
    publicPath: '/'
  },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    alias: {
      // 'vue$': 'vue/dist/vue.esm.js',
      'vue$': resolve('node_modules/vue/dist/vue.esm.js'),
      '@': resolve('src'),
      '+': resolve('ya'),
      'ya-ui-vue': resolve('node_modules/ya-ui-vue')
    }
  },
  module: {
    rules: (isProduction ? [] :  [{
      test: /\.(js|vue)$/,
      loader: 'eslint-loader',
      enforce: 'pre',
      include: [resolve('src'), resolve('ya')],
      options: {
        formatter: require('eslint-friendly-formatter')
      }
    }]).concat([{
      test: /\.vue$/,
      loader: 'vue-loader',
      options: {
        loaders: utils.cssLoaders({
          sourceMap: isProduction
            ? config.build.productionSourceMap
            : config.dev.cssSourceMap,
          extract: isProduction
        }),
        transformToRequire: {
          video: 'src',
          source: 'src',
          img: 'src',
          image: 'xlink:href'
        },
        cssModules: {
          localIdentName: '[path][name]---[local]---[hash:base64:5]',
          camelCase: true
        }
      }
    },
    {
      test: /\.js$/,
      loader: 'babel-loader',
      include: function (src) {
        src = src.split('\\').join('/')
        if (src.search('node_modules') === -1) {
          return true
        } else {
          // node_modules目录下除了ya-ui-vue和以ipos开头的包，其它都不走babel转义
          // if (src.search('node_modules/ya-ui-vue') >= 0 || src.search('node_modules/ipos-') >= 0) {
          if (src.search('node_modules/ipos-') >= 0) {
            return true
          }
        }
        return false
      }
    },
    {
      test: /\.html$/,
      loader: 'html-loader'
    },
    {
      test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'plus/img/[hash:7].[ext]'
      }
    },
    {
      test: /\.(mp4|webm|ogg|mp3|wav|flac|aac)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'plus/media/[hash:7].[ext]'
      }
    },
    {
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'plus/fonts/[hash:7].[ext]'
      }
    }
    ])
  }
}
