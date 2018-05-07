'use strict';
// http://info.zb.video.qq.com/?cnlid=101920702&host=qq.com&cmd=2&qq=0&guid=asd&txvjsv=2.0&stream=2&debug=&ip=&system=1&sdtfrom=10801&livepid={pid}&callback=jsonp4
const PLATFORM = require("../../util/platform-config").APP_PLATFORM;
var request = require("../../../lib-inject").request;
var cache = require("../../module/cache");
var qvsec = require("../../lib/algorithm/qvsec");
var timestamp = require("../../lib/algorithm/fillTimeStamp");

var guid = cache.get('tvp_guid');
if (!guid) {
	guid = Math.random().toString(16).substring(2);
	cache.set('tvp_guid', guid);
}

module.exports = function (sid, pid, FROM, defn) {
	var _rnd = timestamp();

	// 加密串
	var qvData = qvsec[FROM == 'v4138' ? '$xxzb' : '$xxzbf'](PLATFORM[FROM], sid, 1, 1, _rnd);
	var qvstr = '';
	if (qvData) {
		qvstr = `encver=${FROM == 'v4138' ? '201' : '301'}&_qv_rmtv2=${qvData}`;
	}

	return request(
		'https://info.zb.video.qq.com/?' +
		`host=qq.com&cmd=2&qq=0&guid=${guid}&appVer=7&stream=2&ip=&system=1` +
		`&sdtfrom=${PLATFORM[FROM]}&livepid=${pid}&cnlid=${sid}&_rnd=${_rnd}&${qvstr}`,
		{
			needlogin: true
		}
	);
};