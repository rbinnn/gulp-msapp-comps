'use strict';
var reportPlay = require("./report-play");
var Reporter = require("../module/reporter/index");

const checkReportStep = [5, 30]; // 需要进行离线保存的上报step

// https://docs.google.com/spreadsheets/d/1eUyqFD1FkRc8L4YawJg2rUOqYecqmFjH2b_MeT_FS3w/edit#gid=0
module.exports = function (cfg, hook) {
	var {vid, cid} = cfg;
	let externalReportParam = hook.getReportParam || (cb=> cb({}));

	var _videoinfo = null;

	var allPlayStartTime = 0;   // 所有播放的开始时间
	var currentPlayStartTime;   // 这一段播放开始时间
	var currentPlaySumTime = 0; // 这一段播放总长

	function getbase() {
		return {
			iformat: _videoinfo ? _videoinfo.dltype : 0,
			duration: _videoinfo ? Math.floor(_videoinfo.duration) : '',
			defn: _videoinfo ? formatidToDefn(_videoinfo.fmid) : '',

			playtime: currentPlaySumTime + (currentPlayStartTime ? Date.now() - currentPlayStartTime : 0),

			vid: vid || '',
			cid: cid || ''
		};
	}

	var playedAd = false;
	var playedVideo = false;

	var step7 = Oncer(function (url) {
		var param = getbase();
		param.val1 = 0;
		param.val2 = 0;
		param.val3 = url;
		reportPlay(7, param, externalReportParam);
	});

	var step6 = Oncer(function (url) {
		var param = getbase();
		param.val1 = allPlayStartTime ? Date.now() - allPlayStartTime : 0;
		param.val2 = playedAd ? 0 : 1; // 无法得知视频loaded状态，反正有广告就报0
		param.val3 = url;
		reportPlay(6, param, externalReportParam);
	});

	var step5 = Oncer(function (type, val3) {
		var param = getbase();

		param.val1 = allPlayStartTime ? Date.now() - allPlayStartTime : 0;
		param.val2 = {
			"error": 3,
			"complete": 1,
			"incomplete": !playedVideo ? 0 : 2
		}[type];
		param.val2 == void 0 && (param.val2 = 2);
		param.val3 = val3;

		reportPlay(5, param, externalReportParam)
	});

	var timer = null;
	var report30 = Oncer(function (second, val2) {
		// cache.del('tvp_report_30');
		Reporter.reportCache.del('step30');
		var param = getbase();
		param.val1 = second;
		param.val2 = val2;

		reportPlay(30, param, externalReportParam);
	});
	var step30 = function (second, val2) {
		if (second == 10000) {
			timer = setTimeout(function () {
				report30(second);
			}, 11000);

			var param = getbase();
			param.val1 = second;
			param.val2 = val2;
			reportPlay(30, param, externalReportParam, function (err, url) {
				Reporter.reportCache.set('step30', url);
			});

		} else {
			clearTimeout(timer);
			report30(second);
		}
	};

	reportPlay(3, getbase(), externalReportParam);

	Reporter.on('_save', function () {
		var param = getbase();
		param.val1 = allPlayStartTime ? Date.now() - allPlayStartTime : 0;
		param.val2 = !playedVideo ? 0 : 2;

		reportPlay(5, param, externalReportParam, function (err, url) {
			Reporter.reportCache.set('step5', url);
		});
	});
	Reporter.on('_restore', function () {
		checkReportStep.forEach(step=> {
			Reporter.reportCache.del('step' + step);
		});
	});

	return {
		setPlayFlow: Oncer(function (playflow) {
			playflow.on('adplaying', function (content) {
				playedAd = true;
				step7(content.url);
			});
			playflow.on('videoplay', function (content) {
				!allPlayStartTime && (allPlayStartTime = Date.now());
				currentPlayStartTime = Date.now();
			});
			playflow.on('videoplaying', function (content) {
				playedVideo = true;
				step6(content.url);
				step30(allPlayStartTime ? Date.now() - allPlayStartTime : 0, 0);
			});
			playflow.on('videopause', function () {
				// 用于统计播放时长
				currentPlaySumTime += (Date.now() - currentPlayStartTime);
				currentPlayStartTime = 0;
			});
			playflow.on('videotimeout', function (second) {
				step30(second, 1);
			});
			playflow.on('terminate', function () {
				step5('incomplete');
			});
			playflow.on('end', function () {
				step5('complete');
			});
			playflow.on('error', function (e) {
				step5('error', '1 ' + (e.code || '') + ' ' + e.message);
			});
		}),

		setVideoInfo: Oncer(function (v) {
			_videoinfo = v;
		}),

		// getinfo失败调这里？
		error: function (e) {
			step5('error', '2 ' + (e.code || '') + ' ' + e.message);
		}
	}
};

// 转化成boss上报的清晰度id
// 产品定义的清晰度： 1.默认（未知，例如format 1和2), 2.流畅 3.高清 4.超清 5.蓝光
function formatidToDefn(id) {

	return {
		1: 1,
		2: 1,
		10001: 4,
		10002: 3,
		10003: 2,
		10201: 4,
		10202: 3,
		10203: 2,
		100001: 2,

		320089: 2,
		320091: 3,
		320092: 4,
		320093: 5
	}[id]
}

// 只跑一次的
function Oncer(fn) {
	var done = false;
	var ret = function () {
		if (done) return;
		done = true;
		fn.done = done;
		fn.apply(this, arguments);
	};

	ret.done = done;
	return ret;
}