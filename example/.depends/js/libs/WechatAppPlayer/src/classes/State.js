'use strict';
var Message = require("../lib/message");
var Promise = require("../../lib-inject").Promise;

module.exports = class State {
	static create(states, options) {
		return new State(states, options)
	}

	constructor(states, options) {
		this.destroyed = false;
		let stateKeys = Object.keys(states);
		stateKeys.forEach(key=> {
			!(states[key].to instanceof Array) && (states[key].to = []);
			!(typeof states[key].beforeLeave == 'function') && (states[key].beforeLeave = noop);
			!(typeof states[key].beforeEnter == 'function') && (states[key].beforeEnter = noop);
			!(typeof states[key].afterLeave == 'function') && (states[key].afterLeave = noop);
			!(typeof states[key].afterEnter == 'function') && (states[key].afterEnter = noop);
		});

		this.message = new Message;
		this.states = states;

		this._state = stateKeys[0];
		this._laststate = '';

		Object.defineProperties(this, {
			'state': {
				get: function () {
					return this._state;
				}
			},
			'lastState': {
				get: function () {
				    return this._laststate;
				}
			}
		})
	}

	/**
	 *
	 * @param newstate
	 * @param options
	 *  force 不触发before
	 *  slient 不触发after
	 */
	setState(newstate, options) {
		options = options || {}
		let force = options.force || false;
		let slient = options.silent || false;

		let states = this.states;

		// 检查是否允许
		if (!force && !~states[this._state].to.indexOf(newstate)) {
			// to数组里没有这个新状态，不让跑
			// 看看是否throw 比较好
			return;
		}
		let oldstate = this._state;

		if (slient) {
			this._laststate = this._state;
			this._state = newstate;

		} else {
			let cantswitch = false;
			if (!force) {
				cantswitch = states[oldstate].beforeLeave(newstate) === false;
				cantswitch = states[newstate].beforeEnter(oldstate) === false || cantswitch === true;
			}

			if (cantswitch) {
				return;
			}

			this._laststate = this._state;
			this._state = newstate;
			this.message.emit('change', newstate, oldstate);

			states[oldstate].afterLeave(newstate);
			states[newstate].afterEnter(oldstate);

		}

		if (states[newstate].to.length == 0) {
			// 进入了一个终结状态
			this.message.emit('end', newstate);
			this.message.off();
		}
		return this;
	}

	/**
	 * 获取下一次进入某状态的promise
	 */
	getStatePromise(state) {
		if (typeof state != 'function') {
			let _state = state;
			state = function (newstate) {
			    return newstate == _state;
			}
		}

		return new Promise((resolve, reject)=> {
			let off = this.message.on('change', newstate=> {
				if (state(newstate)) {
					off();
					resolve();
				}
			});
			this.message.on('end', newstate=> {
				off();
				reject(new Error('state ended:' + newstate));
			}, true);
		});
	}

	onChange(fn) {
		this.message.on('change', fn);
		return this;
	}
};

function noop() {
    
}