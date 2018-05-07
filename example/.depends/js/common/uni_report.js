/**
 * @author: zimyuan
 * @desc: 新版游戏中心前端质量上报库
 */

/**
 * 微信游戏中心前端质量上报系统
 * 前端常见的出错点：
 * 1. 资源请求环节
 *    CDN资源加载错误
 *    资源请求超时导致用户直接退出
 * 2. 渲染环节
 *    排版出错
 *    白屏或者模块缺失
 *    元素隐藏或者遮盖
 * 3. 交互环节
 *    元素点击无响应
 * 4. 网络请求环节
 *    请求参数错误
 *    网络连接失败
 *    网络返回格式错误
 * 
 * 错误上报的备选方案
 * a. 添加全局的try catch代理，只要监控到任意一个函数的错误就执行上报
 *    这种方案的缺陷在于，很多bug不是js报错导致的，
 *    而且现有的badjs系统可以很完善监页面报错，
 *    已经能够有效排除因为错误上报而导致的bug
 *
 * b. 与客户端一样，前端维护一套本地日志，借助白名单可以主动或者被动上传本地日志
 *    这种方案的缺陷在于，前端常规页面没有长连接机制，
 *    相对较大的前端日志保存到本地不可能要求所有用户都去提交
 *    即便单个用户出错了，还需要该用户去二次访问页面才能将日志上传
 *    定位现网用户的问题不方便
 *
 * c. 前端借助客户端的能力，通过jsapi，将前端日志保存到客户端
 *    好处是可以利用客户端现有的日志系统，并且可以主动拉用户的日志
 *    缺陷在于客户端实现这一套机制需要不少时间，
 *    并且只有安卓才能实现主动拉取机制
 *    这一套机制先挂起，留到后续推进
 *
 * d. 与方案a类似，采用实时上报机制，包括主动收集错误和规范性埋点上报
 *
 */

// new
var request     = require('request');
var util        = require('util');
  
/**
 * 为最大化减少外部依赖
 * 本库自己实现几个常用的函数
 */
