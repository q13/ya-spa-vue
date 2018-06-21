var path = require('path')
var utils = require('./utils')
var webpack = require('webpack')
var config = require('./config')
var merge = require('webpack-merge')
var baseWebpackConfig = require('./webpack.base.conf')
// var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
var ParseAtFlagPlugin = require('./webpack-parse-at-flag')
var RemoveStrictFlagPlugin = require('./webpack-remove-strict-flag')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

var envScripts = [];
if (utils.isNeedReact()) {
  envScripts.push('https://as.alipayobjects.com/g/component/react/15.5.4/react.min.js');
  envScripts.push('https://as.alipayobjects.com/g/component/react/15.5.4/react-dom.min.js');
}

function getWebpackConfig(options) {
  var webpackConfig = merge(baseWebpackConfig, {
    module: {
      rules: utils.styleLoaders({
        sourceMap: true,
        extract: true
      }).concat({
        test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
        // loader: 'base64-font-loader',
        loader: 'url-loader',
        options: {
          limit: 1024,
          name: 'plus/fonts/[hash].[ext]'
        }
      })
    },
    devtool: 'source-map',
    output: {
      path: config.build.assetsRoot,
      filename: 'plus/js/[name]-[chunkhash].js',
      chunkFilename: 'plus/js/[name]-[chunkhash].js',
      publicPath: options.publicPath // 项目名默认就是二级path
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          NODE_ENV: '"production"'
        }
      }),
      new webpack.optimize.UglifyJsPlugin({
        compress: {
          warnings: false,
          drop_debugger: true
          // drop_console: true
        },
        sourceMap: true
      }),
      // extract css into its own file
      new ExtractTextPlugin({
        filename: 'plus/css/[name]-[contenthash].css',
        allChunks: true
      }),
      new OptimizeCSSPlugin({
        cssProcessorOptions: {
          safe: true
        }
      }),
      // generate dist index.html with correct asset hash for caching.
      // you can customize output by editing /index.html
      // see https://github.com/ampedandwired/html-webpack-plugin
      new HtmlWebpackPlugin({
        filename: config.build.index,
        template: 'index.ejs',
        inject: false,
        scripts: envScripts,
        // hash: true,
        minify: {
          removeComments: true,
          collapseWhitespace: true,
          removeAttributeQuotes: true
        },
        // chunksSortMode: 'dependency',
        chunks: ['manifest', 'vendor', 'vendor-vue', 'app'],
        chunksSortMode: 'manual',
        // chunksSortMode: function (chunk1, chunk2) {
        //   var orders = ['manifest', 'vendor', 'vendor-vue', 'app'];
        //   var order1 = orders.indexOf(chunk1.names[0]);
        //   var order2 = orders.indexOf(chunk2.names[0]);
        //   if (order1 > order2) {
        //     return 1;
        //   } else if (order1 < order2) {
        //     return -1;
        //   } else {
        //     return 0;
        //   }
        // },
        window: {
          APP_DOMAIN: options.appDomain, // 域名写入window对象 
          APP_NAME: options.appName // 项目二级path名
        }
      }),
      // keep module.id stable when vender modules does not change
      new webpack.HashedModuleIdsPlugin(),
      // split vendor js into its own file
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor',
        chunks: utils.getAsyncChunkNames(),
        minChunks: function (module, count) {
          // any required modules inside node_modules are extracted to vendor
          return (
            module.resource &&
            /\.(js|vue)$/.test(module.resource) &&
            (module.resource.indexOf(
              path.join(__dirname, '../node_modules')
            ) === 0 || module.resource.indexOf(
              path.join(__dirname, '../src/widgets')
            ) === 0 || module.resource.indexOf(
              path.join(__dirname, '../src/modules')
            ) === 0 || module.resource.indexOf(
              path.join(__dirname, '../src/deps')
            ) === 0)
          )
        }
      }),
      new webpack.optimize.CommonsChunkPlugin({
        name: 'vendor-vue',
        chunks: ['vendor'],
        minChunks: function (module, count) {
          if (/vue\.esm\.js/.test(module.resource) ||
            /vue-router\.esm\.js/.test(module.resource) ||
            /vuex\.esm\.js/.test(module.resource)) {
            return true;
          }
          return false;
        }
      }),
      // 提取 webpack runtime、module manifest到单独文件
      new webpack.optimize.CommonsChunkPlugin({
        name: 'manifest',
        chunks: ['vendor', 'vendor-vue']
      }),
      new ParseAtFlagPlugin(),
      new RemoveStrictFlagPlugin()
      // copy custom static assets
      // new CopyWebpackPlugin([
      //   {
      //     from: path.resolve(__dirname, '../'),
      //     to: config.build.assetsRoot,
      //     ignore: ['.*']
      //   }
      // ])
    ].concat(options.isTest ? new BundleAnalyzerPlugin(): [])
  })

  // if (config.build.productionGzip) {
  //   var CompressionWebpackPlugin = require('compression-webpack-plugin')

  //   webpackConfig.plugins.push(
  //     new CompressionWebpackPlugin({
  //       asset: '[path].gz[query]',
  //       algorithm: 'gzip',
  //       test: new RegExp(
  //         '\\.(' +
  //         config.build.productionGzipExtensions.join('|') +
  //         ')$'
  //       ),
  //       threshold: 10240,
  //       minRatio: 0.8
  //     })
  //   )
  // }

  // if (config.build.bundleAnalyzerReport) {
  //   var BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin
  //   webpackConfig.plugins.push(new BundleAnalyzerPlugin())
  // }
  return webpackConfig;
}

module.exports = getWebpackConfig
