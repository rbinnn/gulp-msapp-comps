/* 
    APP整体的配置文件
*/
module.exports = {
    // 小程序APPID
    appid: 'wxc4a8208dc3533550',

    // 对应游戏appid,　如果是单游戏小程序必填
    game_appid: 'wx95a3a4d7c627e07d',

    // 小程序的名称
    app_name: '棋牌群排行',

    // 业务登录唯一ID
    weapp_type: 19,

    // 登录态过期，用于重新登录用。因为不同CGI返回的错误码可能不同
    expiredLoginCodeMap: [],

    // 是否开启debug
    debug: true,

    // 是否mock
    mock: true,

    // iSenceId 上报用
    sceneid: 4,

    // mmgamecenter 以上的路径，写你本地的绝对路径，因为pb import貌似不支持相对路径
    // window路径：E:/xxx/xxx/xxx.proto
    pb_file_base_path: '/Users/addy/Documents/tencent/',

    // pb路径，后台是这么定的，别问我为什么
    pb_file_path: 'mmgamecenter/src/cgi/mmgameweappwap/weapp_chess.proto',

    // 请求url前缀，一般是https://game.weixin.qq.com/cgi-bin/gameweappwap/xxxx,
    // xxxx是方法名，会从pb中解析。
    fetch_base_url: 'https://game.weixin.qq.com/cgi-bin/gameweappwap/',
    cgi_base: 'https://game.weixin.qq.com/cgi-bin/',
    // 反馈信息配置，如果不需要反馈页，请忽略
    feedback: {
        // 场景值
        sourcescene: 63
    }
}