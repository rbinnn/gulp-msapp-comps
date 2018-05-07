var giftItems = {};
module.exports = {
    supportModals : [
        'daily', 'accumulation',  'start', 'banner',
        'task',  'care', 'level', 'new',   'login',  'download', ''
    ].join('Model,'),
    processData: function(data, sysObj){
        this.res    = {};
        this.sysObj = sysObj;
        var res = '{}';
        if(data.gift_info){
            try{
                res = decodeURIComponent(data.gift_info);
            }catch(e){
                res = '{}';
                console.error('decode error', e);
            }
            try{
                res = JSON.parse(res);
            }catch(e){
                console.error('json error', e);
                res = {};
            }
            this.res = this.processSeqItems(res);
            this.res.giftItems = giftItems;
        }
        return this.res;
    },
    updateGiftStatus: function(states){
        var models = this.show_models;
        for(var i=0,il=models.length;i<il;i++){
            var gift = models[i].gift || [];
            if(gift && gift.length>0){
                for(var j=0,jl=gift.length;j<jl;j++){
                    if('giftid' in gift[j]){
                        var giftid = gift[j].giftid;
                        if(giftid in states){
                            models[i].gift[j].state = states[giftid];
                        }
                    }
                }
            }
        }
        // 以备第二次更新礼包状态更新之用
        this.show_models = models;
        return models;
    },
    processGiftStates: function(res){
        if(res && res.errcode == 0){
            var states = {};
            var data   = res.data       || {};
            var list   = data.body_list || [];
            for(var i=0,il=list.length;i<il;i++){
                states[list[i].id] = list[i].state;
            }

            return states;
        }else{
            return false;
        }
    },
    processSeqItems: function(res){
        var rets = {
            show_models  : [],
            sequenceData : [],
            giftids      : [],
        };
        if(res.topData && this.isRightPlatform(res)){
            rets.topData = res.topData;
        }
        this.processModalJumpUrl(res);
        if(res.dailyModel){
            this.dailyModal = res.dailyModel;
        }
        var list = res.sequenceData;
        if('dailyModel' in res && res.dailyModel.gift && res.dailyModel.gift.length == 7){
            list.unshift('dailyModel');
            rets.dailyModel = res.dailyModel;
        }
        for(var i=0,il=list.length;i<il;i++){
            var key  = list[i];
            var item = res[key] || {};
            if(!this.isValidItem(key, item)){continue;}
            for(var j=item.gift.length-1;j>=0;j--){
                var gift = item.gift[j];
                if('giftid' in gift){
                    item.gift[j].state = 1;
                    rets.giftids.push(gift.giftid-0);
                    giftItems[gift.giftid] = gift;
                }
            }
            item.name = key;
            rets.show_models.push(item);
            rets.sequenceData.push(key);
        }
        this.show_models = rets.show_models;
        return rets;
    },
    processModalJumpUrl: function(res){
        if(res.startModel){
            res.startModel.url = 'https://game.weixin.qq.com/cgi-bin/actnew/lunchprivilege?appid='+app.config.game_appid+'&jsapi_ticket=1#wechat_redirect';
        }
    },
    updateDailySignStatus: function(sign, states){
        var self   = this;
        var modals = this.show_models;
        var modal  = {};
        var index  = -1;
        for(var i=0,il=modals.length;i<il;i++){
            if(modals[i].name == 'dailyModel'){
                modal = modals[i];
                index = i;
                break;
            }
        }
        if(modal && modal.gift){
            var gifts  = modal.gift || {};
            var max_cnt = sign.weekly_count + (sign.today_sign?0:1);
            var got_cnt =0;
            for(var i=0,il=gifts.length;i<il;i++){
                var gift = gifts[i];
                var sday = gift.sign_days || (i+1);
                if(states[gift.giftid]==3){
                    got_cnt++;
                }
                else if(states[gift.giftid] == 2 && sday <= max_cnt){
                    modal.giftid = gift.giftid;
                    modal.state  = 2;
                    break;
                }
            }
            if(got_cnt==sign.weekly_count && got_cnt>0 && sign.today_sign){
                modal.state  = 3;
                modal.giftid = '';
            }
            for(var k in sign){modal[k] = sign[k];}
            modals[index] = modal;
            this.show_models = modals;
            return modals;
        }
        return false;
    },
    isValidItem: function(key, item){
        if(this.supportModals.indexOf(key+',')==-1){
            return false;
        }
        if(('start_time' in item || 'end_time' in item) && !this.inTimeRange(item.start_time, item.end_time)){
            return false;
        }
        if(!('gift' in item) || !(item.gift instanceof Array) || item.gift.length < 1){
            return false;;
        }
        return true;
    },
    isRightPlatform: function(modal){
        var self  = this;
        var sobj  = this.sysObj;
        var iplat = sobj.system.toLowerCase() == 'ios' ? 1 : 2;
        var splat = sobj.system.toLowerCase() == 'ios' ? 'ios' : 'android';
        if('platform' in modal && modal.platform != '0' && modal.platform !='android_ios'){
            var rplat = modal.platform;
            if(rplat!=iplat && rplat != splat){
                return false;
            }
        }
        return true;
    },
    inTimeRange: function(sd, ed){
        var dt = new Date().getTime();
        var st = sd ? new Date(sd.replace(/-/g,'/').substr(0,10)+' 00:00:00').getTime() : false;
        var et = ed ? new Date(ed.replace(/-/g,'/').substr(0,10)+' 23:59:59').getTime() : false;
        if(st && et){
            return dt>=st && dt<=et;
        }else if(st){
            return dt>=st;
        }else if(et){
            return dt<=et;
        }else{
            return false;
        }
    }
}