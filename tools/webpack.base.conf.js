var path = require('path')
var utils = require('./utils')
var config = require('./config')
var packageData = require('../package.json');

function resolve (dir) {
  return path.join(__dirname, '..', dir)
}
var isProduction = process.env.NODE_ENV === 'production'

var needBabelTransformDirs = [resolve('src'), resolve('ya'), resolve('node_modules/ya-ui-vue')];

Object.keys(packageData.dependencies).forEach((dep) => {
  const depPrefix = dep.slice(0, 4);
  if (depPrefix === 'ipos') {
    needBabelTransformDirs.push(dep);
  }
});

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
      'vue$': 'vue/dist/vue.esm.js',
      '@': resolve('src'),
      '+': resolve('ya')
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
      include: needBabelTransformDirs
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
