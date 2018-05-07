var Txv = require("js/libs/WechatAppPlayer/index.js");

Component({
    properties: {
      // 这里定义了innerText属性，属性值可以在组件使用时指定
      vid: {
        type: String,
        value: '',
        observer: function(newVal, oldVal){
            if( newVal ) {
                this.setVideoSrc(newVal);
            }
        }
      }
    },
    data: {
      // 这里是一些组件内部数据
      videoSrc: ""
    },
    methods: {
        setVideoSrc: function(vid) {
            this.createVideo(vid, url => {
                this.setData({
                    videoSrc: url
                })
            });
        },
        // 这里是一个自定义方法
        createVideo: function(vid, callback) {
            // this.video && this.video.stop();
            // 创建视频生命周期
            var video  = Txv(vid, {

                from: 'v4152', // 平台号，我们需要根据这个值检测播放情况，请务必找我们申请独立平台号
        
                // http://beehive.boss.webdev.com/bossid/myid/viewId?id=5895
                // 从第16个字段开始，都可以在这个函数中指定上报值
                getReportParam: function (cb) {
                    cb(null, {
                        hc_openid: '123',
                        rmd: 'hehe'
                    });
                }
            });

            video.on('error', function (e) {
                console.error(e.stack);
            });
        
            video.on('contentchange', content => {
                // 开播前会抛出一次没有currentContent的事件。有别的用意，此处不用处理
                if (!content.currentContent) {
                    return;
                }
        
                callback(content.currentContent.url);
            });
        },
    }
})