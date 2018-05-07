'use strict';
var request = require("../../../../lib-inject").request;
var Message = require("../../../lib/message");
var cache = require("../../../module/cache");
var adReport = require("./adReport");
var md5 = require("./md5");

var ad_type = "WL";
var vid = "";
var live = 0;
var coverid = "";
var chid = 0;
var pu = -1;
var tpid = 1;
var reportTime;
var trueviewAd;
var skipable = -1;
var currentAdDuration = 0;
var allAdDuration = 0;
var rfid = "";
var openid = "";
//初始时间
var startTime;

//cookie
var Lturn;
var appuesr;
var order_data;

var message = new Message();

/**
 * 由于组件引用组件不太好弄，考虑到后续甚至有可能要把播放器独立出sdk给第三方使用
 * 这里暂时改成与databinding解耦的模式...
 *
 * @param query   vid,cid等
 * @returns {{adList: Array}} 广告列表 每一个广告是一个function，详见函数末尾的注释。
 */
var exportee = module.exports = function(query) {
	var adList = [];

	console.log('ad video onLoad');
	console.log(query);
	//console.log("tpid:" + paramPromise._result.tpid);
	console.log("当前rfid:" + rfid);
	//console.log(login.getUserInfoSync());
	//console.log(login.getReqHeader());

	if (query.vid) vid = query.vid;
	if (query.live) live = query.live;
	if (query.chid) chid = query.chid;
	if (query.coverid) coverid = query.coverid;
	if (query.pu) pu = query.pu;
	if (query.openid) openid = query.openid;
	//if (paramPromise._result.tpid) tpid = paramPromise._result.tpid;
	console.log("openid:" + openid);
	appuesr = String(md5(openid).substr(0, 16)).toUpperCase();
	console.log("appuesr:" + appuesr);

	createCookie();

	var rptVars = {};

	startTime = (new Date()).getTime();

	//请求后台lview
	return request(
		'https://livew.l.qq.com/livemsg?ty=web&ad_type=' + ad_type +
		'&pf=H5&lt=wx&pt=0&live=' + live +
		'&pu=' + pu + '&rfid=' + rfid + "&openid=" + openid +
		'&v=TencentPlayerV3.2.19.358&plugin=1.0.0&speed=0&adaptor=2&musictxt=&chid=' + chid +
		'&st=0&resp_type=json&_t=1478361546359&rfid=&vid=' + vid +
		'&vptag=&url=&refer=&pid=&mbid=&oid=&guid=&coverid=' + coverid, {
			needlogin: true,
			header: {
				'Cookie': 'appuser=' + appuesr + '; Lturn=' + Lturn,
			}
		}
	).then(function(res) {
		order_data = res;
		if (res.data.adLoc) {
			/*if (res.data.adLoc.rfid) {
				rfid = res.data.adLoc.rfid;
			}*/
			if (res.data.adLoc.tpid) {
				tpid = res.data.adLoc.tpid;
			}
		}

		rptVars = {
			t: "0",
			url: "",
			vid: vid,
			coverid: coverid,
			pf: "H5",
			vptag: "",
			pid: "",
			chid: chid,
			tpid: tpid
		};


		var reportTime = (new Date()).getTime() - startTime;
		console.log("livew请求完成，进行dp3上报,时间为:" + reportTime);
		//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
		//console.log(adReport.reportDp3);
		adReport.reportDp3(2, ad_type, reportTime, 1, 100, 0, openid, rptVars);
		startTime = (new Date()).getTime();

		var adList = getLoading(res.data.adList);
		//adList = adList.slice(0, 2);
		console.log("最终adList:" + adList);
		checkTrueviewAd(adList);
		getAllDuration(adList);
		// console.log(adList[0].reportUrlOther.reportitem[0].url);

		// switchAd(adList[0].image[0].url);
		// console.log(adList[0].image[0].url);
		return adList;
	}, function(e) {
		console.log("livew error，再试一次");
		var reportTime = (new Date()).getTime() - startTime;
		console.log("livew请求失败，进行dp3上报,时间为:" + reportTime);
		//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
		adReport.reportDp3(2, ad_type, reportTime, 1, 202, 0, openid, rptVars);
		startTime = (new Date()).getTime();

		return request(
			'https://livew.l.qq.com/livemsg?ty=web&ad_type=' + ad_type + '&pf=H5&lt=wx&pt=0&live=' + live + '&pu=' + pu + '&rfid=' + rfid + '&v=TencentPlayerV3.2.19.358\
&plugin=1.0.0&speed=0&adaptor=2&musictxt=&chid=' + chid + "&openid=" + openid + '&st=0&resp_type=json&_t=1478361546359&rfid=&vid=' + vid + '&vptag=&url=&refer=\
&pid=&mbid=&oid=&guid=&coverid=' + coverid, {
				needlogin: true,
				header: {
					'Cookie': 'appuser=' + appuesr + '; Lturn=' + Lturn
				}
			}
		).then(function(res) {
			order_data = res;
			if (res.data.adLoc) {
				/*if (res.data.adLoc.rfid) {
					rfid = res.data.adLoc.rfid;
				}*/
				if (res.data.adLoc.tpid) {
					tpid = res.data.adLoc.tpid;
				}
			}

			rptVars = {
				t: "0",
				url: "",
				vid: vid,
				coverid: coverid,
				pf: "H5",
				vptag: "",
				pid: "",
				chid: chid,
				tpid: tpid
			};

			var reportTime = (new Date()).getTime() - startTime;
			console.log("livew重试请求完成，进行dp3上报,时间为:" + reportTime);
			//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
			adReport.reportDp3(2, ad_type, reportTime, 1, 100, 0, openid, rptVars);
			startTime = (new Date()).getTime();

			var adList = getLoading(res.data.adList);
			//adList = adList.slice(0, 2);
			console.log("最终adList:" + adList);
			checkTrueviewAd(adList);
			getAllDuration(adList);

			// console.log(adList[0].reportUrlOther.reportitem[0].url);
			// switchAd(adList[0].image[0].url);
			// console.log(adList[0].image[0].url);
			return adList;
		}, function(e) {
			var reportTime = (new Date()).getTime() - startTime;
			console.log("livew error，订单获取失败，返回空数组，进行dp3上报,时间为:" + reportTime);
			//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
			adReport.reportDp3(2, ad_type, reportTime, 1, 202, 0, openid, rptVars);
			startTime = (new Date()).getTime();

			return [];
		})
	}).then(function(adList) {
		adList = adList.map((ad, index) => {
			return function() {
				// 外部通过调用该函数获取每个广告url，因此，此处应该也可以放一些上报逻辑：
				var reportUrlOtherArr = [];
				if (ad.reportUrlOther.reportitem) {
					for (var i = 0; i < ad.reportUrlOther.reportitem.length; i++) {
						reportUrlOtherArr[i] = {
							url: ad.reportUrlOther.reportitem[i].url,
							time: ad.reportUrlOther.reportitem[i].reporttime,
							isReported: false
						};
					}
				}

				var reportUrlSDKArr = [];
				if (ad.reportUrlSDK.reportitem) {
					for (var i = 0; i < ad.reportUrlSDK.reportitem.length; i++) {
						reportUrlSDKArr[i] = {
							url: ad.reportUrlSDK.reportitem[i].url,
							time: ad.reportUrlSDK.reportitem[i].reporttime,
							isReported: false
						};
					}
				}

				console.log("当前广告的trueview开关是否打开：" + ad.trueviewTurn);
				console.log("当前广告是否符合trueview条件：" + trueviewAd);
				//if (ad.trueviewTurn && trueviewAd) {
				if (trueviewAd) {
					console.log("allAdDuration:" + allAdDuration);
					if (allAdDuration <= 5) {
						skipable = 0;
					} else {
						skipable = 5;
					}
				} else {
					skipable = -1;
				}
				console.log("skipable:" + skipable);

				return {
					oid: ad.order_id, //oid
					url: ad.image[0].url, // 广告的url
					reportUrl: {
						url: ad.reportUrl,
						time: ad.ReportTime,
						isReported: false
					},
					reportUrlOther: reportUrlOtherArr,
					reportUrlSDK: reportUrlSDKArr,
					skipable: skipable, //是否可被跳过，0表示一开始就可被跳过，-1表示不可跳过，其他数字表示几秒后可跳过
					duration: ad.duration / 1000,
					allDuration: allAdDuration,
					onSkip: function() { // 当广告被跳过，会回调该函数
						console.log("当前广告被跳过了，上报智慧点10237");
						adReport.reportWisdomPoint(10237, ad.order_id, ad.order_id, "");

						var reportTime = (new Date()).getTime() - startTime;
						console.log("当前广告被跳过，进行dp3上报,时间为:" + reportTime);
						//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
						adReport.reportDp3(4, ad_type, reportTime, 1, "", 0, openid, rptVars);
						startTime = (new Date()).getTime();
					},
					onTimeupdate: function(e) { // 当该广告播放时间更新时的回调
					},
					onEnd: function() { // 广告播放结束事件 可作上报
						var reportTime = (new Date()).getTime() - startTime;
						console.log("当前广告播放结束，进行dp3上报,时间为:" + reportTime);
						//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
						adReport.reportDp3(5, ad_type, reportTime, 1, "", 0, openid, rptVars);
						startTime = (new Date()).getTime();

						//设置rfid
						if (order_data.data.adLoc) {
							if (order_data.data.adLoc.rfid) {
								rfid = order_data.data.adLoc.rfid;
								console.log("rfid赋值成功：" + rfid);
							}
						}
					},
					onStart: function() { // 广告播放开始事件 可作上报
						console.log("当前广告开始播放" + ad);
						console.log("当前广告的oid是：" + this.oid);
						var reportTime = (new Date()).getTime() - startTime;
						console.log("素材加载完成，开始播放，进行dp3上报,时间为:" + reportTime);
						//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
						adReport.reportDp3(3, ad_type, reportTime, 1, "", 0, openid, rptVars);
						startTime = (new Date()).getTime();
						//console.log("当前广告的url是：" + ad.image[0].url);
						this.reportUrl.url = adReport.updateUrlParam(this.reportUrl.url, rptVars);
						//console.log("当前广告的上报地址是：" + this.reportUrl.url + "/上报时间是：" + this.reportUrl.time);
						if (this.reportUrl.time >= 0 && !this.reportUrl.isReported) {
							this.reportUrl.isReported = true;
							try {
								// console.log(request);
								requestPing(this.reportUrl.url);
							} catch (e) {}
						}

						for (var i = 0; i < this.reportUrlOther.length; i++) {
							this.reportUrlOther[i].url = adReport.updateUrlParam(this.reportUrlOther[i].url, rptVars);
							//console.log("当前广告的第三方上报地址是：" + this.reportUrlOther[i].url + "/上报时间是：" + this.reportUrlOther[i].time);
							if (this.reportUrlOther[i].time >= 0 && !this.reportUrlOther[i].isReported) {
								this.reportUrlOther[i].isReported = true;
								try {
									adReport.pingUrl(this.reportUrlOther[i].url);
								} catch (e) {}
							}
						}

						for (var i = 0; i < this.reportUrlSDK.length; i++) {
							this.reportUrlSDK[i].url = adReport.updateUrlParam(this.reportUrlSDK[i].url, rptVars);
							if (this.reportUrlSDK[i].time >= 0 && !this.reportUrlSDK[i].isReported) {
								this.reportUrlSDK[i].isReported = true;
								try {
									adReport.pingUrl(this.reportUrlSDK[i].url);
								} catch (e) {}
							}
						}
					},
					onError: function() { //广告播放出错
						var reportTime = (new Date()).getTime() - startTime;
						console.log("当前广告播放出错，进行dp3上报,时间为:" + reportTime);
						//step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars
						adReport.reportDp3(4, ad_type, reportTime, 1, "", 0, openid, rptVars);
						startTime = (new Date()).getTime();
					},
					onReportEmpty: function() { //空单上报
						console.log("我是空单上报，当前广告的上报地址是：" + this.reportUrl.url);
						this.reportUrl.url = adReport.updateUrlParam(this.reportUrl.url, rptVars);
						try {
							requestPing(this.reportUrl.url);
						} catch (e) {}

						for (var i = 0; i < this.reportUrlOther.length; i++) {
							this.reportUrlOther[i].url = adReport.updateUrlParam(this.reportUrlOther[i].url, rptVars);
							//console.log("当前广告的第三方上报地址是：" + this.reportUrlOther[i].url + "/上报时间是：" + this.reportUrlOther[i].time);
							if (this.reportUrlOther[i].time >= 0 && !this.reportUrlOther[i].isReported) {
								this.reportUrlOther[i].isReported = true;
								try {
									adReport.pingUrl(this.reportUrlOther[i].url);
								} catch (e) {}
							}
						}

						for (var i = 0; i < this.reportUrlSDK.length; i++) {
							this.reportUrlSDK[i].url = adReport.updateUrlParam(this.reportUrlSDK[i].url, rptVars);
							if (this.reportUrlSDK[i].time >= 0 && !this.reportUrlSDK[i].isReported) {
								this.reportUrlSDK[i].isReported = true;
								try {
									adReport.pingUrl(this.reportUrlSDK[i].url);
								} catch (e) {}
							}
						}
					}
					// 此处还可以放置更多的hook函数，具体再议

				}
			};
		});

		return {
			adList: adList
		};
	}).catch(function(e) {
		return {}
	})

};

