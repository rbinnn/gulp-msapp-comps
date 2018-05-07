'use strict';
var message = new (require("../../lib/message"));
var reportQueue = require("./report-queue");
reportQueue.onReport = function (cfg) {
	Reporter.emit('report', cfg)
};
var reportCache = require("./report-cache");

var Reporter = {};

Reporter.any = function (url) {
	reportQueue.push(url);
};

// 进入后台，保存状态
Reporter.saveState = function () {
	console.log('reporter.js', 'saveState');
	Reporter.emit('_save');
};

// 回到前台，恢复状态
Reporter.restoreState = function () {
	console.log('reporter.js', 'restoreState');
	Reporter.emit('_restore')
};

// 重新启动了，找回状态
Reporter.checkState = function () {
	console.log('reporter.js', 'checkState');
	reportCache
		.getAll()
		.forEach(reportQueue.push);

	reportCache.del();
};

Reporter.reportCache = reportCache;

message.assign(Reporter);

module.exports = Reporter;