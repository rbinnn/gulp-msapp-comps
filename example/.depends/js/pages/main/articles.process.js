var imgDatas = {};
var topics   = {};
var app      = getApp();
module.exports = {
    processVideoJump: function(data){
        // enum VideoType {
        //     VIDEO_TYPE_TENCENT  = 0;  // 腾讯视频
        //     VIDEO_TYPE_QT       = 1;  // Qt视频
        //     VIDEO_TYPE_HUYA     = 2;  // 虎牙视频
        //     VIDEO_TYPE_CHUSHOU  = 3;  // 触手
        //     VIDEO_TYPE_DOUYU    = 4;  // 斗鱼
        //     VIDEO_TYPE_TX_CLOUD = 5;  // 腾讯云视频
        // }
        app.report(404, 3, 3);
        // 腾讯视频
        if(data.vtype=='0'){
            wx.navigateTo({url:'../video/video?vid='+data.vid})
        }
        // Qt视频
        else if(data.vtype=='1'){
            wx.navigateTo({url:'../video/qtvideo?vid='+data.vid})
        }
        // 虎牙 / 腾讯云视频
        else if((data.vtype=='2' || data.vtype=='5') && /^https?:\/\//i.test(data.vid)){
            wx.navigateTo({url:'../video/video?vid_url='+encodeURIComponent(data.vid)})
        }
        // 触手
        else if(data.vtype == '3'){
            app.jumpToUrl([
                'https://open.chushou.tv/open/video/',
                data.vid,
                '.htm?autoplay=0'
            ].join(''))
        }
    },
    processBlockList: function(list, start){
        start = isNaN(start) ? 0 : start;
        var strips = [];
        for(var i=0,il=list.length;i<il;i++){
            if(list[i].tpl_id==4){
                list[i].tpl = 'live_video';
            }else if(list[i].tpl_id == 2){
                list[i].tpl = 'qt_video';
            }else if(list[i].tpl_id == 1){
                list[i].tpl = 'community';
            }
            list[i].index = start + 10 + i;
            list[i] = this.processListItem(list[i]);
            if(list[i].topic_info){
                var tp = list[i].topic_info;
                if(tp.topic_id in topics){
                    strips.push(i);
                }
                tp.pic_list = tp.pic_list || [];
                if(!tp.brief_content && tp.pic_list.length==0){
                    strips.push(i);
                }
                topics[list[i].topic_info.topic_id] = 1;
            }
        }
        for(var i=strips.length-1;i>-1;i--){
            list.splice(strips[i],1);
        }
        return list;
    },
    getTopicImages: function(topic_id){
        if(topic_id in imgDatas){
            return imgDatas[topic_id];
        }else{
            return [];
        }
    },
    processListItem: function(item){
        var lis = [];
        if(item.topic_info){
            var topic = item.topic_info;
            var lst   = topic.preview_pic_url_list || [];
            var obj   = {cnt:0};
            var imgs  = [];
            item.pic_count = lst.length || 0;
            if(topic.video_list){
                var l = topic.video_list || [];
                for(var i=0,il=Math.min(l.length, 3);i<il;i++){
                    var t = l[i];
                    if(t.pic_url_list && t.pic_url_list.length>0){
                        lis.push({pic:t.pic_url_list[0],type:'video',vtype:t.type, vid:t.vid});
                        imgs.push(t.pic_url_list[0]);
                        obj[t.pic_url_list[0]] = 1;
                        if(t.title){
                            topic.title = t.title;
                            if(topic.brief_content==t.title){
                                topic.brief_content = '';
                            }
                        }
                    }
                    if(i==2){break;}
                }
            }
            imgs = imgs.concat(lst);
            var l = lst.splice(0, Math.max(0, 3-lis.length));
            for(var i=0,il=l.length;i<il;i++){
                if(l[i] in obj){obj.cnt++; continue;}
                lis.push({pic:l[i], type:'img',vtype:'',vid:''})
            }
            if(imgs.length>0 && topic.topic_id){
                imgDatas[topic.topic_id] = imgs;
            }
            if(obj.cnt>0){item.pic_count -= obj.cnt;}
            if(item.tpl_id==2){
                if(topic.video_list && topic.video_list.length>0){
                    for(var i=0,il=topic.video_list.length;i<il;i++){
                        var t = topic.video_list[i] || {};
                        var p = t.pic_url_list || [];
                        for(var j=0,jl=p.length;j<jl;j++){
                            if(p[j] && p[j].length>0){
                                item.topic_info.pic_url = p[j];
                                i = il + 1;
                                break;
                            }
                        }
                    }
                }else if(topic.preview_pic_url_list && topic.preview_pic_url_list.length>0){
                    item.topic_info.pic_url = topic.preview_pic_url_list[0];
                }
            }
        }
        item.pic_list = lis;
        return item;
    }
};