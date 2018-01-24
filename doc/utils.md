<a name="module_@/deps/utils"></a>

## @/deps/utils
工具库


* [@/deps/utils](#module_@/deps/utils)
    * [~BASE_PATH](#module_@/deps/utils..BASE_PATH) : <code>String</code>
    * [~c2s](#module_@/deps/utils..c2s)
    * [~asyncLoadJs](#module_@/deps/utils..asyncLoadJs)
    * [~asyncLoadCss](#module_@/deps/utils..asyncLoadCss)
    * [~getUrlQueryValue(key)](#module_@/deps/utils..getUrlQueryValue)
    * [~getPlatformName()](#module_@/deps/utils..getPlatformName)
    * [~getDocumentTitle()](#module_@/deps/utils..getDocumentTitle)
    * [~setDocumentTitle(title)](#module_@/deps/utils..setDocumentTitle)
    * [~getRequestIgnorePrefix()](#module_@/deps/utils..getRequestIgnorePrefix)
    * [~isDevelop()](#module_@/deps/utils..isDevelop)
    * [~getProxyPrefix()](#module_@/deps/utils..getProxyPrefix)
    * [~jumpTo(options)](#module_@/deps/utils..jumpTo)
    * [~sessionStorage(key, value)](#module_@/deps/utils..sessionStorage)
    * [~getAppStore(key)](#module_@/deps/utils..getAppStore)
    * [~setAppStore(key, value)](#module_@/deps/utils..setAppStore)
    * [~getAppData(key)](#module_@/deps/utils..getAppData)
    * [~setAppData(key, value)](#module_@/deps/utils..setAppData)
    * [~removeAppData(key)](#module_@/deps/utils..removeAppData)
    * [~generateID()](#module_@/deps/utils..generateID)
    * [~log(message, [pattern])](#module_@/deps/utils..log)
    * [~getWindowScrollTop()](#module_@/deps/utils..getWindowScrollTop)
    * [~gotoWinTop()](#module_@/deps/utils..gotoWinTop)

<a name="module_@/deps/utils..BASE_PATH"></a>

### @/deps/utils~BASE_PATH : <code>String</code>
**Kind**: inner constant of [<code>@/deps/utils</code>](#module_@/deps/utils)
**Default**: <code>/</code>
<a name="module_@/deps/utils..c2s"></a>

### @/deps/utils~c2s
前后端异步通信接口

**Kind**: inner constant of [<code>@/deps/utils</code>](#module_@/deps/utils)

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

<a name="module_@/deps/utils..asyncLoadJs"></a>

### @/deps/utils~asyncLoadJs
异步加载js

**Kind**: inner constant of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| deps | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 要加载的js列表 |
| callback | <code>function</code> | 加载后回调 |

<a name="module_@/deps/utils..asyncLoadCss"></a>

### @/deps/utils~asyncLoadCss
异步加载css

**Kind**: inner constant of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| deps | <code>String</code> \| <code>Array.&lt;String&gt;</code> | 要加载的js列表 |
| callback | <code>function</code> | 加载后回调 |

<a name="module_@/deps/utils..getUrlQueryValue"></a>

### @/deps/utils~getUrlQueryValue(key)
获取地址对应查询参数值

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | Query key |

<a name="module_@/deps/utils..getPlatformName"></a>

### @/deps/utils~getPlatformName()
获取平台名（内部根据platformName参数值判定）

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..getDocumentTitle"></a>

### @/deps/utils~getDocumentTitle()
获取页面title（内部根据title query param返回）

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..setDocumentTitle"></a>

### @/deps/utils~setDocumentTitle(title)
设置Document title

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| title | <code>String</code> | Document title |

<a name="module_@/deps/utils..getRequestIgnorePrefix"></a>

### @/deps/utils~getRequestIgnorePrefix()
根据ignorePrefix查询参数获取请求需要忽略的访问路径

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..isDevelop"></a>

### @/deps/utils~isDevelop()
根据请求参数或者访问地址判断是否处于develop状态
开发环境包括127.0.0.1/localhost/192.168.x.x（不包括192.168.49.61）

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..getProxyPrefix"></a>

### @/deps/utils~getProxyPrefix()
获取当前代理数据请求地址前缀

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..jumpTo"></a>

### @/deps/utils~jumpTo(options)
手动地址跳转

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| options | <code>Object</code> | $router.push(options) |

<a name="module_@/deps/utils..sessionStorage"></a>

### @/deps/utils~sessionStorage(key, value)
session storage操作

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | session key |
| value | <code>\*</code> | session value |

<a name="module_@/deps/utils..getAppStore"></a>

### @/deps/utils~getAppStore(key)
获取app store

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | 要获取的key |

<a name="module_@/deps/utils..setAppStore"></a>

### @/deps/utils~setAppStore(key, value)
设置app store， Deep merge方式

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value |

<a name="module_@/deps/utils..getAppData"></a>

### @/deps/utils~getAppData(key)
获取app data

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |

<a name="module_@/deps/utils..setAppData"></a>

### @/deps/utils~setAppData(key, value)
设置app data

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |
| value | <code>\*</code> | value |

<a name="module_@/deps/utils..removeAppData"></a>

### @/deps/utils~removeAppData(key)
清除app data

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Description |
| --- | --- | --- |
| key | <code>String</code> | key |

<a name="module_@/deps/utils..generateID"></a>

### @/deps/utils~generateID()
生成唯一id

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..log"></a>

### @/deps/utils~log(message, [pattern])
自定义log屏幕打印

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| message | <code>String</code> |  | log message |
| [pattern] | <code>String</code> | <code>&#x27;append&#x27;</code> | 信息显示方式：append（追加到上一条后面）; clear（先清屏） |

<a name="module_@/deps/utils..getWindowScrollTop"></a>

### @/deps/utils~getWindowScrollTop()
获取window scrollTop

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
<a name="module_@/deps/utils..gotoWinTop"></a>

### @/deps/utils~gotoWinTop()
回到顶部

**Kind**: inner method of [<code>@/deps/utils</code>](#module_@/deps/utils)
