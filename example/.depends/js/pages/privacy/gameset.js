var app = getApp();
Page({
    onLoad: function(res){
        var self = this;
        try{app.processOnloadQuery(res||{});}catch(e){}
    },
    onShow: function(){
        var self = this;
        wx.showNavigationBarLoading();
        /*app.checkLogin(function(res){
            if(res.errcode == app.net.OK){
                self.loadData({
                    appid: app._privacyQuery.gameset_appid
                });
            }
        });*/
        self.loadData({
            appid: app._privacyQuery.gameset_appid
        });
    },
    showTips : function(msg, title, cbk, showCancel){
        var data = {
            content      : msg,
            showCancel   : false,
            confirmText  : "知道了",
            confirmColor : "#18B924",
        };
        if(typeof(cbk) == 'function'){; 
            data.showCancel  = showCancel != undefined ? showCancel : true;
            data.confirmText ='确定';
            data.cancelText  ='取消';
            if(title){
                data.title = title;
            }
            data.success = function(res){
                if(res.confirm){cbk();}
            };
        }
        wx.showModal(data);
    },
    goGameRecord : function(evt){
        console.log(evt);
        wx.navigateTo({url:'./gamerec'})
    },
    _dataset : function(evt){
        var dataset = evt && evt.currentTarget && evt.currentTarget.dataset ?
            evt.currentTarget.dataset : (evt && evt.target && evt.target.dataset 
                ? evt.target.dataset : {});
        return dataset;
    },
    setFlag : function(evt){
        var data = this._dataset(evt);
        var flag = evt.detail.value;
        var extr = data.extra || '';
        var param= {appid:app._privacyQuery.gameset_appid};
        param[data.flag] = flag ? 0 : 1;
        if(extr){param[extr]=flag ? 0 : 1;}
        this.sendFlag(param); 
    },
    cancelBind : function(){
        var self = this;
        if(self.is_canceling){return;}
        var msg  = self.data.release_license    || '是否确定解除该游戏授权';
        var titl = self.data.cancel_association || '取消游戏关联';
        var data = {"appid":app._privacyQuery.gameset_appid, "correlation":1};
        self.showTips(msg, titl, function(){
            self.is_canceling = true;
            self.getData('gamemanage',JSON.stringify(data), function(res){
                self.is_canceling = false;
                self.showTips(titl+'成功', false, function(){
                    wx.navigateBack({delta:1});
                }, false);
            })
        });
    },
    getData : function(cgi, param, cbk, method){
        var self =this;
        var url  = 'https://game.weixin.qq.com/cgi-bin/gamewap/'
                 + cgi
                 + '?auth_type=8'
                 + '&session_id=' + app.session.session_id;
        app.request({
            url : url,
            data: param,
            method: method || 'POST',
            header: {'content-type': 'application/x-www-form-urlencoded'},
            success : function(res){
                if(typeof(cbk)=='function'){
                    cbk(res)
                }
            }
        })
    },
    loadData: function(param){
        var self = this;
        self.getData('getplayedgameinfo', param, function(res){
            // res.is_wzry = true || app._privacyQuery.gameset_appid == app.net.WZRY;
            self.setData(res);
            wx.hideNavigationBarLoading();
        }, 'GET');
    },
    sendFlag : function(data){
        var self = this;
        wx.showNavigationBarLoading();
        self.getData('gamemanage', JSON.stringify(data), function(res){
            if(res.errcode != 0){
                for(var k in data){
                    if(data[k]==0||data[k]==1){
                        data[k] = data[k] == 0 ? 1 : 0;
                    }
                }
                self.showTips('设置失败，请稍候重试('+res.errcode+')');
            }else{
                app.need_showLoading = true;
                app.need_taskLoading = true;
                app.need_trendLoading= true;
            }
            if('block_feed' in data){
                self.data.app_flag.block_feed = data.block_feed;
            }else{
                self.data.receive_msg = data.receive_msg;
            }
            self.setData(self.data);
            wx.hideNavigationBarLoading();
        });
    }
});