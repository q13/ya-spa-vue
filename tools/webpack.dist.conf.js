/**
 * 打包成一个文件
 */
process.env.NODE_ENV = 'production'
var path = require('path')
var utils = require('./utils')
var webpack = require('webpack')
var config = require('./config')
var merge = require('webpack-merge')
var fsExtra = require('fs-extra')
var baseWebpackConfig = require('./webpack.base.conf')
// var CopyWebpackPlugin = require('copy-webpack-plugin')
var HtmlWebpackPlugin = require('html-webpack-plugin')
var ExtractTextPlugin = require('extract-text-webpack-plugin')
var OptimizeCSSPlugin = require('optimize-css-assets-webpack-plugin')
var ParseAtFlagPlugin = require('./webpack-parse-at-flag')
var RemoveStrictFlagPlugin = require('./webpack-remove-strict-flag')
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

fsExtra.removeSync(path.join(config.build.assetsRoot, '/'));
var webpackConfig = merge(baseWebpackConfig, {
  module: {
    rules: utils.styleLoaders({
      sourceMap: true,
      extract: true
    }).concat({
      test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
      loader: 'url-loader',
      options: {
        limit: 10000,
        name: 'plus/fonts/[hash].[ext]'
        // name: '[hash].[ext]'
      }
    })
  },
  // devtool: 'source-map',
  devtool: 'none',
  output: {
    path: config.build.assetsRoot,
    filename: 'plus/js/[name]-[chunkhash].js',
    chunkFilename: 'plus/js/[name]-[chunkhash].js',
    publicPath: '' // 项目名默认就是二级path
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
      // assetNameRegExp: /\.(css|sass|scss|less|styl)$/g,
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
      // hash: true,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeAttributeQuotes: true
      },
      chunksSortMode: 'dependency',
      window: {
      }
    }),
    // keep module.id stable when vender modules does not change
    // new webpack.HashedModuleIdsPlugin(),
    // split vendor js into its own file
    new webpack.optimize.CommonsChunkPlugin({
      name: 'vendor',
      // children: true,
      // deepChildren: true,
      // async: true,
      // minChunks: 2,
      chunks: utils.getAsyncChunkNames(),
      minChunks: function (module, count) {
        // any required modules inside node_modules are extracted to vendor
        // return true;
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
    // 提取 webpack runtime、module manifest到单独文件
    new webpack.optimize.CommonsChunkPlugin({
      name: 'manifest',
      chunks: ['vendor']
    }),
    new BundleAnalyzerPlugin(),
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
  ]
})

module.exports = webpackConfig;

