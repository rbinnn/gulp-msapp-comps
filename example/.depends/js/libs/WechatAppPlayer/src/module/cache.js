'use strict'

module.exports = {
	/**
	 * LS cache
	 * @param {String} k      key
	 * @param {Object} v      value
	 * @param {Number} expire 过期时间，毫秒
	 */
	set: function (k, v, expire) {
		wx.setStorageSync('_cache_' + k, {
			expr: expire || 0,
			date: + new Date(),
			data: v
		})
	},
	get: function (k) {
		k = '_cache_' + k
		var v =  wx.getStorageSync(k)
		if (!v) return null
		if (!v.expr) return v.data
		else {
			if (!v.expr) {
				return v.data
			} else if (new Date() - (v.date + v.expr) < 0) {
				return v.data
			} else {
				wx.removeStorageSync(k)
				return null
			}
		}
	},
	del: function (k) {
		k = '_cache_' + k;
		wx.removeStorageSync(k)
	}
};