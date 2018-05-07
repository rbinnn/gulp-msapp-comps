let Report14359 = require('js/common/report_14359').batchCltStat;

export let Promise = require('js/libs/Promise');


export function Report(list) {
  let session = getSession();
  Report14359(session, list);
}

/**
 * newRooms与rooms去重，返回去重后的newRooms    
 * @param  {Array} rooms    已有rooms
 * @param  {Array} newRooms 行rooms
 * @return {Array}          去重后的newRooms
 */
export function getUniqueRooms(rooms, newRooms) {
    let uniqueNewRooms = [];
    for (let i =  0; i < newRooms.length; i++) {
      let newRoom     = newRooms[i];
      for (var j = rooms.length - 1; j >= 0; j--) {
        let room = rooms[j];
        if(newRoom.anchor_wechat_uid === room.anchor_wechat_uid) break;
      }
      if(j < 0){
        uniqueNewRooms.push(newRoom);
      }
    }
    return uniqueNewRooms;
}


export function getValue(json,jsonDotStr){
    var layKeys = jsonDotStr.split('.');
    var tjson = json || {},
        tkey = null;
    while( tkey = layKeys.shift() ){
        if('undefined' === typeof tjson[tkey]){
            return undefined;
        }
        tjson = tjson[tkey];
    }
    return tjson;
}

export function errorAlert(res = {}) {
  wx.showModal({
      title: '温馨提示',
      content: `数据加载错误，请稍后重试（${res.ret || 'uk'}）`,
      showCancel: false
  });
}


export function getAnchorType(wxid) {
  if(typeof wxid !== 'string' || wxid.length < 4) return '';
  return parseInt(wxid.slice(2, 4));
}

export function filterCount(count) {
  if( ('' + count).indexOf('万') > -1 ) return count
  if(!count) return 0;
    
  let w = count / 1000;
  if(w < 10){
    return count;
  }else{
    return Math.round(w) / 10 + '万';
  }
}

export let extend = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

export function getSession() {
  var v = wx.getStorageSync('__SESSION__KEY__');
  try {
    if (('' + v).length > 0) {
      return JSON.parse(v + '');
    } else {
      return {};
    }
  } catch (e) {
    return {};
  }
}
