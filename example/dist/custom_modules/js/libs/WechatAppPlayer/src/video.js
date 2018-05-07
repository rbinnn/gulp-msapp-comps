'use strict';
var Reporter = require("./module/reporter/index");
var VideoController = require("./controller-video/index");
var LiveController = require("./controller-live/index");

var APP_NAME = require("./util/platform-config").APP_NAME;

/**
 * 构造函数
 * @param ids 视频vid 专辑cid 直播pid 流sid
 * @param option
 *  from 平台号
 *  autoplay 自动播放（抛出第一个currentContent的时机） 默认true
 *
 *  @deprecated getLoginData
 *  getReportParam
 */
var exportee = module.exports = function (ids = {}, option = {}) {
	let from = option.from;
	let autoplay = option.autoplay !== void 0 ? option.autoplay : true;
	let defn = option.defn || '';
	let noad = option.noad !== void 0 ? !!option.noad : false;
	let chid = option.chid || void 0;

	var getReportParam = typeof option.getReportParam == 'function' ? option.getReportParam : (
		typeof option.getLoginData == 'function' ? cb=> {
			option.getLoginData(function (err, res) {
				res.hc_openid = res.openid;
				delete res.openid;
				cb(err, res);
			})
		} : cb=> cb()
	);

	// 优先解析vid
	let vid = ids.vid;
	if (typeof ids == 'string') {
		vid = ids;
	}
	let cid = ids.cid || '';

	let sid = ids.sid;
	let pid = ids.pid;

	var controller;
	if (vid) {
		controller = VideoController({
			vid, cid,
			from,

			chid,
			defn,
			noad
		}, {
			getReportParam: function (cb) {
				getReportParam(function (err, res) {
					res && (res.appname = APP_NAME[from]);
					cb(err, res);
				})
			}
		});
	} else {
		controller = LiveController({
			sid, pid,
			from,

			defn,
			noad
		}, {
			getReportParam: function (cb) {
				getReportParam(function (err, res) {
					res && (res.appname = APP_NAME[from]);
					cb(err, res);
				})
			}
		})
	}

	if (autoplay) {
		controller.start()
	}
	return controller;
};

exportee.on = function (ev) {
	if (ev == 'report') {
		Reporter.off('report');
		Reporter.on.apply(Reporter, arguments);
	}
};

exportee.release = Reporter.release;

exportee.saveState = Reporter.saveState;

exportee.restoreState = Reporter.restoreState;

exportee.checkState = Reporter.checkState;