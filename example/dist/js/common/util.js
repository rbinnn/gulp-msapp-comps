function fullMonth(timestamp) {
    var mons = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];
    return mons[new Date((timestamp||new Date().getTime()/1000) * 1000).getMonth()];
}

function fullDay(timestamp) {
    var dt = new Date((timestamp||new Date().getTime()/1000)* 1000).getDate();
    return dt < 10 ? '0' + dt : dt;
}

function getYMD(timestamp){
    var nt = new Date((timestamp||new Date().getTime()/1000)*1000),
        yt = nt.getFullYear(),
        mt = nt.getMonth()+1,
        dt = nt.getDate();
    return [yt+'年',(mt<10?'0':'')+mt+'月',(dt<10?'0':'')+dt+'日'].join('')
}

function getWeekDay(timestamp){
    var dt = new Date((timestamp||new Date().getTime()/1000)*1000);
    var mp = '日一二三四五六'.split('');
    return '星期' + mp[dt.getDay()];
}

function formatTime(time) {
    var nt = new Date(),
        td = new Date(nt.toString().replace(/\d+:\d+:\d/, '00:00:00')),
        dt = parseInt(td.getTime() / 1000),
        yt = new Date((dt - 86400) * 1000),
        tt = new Date(time * 1000),
        m = dt - time;
    if (m > 86400) { //距今天0点超过1天
        if (m > 31536000) {
            return Math.floor(m / 31536000) + '年前';
        } else if (m >= 2592000) {
            return Math.floor(m / 2592000) + '月前';
        } else if (m >= 14515200) {
            return Math.floor(m / 14515200) + '周前';
        } else {
            return Math.floor(m / 86400) + '天前';
        }
    } else if (m <= 0) { //今天0点之后
        return '今天';
    } else {
        return '昨天';
    }
}

function setKeyValue(key, val) {
    wx.setStorage({
        key: key,
        data: val,
        fail(res) {
            console.log('setStorage res', res);
            wx.clearStorageSync();
            wx.setStorageSync(key, val);
        }
    })
}

function getKeyValue(key) {
    return wx.getStorageSync(key);
}

function delKeyValue(key) {
    return wx.removeStorageSync(key);
}

function clearKeyValue() {
    wx.clearStorageSync();
}

function formatNumber(n) {
    n = n.toString()
    return n[1] ? n : '0' + n
}
/* 
    language     : "zh_CN"
    model        : "iPhone 6", iPhone 7 Plus<iPhone9,2>
    pixelRatio   : 2
    platform     : ios/ android /devtools
    system       : "iOS 10.0.1"
    version      : "6.3.9"
    screenHeight : 736,
    screenWidth  : 414
    windowHeight : 625
    windowWidth  : 375

*/
function _parseNetWork(ver) {
    var tp = ver.toLowerCase(),
        mp = {
            'wifi': 0,
            'uninet': 2,
            'uniwap': 2,
            'cmnet': 2,
            'cmwap': 2,
            'ctnet': 2,
            'ctwap': 2,
            '2g': 2,
            '3g': 3,
            '3gnet': 3,
            '3gwap': 3,
            'nonwifi': 3,
            '4g': 4,
            'lte': 4,
            'ctlte': 4,
            '3g+': 4,
            '4gnet': 4
        };
    // 0=wifi 1=Unknown 2=2G 3=3G 4=4G
    if (tp in mp) {
        return mp[tp] + '';
    } else {
        return 1 + '';
    }
}


var _sysObj    = false;
function getReportObj(cbk){
    if(_sysObj !== false && typeof(cbk) == 'function'){
        cbk(_sysObj); return;
    }
    wx.getSystemInfo({
        complete: function(sysObj){
            sysObj               = sysObj || {};
            sysObj.device        = /iOS\s\d+\./i.test(sysObj.system||'') ? 'iphone' : 'android';
            sysObj.model         = sysObj.model || '';
            sysObj.clientVersion = intVersion(sysObj.version   ||'0');
            sysObj.sdkVersion    = intVersion(sysObj.SDKVersion||'0');
            wx.getNetworkType({
                complete: function(net){
                    sysObj.networktype = _parseNetWork(net.networkType);
                    _sysObj = sysObj;
                    typeof(cbk) == 'function' && cbk(_sysObj);
                }
            });
        }
    });
}