var tools = {
  /**
   * @Function
   * 简易封装Ajax请求
   * @param {String} url
   * @param {String/Object} params
   * @param {Function} success
   * @param {Function} fail
   */
  ajax: function(monitor_data, success, fail) {
    var session = tools.getSession();
    var query = 'userid=' + (session.user_id || session.userId || '');
    request({
        url     : 'https://game.weixin.qq.com/cgi-bin/comm/pagestat?op=batch&' + query,
        method  : 'POST',
        header  : {"Content-Type": "application/x-www-form-urlencoded"},
        data    : {
          monitor_data: monitor_data
        },
        success : function(res = {}){
            success && success.call(this, res.data);
        },
        fail    : function(res = {}){
          fail && fail.call(this, res.data);
        }
    });
  },

  /**
   * 将对象按照特定的分隔符拼接成字符串
   * 内部函数不做类型判断
   * @param {Object} map
   * @param {String} split
   */ 
  mapToStr: function(map, split) {
    var arr   = [];
    var split = split || '&';

    for ( var key in map )
      arr.push(key + '=' + map[key]);

    return arr.join(split);
  },

  /**
   * 查询url参数
   * @param {String} name: 参数名
   * @param {String} str: 可选的自己提供的url链接
   */
  getQueryStr: function(name, str) {
      "use strict";
      var _str = str || location.search;

      //先去除一下hash
      _str = ('' + _str).replace(/#(.*)$/g, '')
                .replace(/&amp;/g, '&');

      var res = _str.match(new RegExp("[\?\&]" + name + "=([^\&]+)", "i"));

      if ( res === null || res.length <= 1 )
          return '';

      return res[1];
  },

  /**
   * 获取微信版本号
   * @param {String} str: 可选的自己透传agent字符串
   */
  getClientVersion: function(str) {
      var mat     = ( navigator.userAgent || navigator.wxuserAgent || str )
              .match(/MicroMessenger\/([\d\.]+)/i),
          version = '';

      if ( mat && mat.length > 1 )
          version = mat[1];

      version        = version.split('.');
      version.length = 3;

      return version.join('.') + '';
  },

  /**
   * 判断数据结构类型
   * @param {String} type
   * @param {Anything} value
   */
  isType: function(type, value) {
    var typeTemp = Object
              .prototype
              .toString
              .call(value)
              .match(/\s(\w+)/)[1]
              .toLowerCase();

    return typeTemp === type;
  },
  getSession: function () {
    var v = wx.getStorageSync('__SESSION__KEY__');
    try {
      if (('' + v).length > 0) {
        return JSON.parse(v + '');
      } else {
        return {};
      }
    } catch (e) {
      return {};
    }
  }
};

/**
 * @constructor
 * @version        : 0.0.1
 * @last-edit-date : 2017-07-10
 * @size           : gzip 3.1k
 * @doc            : http://tapd.oa.com/wechat11/markdown_wikis/#1010079491005771265
 * 
 * 微信游戏中心前端质量上报通用组件
 * 用于错误上报 & 追踪单个用户行为
 *
 * 工作原理
 * 1. 页面执行版本发布的时候会内嵌两段错误收集脚本，用于收集资源 + js执行的错误
 *    内嵌脚本会上报js文件加载出错，但不会上报css和图片文件加载出错；
 *    因为js加载出错无法执行到本组件，但是css和图片加载出错可以；
 * 2. 本组件对外暴露WxgameReport的实例单例`uni_report`；
 * 3. 在执行真正的上报之前需要调用API`set_base`来设置业务id；
 * 4. 对外暴露的API`report`用于调用者依据文档执行单条上报；
 * 5. 为了提高代码的可读性，组件内嵌了几个API用于追踪用户行为
 *    他们会占据一些status，调用者调用report执行自定义上报的时候
 *    务必避开这些status，防止冲突；每一个API的使用请仔细阅读文档；
 */
// 单例模式的实例
var instance = null;
function WxgameReport() {
  // 单例模式
  if ( instance )
    return instance;

  instance = this;

  this.init();
}

WxgameReport.prototype = {
  constructor: WxgameReport,

  /**
   * 组件初始化函数
   * 1. 组件全局变量说明
   * 2. 上报默认字段初始化
   */
  init: function() {
    /**
     * 组件默认配置
     * 可以通过API`set_config`来修改
     */
    this.config = {
      reportsize : 5,                   // 立即上报的阀值
      reportcgi  : 'https://game.weixin.qq.com/cgi-bin/comm/pagestat?op=batch',   // 上报的cgi
      persistkey : 'mmgamecenter_universe_quality_key', // 本地存储待上报数据的键
      delay      : 1000                 // 延迟上报时间设置
    };

    /**
     * 标识是否设置了基础上报字段
     * 没有设置基础字段不给上报！
     */
    this.hasBaseSetted = false;

    // 当前页面是否第一次上报
    this.isFirstReport = true;

    /**
     * 单条上报基础字符
     * 调用者无需关系这些字段
     * 当然，如果强行要改变这几个字段的值
     * 也可以在调用report接口的时候设置
     */
    this.base = {
      bid         : 1,
      scene_id      : 0,
      device      : 0,
      // 当前网络类型
      network_type  : 1,
      // 当前微信客户端版本号
      client_version  : '',
      ssid        : 0,
    };
    this.collectBase((base) => {
      this.base = Object.assign(this.base, base);
    });

    // 除了base之外的可变字段
    this.other = {
      type    : 999999, // number
      status    : 999999, // number
      cost_time : {},   // object(pa, pb, pc, pd字段都必需) 
      url     : '',   // string
      ext     : '',   // string(将ext对象内的stringify)
      time    : 0     // number
    };

    /**
     * 待上报数据池
     * 首次上报会全量上报本地缓存中的数据
     * 而后，dataPool始终与本地缓存保持一致
     */
    this.dataPool = [];
  },

  /**
   * 用于收集固定的上报参数
   * 一个页面打开后这些参数一般不会随着时间而改变
   * 组件初始化的时候统一收集
   */
  collectBase: function(fuc) {
    util.getReportObj(function(sysObj) {
      let device  = sysObj.device,
      networktype = sysObj.networktype,
      version     = sysObj.clientVersion + '@' + sysObj.sdkVersion;

      fuc && fuc({
        // 当前设备类型
        device      : (  device === 'android'
                   ? 2
                   : (  device === 'iphone'
                      ? 1
                      // mdmata上其他类型对应device: -1, 所以默认取0
                      : 0  )  ),

        // 当前网络类型
        network_type  : (  (   networktype === null
                    || networktype === undefined )
                   ? 1
                   : parseInt(networktype)  ),

        // 当前微信客户端版本号
        client_version  : version || ''
      });
    });
  },

  /**
   * 补全单条上报需要的字段
   * 1. 采集base字段，data中字段可覆盖base中字段的值
   * 2. other字段需要满足特定的类型
   */
  abstractOneReport: function(data) {
    var base  = this.base,
      other = this.other,
      res   = {};

    // 收集base中的字段
    for ( var p in base ) {
      if ( !{}.hasOwnProperty.call(base, p) )
        continue;

      /**
       * 通常来讲不需要关心base字段
       * 但是仍然支持手动设置
       */
      res[p] = (  data[p] !== undefined
            ? data[p]
            : base[p]  );
    }

    /**
     * 收集额外字段
     * 其中有些字段需要强变更格式
     */
    for ( var p in other ) {
      if ( !{}.hasOwnProperty.call(other, p) )
        continue;

      // 取手动设置值或者默认值
      res[p] = (  data[p] !== undefined
            ? data[p]
            : other[p]  );

      // 强制采用组件的时间戳
      if ( p === 'time' )
        res[p] = Math.floor(new Date().getTime() / 1000);

      /**
       * data['type'] === 0代表是cgi类型的上报
       * 如果是cgi上报，加上host
       */
      else if ( p === 'url' && data['type'] === 0 ) { 
        res[p] = data[p];
      }

      else if ( p === 'cost_time' ) {
        // 保证pa，pb，pc，pd字段都要有
        for ( var key in data[p] ) {
          var val = data[p][key];

          if ( isNaN(val) || val === undefined )
            data[p][key] = 999999;
        }

        res[p] = (  data[p] === undefined
              ? other[p]
              : data[p]  );
      }

      // 额外字段需要解析成字符串
      else if ( p === 'ext' && typeof data[p] === 'object' )
        res[p] = JSON.stringify(data[p]);
    }

    return res;
  },

  /**
   * 将多条上报组成的数组上报
   * @param {Array} arr: 多条上报组成的数组
   * @param {Function} callback: 上报回调函数
   */
  reportArr: function(arr, callback) {
    // var monitor_data = encodeURIComponent( JSON.stringify(arr) );
    var monitor_data = JSON.stringify(arr) ;

    // 发送ajax请求将数据上报到后台
    tools.ajax(
      monitor_data
      ,
      function(res){
        callback && callback.call(this, res.ret);
      }
    );
  },

  /**
   * 执行一次上报
   * 从数据池中取出几条数据进行上报
   * 无论上报成功与否都需要将待上报数据同步到缓存
   */
  doReport: function() {
    var that = this,
      key  = this.config.persistkey,
      pool = this.dataPool,
      // 从上报池中取出准备上报的数据
      data = pool.splice(0, this.config.reportsize);

    if ( !data.length )
      return;

    
    this.reportArr(
      data,
      function (ret) {
        /**
         * 上报失败，取出来的数据重新入队列
         * @TODO: 这里需要抛弃格式错误的上报
         */
        if ( ret !== 0 )
          that.dataPool = data.concat(that.dataPool);

        // 保证后台在工作，但返回非0，即格式不正确时抛弃第一条
        // 防止因为第一条的不正确导致之后的上报失效
        if ( !isNaN(ret) && ret !== 0 )
          that.dataPool = that.dataPool.slice(1);
      }
    );
  },

  /**
   * @API
   * 提供接口可以修改config的值
   */
  set_config: function(params) {
    // 类型检查
    if ( !tools.isType('object', params) )
      throw 'IllegalArgumentException: params must be type of Object';

    var config = this.config;

    for ( var key in params ) {
      if (   !{}.hasOwnProperty.call(params, key)
        || !{}.hasOwnProperty.call(config, key) )
        continue;

      config[key] = params[key];
    }
  },

  /**
   * @API
   * 单条上报基础参数配置
   */
  set_base: function(params) {
        // 参数类型检查
    if ( !tools.isType('object', params) )
      throw 'IllegalArgumentException: params must be type of Object';

    var base = this.base;

    for ( var key in params ) {
      if (   !{}.hasOwnProperty.call(params, key)
        || !{}.hasOwnProperty.call(base, key) )
        continue;

      base[key] = params[key];
    }

    this.hasBaseSetted = true;
  },
  /**
   * @API
   * 对外开放的API，手动执行上报操作
   * @param {Object} data: 单条上报数据对象
   */
  report: function(data) {
    if ( !this.hasBaseSetted )
      throw 'IllegalStateException: please invoke API `set_base` before.';

    var that = this;

    // 补全上报字段
    data = this.abstractOneReport(data);

    /**
     */
    this.dataPool = this.dataPool
                .concat(data);

    // 只要数据池达到阀值立即执行上报
    if ( this.dataPool.length >= this.config.reportsize )
      this.doReport();

    // 先清理之前定义的定时器
    if ( this.timer )
      clearTimeout(this.timer);

    /**
     * 数据池没有达阀值的时候
     * 启动定时器延迟执行上报
     */
    this.timer = setTimeout(
      this.doReport.bind(this),
      this.config.delay
    );
  },
  /**
   * @API
   * 调用 通用 打点进行
   * @param {String} name:jsapi的名字
   */
  call: function(status,name) {
        // 参数类型检查
        if (   typeof name === 'undefined'
            || name === null )
            throw "IllegalArgumentException: name is null or undefined.";

    if ( !tools.isType('string', name) )
      throw 'IllegalArgumentException: name must be type of String';

    this.report({
      type   : 1,
      status : status,
      ext    : name
    });
  },
  afterCall:function(status,name,res){
    // 参数类型检查
        if (   typeof name === 'undefined'
            || name === null )
            throw "IllegalArgumentException: name is null or undefined.";

    if ( !tools.isType('string', name) )
      throw 'IllegalArgumentException: name must be type of String';

    if ( res && !tools.isType('object', res) && !tools.isType('string', res) )
      throw 'IllegalArgumentException: res must be type of String or Object';   

    res = res || '';

    // jsapi执行结果拼接并且上报
    this.report({
      type   : 1,
      status : status,
      ext    : name
           + '_res:'
           + (  tools.isType('object', res)
            ? JSON.stringify(res)
            : res  )
    });
  },
  /**
   * @API
   * 渲染界面的时候打点进行上报
   * @param {String} ext: 此次渲染的关键信息
   */
  render: function(ext) {
    this.call(1000,'render_'
           + (  tools.isType('object', ext)
            ? JSON.stringify(ext)
            : ext  ));
  },

  /**
   * @API
   * 读取缓存的时候打点进行上报
   * @param {String} ext: 缓存的关键信息
   */
  readCache: function(ext) {
    this.call(1001,'render_'
           + (  tools.isType('object', ext)
            ? JSON.stringify(ext)
            : ext  ));
  },

  /**
   * @API
   * 点击元素之前打点进行数据上报
   * 仅仅为了统计用户行为可以忽略afterClick
   * @param {String} name: 元素的id/class
   */
  click: function(eleName) {
    this.call(1002,'click_' + eleName);
  },

  /**
   * @API
   * 点击元素之后打点进行数据上报
   * 用于上报点击元素之后的页面状态
   * @param {String} name: 元素的id/class
   * @param {String/Obejct} res: 点击元素之后的期望上报的额外信息
   */
  afterClick: function(eleName, res) {
    this.afterCall(1003,'click_' + eleName,res);
  },

  /**
   * @API
   * 调用jsapi之前打点进行数据上报
   * @param {String} name:jsapi的名字
   */
  invokeJsapi: function(name) {
    this.call(1004,'invoke_' + name);
  },

  /**
   * 调用jsapi之后打点进行数据上报
   * @param {String} name: jsapi的名字
   * @param {String/Object} res: 调用jsapi的结果 
   */
  afterInvokeJsapi: function(name, res) {
    this.afterCall(1005,'invoke_' + name,res);
  },

  /**
   * 上报 通用的某个函数调用的log,用于记录某个函数执行状态。
   * 函数开始时调用 。
   * @param {String} fnName 
   */
  callFnBegin:function(fnName){
    this.call(1006,'fncall_' + fnName);
  },
  /**
   * 上报 通用的某个函数调用的log,用于记录某个函数执行状态。
   * 函数 成功 结束 时调用 。
   * @param {any} fnName 
   */
  callFnEnd:function(fnName,res){
    this.afterCall(1007,'fncall_' + fnName,res);
  }
}

/**
 * @exports
 * 对外暴露类实例
 */
module.exports = new WxgameReport();
