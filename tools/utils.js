var path = require('path')
var fs = require('fs');
var fsExtra = require('fs-extra');
var config = require('./config')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

exports.cssLoaders = function (options) {
  options = options || {}

  var cssLoader = {
    loader: 'css-loader',
    options: {
      minimize: process.env.NODE_ENV === 'production',
      // modules: true,
      sourceMap: options.sourceMap
    }
  }
  
  // generate loader string to be used with extract text plugin
  function generateLoaders (loader, loaderOptions) {
    var loaders = [cssLoader]
    if (loader) {
      loaders.push({
        loader: loader + '-loader',
        options: Object.assign({}, loaderOptions, {
          sourceMap: options.sourceMap
        })
      })
    }
    // 附加样式预设
    let presetStyleExt = 'css';
    if (loader) {
      if (loader === 'stylus') {
        presetStyleExt = 'styl';
      } else if (loader === 'sass') {
        presetStyleExt = 'sass';
      } else if (loader === 'less') {
        presetStyleExt = 'less';
      }
    }
    const presetFilePath = path.resolve(__dirname, '../src/app/preset.' + presetStyleExt);
    if (fs.existsSync(presetFilePath)) {
      console.log('附加预设样式 ', presetFilePath);
      loaders.push({
        loader: 'sass-resources-loader',
        options: {
          resources: presetFilePath
        }
      });
    }
    // Extract CSS when that option is specified
    // (which is the case during production build)
    if (options.extract) {
      return ExtractTextPlugin.extract({
        use: loaders,
        publicPath: '../../', 
        fallback: 'vue-style-loader'
      })
    } else {
      return ['vue-style-loader'].concat(loaders)
    }
  }

  // https://vue-loader.vuejs.org/en/configurations/extract-css.html
  return {
    css: generateLoaders(),
    postcss: generateLoaders(),
    stylus: generateLoaders('stylus'),
    styl: generateLoaders('stylus'),
    less: generateLoaders('less'),
    sass: generateLoaders('sass'),
    scss: generateLoaders('sass')
  }
}

// Generate loaders for standalone style files (outside of .vue)
exports.styleLoaders = function (options) {
  var output = []
  var loaders = exports.cssLoaders(options)
  for (var extension in loaders) {
    var loader = loaders[extension]
    output.push({
      test: new RegExp('\\.' + extension + '$'),
      use: loader
    })
  }
  return output
}

// 获取预设的异步chunk name
exports.getAsyncChunkNames = function () {
  var result = ['app'];
  const chunkListFilePath = path.resolve(__dirname, '../src/chunks.json');
  if (fs.existsSync(chunkListFilePath)) {
    const chunks = fsExtra.readJsonSync(chunkListFilePath, { throws: false });
    if (chunks && chunks.length) {
      result = result.concat(chunks);
    }
  }
  console.log('收集的chunks列表：' + result.join('，'));
  return result;
};
