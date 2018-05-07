var util    = require('./util');
var request = require('./request');
function batch11332(sysObj, list, cbk) {
    var _report = [];
    for (var i = 0, il = list.length; i < il; i++) {
        var _o     = list[i],
            params = [
                "GameID="        , (_o.sGameId          || "0"),
                "&SceneID="       , (_o.iSceneId         || "0"),
                "&OpType="        , (_o.iOpType          || '0'),
                "&LogType="       , (_o.iLogType         || "0"),
                "&UIArea="        , (_o.iUIArea          || "0"),
                "&ActionID="      , (_o.iActionId        || "0"),
                "&SourceID="      , (_o.iSourceSceneId   || "0"),
                "&PositionID="    , (_o.iPositionId      || "0"),
                "&ActionStatus="  , (_o.sActionStatus    || "0"),
                "&GiftID="        , (_o.iGiftBagId       || "0"),
                "&GiftType="      , (_o.iGiftBagType     || "0"),
                "&DeviceBrand="   , (_o.sDeviceBrand     || '0'),
                "&ActID="         , (_o.iActID           || "0"),
                "&ISP="           , (_o.sServiceProvider || '0'),
                "&DeviceModel="   , (_o.sDeviceModel     || sysObj.model                        || '0'),
                "&Device="        , (_o.sDevice          || (sysObj.device == 'iphone' ? 1 : 2) || "0"),
                "&ConnectType="   , (_o.sConnectType     || sysObj.networktype                  || "0"),
                "&ClientVersion=" , (_o.sClientVersion   || sysObj.clientVersion                || '0'),
                "&ExternInfo="    , (_o.sExternInfo      || sysObj.sExternInfo                  || ""),
                "&ExpandCol1="    , (_o.sExpandCol1      || sysObj.sExpandCol1   || sysObj.sdkVersion||'')
            ].join('');
        _report.push(params);
    }
    var query = 'auth_type=8&userid=' + sysObj.user_id;
    request({
        url     : 'https://game.weixin.qq.com/cgi-bin/comm/cltstat?' + query,
        method  : 'POST',
        header  : {"Content-Type": "application/x-www-form-urlencoded"},
        data    : 'BatchData='+encodeURIComponent(JSON.stringify(_report)),
        success : function(res){
            console.log(res);
        },
        fail    : function(res){
            console.error(res);
        }
    });
}

module.exports = {
    batchCltStat: function(session, list, cbk){
        util.getReportObj(function(sysObj){
            sysObj.user_id    = session.user_id || session.userId || '';
            batch11332(sysObj, list, cbk);
        });
    }
};