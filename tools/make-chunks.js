/**
 * 生成chunks
 */
const path = require('path');
const fsExtra = require('fs-extra');
const fs = require('fs');
const glob = require("glob");

glob('**/*.js', {
  cwd: path.resolve(__dirname, '../src'),
  absolute: true // 完整地址
}, function (err, files) {
  let result = [];
  files.forEach((filePath) => {
    const str = fs.readFileSync(filePath, 'utf8');
    // 正则表达式匹配 /* webpackChunkName: 'pages-business-printer' */ 形式
    const webpackChunkNames = str.match(/\/\*\s*webpackChunkName:[\s|\S]+?\*\//g);
    if (webpackChunkNames && webpackChunkNames.length) {
      webpackChunkNames.forEach((text) => {
        let obj = eval('({' + text.slice(2, -2) + '})');
        // 塞到result里
        result.push(obj.webpackChunkName);
        // console.log('obj', obj);
      });
    }
    // console.log('files', webpackChunkNames);
  });
  const CHUNK_PATH = path.resolve(__dirname, '../src/chunks.json');
  const originChunks = fsExtra.readJsonSync(CHUNK_PATH, {
    throws: false
  }) || [];
  // 合并自动生成的，注意去重
  result = [...new Set(result.concat(originChunks))];
  console.log('chunks', result);
  // 回写
  fsExtra.writeJsonSync(CHUNK_PATH, result, {
    spaces: 2
  });
});
