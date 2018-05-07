import {filterCount, getValue} from '../../common/util';

// 目前明星不支持特殊样式
const _videoTypeMap = {
  0: 'normal',
  // 1: 'star',
  1: 'normal',
  2: 'contest'
}
const MINIAPPID = 'wx98bb879bbb53ad81';
let App = getApp();
/**
 * 初始化视频组件
 * @param {Object} opt  {controlName: 控件类型名, page: 页面context, videoCtx: video context}
 */
export class WgVideo {
  constructor(opt) {
    this._opt = opt;
    this.page = this._opt.page;
    this._isEnd        = this._opt.videoInfo.isEnd;
    this._isLoad = true;

    this._selectVideoStyle();
    this._extendPageMethod();
  }
/*------------------------------主函数 开始------------------------------*/
  _selectVideoStyle(netType) {
    if(!this._isLoad) return;
    // 如果是非wifi首页与旧版首页保持一致-->不播放
    this.isOldHome    = true;
    // 渲染非视频内容
    this._renderComponent();
  }
  _filterData() {
    // 转化观众数
    this._opt.videoInfo.detail.audience_cnt = filterCount(this._opt.videoInfo.detail.audience_cnt);

    // 视频组件控制控制字段
    this.videoId = 'wgvideo_' + new Date().getTime();
    this._videoComponentData = {         
      // controlName   : 'fullScreenControl' || (this._opt.controlName + (this.isOldHome ? 'Old' : '')) || 'halfScreenControl',  // 控制bar类型
      controlName   : (this._opt.controlName + (this.isOldHome ? 'Old' : '')) || 'halfScreenControl',  // 控制bar类型
      isOldHome     : this.isOldHome,                  // wifi下自动播放
      backgroundUrl : this._opt.videoInfo.backgroundUrl || '',
      contest       : this._opt.videoInfo.contest,
      detail        : this._opt.videoInfo.detail,
      videoId       : this.videoId,
    };
  }
  /* 渲染静态页面数据 */
  _renderComponent() {
    this._filterData();
    this.videoStatusControl = {
      isVideo           : !this._isEnd,
      isEnd             : this._isEnd,
      isDanmu           : this.isLastDanmu,
      isMuted           : !!this._opt.isHome,
      isMutedBtn        : !!this._opt.isHome,
      isAutoplay        : false,
      isInitVideo       : false,
      isError           : false,
      isShowQua         : false,         // 是否展示全部清晰度
      isFullScreen      : false,         // 不与wxml绑定
      isPlayBtn         : false,         // 是否展示暂停按钮
      isControlBar      : true,
      tipsText          : '',
      currentVideoIndex : 0
    };
    this.page.setData({
      videoData: {
        name       : _videoTypeMap[ this._opt.type ], // 组件类型
        info       : this._videoComponentData,
        controller : this.videoStatusControl
      },
      isInitVideoComponent: true
    });
    return this;
  }
/*------------------------------主函数 结束------------------------------*/
/*------------------------------ 实例方法 开始 ------------------------------*/

/*------------------------------ 实例方法 结束 ------------------------------*/
/*------------------------------ 工具方法 开始 ------------------------------*/

/*------------------------------ 工具方法 结束 ------------------------------*/
/*------------------------------ html方法 结束 ------------------------------*/
  _extendPageMethod() {
    let that = this;
    Object.assign(this.page, {
      _customTapEvent(e) {
        let wxid = that._opt.videoInfo.detail.anchor_wechat_uid;
        App.report(406, 1, 2);
        wx.navigateToMiniProgram({
          appId: MINIAPPID,
          path: `/pages/room/room?ssid=29&jump=video&wxid=${wxid}&gameid=`+App.config.game_appid,
          extraData: {},
          envVersion: 'release',
          success(res) {
          }
        });
      }
    }); 
  }
/*------------------------------ html方法 结束 ------------------------------*/
}
