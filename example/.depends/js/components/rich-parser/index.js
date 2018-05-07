import HtmlToJson from './libs/html2json.js';
import Txv from "../WechatAppPlayer/index";

Component({
    properties: {
        html: {
            type: String,
            value: "",
            observer: function(newVal, oldVal) {
                if( newVal && newVal !== oldVal ) {
                    this.parse(newVal)
                }
            }
        }
    },
    data: {
        content: {}
    },
    methods: {
        parse(html) {
            var transData = {}
            html = this.parseVideo(html)
            transData = HtmlToJson(html, 'rich-parser')
            // 解析html成json事件完成
            this.triggerEvent("parsed")
            console.log(transData)
            // return
            this.setData({
                content: transData
            }, () => {
                // 渲染时间完成
                this.triggerEvent("rendered")
            })
            this.fetchVideo(transData.vids)
        },

        parseVideo(html) {
            var videos = this.findVideoSrc(html)
            this.vids = []
            videos.forEach(url => {
                var vid;
                if( url.indexOf("http") > -1 ) {
                    vid = this.getVidFromUrl(url)
                }else {
                    vid = url
                }
                html = html.replace(url, `<video data-vid='${vid}'></video>`)
                this.vids.push(vid)
            })
            return html
        },

        fetchVideo(vids) {
            var that = this
            var len = vids.length
            vids.forEach((vidInfo, index) => {
                if( index === len - 1 ) {
                    this.createVideo(vidInfo, function() {
                        // 解析vid事件完成
                        that.triggerEvent("parsedvideo")
                    })
                }else {
                    this.createVideo(vidInfo)
                }
            })
        },
 
        wxParseImgTap(e) {
            var nowImgUrl = e.target.dataset.src;
            wx.previewImage({
                current: nowImgUrl, // 当前显示图片的http链接
                urls: this.data.content.imageUrls // 需要预览的图片http链接列表
            })
        },

        findVideoSrc(content) {
            let list = [];
            let re = this.genVideoReg('ig');
            content = content.replace(re, function(input) {
                list.push(input);
                return "";
            });
            return list;
        },

        getVidFromUrl(url) {
            //先从url中分析出vid参数，例如×××××.html?vid=××××××
            var vid = getUrlParam("vid", url),
            r;

            function getUrlParam(p, u) {
                var u = u || document.location.toString();
                var pa = p + "=";
                var f = u.indexOf(pa);
                if (f != -1) {
                    var f2 = u.indexOf("&", f);
                    var f2p = u.indexOf("?", f);
                    if (f2p != -1 && (f2 == -1 || f2 > f2p))
                        f2 = f2p;
                    f2p = u.indexOf("#", f);
                    if (f2p != -1 && (f2 == -1 || f2 > f2p))
                        f2 = f2p;
                    if (f2 == -1)
                        return u.substring(f + pa.length);
                    else
                        return u.substring(f + pa.length, f2);
                }
                return "";
            }

            if (!vid) { // 使用新规则生成的专辑单视频页面
                if (r = url.match(/\/\w{15}\/(\w+)\.html/)) {
                    vid = r[1];
                }
            }
            // 单视频播放页
            if (!vid) {
                if (r = url.match(/\/page\/\w{1}\/\w{1}\/\w{1}\/(\w+)\.html/)) {
                    vid = r[1];
                } else if (r = url.match(/\/(page|play)\/+(\w{11})\.html/)) {
                    vid = r[2];
                }
            }
            // 播客专辑播放页
            if (!vid) {
                if (r = url.match(/\/boke\/gplay\/\w+_\w+_(\w+)\.html/)) {
                    vid = r[1];
                }
            }
            return vid
        },

        genVideoReg(pattern) {
            var strReg  = '(?:(?:http|https):\\/\\/)?'           // 匹配协议, 支持http和https, 不捕获该分组
                        + '(?:(?:m\\.)?v\\.qq\\.com\\/)'         // 匹配域名, 目前支持v.qq.com和m.v.qq.com, 不捕获该分组
                        + '(?:(?:cover|page|play)\\/)'           // 匹配域名后面的第一个路径, 可以是page, cover, play之中的任意一个, 不捕获该分组
                        + '(?:[A-Za-z0-9]\\/)?'                  // 匹配vid或者cid的第一位, 不捕获该分组, 为了兼容link4, 该分组可选, 不捕获该分组       
                        + '(?:(?:[A-Za-z0-9]\\/){2})?'           // 匹配用户自己上传的视频中带有的vid第九第十位, 不捕获该分组
                        + '([A-Za-z0-9]+)'                       // 匹配vid或者cid, 因为可能是vid, 所以捕获该分组
                        + '(?:\\/([A-Za-z0-9]+))?'               // 匹配link3情况, 在.html之前同时出现vid和cid的情况 
                        + '(?:\\.html)'                          // 匹配vid或cid之后跟随的.html
                        +'(?:(?:.*?)coverid=(?:[A-Za-z0-9]+)&)?' // 匹配link4中出现的coverid, 不捕获该分组
                        + '(?:(?:.*?)?(?:vid=)([A-Za-z0-9]+))?'; // 匹配link2中在html之后以参数形式呈现的vid    
            /*
             * 该正则捕获三个分组
             *      1. link1和link3中的vid分组
             *      2. link2和link4中的vid分组
             *      3. link3中的cid分组
             */
            return new RegExp(strReg, pattern || 'i');  
        },

        createVideo(vidInfo, lastVideoCb) {
            var vid = vidInfo.vid
            var pos = vidInfo.pos
            var that = this
            var video  = Txv(vid, {
    
                from: 'v4152', // 平台号，我们需要根据这个值检测播放情况，请务必找我们申请独立平台号
        
                // http://beehive.boss.webdev.com/bossid/myid/viewId?id=5895
                // 从第16个字段开始，都可以在这个函数中指定上报值
                getReportParam: function (cb) {
                    cb(null, {
                        hc_openid: '123',
                        rmd: 'hehe'
                    })
                }
            });

            function callback(url) {
                if( url ) {
                    var data = {}
                    pos.forEach(key => {
                        key = key.split(".").map(item => `.nodes[${item}]`).join("")
                        data[`content${key}.attr.src`] = url
                    })
                    that.setData(data)
                }
                if( lastVideoCb ) {
                    lastVideoCb()
                }
            }
            callback.hasCalled = false
    
            video.on('error', function (e) {
                console.error(e.stack);
                if( !callback.hasCalled ) {
                    callback.hasCalled = true;
                    callback();
                }
            });
        
            video.on('contentchange', content => {
                // 开播前会抛出一次没有currentContent的事件。有别的用意，此处不用处理
                if (!content.currentContent) {
                    return;
                }
                if( !callback.hasCalled ) {
                    callback.hasCalled = true;
                    callback(content.currentContent.url);
                }
            });
        },
    }
})