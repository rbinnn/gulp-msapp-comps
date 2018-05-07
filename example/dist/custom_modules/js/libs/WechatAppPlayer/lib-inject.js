'use strict';
var promisePath = "./src/lib/es6-promise";
var requestPath = "./src/lib/request";

/**
 * 如果希望减少播放器带来的代码尺寸，或是使用自己的promise库，可以修改tvp.js
 * @type {{}}
 */

module.exports = {
	Promise: require("./src/lib/es6-promise"),

	request: require("./src/lib/request").get
};