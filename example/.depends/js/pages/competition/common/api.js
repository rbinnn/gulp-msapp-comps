import {Promise, getValue} from './util.js';

let App = getApp();

/**
 * 首页接口
 */
export function homeNetwork(appid, wxid, limit) {
    return new Promise((resolve, reject) => {
        request({
            url: `https://game.weixin.qq.com/cgi-bin/opwap/esports?auth_type=1`,
            data:{
                "request_type": 1,
                "home_page_request":{
                    "game_app_id": appid || App.config.game_appid,
                    "anchor_list_paging":{
                        "offset":0,
                        "limit": limit
                    }
                }
            },
            success(res) {
                resolve(res);
            },
            fail(res) {
                wx.showModal({
                    title: '温馨提示',
                    content: `网络错误，请稍后重试`,
                    showCancel: false
                });
                reject(res);
            }
        })
    })
}
/**
 * 首页分页
 */
export function homePageNetwork(appid, offset, limit) {
    return new Promise((resolve, reject) => {
        request({
            url: `https://game.weixin.qq.com/cgi-bin/opwap/esports?auth_type=1`,
            data: {
                "request_type": 2,
                "sub_page_request":{
                    "game_app_id": appid,
                    "anchor_list_paging":{
                        "offset":offset,
                        "limit": limit
                    }
                }
            },
            success(res) {
                resolve(res);
            },
            fail(res) {
                reject();
            }
        })
    })
}

function request(param) {
    App.request({
        url: param.url,
        data:param.data,
        method: "POST",
        header: {
            'content-type': 'application/json'
        },
        success(res) {
            param.success && param.success(res);
        },
        fail(res) {
            param.fail && param.fail(res);
        }
    }) 
}
