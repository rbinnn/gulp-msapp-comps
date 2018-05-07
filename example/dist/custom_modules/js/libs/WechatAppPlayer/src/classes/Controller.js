'use strict';
var Message = require("../lib/message");
var Promise = require("../../lib-inject").Promise;

/**
 * 播放流程控制器
 *
 * attr:
 * currentContent
 * state
 *
 * ev:
 * statechange
 * contentchange
 * error
 *
 * videotimeupdate (vod only)
 *
 * method:
 * start()
 * stop()
 * virtual createFlow()
 */
module.exports = class {

	constructor(...args) {

		// 是否已经开始流程，适用于开播前需要确认的场景
		this.started = Promise.defer();
		(new Message).assign(this);

		var model = this.model = new Model([{
			// 播放状态
			// loading, ready, playing, end, error
			name: 'state',
			onChange: (newstate, oldstate)=> {
				this.emit('statechange', newstate, oldstate);
			},
			initialize: 'loading'

		}, {
			// 当前播放content
			name: 'currentContent',
			initialize: null

		}]);

		Object.defineProperties(this, {
			currentContent: {
				get: ()=> model.currentContent
			},
			state: {
				get: ()=> model.state
			}
		});

		this.flow = this.createFlow.apply(this, args);
		this.flow.catch(err=> {
			this.emit('error', err);
		});

		['End', 'Play', 'Pause', 'Timeupdate', 'Error', 'Skip'].forEach(hook=> {
			this['onContent' + hook] = (...args)=> {
				this.emit.apply(this, ['content' + hook.toLowerCase()].concat(args));
			};
			this['on' + hook] = function () {
				console.warn(`不建议再使用video.on${hook}，请使用onContent${hook}`);
				this['onContent' + hook].apply(this, arguments);
			}
		});
	}

	createFlow() {
		/* 待重载 */
	}

	start() {
		this.started.resolve();
		return this;
	}

	stop() {
		this.started.reject();

		this.off();
		return this;
	}
};

/**
 *
 * @constructor
 */
function Model(_configs) {
	var configs = _configs instanceof Array ? _configs : [].slice.call(arguments, 0);
	var object = {};
	configs.forEach(function (config) {
		var _value = config.initialize;
		Object.defineProperty(object, config.name, {
			get: () => {
				return _value
			},
			set: newvalue => {
				let oldvalue = _value;
				_value = newvalue;
				config.onChange && config.onChange(newvalue, oldvalue);
			}
		})
	});
	return object
}