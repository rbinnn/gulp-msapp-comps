var Promise = require('../libs/Promise');
var SESSION_KEY = '__session';
var NET   	= require('./net');
var Util 	= require('./util');

var Login = {
	loginWXGame: function (code){
	  	return new Promise((resolve, reject) => {
	  		console.log(JSON.stringify({
		        	code: code,
		        	weapp_type:1
		        }) );
		    NET.request({
		        url: 'https://game.weixin.qq.com/cgi-bin/gameweappwap/login',
		        data: JSON.stringify({
		        	code: code,
		        	weapp_type:1
		        }),
		        method: "POST",
		        header: {
		            'content-type': 'application/json'
		        },
		        success: resolve,
		        fail: reject
		    })
	  	})
	},
	checkWXLogin(cbk) {
	    var self = this;
	    wx.checkSession({
	        success() {
	            var session = Util.getKeyValue(SESSION_KEY) || {};
	            if(session.errcode === NET.OK) { 
	              // 有session_id
	              self.session = session;
	              typeof (cbk) === 'function' && cbk(session);
	            } else { 
	              //无session_id
	              self.loginWX(cbk);
	            }
	        },
	        fail(res) {
	            self.loginWX(cbk);
	        }
	    });
	},
	/*
 	* cbk(res) 
 	res = {		
 		errcode: 1,
		errmsg: '32fds',
		data: {
			session_id: 33,
			user_id: 333
		}
	}
 	*/
  	loginWX(cbk) {
  		//用户信息授权
	    var self = this;
	    wx.login({
	      	success(res) {
		        res = res || {};
		        if (res.code) {
		            self.loginWXGame(res.code).then(result => {
		                result       = result || {};
		                wx.setStorageSync(SESSION_KEY, result);
		                typeof (cbk) === 'function' && cbk(result);
		            });
		        } else { 
		        	// 小程序版本不支持
		            result.errcode = NET.SYSTEM_NOT_SUPPORT;
		           	typeof (cbk) === 'function' && cbk(result);
		        }
		        self.session = res;
	    	},
	    	//拒绝授权获取用户信息
	      	fail(res) {
	          	var res = {
		            res     : res || {},
		            errcode : NET.USER_AUTH_REJECT,
		            errmsg  : 'login rejected by user'
	          	}
	          	typeof (cbk) === 'function' && cbk(res)
	          	self.session = res;
	      	}
	  	});
  	}
}
module.exports = Login;
