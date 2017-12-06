/*
 * @Author: lmr 
 * @Date: 2017-10-19 19:51:13 
 * @Last Modified by: lmr
 * @Last Modified time: 2017-10-28 18:10:59
 */
var express = require('express')
var mockApp = express()
var bodyParser = require('body-parser')
var fs = require("fs")
var Mock = require('mockjs')

// port 
let argvs = {}
process.argv.slice(2).forEach(arg => {
  let arr = (arg || '').split('=')
  argvs[arr[0]] = arr[1]
})
let port = argvs.port || 3001

mockApp.use(bodyParser.json({limit: '1mb'}))  //这里指定参数使用 json 格式
mockApp.use(bodyParser.urlencoded({
  extended: true
}))

// mock
var rapnode = require('rap-node-plugin')
var rapConfig = {
  host: '192.168.49.96',    //启动的服务主机 
  port: '10010',           //端口号 
 //  mock: '/mymockjsurl/',  //RAP前缀 
  wrapper: ''             //不需要包装 
}

global.RAP_FLAG = 1  // 开启RAP 
function mockToRap(req, res) {
  const projectId = req.query.projectId || req.body.projectId;
  // 如果请求地址包含.json
  //if(/\.json/.test(req.url)) {
  if (!projectId) {
    let data = '{}'
    let filePath = '../src/mock' + req.url + '.js'
    try {
      data = fs.readFileSync(filePath, 'utf8')
    } catch (evt) {
      filePath = '../src/mock' + req.url + '.json'
      data = fs.readFileSync(filePath, 'utf8')
    }
    // 自定义mock数据占位符
    Mock.Random.extend({
      requestBody: function () {
        return req.body;
      }
    })
    // eval方式解析处理复杂数据类型
    data = eval('(' + data + ')')
    // 将req.body插入到每一个含有Funciton类型的deep对象里
    const insertDeep = function (data) {
      Object.keys(data).forEach((key) => {
        if (Object.prototype.toString.call(data[key]) === '[object Function]') {
          data['__request_body__'] = req.body
        }
        if (Object.prototype.toString.call(data[key]) === '[object Object]') {
          insertDeep(data[key])
        }
        if (Object.prototype.toString.call(data[key]) === '[object Array]') {
          data[key].forEach((item) => {
            insertDeep(data[key])
          })
        }
      })
    }
    insertDeep(data)

    res.json(Mock.mock(data))
    // let data = require('./mock' + req.url.replace(/\/mock/g, ''))
    // if(data) res.json(data)
  } else {
    // mock数据并输出
      rapnode.getRapData(Object.assign({}, rapConfig, {
        url: req.url,
        projectId: projectId
      }), function() {}, function (err, data) {
        if(data) res.json(data)
      })
  }
}
mockApp.get('/*', mockToRap)
mockApp.post('/*', mockToRap)
var server = mockApp.listen(port)
console.log("Mock Server runing at port: " + server.address().port + ".")