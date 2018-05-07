/**
 * 给wx.request包装一层，方便后续统一加CSRF、返回码上报等。
 */
var parseBody = require("./parse-body");
var Promise = require('./es6-promise');

var exportee = module.exports = {
	request: function (config) {
		config.success = (function (fn) {
			fn = fn || function() {};

			return function (res) {

				if (res && res.statusCode == 200) {
					try {
						res.data = parseBody(res.data);

					} catch(e) {
					}
				}
				fn(res);
			}
		})(config.success);

		return wx.request(config);
	},
	
	get: function (url, option) {
		option = {};
		return new Promise((resolve, reject)=> {
			exportee.request({
				url: url,
				data: option.data || {},
				header: option.header || {},
				method: "GET",
				success: function (res) {
					resolve(res);
				},
				fail: function (err) {
					reject(err)
				},

				needlogin: option.needlogin
			})
		})
	}
};