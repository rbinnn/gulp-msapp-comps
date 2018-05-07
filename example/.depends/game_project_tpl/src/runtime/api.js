
import config from '../../config';
import login  from 'common/welogin';

export let app = {};

let FETCH_URL = 'https://game.weixin.qq.com/cgi-bin/gametetrisws/';

// welogin模块需要的配置
let loginConfig  = {
    appid     : config.appid,

    // 业务登录唯一ID
    weapp_type: config.weapp_type,
};

// welogin模块初始化操作
login.prepare(app, loginConfig);

// API请求默认回调函数
const none = () => {}

export function getData(success = none, fail = none) {
	app.request({
        url    : FETCH_URL + 'getwxagfriendrankboard',
        data   : {},
        method : "POST",
        header : {
            'content-type': 'application/json'
        },
        success  : (data) => {
        	console.log(data);
        	success(data);
        },
        fail     : (data) => {
        	console.log(data);
        	fail(data);
        },
    });
}
