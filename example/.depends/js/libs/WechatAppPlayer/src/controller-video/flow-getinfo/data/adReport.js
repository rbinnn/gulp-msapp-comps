'use strict';
var Message = require("../../../lib/message");
var cache = require("../../../module/cache");

var closeReport = "https://t.l.qq.com?t=s";
var dp3Report = "https://dp3.qq.com/stdlog/?bid=weixin&";
var message = new Message();

var exportee = module.exports = {
	/**
	 * 更新url中的参数值，同名的会被覆盖
	 */
	updateUrlParam: function(url, data) {
		try {
			var param = getUrlParas(url);
			var t_url = url;
			var flag = true;

			if (url.indexOf("?") != -1) {
				t_url = url.substring(0, url.indexOf("?"));

				var o;

				for (o in data) {
					param[o] = data[o];
				}

				for (o in param) {
					if (flag) {
						flag = false;
						t_url += "?" + o + "=" + param[o];
					} else {
						t_url += "&" + o + "=" + param[o];
					}
				}
			}
		} catch (e) {
			t_url = "";
		}

		return t_url;
	},
	reportDp3: function(step, adtype, timestamp, merged, errorcode, trycount, openid, rptVars) {
		console.log("开始dp3上报");
		var tempStr = dp3Report + "step=" + step + "&merged=" + merged + "&errorcode=" + errorcode + "&trycount=" + trycount + "&openid=" + openid;
		//console.log(rptVars);
		//console.log(this.updateUrlParam)
		tempStr = this.updateUrlParam(tempStr, rptVars);
		try {
			this.pingUrl(tempStr);
		} catch (e) {
			console.log("dp3上报失败");
		}
	},

	reportWisdomPoint: function(actid, oid, mid, locid) {
		console.log("开始智慧点上报");
		var reportUrl = closeReport + "&actid=" + actid;
		reportUrl += "&oid=" + oid + "&mid=" + mid + "&locid=" + locid;
		try {
			this.pingUrl(reportUrl);
		} catch (e) {}
	},

	pingUrl: function(_url, _appuser, _Lturn, _n) {
		//_n=1，上报己方URL
		console.log("ping上报地址：" + _url);
		var reportTime = (new Date()).getTime();
		_url = this.updateUrlParam(_url, {
			reportTime: reportTime
		});
		//_url = getHttpsUrl(_url);
		//_url = _url.replace("livep", "p");
		// console.log("加上参数后的上报地址为：" +(_url+","+_appuesr+","+_Lturn+","+_n));
		//抛出上报事件
		message.emit('report', {
			reportUrl: _url
		});
		console.log("用message抛出上报事件");
	}
}


exportee.reporter = message;

function getUrlParas(url) {
	var index = url.indexOf("?");
	var para = new Object();
	var newurl = url;
	if (index >= 0) {
		newurl = newurl.substr(index + 1);
		var paraArray = newurl.split("&");
		var parastr;
		var strArray;
		for (var i = 0; i < paraArray.length; i++) {
			parastr = paraArray[i];
			strArray = parastr.split("=");
			if (strArray.length > 1)
				para[strArray[0]] = strArray[1];
			else
				para[strArray[0]] = "null";
		}
	}
	return para;
}

function getHttpsUrl(url) {
	console.log("要转换的url是：" + url);
	//if (!url || !rich.isHttps) return url;
	if (!url) return url;
	var urlArr = url.match(/^(http:\/\/|https:\/\/)(.*)/);
	if (!urlArr || urlArr.length < 2) return url;
	return "https://" + urlArr[2];
}