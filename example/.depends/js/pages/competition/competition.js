import {homeNetwork, homePageNetwork } from './common/api.js';
import {Promise, errorAlert, getValue, extend, getUniqueRooms, Report, getAnchorType } from './common/util.js';
import {HOMETOPROOMSNUM, MAXTYPENUM, ADMAXPOSITION } from './common/config.js'; // 页面组件
import {WgVideo } from '/components/wgvideo/wgvideo';
import {FeedList } from './components/feedList/feedList';



//获取应用实例
let App         = getApp();
let pullRoomNum = 10;
const MINIAPPID = 'wx98bb879bbb53ad81';

const _shareImgMap = {};
_shareImgMap[App.config.game_appid] = [
    '../../resource/3-kill.jpg',
    '../../resource/4-kill.jpg',
    '../../resource/5-kill.jpg',
];
wx.navigateToMiniProgram || (wx.navigateToMiniProgram = function() {});

Page({
    // 下划线
    data: {
        modelPage: 'game',
        beginRender: false,
        game_app_info: {
            "game_app_name": "",
            "game_app_icon": "",
            "game_app_id"  : App.config.game_appid
        },
        // next_subscribe_content: null,
        anchor_tags_list: [],
        videoData: {
            name: ''
        },
        topFeedListInfo: {
            list: []
        },
        middleFeedListInfo: {
            list: []
        },
        bottomFeedListInfo: {
            list: []
        },
        isInitContent: true,
        isInitVideoComponent: false,
        hasNoRoom: false,
        isBottom: true,
        isAds: false,
        adsInfo: {
            bg_img: "",
            title: "",
            desc: ""
        },
        recommend_txt: "切换游戏"
    },
    /*------------------------------生命周期回调 开始------------------------------*/
    // onload -> onReady 需要128ms 
    onLoad(query = {}) {
        // 选择游戏： 1.url；2.上一次 3.推荐
        this.gameid = App.config.game_appid || '';
        this.wxid = getValue(query, 'wxid') || '';
        this.isOldVersion = true;
        this.isScrollOverVideo = false;
        this.isFirstLoad = true;
        this.isHide = false;
        this.pullDataWork = this.pullData(this.gameid, this.wxid);
    },
    onReady() {
        this.pullDataWork.then((res) => {
            this.renderPage(res);
            // this.pageExporseReport();
            if (wx.hideLoading) {
                wx.hideLoading();
            }
            if (wx.hideNavigationBarLoading) {
                wx.hideNavigationBarLoading();
            }
        }).catch((res = {}) => {
            if (wx.hideLoading) {
                wx.hideLoading();
            }
            if (wx.hideNavigationBarLoading) {
                wx.hideNavigationBarLoading();
            }
        });
    },
    onShow() {
        App.report(406, 0, 1);
    },
    onHide() {
        this.isHide = true;
    },
    onUnload() {},
    onPullDownRefresh() {
        this.pullData(this.gameid).then((res) => {
            wx.stopPullDownRefresh();
            this.renderPage(res);
            // this.pageExporseReport();
        }).catch(() => {
            wx.stopPullDownRefresh();
        });
    },
    onReachBottom() {
        // 无游戏数据、无主播、无内容则不触发下拉加载
        if (!this.gameid || this.hasNoRoom || !this.hasContent()) return;

        // 触底加载更多
        if (!this.isBottomLoading && this.isMoreAnchor) {

            homePageNetwork(this.gameid, this.pullRoomCurrentOffset, pullRoomNum)
                .then((res = {}) => {
                    if (res.ret === 0) {
                        let data = getValue(res, 'data.sub_page_response') || {};
                        let newRooms = data.live_anchor_list || [];

                        this.isMoreAnchor = data.is_more_anchor;

                        // 去重,并加入this.rooms
                        newRooms = getUniqueRooms([this.recommentRoom].concat(this.rooms), newRooms);
                        this.rooms = this.rooms.concat(newRooms);

                        this.bottomFeedListController.appendFeedList(newRooms);

                        // this.roomListExposureReport(newRooms);

                        this.pullRoomCurrentOffset += pullRoomNum;
                    } else {
                        console.log(`homePageNetwork-error-${res.ret}`);
                        this.isMoreAnchor = false;
                    }

                    this.isBottomLoading = false;
                    this.renderBottom();
                })
                .catch(() => {
                    this.isBottomLoading = false;
                    this.renderBottom();
                });
            this.isBottomLoading = true;
        } else if (!this.isMoreAnchor) {
            this.renderBottom();
        }
    },
    onShareAppMessage() {
        let that = this;
        let shareIcon = _shareImgMap[this.gameid] && _shareImgMap[this.gameid][Math.floor(Math.random() * _shareImgMap[this.gameid].length)];
        App.report(406, 999, 10);
        var param = {
            title: '精彩赛事大神直播',
            path: `/pages/competition/competition?gameid=${this.gameid}`,
        }
        if(shareIcon){param.imageUrl = shareIcon}
        return param;
    },
    /*------------------------------生命周期回调 结束------------------------------*/
    /*------------------------------主函数 开始------------------------------*/
    /**
     * 拉取首页数据
     * @param  {String} appid 游戏id
     */
    pullData(appid, wxid = '') {
        return new Promise((resolve, reject) => {
            let cmd = appid || 'autorecommend';
            this.pullRoomCurrentOffset = pullRoomNum;
            homeNetwork(cmd, wxid, pullRoomNum).then((res = {}) => {
                this.gameid = getValue(res, 'data.home_page_response.game_app_info.game_app_id') || this.gameid;

                if (res.ret === 0) {
                    // 处理无主播情况
                    this.hasNoRoom = getValue(res, 'data.home_page_response.live_anchor_total') == 0;
                    if (!this.hasNoRoom) {
                        this.showContent();
                        resolve(res);
                    } else {
                        // 无主播
                        this.renderTopSelect();
                        this.hideContent();
                        // 展示无主播UI
                        this.setNoRoomUI('show');
                        reject(res);
                    }
                } else {
                    this.renderTopSelect();
                    this.hideContent();
                    // 隐藏无主播UI
                    this.setNoRoomUI('hide');
                    reject(res);
                    errorAlert(res);
                }
                setTimeout(() => {
                    if (wx.hideLoading) {
                        wx.hideLoading();
                    }
                    if (wx.hideNavigationBarLoading) {
                        wx.hideNavigationBarLoading();
                    }
                }, 10);
            }).catch((res) => {
                reject('netError');
                // 网络错误情况
                if (wx.hideLoading) {
                    wx.hideLoading();
                }
                if (wx.hideNavigationBarLoading) {
                    wx.hideNavigationBarLoading();
                }
            });
        });
    },
    renderPage(res) {
        if (res.ret === 0) {
            this.resetPageState()
                .setPageData(res.data)
                .renderTopSelect()
                // .renderSubscribe()
                .renderVideoInfo()
                .renderTopAndBottomList()
                .renderAdInfo()
                .showContent()
                .renderTypeList()
                .renderBottom();
        }
    },
    resetPageState() {
        this.isMoreAnchor = true; // 控制下拉加载以及标签区域
        this.isBottomLoading = false; // 控制是否正在加载
        this.pageInfo = null;
        this.hasNoRoom = false;

        this.setData({
            hasNoRoom: this.hasNoRoom,
            isMoreAnchor: this.isMoreAnchor
        });
        return this;
    },
    /**
     * 处理下后台关于直播列表的数据
     * 1.头部推荐信息补全，并从列表中删除
     * 2.获取房间的自定义标签
     * 3.重置加载更多
     * @param  {Object} data 后台数据
     */
    setPageData(data) {
        this.pageInfo = data.home_page_response || {};
        this.isMoreAnchor = this.pageInfo.is_more_anchor;

        // 找到头部推荐视频，并从列表移除
        let rooms = this.rooms = getValue(data, 'home_page_response.live_anchor_list') || [],
            recommentRoom = getValue(data, 'home_page_response.recomment_alive_room_list') || {};

        // 将推荐房间信息与房间详细信息合并在一起
        recommentRoom && (recommentRoom = extend(recommentRoom,
            this.filterRooms(rooms, [recommentRoom.anchor_wechat_uid], 'anchor_wechat_uid', true)[0]
        ));
        this.recommentRoom = recommentRoom;
        // this.shareImg      = recommentRoom.video_screenshot || '';
        this.wxid = recommentRoom.anchor_wechat_uid || this.wxid || '';

        this.anchorTagsList = getValue(data, 'home_page_response.all_tags_info.anchor_tags_list') || [];

        // 缓存推荐视频
        // cacheRoomsData([this.recommentRoom]);
        return this;
    },
    /*------------------------------主函数 结束------------------------------*/

    /*------------------------------页面渲染 开始------------------------------*/
    renderTopSelect() {
        var recommend_txt = getValue(this.pageInfo, "head_recommend.recommend_txt")
            // if(App.currentGame){
        this.setData({
            'game_app_info': getValue(this.pageInfo, 'game_app_info'),
            'beginRender': true,
            'recommend_txt': recommend_txt
        });
        // }else{
        //   this.setData({
        //     'game_app_info.game_app_id' : '',
        //     'recommend_txt': recommend_txt
        //   });
        // }
        return this;
    },
    // renderSubscribe() {
    //   let subId = getValue(this.pageInfo, 'next_subscribe_content.subscribe_theme_id');

    //   if(subId){
    //     this.setData({
    //       'next_subscribe_content': this.pageInfo.next_subscribe_content
    //     });
    //   }
    //   return this;
    // },
    renderVideoInfo() {
        let that = this;
        // this.recommentRoom.room_style_type = 2;
        this.wgVideo = new WgVideo({
            type: getValue(this.recommentRoom, 'room_style_type') || 0,
            isAutoplay: true,
            page: this,
            isOldHome: true,
            controlName: getValue(this.recommentRoom, 'room_style_type') === 2 ? 'simpleHalfScreenControl' : 'halfScreenHomeControl',
            isHome: true,
            videoInfo: {
                backgroundUrl: getValue(this.recommentRoom, 'contest_style_info.video_background_url') || '',
                contest: getValue(this.recommentRoom, 'contest_style_info') || {},
                detail: this.recommentRoom
            }
        });

        return this;
    },
    renderTypeList() {
        let all_tags_info = getValue(this.pageInfo, 'all_tags_info') || {};

        if (this.anchorTagsList.length === 0 || !this.isMoreAnchor) {
            this.setData({
                anchor_tags_list: []
            });
            return this;
        }
        if (all_tags_info.live_tags_total > MAXTYPENUM) {
            this.anchorTagsList = this.anchorTagsList.slice(0, MAXTYPENUM - 1);

            this.anchorTagsList.push({
                "tag_icon": 'https://mmocgame.qpic.cn/wechatgame/mEMdfrX5RU0PBicAf6Oyccw2nadHamu4jKlhlmda5BT5Sl8yuL2N4dicf0TZvoVvss/0',
                "tag_name": "更多"
            });
        }

        this.setData({
            anchor_tags_list: this.anchorTagsList
        });
        return this;
    },
    renderTopAndBottomList() {
        let topRoomsNum = this.rooms.length > HOMETOPROOMSNUM - 1 ? HOMETOPROOMSNUM - 1 : this.rooms.length;
        this.iPositionId = this.newRoomPosition = 10;
        let middleRoomsNum;
        if (this.rooms.length >= ADMAXPOSITION - 1) {
            this.setData({
                isAds: true
            });
            middleRoomsNum = ADMAXPOSITION - 1;
        } else {
            this.setData({
                isAds: false
            });
            middleRoomsNum = this.rooms.length;
        }

        this.topFeedListController = new FeedList(
            'topFeedListInfo',
            this,
            this.gameid,
            this.rooms.slice(0, topRoomsNum), {
                iUIArea: 101,
                iPositionId: this.iPositionId
            }
        );
        this.middleFeedListController = new FeedList(
            'middleFeedListInfo',
            this,
            this.gameid,
            this.rooms.slice(topRoomsNum, middleRoomsNum), {
                iUIArea: 101,
                iPositionId: this.iPositionId + topRoomsNum
            }
        );
        this.bottomFeedListController = new FeedList(
            'bottomFeedListInfo',
            this,
            this.gameid,
            this.rooms.slice(middleRoomsNum, this.rooms.length), {
                iUIArea: 101,
                iPositionId: this.iPositionId + middleRoomsNum
            }
        );

        return this;
    },

    renderAdInfo() {
        var adsInfo = getValue(this.pageInfo, "ads_info");
        this.setData({
            adsInfo: adsInfo
        });
        // this.report([{
        //   iPositionId: 501,
        //   iActionId: 1
        // }])
        return this;
    },
    renderBottom() {
        this.isBottom = true;

        // 如果页面只有三个以内直播则不展示   已加载完
        if (this.rooms && this.rooms.length < 2) {
            this.isBottom = false;
            this.isMoreAnchor = false;
        }

        this.setData({
            isBottom: this.isBottom,
            isMoreAnchor: this.isMoreAnchor
        })
        return this;
    },
    /*------------------------------页面渲染 结束------------------------------*/

    /*------------------------------工具函数 开始------------------------------*/
    /**
     * 选出ids对应的数组
     * @param  {Array}  rooms    
     * @param  {Array}  ids      
     * @param  {String}  key      
     * @param  {Boolean} isDelete 
     * @return {Array}           
     */
    filterRooms(rooms, ids, key, isDelete) {
        let filterArray = [];

        for (let i = 0; i < ids.length; i++) {
            let id = ids[i];
            for (let j = 0; j < rooms.length; j++) {
                let room = rooms[j];
                if (room[key] == id) {
                    filterArray.push(room);
                    if (isDelete) {
                        rooms.splice(j, 1);
                    }
                }
            }
        };

        return filterArray;
    },
    // roomListExposureReport(roomList) {
    //   let reportList = [];
    //   roomList.forEach((room, index) => {
    //     reportList.push({
    //       iPositionId   : this.newRoomPosition + index,
    //       iActionId     : 1,
    //       sGeneralId    : room.anchor_wechat_uid,
    //       iAnchorType   : getAnchorType(room.anchor_wechat_uid),
    //       sExternInfo   : room.sort_type !== undefined ? JSON.stringify({exp_id: room.sort_type}) : '{}'
    //     })
    //   })
    //   this.newRoomPosition += roomList.length;

    //   this.report(reportList);
    // },
    // report(list) {
    //   if(Object.prototype.toString.call(list) !== '[object Array]' || list.length === 0) return;

    //   list = list.map((item) => {
    //     item.sExternInfo = item.sExternInfo || {};
    //     item.sExternInfo = JSON.stringify(item.sExternInfo);
    //     return extend({
    //       iSceneId : 1,
    //       iUIArea  : 101,
    //       sGameId  : this.gameid,
    //     }, item);
    //   })

    //   Report(list);
    // },
    hasContent() {
        return this.data.isInitContent || this.isInitVideoComponent
    },
    // 隐藏内容区
    hideContent() {
        this.setData({
            isBottom: false,
            isInitVideoComponent: false,
            isInitContent: false
        });
    },
    // 显示内容区
    showContent() {
        this.setData({
            isInitVideoComponent: true,
            isInitContent: true
        });
        return this;
    },
    setNoRoomUI(cmd) {
        if (cmd === 'show') {
            this.hasNoRoom = true;
        } else if (cmd === 'hide') {
            this.hasNoRoom = false;
        }
        this.setData({
            hasNoRoom: this.hasNoRoom
        })
    },
    // pageExporseReport() {
    //   // pv、直播首位、热门标签、直播列表 曝光上报
    //   let reportList = [
    //     {
    //       iPositionId : 0,
    //       iActionId   : 1
    //     }, {
    //       iPositionId   : 3,
    //       iActionId     : 1,
    //       sGeneralId    : this.recommentRoom.anchor_wechat_uid,
    //       iAnchorType   : getAnchorType(this.recommentRoom.anchor_wechat_uid)
    //     }
    //   ];
    //   if(this.anchorTagsList.length > 0 && this.isMoreAnchor) {
    //     this.anchorTagsList.forEach((tag) => {
    //       tag.tag_id && reportList.push({
    //         iPositionId : 4,
    //         iActionId   : 1,
    //         iGiftId     : tag.tag_id
    //       })
    //     });
    //   }
    //   this.report(reportList);
    //   this.roomListExposureReport(this.rooms);
    // },
    /**
     * 只有当参数与页面数据不相符才会重新加载
     */
    isReloadPage({
        wxid = '',
        gameid = ''
    } = {}) {
        return wxid.length > 0 && wxid !== this.wxid ||
            gameid.length > 0 && gameid !== this.gameid;
    },
    /*------------------------------工具函数 结束------------------------------*/

    /*------------------------------交互事件 开始------------------------------*/
    goGameList() {
        let that = this;
        App.report(406, 1, 2)
        wx.navigateToMiniProgram({
            appId: MINIAPPID,
            path: '/pages/gamelist/gamelist',
            extraData: {},
            envVersion: 'release',
            success(res) {}
        });
    },
    goTagPage(e) {
        let that = this;
        let tagId = getValue(e, 'currentTarget.dataset.tagid');
        let url = '',
            rParam;
        if (tagId) {
            url = `/pages/taglist/taglist?tagid=${tagId}&appid=${this.gameid}`;
        } else {
            url = `/pages/tag/tag?jump=index&appid=${this.gameid}`;
        }
        App.report(406, 2, 2);
        wx.navigateToMiniProgram({
            appId: MINIAPPID,
            path: url,
            extraData: {},
            envVersion: 'release',
            success(res) {}
        })
    },
    goMixPage() {
        let that = this;
        wx.navigateToMiniProgram({
            appId: MINIAPPID,
            path: `/pages/index/index?router=mix&mix_gameid=${this.gameid}`,
            extraData: {},
            envVersion: 'release',
            success(res) {}
        })
    }
    /*------------------------------交互事件 结束------------------------------*/
})