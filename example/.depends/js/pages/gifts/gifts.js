var app  = getApp();
var util = require('js/common/util');
var tool = require('./gifts.data.process');
var Rg   = require('js/components/region/region');
var Md   = require('js/components/modal/modal');
/*
    Url=/cgi-bin/gameweappwap/getgiftinfo
    Url=/cgi-bin/gameweappwap/getguideinfo
    Url=/cgi-bin/gameweappwap/getmainpageinfo
    Url=/cgi-bin/gameweappwap/giftdealtask
    Url=/cgi-bin/gameweappwap/giftsignin
    Url=/cgi-bin/gameweappwap/giftgettasklist
    Url=/cgi-bin/gameweappwap/giftcheckregister
*/
Page({
    gLaunch: 'https://game.weixin.qq.com/cgi-bin/h5/static/gamecenter/gamelauncher.html?appid='+app.config.game_appid,
    onLoad: function(){
        var self = this; 
        Md.initModal(self);
        self.initRegion();
        self.setData({show_loading:true});
        var store = util.getKeyValue('_gifts_data');
        if(store){self.renderData(store);}
    },
    onShow: function(){
        var self = this;
        if(self.gifts_loaded){
            self.checkStatus(self.giftData);
        }else{
            self.loadTasks();
        }
        //app.report(area, pos, action, exter, general);
        app.report(405,0,1);
        wx.showNavigationBarLoading();
    },
    launchGame: function(){
        var self = this;
        app.report(405, 4, 2);
        setTimeout(function(){
            app.jumpToUrl(self.gLaunch+'#wechat_redirect');
        },200)
    },
    getGift : function(evt){
        var self = this;
        var data = util.dataset(evt);
        if(
            self.is_getting_gift 
            || self.is_loading_state 
            || self.is_geting_sign
            || data.state == 3
        ){
            return;
        }
        if(!self.is_register){
            wx.showModal({
                title:'温馨提示',
                content:'你还未玩过游戏',
                showCancel:false
            });
            return;
        }
        app.report(405,2,2);
        self.lastEvt = evt;
        // if(Rg.lastRoleShown()){
        //     if(data.actid){
        //         self.signThenGet(data);
        //     }else{
        //         self.receiveGift(data);
        //     }
        // }else{
            Rg.showSelectRegion();
        // }
    },
    goUrl : function(evt){
        var self = this;
        var data = util.dataset(evt);
        //app.report(area, pos, action, exter, general);
        app.report(405, data.pos, data.act);
        app.jumpToUrl(data.url);
    },
    goGiftDetail: function(evt){
        var url = 'https://game.weixin.qq.com/cgi-bin/h5/static/libao/detail.html?id=';
        var data = util.dataset(evt);
        //app.report(area, pos, action, exter, general);
        app.report(405, 1, 6);
        app.jumpToUrl([url,data.giftid,'#wechat_redirect'].join(''));
    },
    showTips: function(evt){
        var data = util.dataset(evt);
        Md.showModal({
            content: data.tips,
            align: 'justify',
            showCancel: false
        })
    },
    loadTasks: function(){
        var self = this;
        app.request({
            url:'https://game.weixin.qq.com/cgi-bin/gameweappwap/getgiftinfo?auth_type=8&appid='+app.config.game_appid,
            method:'POST',
            success:function(res){
                // res = require('./gift.data');
                self.renderData(res);
                if(res && res.errcode==0){
                    util.setKeyValue('_gifts_data', res);
                }
                wx.hideNavigationBarLoading();
            },
            fail: function(rs){
                var res = util.getKeyValue('_gifts_data');
                //  res = require('./gift.data');
                if(res){
                    self.renderData(res);
                }else{
                    wx.showModal({
                        title     : '出错啦',
                        content   : '数据加载失败，请重试 -' + (rs && 'errcode' in rs ? rs.errcode:''),
                        showCancel:  false
                    })
                }
                wx.hideNavigationBarLoading();
            }
        });
    },
    renderData: function(res){
        var self = this;
        res = res || {};
        if(res && res.errcode == 0){
            util.getReportObj(function(sysObj){
                var data        = tool.processData(res.data, sysObj);
                self.giftids    = data.giftids;
                self.giftItems  = data.giftItems;
                self.giftData   = data;
                delete data.giftids;
                delete data.giftItems;
                self.renderDetails(data);
                self.checkStatus(data);
            });
        }else{
            wx.showModal({
                title      : '出错啦',
                content    : '数据加载失败，请重试 -' + (res && 'errcode' in res ? res.errcode:''),
                showCancel : false
            })
        }
    },
    renderDetails: function(data){
        var self = this;
        data.show_loading = false;
        self.setData(data);
    },
    initRegion: function(evt){
        var self = this;
        if(!self._initRegion){
            self._initRegion = 1;
            Rg.init(self, {
                session_id : app.session.sessionId,
                confirmText:'确认领取',
                confirmCBK : function(res){
                    self.selectedRoleCBK(self.lastEvt, res);
                }
            });
        }
    },
    selectedRoleCBK: function(evt, role){
        var self = this;
        var data = util.dataset(evt);
        if(self.is_getting_gift || self.is_loading_state || self.is_geting_sign){return}
        self.lastRole = role;
        if(data.actid){
            self.signThenGet(data);
        }else{
            self.receiveGift(data);
        }
    },
    signThenGet: function(param){
        var self = this;
        if(param.state == 2 && self.signState.today_sign){
            self.receiveGift(param);
        }else{
            param.cmd = 'sign';
            param.cbk = function(res){
                if(res && res.errcode == 0){
                    var data = res.data || {};
                    if(data.week_get_rsp){
                        for(var k in data.week_get_rsp){
                            self.signState[k] = data.week_get_rsp[k];
                        }
                    }
                    var models = tool.updateDailySignStatus(self.signState, self.giftStates);
                    if(models){
                        self.setData({show_models:models});
                    }
                    delete param.cbk;
                    delete param.cmd;
                    self.receiveGift(param);
                }else{
                    wx.showModal({
                        title:'签到失败',
                        content:'签到失败，请稍候再试 -'+(res && 'errcode' in res ? res.errcode:''),
                        showCancel: false
                    });
                }
            };
            self.signRequest(param)
        }
        // self.is_getting_gift = true;
    },
    signRequest: function(param){
        var self = this;
        self.is_geting_sign = true;
        app.request({
            url:'https://game.weixin.qq.com/cgi-bin/gameweappwap/giftsignin?appid='+app.config.game_appid,
            method:'POST',
            data : {
                actid: param.actid,
                limit: 3,
                appid: app.config.game_appid,
                cmd  : param.cmd
            },
            success  : function(res){
                if(param.cbk){
                    param.cbk.call(self, res);
                }
            },
            complete:function(){
                self.is_geting_sign = false;
            }
        });
    },
    receiveGift: function(param){
        var self = this;
        self.is_getting_gift = true;
        util.getReportObj(function(sysObj){
            app.request({
                url    : 'https://game.weixin.qq.com/cgi-bin/gameweappwap/giftdealtask?auth_type=8&appid='+app.config.game_appid,
                method : 'POST',
                data   : {
                    task_id: param.giftid-0,
                    appid  : app.config.game_appid,
                    plat_id: sysObj.system.toLowerCase().indexOf('ios')!=-1?0:1
                },
                success: function(res){
                    var msg = self.giftItems[param.giftid] || {};
                    if(res && res.errcode==0){
                        wx.showModal({
                            title      : '领取成功',
                            content    :  msg.succ || '领取成功，请去游戏内查收',
                            cancelColor: '#666666',
                            confirmText: '进入游戏',
                            complete   : function(rs){
                                if(rs.confirm){self.launchGame();}
                            }
                        });
                        self.checkStatus(self.giftData);
                        app.report(405,3,20);
                    }else{
                        wx.showModal({
                            title      : '领取失败',
                            content    : (msg.fail || '领取失败，请稍候重试') ,//+' '+(res && 'errcode' in res ? res.errcode : ''),
                            cancelColor: '#666666',
                            confirmText: '进入游戏',
                            complete   : function(rs){
                                if(rs.confirm){self.launchGame();}
                            }
                        })
                    }
                },
                fail: function(res){
                    wx.showModal({
                        title      : '领取失败',
                        content    : '领取失败，请稍候重试 :'+(res && 'errcode' in res? res.errcode : ''),
                        confirmText: '进入游戏',
                        cancelColor: '#666666',
                        complete   : function(rs){
                            if(rs.confirm){self.launchGame();}
                        }
                    })
                    console.error(res);
                },
                complete: function(res){
                    self.is_getting_gift = false;
                }
            })
        });
    },
    checkStatus: function(data){
        var self = this;
        self.updateTaskStatus(self.giftids, data);
        self.checkRegister();
    },
    checkSignStatus: function(data, states){
        var self = this;
        if(!data.dailyModel){return;}
        self.signState = {};
        self.signRequest({
            actid : data.dailyModel.actid,
            cmd   : 'weekget',
            cbk   : function(res){
                if(res && res.errcode == 0){
                    var data = res.data || {};
                    if(data.week_get_rsp){
                        for(var k in data.week_get_rsp){
                            self.signState[k] = data.week_get_rsp[k];
                        }
                    }
                    var info = tool.updateDailySignStatus(self.signState, states);
                    if(info){
                        self.setData({show_models:info});
                    }
                }
                
            }
        })
    },
    updateTaskStatus: function(ids, data){
        var self = this;
        self.is_loading_state = true;
        app.request({
            url    :'https://game.weixin.qq.com/cgi-bin/gameweappwap/giftgettasklist?auth_type=8&j=1&appid='+app.config.game_appid,
            method:'POST',
            data   :{idlist: ids},
            success: function(res){
                var states = tool.processGiftStates(res);
                if(states){
                    self.giftStates = states;
                    var show_models = tool.updateGiftStatus(states);
                    self.setData({show_models:show_models});
                    self.checkSignStatus(data, states);
                }
            },
            fail : function(res){},
            complete: function(res){
                self.is_loading_state = false;
            }
        })
    },
    checkRegister: function(){
        var self = this;
        if(self.register_checked){return;}
        app.request({
            url:'https://game.weixin.qq.com/cgi-bin/gameweappwap/giftcheckregister?auth_type=8&appid='+app.config.game_appid,
            method:'POST',
            success: function(res){
                var data = {};
                if(res && res.errcode==0){
                    data = res.data;
                    self.register_checked = true;
                    self.is_register   = data.is_register || false;
                    self.reg_timestamp = data.timestamp   || 0;
                }
            }
        })
    },
    onShareAppMessage: function(){
        var self = this;
        app.report(405, 999, 10);
        return {
            title: '点击领取王者礼包',
        }
    }
})