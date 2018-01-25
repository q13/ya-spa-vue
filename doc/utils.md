<a name="module_utils"></a>

## utils

工具库引入方式

```javascript
import utils from '@/deps/utils';
```

* [utils](#module_utils)
    * [.BASE_PATH](#module_utils.BASE_PATH) : <code>String</code>
    * [.c2s](#module_utils.c2s) ⇒ <code>Promise</code>
    * [.getUrlQueryValue](#module_utils.getUrlQueryValue) ⇒ <code>String</code>
    * [.getPlatformName](#module_utils.getPlatformName) ⇒ <code>String</code>
    * [.getDocumentTitle](#module_utils.getDocumentTitle) ⇒ <code>Stirng</code>
    * [.setDocumentTitle](#module_utils.setDocumentTitle)
    * [.getRequestIgnorePrefix](#module_utils.getRequestIgnorePrefix) ⇒ <code>String</code>
    * [.isDevelop](#module_utils.isDevelop) ⇒ <code>Boolean</code>
    * [.getProxyPrefix](#module_utils.getProxyPrefix) ⇒ <code>String</code>
    * [.jumpTo](#module_utils.jumpTo)
    * [.sessionStorage](#module_utils.sessionStorage) ⇒ <code>\*</code>
    * [.localStorage](#module_utils.localStorage) ⇒ <code>\*</code>
    * [.getAppStore](#module_utils.getAppStore) ⇒ <code>\*</code>
    * [.setAppStore](#module_utils.setAppStore) ⇒ <code>\*</code>
    * [.getAppData](#module_utils.getAppData) ⇒ <code>\*</code>
    * [.setAppData](#module_utils.setAppData) ⇒ <code>\*</code>
    * [.removeAppData](#module_utils.removeAppData) ⇒ <code>\*</code>
    * [.generateID](#module_utils.generateID) ⇒ <code>String</code>
    * [.log](#module_utils.log)
    * [.getWindowScrollTop](#module_utils.getWindowScrollTop) ⇒ <code>Number</code>
    * [.gotoWinTop](#module_utils.gotoWinTop)
    * [.asyncLoadJs](#module_utils.asyncLoadJs)
    * [.asyncLoadCss](#module_utils.asyncLoadCss)

<a name="module_utils.BASE_PATH"></a>

### utils.BASE_PATH : <code>String</code>
**Kind**: static constant of [<code>utils</code>](#module_utils)
<a name="module_utils.c2s"></a>

### utils.c2s ⇒ <code>Promise</code>
前后端异步通信接口

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>Promise</code> - Ajax handler

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| ajaxOptions | <code>Object</code> |  | axios config |
| options | <code>Object</code> |  | 自定义配置项 |
| [options.mask] | <code>Boolean</code> | <code>true</code> | 请求是否带遮罩 |
| [options.ajaxType] | <code>String</code> | <code>&#x27;ignore&#x27;</code> | 防止二次提交 ignore(等上次请求完才能发请求)/abort(直接中断上次请求)/none(可发多个相同请求) |
| [options.withData] | <code>Boolean</code> | <code>true</code> | 在ajaxType不等于none时起作用，作为二次提交的判定条件，是否连带提交参数判定 |
| [options.autoApplyUrlPrefix] | <code>Boolean</code> | <code>true</code> | 自动附加请求前缀 |
| [options.silentError] | <code>Boolean</code> | <code>false</code> | 默认提示错误 |
| [options.forceMock] | <code>Boolean</code> | <code>false</code> | 是否强制走本地mock服务 |
| [options.autoTry] | <code>Boolean</code> | <code>false</code> | 是否是自动发起的请求尝试 |
| [options.customCallback] | <code>Boolean</code> | <code>false</code> | 是否自定义callback |
| [options.callbackCoverServer] | <code>Boolean</code> | <code>false</code> | onError/onCallback是否覆盖server error |

<a name="module_utils.getUrlQueryValue"></a>

### utils.getUrlQueryValue ⇒ <code>String</code>
获取地址对应查询参数值

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>String</code> - Value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | Query key |

<a name="module_utils.getPlatformName"></a>

### utils.getPlatformName ⇒ <code>String</code>
获取平台名（内部根据platformName参数值判定）

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>String</code> - 平台名
<a name="module_utils.getDocumentTitle"></a>

### utils.getDocumentTitle ⇒ <code>Stirng</code>
获取页面title（内部根据title query param返回）

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>Stirng</code> - 页面title
<a name="module_utils.setDocumentTitle"></a>

### utils.setDocumentTitle
设置Document title

**Kind**: static constant of [<code>utils</code>](#module_utils)

| Param | Type | Description |
| --- | --- | --- |
| title | <code>String</code> | Document title |

<a name="module_utils.getRequestIgnorePrefix"></a>

### utils.getRequestIgnorePrefix ⇒ <code>String</code>
根据ignorePrefix查询参数获取请求需要忽略的访问路径

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>String</code> - 路径
<a name="module_utils.isDevelop"></a>

### utils.isDevelop ⇒ <code>Boolean</code>
根据请求参数或者访问地址判断是否处于develop状态
开发环境包括127.0.0.1/localhost/192.168.x.x（不包括192.168.49.61）

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>Boolean</code> - true/false
<a name="module_utils.getProxyPrefix"></a>

### utils.getProxyPrefix ⇒ <code>String</code>
获取当前代理数据请求地址前缀

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>String</code> - ?proxy="返回值"
<a name="module_utils.jumpTo"></a>

### utils.jumpTo
手动地址跳转

**Kind**: static constant of [<code>utils</code>](#module_utils)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | $router.push(options) |

<a name="module_utils.sessionStorage"></a>

### utils.sessionStorage ⇒ <code>\*</code>
sessionStorage操作

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value，当value为undefined时为getter操作，否则为setter |

<a name="module_utils.localStorage"></a>

### utils.localStorage ⇒ <code>\*</code>
localStorage操作
基于 https://github.com/marcuswestin/store.js/ 实现

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value，当value为undefined时为getter操作，否则为setter |

<a name="module_utils.getAppStore"></a>

### utils.getAppStore ⇒ <code>\*</code>
获取app store

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | 要获取的key |

<a name="module_utils.setAppStore"></a>

### utils.setAppStore ⇒ <code>\*</code>
设置app store， Deep merge方式

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value |

<a name="module_utils.getAppData"></a>

### utils.getAppData ⇒ <code>\*</code>
获取app data

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |

<a name="module_utils.setAppData"></a>

### utils.setAppData ⇒ <code>\*</code>
设置app data

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value |

<a name="module_utils.removeAppData"></a>

### utils.removeAppData ⇒ <code>\*</code>
清除app data

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>\*</code> - value

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |

<a name="module_utils.generateID"></a>

### utils.generateID ⇒ <code>String</code>
生成唯一id

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>String</code> - uuid
<a name="module_utils.log"></a>

### utils.log
自定义log屏幕打印

**Kind**: static constant of [<code>utils</code>](#module_utils)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>String</code> |  | log message |
| [pattern] | <code>String</code> | <code>&#x27;append&#x27;</code> | 信息显示方式：append（追加到上一条后面）; clear（先清屏） |

<a name="module_utils.getWindowScrollTop"></a>

### utils.getWindowScrollTop ⇒ <code>Number</code>
获取window scrollTop

**Kind**: static constant of [<code>utils</code>](#module_utils)
**Returns**: <code>Number</code> - scrollTop值
<a name="module_utils.gotoWinTop"></a>

### utils.gotoWinTop
回到顶部

**Kind**: static constant of [<code>utils</code>](#module_utils)
<a name="module_utils.asyncLoadJs"></a>

### utils.asyncLoadJs
异步加载js

**Kind**: static constant of [<code>utils</code>](#module_utils)

| Param | Type | Description |
| --- | --- | --- |
| deps | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 要加载的js列表 |
| callback | <code>function</code> | 加载后回调 |

<a name="module_utils.asyncLoadCss"></a>

### utils.asyncLoadCss
异步加载css

**Kind**: static constant of [<code>utils</code>](#module_utils)

| Param | Type | Description |
| --- | --- | --- |
| deps | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 要加载的js列表 |
| callback | <code>function</code> | 加载后回调 |
