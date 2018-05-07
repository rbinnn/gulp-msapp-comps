// addy 2017-8-1
var App     = getApp();

// 这里缓存，如果进出两个不同的会话，不知道会怎样，待验证
var cacheShareInfo;

module.exports = {
    /* 对外的接口
        如果有效票据，则会回传加密数据，mode：分享模式,2:单聊，3：群聊
        callback({iv: 'xxx', encryptedData: 'xxx'}, mode)
    */
    getShareData(callback, config){
        /*config: {
            shareTicket: '',
            do_not_use_cache: true
        }*/
        config = config || {};

        var that = this;

        console.log('shareTicket:' + App.pageInfo.shareTicket);
        // debug 模式，这个走不通，直接return
        if(App.debug){
            callback && callback({}, 2);
            return;
        }
        // 如果有缓存，并且没有强制要去用新的
        if(cacheShareInfo && !config.do_not_use_cache){
            callback && callback(cacheShareInfo, 2);
            return;
        }

        var shareTicket;
        // 参数含有票据，来自主动分享的回调。
        if(config.shareTicket){
            shareTicket = config.shareTicket;
        }else{
            // 单聊无shareTicket，直接return。某些APP，单聊有shareTicket，继续走
            if(!App.pageInfo.shareTicket && App.pageInfo.scene == '1007'){
                callback && callback({}, 2);
                return;
            }

            // 群聊无shareTicket
            if(!App.pageInfo.shareTicket && App.pageInfo.scene == '1044'){
                wx.showModal({
                    title: '错误',
                    content: '无效的分享，请退出重试',
                    showCancel:false
                });
                return;
            }
            shareTicket = App.pageInfo.shareTicket;
        }
        
        this.getShareDataByTicket(shareTicket, callback);
        
    },
    getShareDataByTicket(shareTicket, callback){
        if(wx.getShareInfo){
            var start = Date.now();

            wx.getShareInfo({
                shareTicket: shareTicket,
                success: function(data){
                    // 此接口不能频繁调用，需临时缓存
                    cacheShareInfo = data;
                    console.log(Date.now() - start)
                    callback && callback(data, 3);
                },
                fail: function(res){
                    // 单聊
                    if(+res.err_code === -12008){
                        callback && callback({}, 2);
                        return;
                    }

                    wx.showModal({
                        title: '提示',
                        content: JSON.stringify(res),
                        showCancel:false
                    });
                }
            })
        }else{
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
            });
        }
    },
    setShareMenu(){
        if (wx.showShareMenu) {
            wx.showShareMenu({
                withShareTicket: true
            });
        } else {
            wx.showModal({
                title: '提示',
                content: '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。'
            })
        }
    }
}