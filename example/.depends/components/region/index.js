let base_url    = 'https://game.weixin.qq.com/cgi-bin/';
let role_list   = base_url + 'gamewap/getsmobaroleinfo?auth_type=8&';
let wap_roles   = base_url + 'actnew/appletrole?';
let _appid      = 'wx95a3a4d7c627e07d';
let _sysObj     = false;
let _session_id = '';
let _objs       = {};

Component({
    behaviors: [
        require('../../behaviors/util'),
    ],
    properties: {
        appid      : String,
        session_id : String,
        confirmText: String,
        cancelText : String,
        visible    : {
            type  : Boolean,
            value : false,
            observer : function(newVal){
                debugger;
                if(newVal){
                    this.showSelectRegion();
                }
            }
        }
    },
    attached: function () {
        this.init();
    },
    methods: {
        init: function () {
            let self = this;
            let data = {
                role_cls      : '',
                partition_cls : '',
                default_cls   : 'ui-d-n',
                confirm_text  : self.data.confirmText,
                cancel_text   : self.data.cancelText,
                show_canel    : !!self.data.cancelText
            };
            let sess    = self.getKeyValue('__SESSION__KEY__')
            console.log(sess);
            _session_id = self.data.session_id || _session_id;
            _appid      = self.data.appid      || _appid;
            self.queryRecentRoles({});
            self.setData(data);
        },
        nullAction :function (){},
        lastRoleShown: function(){
            return _objs.role_shown && _objs.last_role && _objs.last_role.charac_name ? _objs.last_role : false;
        },
        showSelectRegion: function() {
            let self = this;
            if (_objs._partition_quering || _objs._roles_quering) {
                clearTimeout(_objs._ptout);
                _objs._ptout = setTimeout(()=>{self.showSelectRegion();}, 30);
                return;
            }
            if (_objs._need_partition_retry) {
                self.queryParitions({no_hide: true});
                clearTimeout(_objs._ptout);
                _objs._ptout = setTimeout(()=>{self.showSelectRegion();}, 30);
                return;
            }
            self.setData({
                showSelector: true,
                showCancel  : true
            });
        },
        hideSelectRegion: function _hsr() {
            let self = this;
            self.setData({
                showSelector: false
            });
        },
        resetRoles: function () {
            _objs.roles      = [];
            _objs.partition  = {};
            _objs.last_role  = {};
            _objs.role       = {};
            _objs.role_shown = false;
        },
        selectPartition: function (evt) {
            let self = this;
            let data = evt.detail;
            self.setData({
                pidx : data.value,
                roles: []
            });
            self.resetRoles();
            if (_objs.partitions[data.value]) {
                _objs.partition = _objs.partitions[data.value] || {};
                self.queryRoleList({
                    partition: _objs.partition.v
                });
            }
        },
        changeRole: function (evt) {
            let self = this;
            let data = evt.detail;
            if (_objs._roles_quering) {
                clearTimeout(_objs._rtout);
                _objs._rtout = setTimeout(()=>{self.changeRole(evt);}, 30);
                return;
            }
            _objs.role = _objs.roles[data.value] || {};
            _objs.last_role = {
                "charac_name": _objs.role.rolename,
                "charac_no"  : _objs.role.roleid,
                "parname"    : _objs.partition.t,
                "partition"  : _objs.partition.v
            };
        },
        lastRole: function (evt) {
            let self = this;
            let params = {no_hide: true};
            self.resetRoles();
            self.queryParitions(params, function (rs) {
                self.renderPartitions(rs, params);
                self.setData({
                    role_cls     : '',
                    partition_cls: '',
                    default_cls  : 'ui-d-n',
                });
            });
        },
        confirmRole: function () {
            let self = this;
            if (!_objs.role || !_objs.role.rolename || !_objs.partition || !_objs.partition.v) {
                wx.showModal({
                    content   : '请选择分区角色',
                    showCancel: false,
                    complete: function () {
                        self.showSelectRegion();
                    }
                });
                return;
            }
            self.setData({
                showSelector: false,
                showCancel  : true
            });
            let role = {
                "charac_name": _objs.role.rolename,
                "charac_no"  : _objs.role.roleid,
                "parname"    : _objs.partition.t,
                "partition"  : _objs.partition.v
            };
            self.bindRole(role, function (rs) {
                _objs.last_role  = role;
                _objs.role_shown = true;
                self.triggerEvent('confirm', _objs.last_role || {}, {});
            });
        },
        cancelRole: function () {
            let self = this;
            self.setData({
                showSelector: false
            })
            self.triggerEvent('cancel', _objs.last_role || {}, {});
        },
        queryCommon: function (cmd, param, __cbk00__) {
            let self = this;
            _objs[cmd + '_cnt'] = _objs[cmd + '_cnt'] || 0;
            _objs[cmd + '_cnt']++;
            if (_objs[cmd + '_querying']) {
                return;
            }
            _objs[cmd + '_querying'] = true;
            wx.request({
                method: 'GET',
                url: wap_roles + 'session_id=' + _session_id + '&' + param,
                success: function (res) {
                    if (typeof (__cbk00__) == 'function') {
                        __cbk00__(res);
                    }
                },
                complete: function () {
                    _objs[cmd + '_querying'] = false;
                }
            });
        },
        queryParitions: function (par, __cbk21__) {
            let self   = this;
            let params = par && typeof(par) == 'object' ? par : {};
            let param  = [
                'cmd=partitionlist',
                'appid=' + _appid
            ];
            _objs._partition_quering = true;
            self.getReportObj(function (res) {
                param.push('platid=' + (res.device == 'iphone' ? 0 : 1));
                self.queryCommon('partitionlist', param.join('&'), function (rs0) {
                    _objs._partition_quering = false;
                    if (typeof (__cbk21__) == 'function') {
                        __cbk21__(rs0, params);
                    }
                });
            });
        },
        renderPartitions: function (rs, par) {
            let self   = this;
            let params = par && typeof (par) == 'object' ? par : {};
            let res    = rs && typeof(rs)    == 'object' ? rs  : {};
            if (res && res.ret == 0) {
                _objs.partitions = res.data;
                let data = {
                    partitions: res.data
                };
                if (params.no_hide) {
                    data.default_cls = 'ui-d-n';
                    self.setData(data);
                }
                _objs._need_partition_retry = false;
                _objs._load_partition_ready = true;
            } else {
                if (_objs._need_partition_retry) {
                    wx.showModal({
                        confirmColor: "#18B924",
                        showCancel  : false,
                        confirmText : '知道了',
                        title       : '服务器繁忙',
                        content     : '分区表拉取失败，请稍候重试' + (
                            res && res.ret ? ' (' + res.ret + ')' : ''
                        )
                    })
                }
                _objs._need_partition_retry = true;
                _objs.partitions = [];
            }
        },

        // appid       string  必填  appid
        // partition   string  必填  小区id
        // platid      int32   选填  0:ios 1:android
        queryRoleList: function (par, __cbk22__) {
            let self   = this;
            let params = par && typeof(par) == 'object' ? par : {};
            _appid = params.appid || _appid;
            let param = [
                'cmd=rolelist',
                'appid=' + _appid,
                'partition=' + params.partition,
            ];
            _objs._roles_quering = true;
            self.getReportObj(function (res) {
                param.push('platid=' + (res.device == 'iphone' ? 0 : 1));
                self.queryCommon('rolelist', param.join('&'), function (rs1) {
                    _objs._roles_quering = false;
                    if (typeof (__cbk22__) == 'function') {
                        __cbk22__(rs1);
                    }
                })
            });
        },

        renderRoleList: function (rs) {
            let self = this;
            let res  = rs && typeof(rs) == 'object' ? rs : {};
            if (res && res.ret == 0) {
                let list = res.data;
                self.setData({
                    ridx  : 0,
                    roles : list
                })
                _objs.role  = list[0];
                _objs.roles = list;
            } else {
                _objs.roles = [];
                _objs.role  = {};
            }
            _objs.last_role = {
                "charac_name": _objs.role.rolename,
                "charac_no"  : _objs.role.roleid,
                "parname"    : _objs.partition.t,
                "partition"  : _objs.partition.v
            };
        },
        /*
            {"ret":0,"msg":"","data":{"charac_name":"蠢萌和风筝","charac_no":"0","parname":"微信1区-绚烂刀锋","partition":"4011"}}
         */
        queryRecentRoles: function (par, __cbk24__) {
            let self   = this;
            let params = par && typeof (par) == 'object' ? par : {};
            let param  = [
                'cmd=getbind',
                'appid=' + _appid,
            ];
            self.getReportObj(function (res) {
                param.push('platid=' + (res.device == 'iphone' ? 0 : 1));
                self.queryCommon('getbind', param.join('&'), function (rs2) {
                    if (typeof (__cbk24__) == 'function') {
                        __cbk24__(rs2);
                    }
                })
            });
        },
        renderRecentRoles: function (rs) {
            let self = this;
            let res  = rs && typeof(rs) == 'object' ? rs : {};
            if (res && res.ret == 0) {
                _objs._need_role_retry = false;
                if (res.data && res.data.partition) {
                    _objs.last_role = res.data;
                    _objs.role      = {
                        roleid  : res.data.charac_no,
                        rolename: res.data.charac_name
                    };
                    _objs.partition = {
                        v: res.data.partition,
                        t: res.data.parname
                    };
                    let role_name = res.data.charac_name;
                    self.setData({
                        partition_cls: 'ui-d-n',
                        role_cls     : 'ui-d-n',
                        default_cls  : '',
                        default_role : role_name
                    })
                    return;
                }
                _objs._load_role_ready = true;
            } else {
                _objs._need_role_retry = true;
            }
            self.queryParitions({no_hide: true});
        },

        // partition   string  必填  小区ID
        // charac_no   string  必填  角色ID
        // parname     string  必填  小区名称
        // charac_name string  必填  角色名称
        bindRole: function (par, __cbk23__) {
            let self   = this;
            let params = par && typeof (par) == 'object' ? par : {};
            let param  = [
                'cmd=bind',
                'appid='       + _appid,
                'partition='   + params.partition,
                'charac_no='   + params.charac_no,
                'parname='     + params.parname,
                'charac_name=' + params.charac_name
            ];
            self.getReportObj(function (res) {
                param.push('platid=' + (res.device == 'iphone' ? 0 : 1));
                self.queryCommon('bind', param.join('&'), function (rs2) {
                    if (typeof (__cbk23__) == 'function') {
                        __cbk23__(rs2);
                    }
                })
            });
        }
    }
})