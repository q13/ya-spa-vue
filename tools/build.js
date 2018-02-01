process.env.NODE_ENV = 'production'
// return;
let appEnv = process.argv[2];
let appName = process.argv[3];
let apiDomain = process.argv[4];
if (!appEnv || !appName || !apiDomain) {
  console.log('缺少必要运行参数（--app-env,--app-name,--api-domain）');
  return;
}
// 提取参数值
appEnv = appEnv.split('=')[1];
appName = appName.split('=')[1];
apiDomain = apiDomain.split('=')[1];
console.log('build参数如下：');
console.log('--app-env: ' + appEnv);
console.log('--app-name: ' + appName);
console.log('--api-domain: ' + apiDomain);

var ora = require('ora')
var rm = require('rimraf')
var path = require('path')
var chalk = require('chalk')
var webpack = require('webpack')
var fsExtra = require('fs-extra');
var config = require('./config')
var getWebpackConfig = require('./webpack.prod.conf')

var spinner = ora('building for production...')
spinner.start()

rm(path.join(config.build.assetsRoot, '/'), err => {
  if (err) throw err
  const webpackConfig = getWebpackConfig({
    appEnv: appEnv,
    appName: appName,
    apiDomain: apiDomain
  });
  webpack(webpackConfig, function (err, stats) {
    spinner.stop()
    if (err) throw err
    process.stdout.write(stats.toString({
      colors: true,
      modules: false,
      children: false,
      chunks: false,
      chunkModules: false
    }) + '\n\n')

    if (stats.hasErrors()) {
      console.log(chalk.red('  Build failed with errors.\n'))
      process.exit(1)
    }
    // copy public assets
    fsExtra.copySync(path.resolve(__dirname, '../src/deps/public'), path.resolve(__dirname, '../dist/static'))
    console.log(chalk.cyan('  Build complete.\n'))
    console.log(chalk.yellow(
      '  Tip: built files are meant to be served over an HTTP server.\n' +
      '  Opening index.html over file:// won\'t work.\n'
    ))
  })
})