function intVersion(ver) {
	ver   = ver || '';
    var x = ver.replace(/[^0-9\.]+/g, '').split(/[^0-9]+/).splice(0, 3);
    var s = 0,
        p = [1000, 100, 1];
    for (var i = 0, il = x.length; i < il; i++) {
        s += (x[i] - 0) * p[i];
    }
    return s;
}

function stripThumbImg(url) {
    return url.replace(/\/\d+$/, '/0');
}
/**
 * 用于获取，当前页面的前一个页面。如果没有前一页面，则返回空对象 {}
 * 
 * @returns 是Page()方法里的那个整个对象。
 */
function getPageFrom() {
    var currentPageStack = getCurrentPages();
    var len = currentPageStack.length;

    if (len > 1) {
        return currentPageStack[len - 2];
    } else {
        return {};
    }
}

function _dataset(evt){
    var dataset = evt && evt.currentTarget && evt.currentTarget.dataset ?
        evt.currentTarget.dataset : (evt && evt.target && evt.target.dataset 
            ? evt.target.dataset : {});
    return dataset;
}

// 统一对特殊错误做处理
function handleRequestError(res) {
    try {
        var sys = wx.getSystemInfoSync()||{};
        if (res.errMsg && /^request:fail/.test(res.errMsg)) {
            if (res.errMsg && /^request:fail/.test(res.errMsg)) {
                if ((sys.version === "6.5.6" || sys.version === "6.5.7") && /Android/i.test(sys.system)) {
                    wx.showModal({
                        title: '',
                        content: '系统繁忙，请稍后再试(-1000)',
                        confirmText: "好的",
                        showCancel: false
                    });
                }
            }
        }
    } catch (e) {
        console.log("handleRequestError : " + e.message);
    }
}

// fixed onLaunch/onShow params.query is string problems
// params = {query:'{gamename=王者荣耀, appid=wx95a3a4d7c627e07d}'}
function fix_app_init_params(res){
    res = res || {};
    if('query' in res && typeof(res.query)=='string'){
        var a = res.query.substr(1, res.query.length-2)+', ';
        var r = /(\w+)=(.*?), (?:\w+=)?/i;
        var c = null;
        var o = {};
        while(c = r.exec(a)){
            o[c[1]] = c[2];
            a = a.substr(c[1].length+c[2].length+3);
        }
        res.query = o;
        r = a = c = '';
    }
};

function throttle(callback, t, context) {
    var timer;

    return function () {
        var args = arguments;

        if (timer) {
            return;
        }

        timer = setTimeout(function () {
            callback.apply(context, args);
            timer = null;
        }, t)
    }
}

function debounce(callback, t, context) {
    var timer;

    return function () {
        var args = arguments;

        clearTimeout(timer);

        timer = setTimeout(function () {
            callback.apply(context, args);
        }, t);
    }
}

module.exports = {
    setKeyValue        : setKeyValue,
    getKeyValue        : getKeyValue,
    delKeyValue        : delKeyValue,
    clearKeyValue      : clearKeyValue,
    stripThumbImg      : stripThumbImg,
    getReportObj       : getReportObj,
    intVersion         : intVersion,
    formatTime         : formatTime,
    getYMD             : getYMD,
    getWeekDay         : getWeekDay,
    fullDay            : fullDay,
    dataset            : _dataset,
    fullMonth          : fullMonth,
    getPageFrom        : getPageFrom,
    fixQueryStr        : fix_app_init_params,
    handleRequestError : handleRequestError,
    throttle           : throttle,
    debounce           : debounce,
}