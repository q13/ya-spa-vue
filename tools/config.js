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
      },
      '/mingren': {
        target: 'http://192.168.232.86:3001',
        pathRewrite: {
          '^/mingren': '/'
        },
        changeOrigin: true
      },
      '/test-chain': {
        target: 'http://ipos-t.4008827123.cn',
        pathRewrite: {
          '^/test-chain': '/'
        },
        changeOrigin: true
      },
      '/dev-chain': {
        target: 'http://ipos-d.4008827123.cn',
        pathRewrite: {
          '^/dev-chain': '/'
        },
        changeOrigin: true
      },
      '/prod-chain': {
        target: 'http://ipos.yazuo.com',
        pathRewrite: {
          '^/prod-chain': '/'
        },
        changeOrigin: true
      },
      '/test-mobile': {
        target: 'http://common-t.4008827123.cn',
        pathRewrite: {
          '^/test-mobile': '/'
        },
        changeOrigin: true
      },
      '/dev-mobile': {
        target: 'http://common-d.4008827123.cn',
        pathRewrite: {
          '^/dev-mobile': '/'
        },
        changeOrigin: true
      },
      '/prod-mobile': {
        target: 'http://m.yazuo.com',
        pathRewrite: {
          '^/prod-mobile': '/'
        },
        changeOrigin: true
      },
      '/test-membership': {
        target: 'http://common-t.4008827123.cn',
        pathRewrite: {
          '^/test-membership': '/'
        },
        changeOrigin: true
      },
      '/dev-membership': {
        target: 'http://common-d.4008827123.cn',
        pathRewrite: {
          '^/dev-membership': '/'
        },
        changeOrigin: true
      },
      '/zy': {
        target: 'http://192.168.49.61:40124',
        pathRewrite: {
          '^/zy': ''
        },
        changeOrigin: true
      }
    },
    cssSourceMap: true
  }
}
