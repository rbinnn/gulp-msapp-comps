'use strict';
var request = require("../../../lib-inject").request;

module.exports = (function (message) {
	const MAX_RELEASE_TIMEOUT = 3000;
	var self;

	var lock = false;
	var queue = [];
	var maxReleaseTimer = null;

	function doReport(url) {

		if (~url.reportUrl.indexOf('btrace.qq.com')) {
			request(url.reportUrl)
				.then(function () {
					self.release();
				})
				.catch(function () {
					self.onReport && self.onReport(url);

				})

		} else {
			self.onReport && self.onReport(url);
		}

		maxReleaseTimer = setTimeout(function () {
			self.release();
		}, MAX_RELEASE_TIMEOUT);
	}

	return (self = {
		release: function (url) {
			if (lock && url && url != lock) { // 如果release的url和当前不一样，忽略
				return;
			}
			lock = false;
			clearTimeout(maxReleaseTimer);
			if (queue.length) {
				doReport(queue.shift());
			}
		},
		push: function (url) {
			if (!lock) {
				lock = url;
				doReport(url);

			} else {
				queue.push(url);
			}
		}
	})
})();