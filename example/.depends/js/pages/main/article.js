var app  = getApp();
var tool = require('./article.data.process');
var util = require('js/common/util');
Page({
    onLoad: function(res) {
        var self = this;
        if(res && typeof(res)=='object'){
            self.pageQuery = res;
        }
        self.setData({show_loading:true});
        self.loadData();
    },
    onShow: function(){
        //app.report(area, pos, action, exter, general);
        app.report(404, 0, 1);
    },
    loadData: function(){
        var self = this;
        var reqs =  {};
        if(app.nextPageInfo){
            reqs = app.nextPageInfo;
        }
        self.is_loading = true;
        wx.showNavigationBarLoading();
        app.request({
            url     : 'https://game.weixin.qq.com/cgi-bin/gameweappwap/getguideinfo?appid='+app.config.game_appid,
            method  : 'POST',
            data    : {page_info:reqs},
            success : function(res){
                res = res || {};
                if(res && res.errcode == 0){
                    var data = tool.processData(res, self.block_list||[]);
                    self.block_list = data.block_list || [];
                    data.show_loading = false;
                    self.setData(data);
                    if(data.next_page_info){
                        app.nextPageInfo = data.next_page_info || {};
                    }
                }
            },
            fail : function(res){
                res = res || {};
                wx.showModal({
                    title      : '出错啦',
                    content    : '数据加载失败 '+(res && 'errcode' in res ? res.errcode:''),
                    showCancel : false
                });
            },
            complete: function(){
                self.is_loading = false;
                wx.hideNavigationBarLoading();
            }
        })
    },
    onReachBottom: function(evt){
        var self = this;
        if(self.is_loading){
            setTimeout(function _rcb(){
                if(self.is_loading){
                    setTimeout(_rcb, 200);
                }else{
                    self.nextPage();
                }
            },200);
            return;
        }
        self.nextPage();
    },
    nextPage : function(){
        var self = this;
        self.loadData();
    },
    previewThumb: function(evt){
        var data = util.dataset(evt);
        if(data.topic_id){
            var imgs = tool.getTopicImages(data.topic_id);
            if(data.type == 'img' && wx.previewImage && imgs.length>0){
                app.report(404, 3, 2);
                wx.previewImage({
                    current: data.url,
                    urls   : imgs
                })
            }else if(data.type=='video' && data.vid){
                tool.processVideoJump(data)
            }
        }
    },
    goTopic: function(evt){
        var data = util.dataset(evt);
        var url = [
            'https://game.weixin.qq.com/cgi-bin/h5/static/community/club_detail.html?',
            'appid=' + app.config.game_appid + '&jsapi=1',
            '&topic_id='+data.topic_id,
            '&topic_type=0',
            '#wechat_redirect'
        ].join('');
        if(data.url){url = data.url;}
        //app.report(area, pos, action, exter, general);
        var exter = {
            topic_id: data.topic_id,
            type: data.type,
        }
        var giftid = '';
        var gtypes = {qt:1,live:2}
        if(data.type){
            giftid = data.type in gtypes ? gtypes[data.type] : '';
        }
        app.report(404, data.pos, data.act, JSON.stringify(exter), '', giftid);
        setTimeout(function(){app.jumpToUrl(url);},300);
    },
    goUrl: function(evt){
        var data = util.dataset(evt);
        //app.report(area, pos, action, exter, general);
        var exter = {};
        var giftid = '';
        var gtypes = {qt:1,live:2}
        if(data.topic_id){exter.topic_id = data.topic_id;}
        if(data.type){
            exter.type = data.type;
            giftid = data.type in gtypes ? gtypes[data.type] : '';
        }
        app.report(404, data.pos, data.act, JSON.stringify(exter),'', giftid);
        if(data.type == 'live'){this.goLive(evt); return;}
        if(data.url){
            setTimeout(function(){app.jumpToUrl(data.url);},200);
        }
    },
    goLive: function(evt){
        var data = util.dataset(evt);
        console.log('goLive', data);
        if(wx.navigateToMiniProgram){
            wx.navigateToMiniProgram({
                appId: 'wx98bb879bbb53ad81',
                path: 'pages/room/room?ssid=29&wxid='+data.vid+'&gameid='+app.config.game_appid,
                extraData:{wxid:data.vid,gameid:+app.config.game_appid}
            })
        }
    },
    onShareAppMessage: function(){
        var self = this;
        app.report(404, 999, 10);
        return {
            title: '王者荣耀大神攻略',
        }
    }
})