exportee.reporter = adReport.reporter;

function requestPing(url) {
	request(
		url, {
			header: {
				'Cookie': 'appuser=' + appuesr + '; Lturn=' + Lturn
			}
		}
	).then(function(res) {
		console.log("上报成功");
		console.log(res);
	}, function(e) {
		console.log("上报失败");
		console.log(e);
		url = url + "&appuesr=" + appuesr;
		//抛出上报事件
		message.emit('report', {
			reportUrl: url
		});
		console.log("用message抛出上报事件");
	})
}

function createCookie() {
	Lturn = cache.get('Lturn');
	console.log("Lturn:" + Lturn);
	if (Lturn) {
		Lturn = Lturn + 1;
		console.log("Lturn+1:" + Lturn);
	} else {
		Lturn = Math.floor(Math.random() * 1000);
		console.log("create Lturn:" + Lturn);
	}
	if (Lturn > 999) {
		Lturn = 0;
	}
	cache.set('Lturn', Lturn, 120 * 60 * 1000);

}

function getLoading(items) {
	// console.log(items);
	var ret = [];
	items.item.forEach(function(item, index) {
		// console.log(index, item);
		//if (item.order_id > 10000) {
		ret.push(item);
		//}
	});
	return ret;
}

function checkTrueviewAd(_arrayAdOrder) {
	console.log("开始检查trueview贴片状态");
	var len = _arrayAdOrder.length;
	// 有多少广告算在贴数里
	var trueviewCheckArr = [];
	var trueviewCount = 0;
	for (var i = 0; i < len; i++) {
		_arrayAdOrder[i].trueviewTurn = false;
		if (_arrayAdOrder[i].order_id == 1 || _arrayAdOrder[i].type == "FT") {
			trueviewCheckArr[i] = 0;
		} else {
			if (checkTrueviewTurn(_arrayAdOrder[i])) {
				_arrayAdOrder[i].trueviewTurn = true;
			}
			trueviewCheckArr[i] = 1;
			trueviewCount += 1;
		}
	}

	if (trueviewCount == 1) {
		trueviewAd = true;
	} else {
		trueviewAd = false;
	}
	console.log("trueviewCheckArr内容是：" + trueviewCheckArr + ",trueviewCount值是：" + trueviewCount);
}

