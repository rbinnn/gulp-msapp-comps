'use strict';
/**
 * 缓存在本地的上报内容
 * @type {{}}
 */
var cache = require("../cache");

var memory = cache.get('tvp_report') || {};

exports.get = function (key) {
	return memory[key]
};
exports.set = function (key, value) {
	memory[key] = value;
	cache.set('tvp_report', memory);
};
exports.del = function (key) {
	if (key) {
		delete memory[key];

	} else {
		memory = {};
	}
	cache.set('tvp_report', memory);
};
// 用数组的形式获取所有需要上报的url
exports.getAll = function () {
    return Object.keys(memory).map(key=> memory[key]);
};