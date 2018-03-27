var config = require('./config')
process.env.NODE_ENV = process.env.NODE_ENV || {
  NODE_ENV: '"development"'
}

var opn = require('opn')
var path = require('path')
var fsExtra = require('fs-extra');
var fs = require('fs');
var express = require('express')
var webpack = require('webpack')
var proxyMiddleware = require('http-proxy-middleware')
var webpackConfig = require('./webpack.dev.conf')

// port 
let argvs = {}
process.argv.slice(2).forEach(arg => {
  let arr = (arg || '').split('=')
  argvs[arr[0]] = arr[1]
})
let { proxy, port } = argvs

port = process.env.PORT || port || config.dev.port

var autoOpenBrowser = !!config.dev.autoOpenBrowser

// https://github.com/chimurai/http-proxy-middleware
var proxyTable = Object.assign({}, config.dev.proxyTable, proxy ? {
  '*': {
    target: proxy
  }
} : {})

var app = express()
var compiler = webpack(webpackConfig)

var devMiddleware = require('webpack-dev-middleware')(compiler, {
  publicPath: webpackConfig.output.publicPath,
  quiet: true
})

var hotMiddleware = require('webpack-hot-middleware')(compiler, {
  log: false,
  heartbeat: 2000
})
// force page reload when html-webpack-plugin template changes
// https://github.com/vuejs-templates/webpack/issues/751#issuecomment-309955295 升级到webpack3后需要注释html reload，否则hot replace整体失效
// compiler.plugin('compilation', function (compilation) {
//   compilation.plugin('html-webpack-plugin-after-emit', function (data, cb) {
//     hotMiddleware.publish({ action: 'reload' })
//     cb()
//   })
// })

// proxy api requests
Object.keys(proxyTable).forEach(function (context) {
  var options = proxyTable[context]
  if (typeof options === 'string') {
    options = { target: options }
  }
  // options.cookieDomainRewrite = {
  //   '*': 'localhost'// all domain cooke rewrite to localhost
  // };
  options.cookieDomainRewrite = 'localhost';
  options.preserveHeaderKeyCase = true;
  options.debug = true;
  options.secure =  false;
  options.onProxyRes = (proxyRes) => {
    let setCookieHeaders = proxyRes.headers['set-cookie'] || [];
    // cookie path改成 /
    setCookieHeaders = setCookieHeaders.map((cookieItem) => {
      let cookieArr = cookieItem.split(';');
      cookieArr = cookieArr.map((itemFlagment) => {
        itemFlagment = itemFlagment.trim();
        if (itemFlagment.slice(0, 4) === 'Path') {
          itemFlagment = 'Path=/';
        }
        return itemFlagment;
      });
      return cookieArr.join('; ');
    });
    proxyRes.headers['set-cookie'] = setCookieHeaders;
  };

  app.use(proxyMiddleware(options.filter || context, options))
})

// handle fallback for HTML5 history API
app.use(require('connect-history-api-fallback')())

// serve webpack bundle output
app.use(devMiddleware)

// enable hot-reload and state-preserving
// compilation error display
app.use(hotMiddleware)

// serve pure static assets
// var staticPath = path.posix.join('/', '/')
// app.use(staticPath, express.static('./static'))
const SRC_DEPS_PATH = path.resolve(__dirname, '../src/deps/public') // 伺服/src/deps/public目录
app.use('/static', express.static(SRC_DEPS_PATH))

const DLL_PATH = path.resolve(__dirname, '../dll'); // Dll伺服
fsExtra.ensureDirSync(DLL_PATH); // DLL目录，开发阶段存储打包dll文件
const dllPath = path.resolve(DLL_PATH, 'dll.js');
if (fs.existsSync(dllPath)) {
  fs.writeFileSync(dllPath, fs.readFileSync(dllPath, 'utf8').replace(/"use\sstrict"/g, ''), 'utf8');
}
app.use('/dll', express.static(DLL_PATH));

var uri = 'http://localhost:' + port

var _resolve
var readyPromise = new Promise(resolve => {
  _resolve = resolve
})

console.log('> Starting dev server...')
devMiddleware.waitUntilValid(() => {
  console.log('> Listening at ' + uri + '\n')
  // when env is testing, don't need open it
  if (autoOpenBrowser && process.env.NODE_ENV !== 'testing') {
    opn(uri)
  }
  _resolve()
})

var server = app.listen(port)

module.exports = {
  ready: readyPromise,
  close: () => {
    server.close()
  }
}
