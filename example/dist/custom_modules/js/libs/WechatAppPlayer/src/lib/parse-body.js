'use strict';
/**
 * 处理jsonp接口的返回成为json
 * @param body
 */
module.exports = function parseBody(body) {
	if (typeof body != 'string') {
		return body
	}
	body && (body = body.trim());
	// 具有qz服务器特色的返回 "QZOutputJson={}"
	if (body && (/^(data|QZOutputJson)=/.test(body))) {
		body = body.replace(/^(data|QZOutputJson)=/, '').replace(/;?$/, '');
	}

	try {
		return JSON.parse(body)
	} catch (e) {
		throw new Error('parse jsonp body failed')
	}
};