var app = getApp();
Page({
    onReady: function(){},
    onShow: function(){
    },
    onLoad: function(res) {
        res = res || {};
        if(res && typeof(res)=='object' && res.vid){
            var pre  = 'https://qt.qq.com/php_cgi/cod_video/php/get_video_url.php?game_id=';
            var pra  = [res.game_id || '1007039', '&vid=', res.vid, '&source=weixin'];
            var data = {
                video_url: pre + pra.join(''),
                pic_url  : res.pic_url || ''
            };
            this.setData(data);
        }else{
            wx.showModal({
                title   : '温馨提示',
                content : '无效的视频',
                showCancel : false,
                complete : function(rs){
                    wx.navigateBack({delta:1});
                }
            });
        }
    }
})