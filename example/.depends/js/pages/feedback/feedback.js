// 小程序反馈页面
var app     = getApp();
var sysInfo = wx.getSystemInfoSync();
var oStr    = require('js/common/string')
Page({
    radios: [
        '充值失败',
        '账号异常',
        '欺诈赌博',
        '恶意营销',
        '色情',
        '诱导分享',
        '骚扰',
        '违法犯罪',
        '侵权（冒名／诽谤／抄袭）',
        '隐私信息收集',
        '其他',
        '游戏推荐',
        '游戏排行榜',
        '游戏圈',
    ],
    submitData: {
        surveyid: 1,
        sourcescene: app.config.feedback.sourcescene,
        appid: app.config.appid,
        phone: '',
        type: '小程序',
        content: ''
    },
    onLoad: function(res) {
        this.submitData.device = sysInfo.system.indexOf('iOS') !== -1 ? 'iphone' : 'android';
        this.setData({radios: this.radios})
    },
    onShow: function() {},
    contentIsOK: function(evt) {
        var val = evt.detail.value;
        console.log(evt);
        this.submitData.content = val.replace(/[<>\'\"\s]+/gi, ' ').replace(/\s+/g, ' ');
    },
    phoneIsOK: function(evt) {
        var val = evt.detail.value;
        this.submitData.phone = val.replace(/[<>\'\"]+/gi, '');
    },
    getFeedType: function(evt){
        var val = evt.detail.value;
        this.submitData.rating = val.replace(/[<>\'\"]+/gi, '');
    },
    collectData: function() {
        var len = this.submitData.content.length;
        if (this.is_sending) {
            return;
        }
        if(!this.submitData.rating){
            this.showTips('请选择小程序中遇到的问题');
            return;
        }
        if (len >= 3) {
            this.is_sending = true;
            this.sendFeedBack(this.submitData);
        } else {
            this.showTips('具体描述必填，至少3个字');
        }
    },
    showTips: function(msg, cbk) {
        var data = {
            content: msg,
            showCancel: false,
            confirmText: "知道了",
            confirmColor: "#18B924",
        };
        if (typeof(cbk) == 'function') {;
            data.success = function(res) {
                if (res.confirm) {
                    cbk();
                }
            };
        }
        wx.showModal(data);
    },
    sendFeedBack: function(data) {
        var self = this;
        var url = 'https://game.weixin.qq.com/cgi-bin/comm/feedback' + '?auth_type=8';
        app.request({
            url: url,
            data: oStr.mapToStr(data),
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            success: function(res) {
                self.is_sending = false;
                if (res && res.ret == 0) {
                    self.showTips('提交成功，感谢你的付出！', function() {
                        wx.navigateBack({
                            delta: 1
                        });
                    });
                } else {
                    self.showTips('提交失败，请稍候重试(' + res.ret + ')');
                }
            }
        })
    }
});