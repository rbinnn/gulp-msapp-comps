'use strict';
var Promise = require("../../../lib-inject").Promise;
var Message = require("../../lib/message");
var Content = require("../../classes/Content");
/**
 * 整个视频播放流程
 * @param data
 *  ad
 *  videoinfo
 * @param contentEventProxy
 * @param _changeContent:fn
 *
 * events:
 *  terminate
 *  end
 *  error
 *  adplaying
 *  videoplaying
 *  videoplay
 *  videopause
 *  videotimeupdate
 *
 * @returns {*}
 */
module.exports = function (data, contentEventProxy, _changeContent) {

	/////////////////////////////定义
	// 广告进度信息
	var adProgressInfo = {
		time: 0,
		duration: 0,
		skipable: false
	};
	// 所有内容的map
	var contentMap = {};
	// 所有内容是否播完的map
	var doneMap = {};
	// 需要预加载的内容列表
	var preloadList = [];
	// 播放进度
	var progressDefer = Promise.defer();
	var progress = progressDefer.promise;
	// 消息
	var _message = new Message;
	// 是否已被中止
	var terminated = false;

	var currentContent = null;

	var changeContent = (content)=> {
		console.log('contentchange:', content, doneMap);
		content = content || currentContent;
		var emittee = {
			currentContent: content,

			// 待预加载内容列表，已经播完或者正在播的过滤掉
			preloadContents: preloadList.filter(item=> !doneMap[item.id] && item != content),

			getinforaw: videoinfo.raw
		};
		if (content && content.isad) {
			emittee.progress = adProgressInfo;
		}
		currentContent = content;
		_changeContent(emittee);
	};

	/////////////////////////////流程定义
	var {ad, videoinfo} = data;
	var skipped = false;

	// 广告内容
	(ad.adList || []).forEach(adFactory=> {
		var adconfig = adFactory();

		// 创建广告content
		let content = new Content({
			url: adconfig.url,
			duration: adconfig.duration,
			isad: true
		});
		// 创建一个promise代表这个播放过程
		let contentProgress = new Promise(resolve=> {
			if (skipped || terminated) return;

			content.on('end', function () {
				resolve();
				adconfig.onEnd();
			}, true);
			content.on('error', function () {
				resolve();
				adconfig.onError();
			}, true);
			content.on('timeout', function () {
				resolve();
				adconfig.onError();
			}, true);
			content.on('skip', function () {
				skipped = true;
				resolve();
				adconfig.onSkip();
			}, true);
			content.on('start', function () {
				_message.emit('adplaying', content);
				adconfig.onStart();
			}, true);
			content.on('timeupdate', function (current) {
				adconfig.onTimeupdate(current)
			}, true);

			_message.on('_terminate', function () {
				resolve();
			})
		}).then(r=> {
			doneMap[content.id] = true; // 播完后，在doneMap里把它标记为完成
			return r;
		});

		// 记录content到content map里
		contentMap[content.id] = content;
		// 把这个content放进预加载列表
		preloadList.push(content);
		adProgressInfo.duration += adconfig.duration;
		adProgressInfo.skipable = adconfig.skipable;

		// 把这个过程拼接到主promise上去
		progress = progress
			.then(()=> {
				console.info('playflow: ad.' + adconfig.url);

				// 到这里时，广告即将开始播放，所以可以用于检测空单
				if (adconfig.oid == "1") {
					console.log("这是一个空单，往下走");
					adconfig.onReportEmpty();
					return;
				}

				changeContent(content);
				return contentProgress
					.then(r=> {
						adProgressInfo.time += content.duration;
					})
			});
	});

	// 视频内容
	let videocontent = new Content({
		url: videoinfo.url,
		duration: videoinfo.duration,
		filesize: videoinfo.filesize,
		isad: false,

		preview: videoinfo.preview,
		charged: videoinfo.charged
	});
	// 记录content到content map里
	contentMap[videocontent.id] = videocontent;
	// 把这个content放进预加载列表
	preloadList.unshift(videocontent);

	// 创建一个promise代表这个播放过程
	let videoProgress = new Promise((resolve, reject)=> {
		if (terminated) return;
		let emittedStart = false;

		listenContent(videocontent);

		_message.on('_terminate', function () {
			resolve();
		});
		_message.on('_changevideocontent', function (newcontent) {
			videocontent.off();
			doneMap[videocontent.id] = true; // 换视频了，在doneMap里把它标记为完成
			preloadList.every((content, index)=> { // preloadList里找到并替换
				if (content == videocontent) {
					preloadList.splice(index, 1, newcontent);
					return false
				}
				return true;
			});

			listenContent(newcontent);
			if (currentContent == videocontent) {
				changeContent(newcontent);
			} else {
				changeContent(null);
			}
			contentMap[newcontent.id] = newcontent;
			videocontent = newcontent;
		});

		function listenContent(content) {
			!emittedStart && content.on('start', ()=> {
				_message.emit('videoplaying', content);
				emittedStart = true;
			}, true);
			content.on('start', ()=> {
				_message.emit('videostart', content);
			});
			content.on('play', ()=> {
				_message.emit('videoplay', content);
			});
			content.on('pause', ()=> {
				_message.emit('videopause', content);
			});
			content.on('timeupdate', (time)=> {
				_message.emit('videotimeupdate', time, videoinfo.duration)
			});
			content.on('error', e=> {
				var err = new Error(e ? ((e.detail && e.detail.errMsg) || e.message) : '播放出错');
				err.code = 'P.0';
				reject(err);
			}, true);
			content.on('end', resolve, true);
			content.on('timeout', function (second) {
				_message.emit('videotimeout', second);
			})
		}
	}).then(r=> {
		doneMap[videocontent.id] = true; // 播完后，在doneMap里把它标记为完成
		return r;
	});

	// 把这个过程拼接到主promise上去
	progress = progress
		.then(()=> {
			// videocontent掌权之后，不再单独emit change事件，而是直接触发video的changeContent
			videocontent.off('change');
			videocontent.on('change', function () {
				changeContent(videocontent);
			});
			_message.on('_changevideocontent', function (newcontent) {
				videocontent.off('change');
				newcontent.on('change', function () {
					changeContent(newcontent);
				});
			});
			changeContent(videocontent);
			return videoProgress
		})
		.then(function () {
			_message.emit('end')
		})
		.catch(function (e) {
			_message.emit('error', e);
			throw e;
		});
	changeContent(null);

	var exportee = {
		progress: progress,

		stop() {
			_message.emit('_terminate');
			_message.emit('terminate');
			Object.keys(contentMap).forEach(key=> {
				contentMap[key].off();
			});
			_message.off();
			return this;
		},

		start() {
			progressDefer.resolve();
			return progress;
		},

		on() {
			return _message.on.apply(_message, arguments);
		},

		switchVideo(data) {
			let _videoinfo = data.videoinfo;
			videoinfo = _videoinfo;
			let newvideocontent = new Content({
				url: _videoinfo.url,
				duration: _videoinfo.duration,
				filesize: _videoinfo.filesize,
				isad: false,

				preview: _videoinfo.preview,
				charged: _videoinfo.charged
			});
			_message.emit('_changevideocontent', newvideocontent);
		}
	};

	['End', 'Play', 'Pause', 'Timeupdate', 'Error', 'Skip'].forEach(hook=> {
		contentEventProxy.on(
			'content' + hook.toLowerCase(),
			function (contentid, ...args) {
				let content = contentid && contentMap[contentid] ?
					contentMap[contentid] :
					currentContent;

				content && content['onContent' + hook].apply(content, args);
			}
		);
	});

	return exportee;
};