var _sysObj = false;
function intVersion(ver) {
        ver = ver || '';
    var x   = ver.replace(/[^0-9\.]+/g, '').split(/[^0-9]+/).splice(0, 3);
    var s   = 0,
        p   = [1000, 100, 1];
    for (var i = 0, il = x.length; i < il; i++) {
        s += (x[i] - 0) * p[i];
    }
    return s;
}
function _parseNetWork(ver) {
    var tp = ver.toLowerCase(),
        mp = {
            'wifi'   : 0,
            'uninet' : 2,
            'uniwap' : 2,
            'cmnet'  : 2,
            'cmwap'  : 2,
            'ctnet'  : 2,
            'ctwap'  : 2,
            '2g'     : 2,
            '3g'     : 3,
            '3gnet'  : 3,
            '3gwap'  : 3,
            'nonwifi': 3,
            '4g'     : 4,
            'lte'    : 4,
            'ctlte'  : 4,
            '3g+'    : 4,
            '4gnet'  : 4
        };
    // 0=wifi 1=Unknown 2=2G 3=3G 4=4G
    if (tp in mp) {
        return mp[tp] + '';
    } else {
        return 1 + '';
    }
}
module.exports = Behavior({
    methods: {
        dataset: function (evt) {
            var dataset = evt && evt.currentTarget && evt.currentTarget.dataset ?
                evt.currentTarget.dataset : (evt && evt.target && evt.target.dataset
                    ? evt.target.dataset : {});
            return dataset;
        },
        getReportObj: function (cbk) {
            if (_sysObj !== false && typeof (cbk) == 'function') {
                cbk(_sysObj); return;
            }
            wx.getSystemInfo({
                complete: function (sysObj) {
                    sysObj = sysObj || {};
                    sysObj.device = /iOS\s\d+\./i.test(sysObj.system || '') ? 'iphone' : 'android';
                    sysObj.model = sysObj.model || '';
                    sysObj.clientVersion = intVersion(sysObj.version || '0');
                    sysObj.sdkVersion = intVersion(sysObj.SDKVersion || '0');
                    wx.getNetworkType({
                        complete: function (net) {
                            sysObj.networktype = _parseNetWork(net.networkType);
                            _sysObj = sysObj;
                            typeof (cbk) == 'function' && cbk(_sysObj);
                        }
                    });
                }
            });
        },
        setKeyValue: function (key, val) {
            wx.setStorage({
                key: key,
                data: val,
                fail(res) {
                    console.log('setStorage res', res);
                    wx.clearStorageSync();
                    wx.setStorageSync(key, val);
                }
            })
        },
        getKeyValue: function(key) {
            return wx.getStorageSync(key);
        },
        delKeyValue: function(key) {
            return wx.removeStorageSync(key);
        },
        clearKeyValue: function() {
            wx.clearStorageSync();
        }
    }
})