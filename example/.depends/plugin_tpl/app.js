//app.js
var Config = require('./config');
var r14359 = require('js/common/report_14359');
var BJ_REPORT = require('js/common/bj_report');
var projectName = "mmsapp/miniapp-portal"
BJ_REPORT.init({ delay: 2000, from: projectName });

App({
    nilReport: [],
    globalData: {},
    pageInfo: {},
    onLaunch: function (res) {
        // 分享参数 shareTicket
        this.pageInfo = res || {};
        // 为登录准备
        require('js/common/welogin').prepare(this, Config);
    },
    onShow: function (res) {
        // 新版本才支持，这个才是正常
        this.pageInfo = res || this.pageInfo || {};
    },
    onError: function (e) {
        BJ_REPORT.report(e);
    },
    getUserInfo: function (cb) {
        var self = this;
        if (this.globalData.userInfo) {
            typeof cb == "function" && cb(this.globalData.userInfo)
        } else {
            //调用登录接口
            wx.login({
                success: function () {
                    wx.getUserInfo({
                        success: function (res) {
                            self.globalData.userInfo = res.userInfo
                            typeof cb == "function" && cb(self.globalData.userInfo)
                        }
                    })
                }
            })
        }
    },
    jumpToUrl: function (url, cbk) {
        if (typeof (wx.openUrl) != 'function') {
            wx.hideToast();
            return;
        }
        var ssid = Config.sceneid;
        url = url.replace(/(\?|\&)ssid=([^&]+)&?/i, '$1').replace(/&$/i, '');
        url = url.indexOf('?') != -1
            ? url.replace('?', '?ssid=' + ssid + '&')
            : (url.indexOf('#') != -1
                ? url.replace('#', '?ssid=' + ssid + '#')
                : url += '?ssid=' + ssid
            );
        console.log('openUrl', url);
        wx.openUrl({
            url: url,
            complete: function (res) {
                if (typeof (cbk) == 'function') {
                    cbk(res);
                }
            }
        });
    },
    delayReport: function () {
        var self = this;
        var sess = typeof (self.session) == 'function' ? self.session() : (self.session || {});
        var list = self.nilReport || [];
        if (list.length > 0) {
            // self.request({
            //     url:'https://game.weixin.qq.com/cgi-bin/h5/static/gamecenter/index.html?d=1',
            //     method:'POST',
            //     data: sess
            // })
            if (!sess.userId || sess.userId == 'nil') {
                setTimeout(function () { self.delayReport() }, 1000);
            } else {
                r14359.batchCltStat(sess, self.nilReport.splice(0, self.nilReport.length));
            }
        }
    },
    // 根据具体需求修改入参参数及顺序
    report: function (area, pos, action, exter, general) {
        var self = this;
        self.pageInfo = self.pageInfo || {};
        var sess = typeof (self.session) == 'function' ? self.session() : (self.session || {});
        var list = self.nilReport || [];
        var param = {
            sGameId: Config.appid,
            iSceneId: Config.sceneid || 0,
            iUIArea: area,
            iActionId: action,
            iPositionId: pos,
            iSourceID: self.pageInfo.scene || 0,
            iSsid: self.pageInfo.ssid || 0,
            sGeneralId: general || '0',
            sExternInfo: exter || ''
        };
        // self.request({
        //     url:'https://game.weixin.qq.com/cgi-bin/h5/static/gamecenter/index.html?d=2',
        //     method:'POST',
        //     data: sess
        // })
        if (!sess.userId || sess.userId == 'nil') {
            self.nilReport.push(param);
            setTimeout(function () { self.delayReport(); }, 1000);
            return;
        } else {
            list = self.nilReport.splice(0, self.nilReport.length).concat(param);
        }
        r14359.batchCltStat(sess, list);
    },
    debug: Config.debug,
    mock: Config.mock,
    config: Config
})