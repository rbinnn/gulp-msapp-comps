'use strict';
var Promise = require("../../../lib-inject").Promise;

var getAd = require("./data/ad");
var getInfo = require("./data/getinfo");

/**
 * 创建一个包括getinfo和广告请求的promise
 * @type {{}}
 */
module.exports = function (cfg) {
	cfg = cfg || {};
	// 参数合法性由上层模块保证，懒得验了
	var vid = cfg.vid;
	var cid = cfg.cid;
	var from = cfg.from;
	var openid = cfg.openid;
	var defn = cfg.defn;
	var noad = cfg.noad;
	var chid = cfg.chid;

	return Promise
		.all([
			['v4138'].indexOf(from) == -1 || noad ? Promise.resolve({}) : getAd({
				coverid: cid,
				vid,
				live: 0,
				chid: chid || 41,
				pu: 1,

				openid: openid || ''
			}),
			getInfo(vid, from, defn)
		])
		.then(function (res) {
			var ad = res[0];
			var videoinfo = res[1];

			return {
				ad,
				videoinfo
			}
		})
};