/**
 *  Simple Pub/Sub module
 *  @tencent/message
 *  @author sendguan
 **/

'use strict';
function Message() {
	this._evtObjs = {};
	this._outdatedMsgs = {};
}
Message.prototype.on = function (evtType, handler, _once) {
	if (!this._evtObjs[evtType]) {
		this._evtObjs[evtType] = [];
	}
	this._evtObjs[evtType].push({
		handler: handler,
		once: _once
	})
	var that = this
	return function () {
		that.off(evtType, handler)
	}
}
Message.prototype.wait = function (evtType, handler) {
	if (this._outdatedMsgs[evtType]) {
		handler.apply(null, this._outdatedMsgs[evtType])
		return noop
	} else {
		// call once
		return this.on(evtType, handler, true)
	}
}
Message.prototype.off = function (evtType, handler) {
	var that = this
	var types;
	if (evtType) {
		types = [evtType];
	} else {
		types = Object.keys(this._evtObjs)
	}
	types.forEach(function (type) {
		if (!handler) {
			// remove all
			that._evtObjs[type] = [];
		} else {
			var handlers = that._evtObjs[type] || [],
				nextHandlers = [];

			handlers.forEach(function (evtObj) {
				if (evtObj.handler !== handler) {
					nextHandlers.push(evtObj)
				}
			})
			that._evtObjs[type] = nextHandlers;
		}
	})

	return this;
}
Message.prototype.emit = function (evtType) {
	var args = Array.prototype.slice.call(arguments, 1)

	this._outdatedMsgs[evtType] = args
	var handlers = this._evtObjs[evtType] || [];
	handlers.forEach(function (evtObj) {
		if (evtObj.once && evtObj.called) return
		evtObj.called = true
		try {
			evtObj.handler && evtObj.handler.apply(null, args);
		} catch(e) {
			console.error(e.stack || e.message || e)
		}
	})
}
Message.prototype.emitAsync = function () {
	var args = arguments
	var ctx = this
	setTimeout(function () {
		ctx.emit.apply(ctx, args)
	}, 0)
}
Message.prototype.assign = function (target) {
	var msg = this;
	['on', 'off', 'wait', 'emit', 'emitAsync'].forEach(function (name) {
		var method = msg[name]
		target[name] = function () {
			return method.apply(msg, arguments)
		}
	})
}
function noop() {
}
/**
 *  Global Message Central
 **/
;(new Message()).assign(Message)
module.exports = Message;