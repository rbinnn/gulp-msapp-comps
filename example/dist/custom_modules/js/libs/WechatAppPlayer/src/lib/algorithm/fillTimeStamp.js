'use strict';

module.exports = function timestamp(len) {
	len = len || 10;
	var timestamp = parseInt(+new Date()) + '';
	if (timestamp.length === len) {
		return timestamp;
	} else if (timestamp.length > len) {
		return timestamp.substring(0, len);
	} else {
		var index = len - timestamp.length;
		while (index > 0) {
			timestamp = '0' + timestamp;
			index--;
		}
		return timestamp;
	}
};