function checkTrueviewTurn(_orderItem) {
	console.log("开始检查trueview开关");
	if (_orderItem.params && _orderItem.params != undefined && _orderItem.params != "") {
		var params = _orderItem.params;
		if (params.indexOf("richdata=") != -1) {
			var richdata = params.substr(params.indexOf("richdata=") + 9);
			if (richdata.indexOf("&") != -1) {
				richdata = richdata.substr(0, richdata.indexOf("&"));
			}
			richdata = decodeURIComponent(richdata.replace(/\+/g, " "));
			console.log("转换出来的richdata参数是：" + richdata);
			try {
				var obj = JSON.parse(richdata);
				console.log("转换成json后的对象是：" + obj);
				if (obj.plugins && obj.plugins != undefined) {
					if (obj.plugins.trueview && obj.plugins.trueview != undefined && obj.plugins.trueview == "Y") {
						console.log("trueview开关是打开的Y！");
						return true;
					}
				}
			} catch (e) {
				console.log("richdata解析出错！");
			}
		}
	}
	return false;
}

function getAllDuration(_arrayAdOrder) {
	//获取所有广告总时长
	allAdDuration = 0;
	for (var i = 0; i < _arrayAdOrder.length; i++) {
		if (_arrayAdOrder[i].order_id != 1) {
			allAdDuration += (_arrayAdOrder[i].duration) / 1000
		}
	}
	console.log("广告总时长为：" + allAdDuration);
}