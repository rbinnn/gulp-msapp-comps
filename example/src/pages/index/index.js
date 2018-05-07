//index.js
//获取应用实例
var app  = getApp()
var util = require('js/common/util');
Page({
    data: {
        motto: 'Hello World',
        userInfo: {}
    },
    //事件处理函数
    bindViewTap: function() {
        wx.navigateTo({
            url: '../logs/logs'
        })
    },
    onLoad: function(res) {
        console.log('onLoad')
        var self = this;
        if(res && typeof(res)=='object'){
            self.pageQuery = res;
        }
        //调用应用实例的方法获取全局数据
        app.getUserInfo(function(userInfo) {
            //更新数据
            self.setData({
                userInfo: userInfo
            })
        })
    }
})