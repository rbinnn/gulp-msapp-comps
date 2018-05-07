/*
    http://dev.weixin.oa.com/itilwebwebmonitor/view/realtimelog?id=101 实时日志
    http://weixin.oa.com/itilwebwebmonitor/view/chart?id=101 历史日志
 */
let request = require('./request');

function stringifyError(error) {
    var msg = error.replace(/\n/gi, "").split(/\bat\b/).slice(0, 5).join("@").replace(/\?[^:]+/gi, "");
    return msg;
}

function _processError(e) {
    var url = e.match("\(https?://[^\)]+\)");
    url = url ? url[0] : "";
    var rowCols = url.match(":([0-9]+):([0-9]+)");
    if (!rowCols) {
        rowCols = [0, 0, 0];
    } 
    var stack = stringifyError(e);
    return {
        msg: `(from: ${_config.from}) @ ${stack}`,
        rowNum: rowCols[1],
        colNum: rowCols[2],
        target: url.replace(rowCols[0], "")
    }
}

function _passIgnore(errObj) {
    var isIgnore = true;
    if (_isOBJByType(_config.ignore, "Array")) {
        for (var i = 0, l = _config.ignore.length; i < l; i++) {
            var rule = _config.ignore[i];
            if ((_isOBJByType(rule, "RegExp") && rule.test(errObj.msg)) ||
                (_isOBJByType(rule, "Function") && rule(errObj, errObj.msg))) {
                    isIgnore = false;
                break;
            }
        }
    }
    return isIgnore;
}

function getSession() {
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

let _isOBJ = function (obj) {
    var type = typeof obj;
    return type === "object" && !!obj;
};

let _isOBJByType = function (o, type) {
    return Object.prototype.toString.call(o) === "[object " + (type || "Object") + "]";
};

let _config = {
    id: 101,
    uin: "926063420",
    url: "https://badjs.weixinbridge.com/badjs",
    delay: 1000,
    level: 4, // error,
    ext: {},
    ignore: [
        /APP\-SERVICE\-SDK\:setStorageSync\:fail/g
    ]
};

let BJ_REPORT = {    

    report(e, level) {
        if( !_config.report ) {
            return;
        }
        var errObj = _processError(e);
        if( !_passIgnore(errObj) ) {
            return;
        }
        var param = [];
        errObj.level = level || _config.level;
        for(var key in errObj ) {
            var value = errObj[key];
            if (_isOBJ(value)) {
                try {
                    value = JSON.stringify(value);
                } catch (err) {
                    value = "[BJ_REPORT detect value stringify error] " + err.toString();
                }
            }
            param.push(key + "=" + encodeURIComponent(value));
        }
        var url = `${_config.report}&${param.join("&")}&_t=${Date.now()}`;
        setTimeout( () => {
            request({
                url: url,
                success(res) {
                },
                fail(res) {
                    console.log("Badjs report fail: ", res)
                }
            })
        }, _config.delay)
    },

    init(options) {
        if( _isOBJ(options) ) {
            for( var key in options ) {
                _config[key] = options[key];
            }
        }
        if( _config.id ) {
            var session = getSession();
            var userid = session.user_id || session.userId || _config.uin
            _config.report = `${_config.url}?id=${_config.id}&uin=${userid}&from=${_config.from}`;
        }
    }
}

module.exports = BJ_REPORT;

