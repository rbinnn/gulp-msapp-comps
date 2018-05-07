'use strict';
var errorMessages = require("./getinfo-status");
var request = require("../../../../lib-inject").request;
var qvsec = require("../../../lib/algorithm/qvsec");
var timestamp = require("../../../lib/algorithm/fillTimeStamp");
var Promise = require("../../../../lib-inject").Promise;

const useHLS = wx.getSystemInfoSync().platform != 'devtools';
var SDTFROM;
const PLATFORM = require("../../../util/platform-config").APP_PLATFORM;

// 算加密串 && 请求
function getInfo(vid, FROM, defn) {
	SDTFROM = FROM;
	defn = defn || 'auto';
	var _rnd = timestamp();

	// 加密串
	var qvData = qvsec[FROM == 'v4138' ? '$xx' : '$xxf'](PLATFORM[FROM], vid, SDTFROM, 1, _rnd);
	var qvstr = '';
	if (qvData) {
		qvstr = `encver=${FROM == 'v4138' ? 2 : 300}&_qv_rmtv2=${qvData}`;
	}

	console.log('getinfo waiting');
	let networkCode = '';
	console.log('player.js fetch start', Date.now());
	return new Promise(function (resolve, reject) {
		wx.getNetworkType({
			success(res) {
				networkCode = {
						'4g': 4,
						'3g': 3,
						'2g': 2,
						'wifi': 1
					}[res && res.networkType] || 0;

				resolve();
			}
		});
	})
		.then(function () {
			return request(
				`https://h5vv.video.qq.com/getinfo?${qvstr}&defn=${defn}&platform=${PLATFORM[FROM]}&otype=json&sdtfrom=${FROM}&_rnd=${_rnd}&appVer=7&${useHLS ? 'dtype=3&' : ''}vid=${vid}&newnettype=${networkCode}`,
				{
					needlogin: true,
					needLoginCase: true
				})
		})
		.catch(function () {
			return request(
				`https://bkvv.video.qq.com/getinfo?${qvstr}&defn=${defn}&platform=${PLATFORM[FROM]}&otype=json&sdtfrom=${FROM}&_rnd=${_rnd}&appVer=7&${useHLS ? 'dtype=3&' : ''}vid=${vid}&newnettype=${networkCode}`,
				{
					needlogin: true,
					needLoginCase: true
				})
		})
		.catch(function () {
			var err = new Error(errorMessages[444]);
			err.em = 444;
			err.code = 'G.' + 444;
			throw err
		})
		.then(function (res) {
			res = res.data;
			console.log('getinfo result:', res);
			return res;
		});
}

module.exports = function () {
	return getInfo.apply(this, arguments)

		// 处理cgi错误
		.then(function (videoinfo) {
			if (videoinfo.em) {
				var err = new Error(errorMessages[videoinfo.em]);
				err.em = videoinfo.em;
				err.code = 'G.' + videoinfo.em;
				throw err
			}
			return videoinfo
		})

		// 处理视频地址
		.then(function (videoinfo) {
			let vlist = videoinfo.vl;
			let video = vlist.vi[0];

			var base = {
				duration: +video.td,
				dltype: videoinfo.dltype,
				// formats: videoinfo.fl.fi.map(item=> ({
				// 	cname: item.cname,
				// 	name: item.name
				// })),
				fmid: videoinfo.fl.fi.filter(item=> +item.sl)[0].id,
				filesize: videoinfo.fl.fi.filter(item=> +item.sl)[0].fs,

				preview: videoinfo.preview,
				charge: video.ch,

				raw: videoinfo
			};
			if (video.ch < 1) {
				base.preview = videoinfo.preview;
				base.charged = video.ch;
			}

			if (videoinfo.dltype == 3) {
				base.url = video.ul.ui.map(ui=> ui.hls.pt ? (
						ui.url +
						ui.hls.pt +
						'?platform=' + PLATFORM[SDTFROM] +
						'&sdtfrom=' + SDTFROM
					) : ''
				);

				base.url = base.url.filter(url=> url);

				// if (!base.url.length) {
				// 	throw checkVideoError(video, videoinfo);
				// }

			} else {
				// if (!video.fvkey) {
				// 	throw checkVideoError(video, videoinfo);
				// }

				base.url = video.ul.ui.map(ui=>
					ui.url +
					video.fn +
					'?vkey=' + video.fvkey +
					'&br=' + video.br +
					'&fmt=auto' +
					'&level=' + video.level +
					'&platform=' + PLATFORM[SDTFROM] +
					'&sdtfrom=' + SDTFROM
				);
			}

			return base;
		})
};
//
// function checkVideoError(video, videoinfo) {
// 	let err = null;
// 	if (video.ch < 1) {
// 		err = new Error('未付费');
// 		err.em = '0403';
// 		err.code = 'GL.0403';
//
// 	} else {
// 		err = new Error('解析视频地址失败');
// 		err.em = '0503';
// 		err.code = 'GL.0503';
// 	}
// 	err.raw = videoinfo;
// 	return err;
// }