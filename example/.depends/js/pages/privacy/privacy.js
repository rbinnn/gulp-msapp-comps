var app = getApp();
Page({
    onLoad: function(res){
        var self = this;
        try{app.processOnloadQuery(res||{});}catch(e){}

    },
    onShow: function(){
        var self = this;
        app._privacyQuery = app._privacyQuery || {};
        wx.showNavigationBarLoading();
        /*app.checkLogin(function(res){
            if(res.errcode == app.net.OK){
                self.loadData({});
            }
        });*/
        self.loadData({});
    },
    showTips : function(msg, cbk){
        var data = {
            content      : msg,
            showCancel   : false,
            confirmText  : "知道了",
            confirmColor : "#18B924",
        };
        if(typeof(cbk) == 'function'){; 
            data.success = function(res){
                if(res.confirm){cbk();}
            };
        }
        wx.showModal(data);
    },
    _dataset : function(evt){
        var dataset = evt && evt.currentTarget && evt.currentTarget.dataset ?
            evt.currentTarget.dataset : (evt && evt.target && evt.target.dataset 
                ? evt.target.dataset : {});
        return dataset;
    },
    goGameDetail : function(evt){
        var data = this._dataset(evt);

        app._privacyQuery.gameset_appid = data.appid;
        wx.navigateTo({url:'./gameset'});
    },
    goVideoIntro: function(){
        wx.navigateTo({url:'./gameguru'})
    },
    setFlag : function(evt){
        var data = this._dataset(evt);
        var flag = evt.detail.value;
        var param= {};
        param[data.flag] = !flag;
        wx.showNavigationBarLoading();
        this.sendFlag(param); 
    },
    getData : function(cgi, param, cbk, header){
        var self =this;
        var url  = 'https://game.weixin.qq.com/cgi-bin/gamewap/'
                 + cgi
                 + '?auth_type=8'
                 + '&session_id=' + app.session.session_id;
        app.request({
            url : url,
            data: param,
            method: 'POST',
            header: header || {},
            success : function(res){
                if(typeof(cbk)=='function'){
                    cbk(res)
                }
            }
        })
    },
    loadData: function(param){
        var self = this;
        var header = {'content-type': 'application/x-www-form-urlencoded'};
        self.getData('getplayedgamelist', param, function(res){
            self.setData(res);
            if(res.language_conf && res.language_conf.title){
                wx.setNavigationBarTitle({title:res.language_conf.title});
            }
            wx.hideNavigationBarLoading();
        }, header);
    },
    sendFlag : function(param){
        var self = this;
        var data = {set_global_flag:param};
        var header = {'content-type': 'application/x-www-form-urlencoded'};
        self.getData('gamemanage', JSON.stringify(data), function(res){
            if(res && res.errcode == 0){
                for(var k in param){
                    self.data.global_flag[k] = param[k];
                }
                app.need_showLoading = true;
                app.need_taskLoading = true;
                app.need_trendLoading= true;
            }else{
                for(var k in param){
                    self.data.global_flag[k] = !param[k];
                }
                self.showTips('设置失败，请稍候重试('+res.errcode+')');
            }
            wx.hideNavigationBarLoading();
            self.setData(self.data);
        }, header);
    }
});