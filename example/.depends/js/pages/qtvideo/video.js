var Txv = require("js/libs/WechatAppPlayer/index");
var app = getApp();

Page({
    onLoad: function (res) {
        var that = this;
        var vid  = res.vid || 's0173c7vsed'; 
        wx.showNavigationBarLoading();
        if(res.vid_url){
            that.setData({tvpUrl: decodeURIComponent(res.vid_url)})
            return;
        }
        // 创建视频生命周期
        that.video = Txv({vid:vid,cid:'',pid:''}, {
            from: 'v4158', // 平台号，我们需要根据这个值检测播放情况，请务必找我们申请独立平台号
            getReportParam : function(cb){
                cb(null, {
                    hc_openid : app.session.userId,
                    rmd: new Date().getTime()
                })
                return '';
            }
        });
        that.video.on('contentchange', function(contents){
            if (!contents.currentContent) {return;}
            var content = contents.currentContent;
            console.log(content);
            that.setData({
                tvpUrl: content.url || content._url[content._urlIndex]
            })
            wx.hideNavigationBarLoading();
        });
        that.video.on('error', function(err){
            wx.showModal({title:'温馨提示',content:'视频播放出错'+err})
            wx.hideNavigationBarLoading();
        })
    },
    onUnload() {
        this.video && this.video.stop();
    },
    // 小程序video元素事件
    onTvpPlay: function () {
        this.video && this.video.onContentPlay()
    },
    onTvpPause: function () {
        this.video && this.video.onContentPause()
    },
    onTvpEnded: function () {
        this.video && this.video.onContentEnd()
    },
    onTvpTimeupdate: function (e) {
        this.video && this.video.onContentTimeupdate(null, e)
    },
    onTvpError: function (e) {
        if (
            +e.currentTarget.dataset.contentid == -1 ||
            e.detail.errMsg.indexOf('updateVideoPlayer') != -1 // 兼容微信的这个不该成为错的错
        ) {
            return;
        }
        this.video && this.video.onContentError(null, e)
    }
});