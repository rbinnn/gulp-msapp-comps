import {getValue, filterCount, Report, extend, getAnchorType} from '../../common/util'

//获取应用实例
let App = getApp();
const MINIAPPID = 'wx98bb879bbb53ad81';

/**
 * 直播列表组件
 * @param {String} key  <template data="{{...key}}">
 * @param {Object} context 页面 context
 * @param {Array} feedList 主播列表
 *
 * @method appendFeedList 追加列表，目前用于首页下拉加载
 */
export class FeedList {
  constructor(key, context, gameid, feedList, reportObj = {}) {
    this.pageCtx = context;
    this.pageData = {};
    this.reportObj = reportObj;
    this.key = key;
    this.gameid = gameid;
    this._extendPageMethod();

    this.feedList = this._getTagsForRooms(feedList);
    this._refreshFeedList();

  }
  appendFeedList(feedList) {
    feedList = this._getTagsForRooms(feedList);
    this.feedList = this.feedList.concat(feedList);
    this._refreshFeedList();
  }
  _extendPageMethod() {
    extend(this.pageCtx, {
     _feedGoRoom(e) {
        let wxid        = getValue(e, 'currentTarget.dataset.wxid');
        let iUIArea     = getValue(e, 'currentTarget.dataset.area');
        let iPositionId = getValue(e, 'currentTarget.dataset.position');
        let sortType    = getValue(e, 'currentTarget.dataset.sorttype');
        let gameid      = getValue(e, 'currentTarget.dataset.gameid')
        App.report(406, 1, 2);
        wxid && wx.navigateToMiniProgram({
          appId: MINIAPPID,
          path: `/pages/room/room?ssid=29&jump=list&wxid=${wxid}&gameid=${gameid}`,
          extraData: {},
          envVersion: 'release',
          success(res) {
          }
        })
      }
    });
  }
  _refreshFeedList() {
    this.pageData[this.key] = {
      list : this.feedList,
      iUIArea: this.reportObj.iUIArea,
      iPositionId: +this.reportObj.iPositionId || 10,
      gameid: this.gameid
    }
    this.pageCtx.setData(this.pageData);
  }
    /**
   * 找寻rooms每个room对应的主播标签 如：最强李白
   * 将人数替换成中文
   * @param  {Array} rooms 
   * @return {Array}      
   */
  _getTagsForRooms(rooms) {
    rooms.forEach((room, i) => {
        let tag = (getValue(room, 'anchor_tags_info.corner_tags_list') || [])[0];
        if(typeof tag === 'string' && tag.length > 0){
          room.anchor_tag = tag
        }
        room.audience_cnt = filterCount(room.audience_cnt);
    });
    return rooms;
  }
}