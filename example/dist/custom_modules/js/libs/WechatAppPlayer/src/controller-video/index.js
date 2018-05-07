'use strict';
var Promise = require("../../lib-inject").Promise;
var GetinfoFlow = require("./flow-getinfo/index");
var PlayFlow = require("./flow-play/index");
var PlayReporter = require("./reporter");
var Reporter = require("../module/reporter/index");
var Controller = require("../classes/Controller");

// 给广告搭个桥
require("./flow-getinfo/data/ad")
	.reporter
	.on('report', function (url) {
		Reporter.any(url)
	});

/**
 * 一个视频生命流程
 * @param cfg
 *  vid
 *  cid
 *  from 平台号
 *  defn 清晰度
 *  noad
 *
 * @param hook
 * @returns {{flow: (Promise.<T>|*|Promise), start: exportee.start, stop: exportee.stop}|*}
 */
class VideoController extends Controller {

	createFlow(cfg, hook) {
		cfg = cfg || {};
		hook = hook || {};

		//////////////////////////definition//////////////////////////////
		if (cfg.from != 'v4138') {
			// 只有腾讯视频允许切换清晰度,去广告
			cfg.defn = '';
			cfg.noad = false;
		}

		var {getReportParam} = hook;
		var getOpenid = new Promise(resolve=> {
			getReportParam ? getReportParam(function (err, res) {
				resolve((res && res.hc_openid) || '');
			}) : resolve('');
		});

		var reporter = PlayReporter({
			cid: cfg.cid, vid: cfg.vid
		}, {
			getReportParam
		});
		//////////////////////////definition//////////////////////////////
		var model = this.model;
		console.log('getOpenid start', Date.now());

		var flow = getOpenid

			.then(openid=> {
				cfg.openid = openid
				return GetinfoFlow(cfg)
			})

			.then(cfg=> {
				model.state = 'ready';

				// 创建播放流程，创建完后会马上触发一次changeContent，但是没有currentContent
				// 调用start后，会真正开始
				var playflow = this.playflow = PlayFlow(cfg, this, (e)=> {
					model.currentContent = e.currentContent;
					this.emit('contentchange', e);
				});
				reporter.setPlayFlow(playflow);
				reporter.setVideoInfo(cfg.videoinfo);

				playflow.on('videotimeupdate', (...args)=> {
					this.emit.apply(this, ['videotimeupdate'].concat(args))
				});
				playflow.on('videostart', (...args)=> {
					this.emit.apply(this, ['videostart'].concat(args))
				});
				// 等待上层开始命令
				return this.started.promise;
			})

			.then(()=> {
				model.state = 'playing';
				// 开始播放流程
				return this.playflow.start();
			})

			.then(ret=> {
				// 结束喽
				model.state = 'ended'
			})

			.catch(err=> {
				model.state = 'error';

				this.playflow && this.playflow.stop();
				reporter.error(err);
				throw err
			});

		this.switchDefn = fname=> {
			return getOpenid
				.then(function (openid) {
					return GetinfoFlow({
						vid: cfg.vid, 
						from: cfg.from, 
						cid: cfg.cid, 
						openid,
						defn: fname,
						noad: true
					})
				})
				.then(data=> {
					this.playflow.switchVideo(data);
				});
		};
		return flow;
	}
	
	// start() {
	// 	super.start();
	// }

	stop() {
		this.model.state = 'ended';
		super.stop();
		this.playflow && this.playflow.stop();
	}

}

module.exports = function (cfg, hook) {
    return new VideoController(cfg, hook);
};