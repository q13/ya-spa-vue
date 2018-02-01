var path = require('path')

module.exports = {
  build: {
    index: path.resolve(__dirname, '../dist/index.html'),
    assetsRoot: path.resolve(__dirname, '../dist'),
    productionSourceMap: true
  },
  dev: {
    port: 8080,
    autoOpenBrowser: true,
    // 如需代理，在此处填写
    // `npm run dev -- proxy=127.0.0.1`
    proxyTable: { // 自行配置在此处
      '/mock': {
        target: 'http://localhost:3001',
        pathRewrite: {
          '^/mock': '/'
        },
        changeOrigin: true
      }
    },
    cssSourceMap: true
  }
}
