'use strict';
var reportQueue = require("./../module/reporter/report-queue");

const BOSSID = 4327;
const PWD = 944465292;
var systemInfo = wx.getSystemInfoSync();
/**
 *
 * @param step 参见stepsheet
 * @param param 参数（同步）
 * @param asyncExt 参数（异步）
 * @param getUrl 获取url的回调函数
 */
module.exports = function reportPlay(step, param = {}, asyncExt, getUrl) {

	asyncExt(function (err, adata) {
		if (err) {
			adata = {};
		}

		// 支持 3: {val1, val2}这样的上报
		delete adata.val1;
		delete adata.val2;
		delete adata.val3;
		if (typeof adata[step] == 'object') {
			['val1', 'val2', 'val3'].forEach(key=> {
				adata[key] = adata[step][key];
			});
			delete adata[step]
		}

		var pages = getCurrentPages().slice(0);
		var cur = pages.pop();
		var ref = pages.pop();

		wx.getNetworkType({
			success: function (res) {
				var reportee = {
					BossId: BOSSID,
					Pwd: PWD,
					app_version: '',
					platform: systemInfo.platform,
					client_model: systemInfo.model,
					wx_version: systemInfo.version,
					network: res && res.networkType ? res.networkType : '',
					step,
					// iformat
					// duration
					// defn
					// tpay
					// adid
					// playtime
					page_url: (cur && cur.$name) || '',
					page_query: (cur && cur.$query) || '',
					page_ref: (ref && ref.$name) || ''
					// cid
					// vid
					// isvip
					// val1
					// val2
					// val3
					// appname
					// nick
					// rmd
					// scene
					// additional
				};
				[
					'hc_openid', 'hc_appid', 'ptag',
					'iformat', 'duration', 'defn', 'tpay', 'adid', 'playtime',
					'page_url', 'page_query', 'page_ref',
					'cid', 'vid', 'isvip', 'val1', 'val2', 'val3',
					'appname', 'nick', 'rmd', 'scene', 'additional'
				].forEach(key=> {
					if (key in param) reportee[key] = param[key];
					if (key in adata) reportee[key] = adata[key];
					if (reportee[key] == void 0) reportee[key] = '';
				});

				if (getUrl && typeof getUrl == 'function') {
					getUrl(null, {
						reportUrl: 'https://btrace.qq.com/kvcollect?' +
						Object.keys(reportee)
							.map(key=> key in reportee ? `${key}=${encodeURIComponent(reportee[key])}` : '')
							.filter(item=>item)
							.join('&')
					});

				} else {
					reportQueue.push({
						reportUrl: 'https://btrace.qq.com/kvcollect?' +
						Object.keys(reportee)
							.map(key=> key in reportee ? `${key}=${encodeURIComponent(reportee[key])}` : '')
							.filter(item=>item)
							.join('&')
					})
				}
			}
		})
	});
};