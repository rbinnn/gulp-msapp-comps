'use strict';
var GetinfoFlow = require("./flow-getinfo/index");
var Controller = require("../classes/Controller");
var Content = require("../classes/Content");

class LiveController extends Controller {
	createFlow(cfg, hook) {

		var {sid, from, pid, defn, noad} = cfg;
		if (from != 'v4138') {
			// 只有腾讯视频允许切换清晰度,去广告
			defn = '';
			noad = false;
		}
		var content = null;

		let flow = GetinfoFlow(
			sid, pid, from
		).then(res=> {
			content = new Content({
				url: res.data.playurl
			});
			this.emit('contentchange', {
				currentContent: content
			});
		});

		['End', 'Play', 'Pause', 'Timeupdate', 'Error', 'Skip'].forEach(hook=> {
			this.on(
				'content' + hook.toLowerCase(),
				function (contentid, ...args) {
					content && content['onContent' + hook].apply(content, args);
				}
			);
		});

		return flow;
	}

	stop() {
		super.stop();
		this.playflow && this.playflow.stop();
	}
}

module.exports = function (cfg, hook) {
    return new LiveController(cfg, hook)
};