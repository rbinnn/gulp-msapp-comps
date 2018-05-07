// plugins/components/nywishes.js
Component({
    options: {
        multipleSlots: true
    },
    /**
     * 组件的属性列表
     */
    properties: {
        partA: {
            type: String,
            value: '1',
            observer: (n, o)=>{
                console.log(`Plugin property part1 change "${o}" -> "${n}"`)
            }
        },
        partB: {
            type: String,
            value: "我是内置属性B，未改变"
        }
    },
    
    externalClasses: [
        'ext-class'
    ],
    /**
     * 组件的初始数据
     */
    data: {
        valuea: 111,
        valueb: 222
    },

    /**
     * 组件的方法列表
     */
    methods: {
        changeA: function (evt) {
            let self = this;
            evt.data = self.data;
            self.triggerEvent('eventa', evt, {})
        },
        changeB: function(evt){
            let self = this;
            evt.data = self.data;
            self.triggerEvent('eventb', evt, {})
        },
        innerEventB: function(evt){
            wx.showModal({
                title:"插件弹框",
                content:"插件内事件响应弹框",
                showCancel:false
            })
        }
    },
    created: function(c) {
        wx.request({
            url: 'https://game.weixin.qq.com/cgi-bin/h5/static/gamecenter/index.html?abt=18',
            success:function(rs){
                console.log(rs)
            },
            fail : function(rs){
                console.log(rs);
            }
        })
    },
    attached: function (c) {
        let k = require('../../index');
        let self = this;
        k.setDataFn('nywishes', function (data) {
            self.setData(data);
        });
    }
})