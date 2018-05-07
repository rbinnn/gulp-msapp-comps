var util    = require('./util');
var request = require('./request');
// http://game.weixin.qq.com/cgi-bin/comm/appstat?userid=xxx&a=1&b=2&...
// http://game.weixin.qq.com/cgi-bin/comm/appstat?userid=xxx&BatchData=%5B%22a%3D1%26b%3D2%22%2C%22a%3D3%26b%3D4%22%5D

// int后台的默认是0 string是空
function batch14359(sysObj, list, cbk) {
    var _report = [];
    for (var i = 0, il = list.length; i < il; i++) {
        var _o     = list[i],
            params = [
                "GameID="         , (_o.sGameId          || "0"), 
                "&SceneID="       , (_o.iSceneId         || "0"),
                "&UIArea="        , (_o.iUIArea          || "0"),
                "&PositionID="    , (_o.iPositionId      || "0"),
                "&ActionID="      , (_o.iActionId        || "0"),
                "&Ssid="          , (_o.iSsid            || "0"),
                "&GiftID="        , (_o.iGiftId          || "0"),
                "&GeneralID="     , (_o.sGeneralId       || "0"),
                "&VideoQuality="  , (_o.iVideoQuality    || "0"),
                "&Type="          , (_o.iType            || "0"),
                "&Type_Id="       , (_o.iTypeId          || "0"),
                "&Time="          , (_o.iTime            || "0"),
                "&AnchorType="    , (_o.iAnchorType      || "0"),
                "&Device="        , (_o.sDevice          || (sysObj.device == 'iphone' ? 1 : 2) || '0'),
                "&ClientVersion=" , (_o.sClientVersion   || sysObj.clientVersion || '0'),
                "&ConnectType="   , (_o.sConnectType     || sysObj.networktype   || "0"),
                "&SourceID="      , (_o.iSourceID        || sysObj.iSourceID     || "0"),
                "&ExpandCol1="    , (_o.sExpandCol1      || sysObj.sExpandCol1   || sysObj.sdkVersion||''),
                "&sdkVersion="    , (_o.sdkVersion       || sysObj.sdkVersion),
                "&DeviceBrand="   , (_o.sDeviceBrand     || sysObj.brand),
                "&DeviceModel="   , (_o.sDeviceModel     || sysObj.model),
                "&ExternInfo="    , (_o.sExternInfo      || sysObj.sExternInfo   || ""),
            ].join('');
        _report.push(params);
    }
    var query = 'userid=' + sysObj.user_id;
    request({
        url     : 'https://game.weixin.qq.com/cgi-bin/comm/appstat?' + query,
        method  : 'POST',
        header  : {"Content-Type": "application/x-www-form-urlencoded"},
        data    : 'BatchData='+encodeURIComponent(JSON.stringify(_report)),
        success : function(res){
            // console.log(res);
        },
        fail    : function(res){
            // console.error(res);
        }
    });
}

module.exports = {
    batchCltStat: function(session, list, cbk){
        util.getReportObj(function(sysObj){
            sysObj.user_id    = session.user_id || session.userId || '';
            batch14359(sysObj, list, cbk);
        });
    }
};