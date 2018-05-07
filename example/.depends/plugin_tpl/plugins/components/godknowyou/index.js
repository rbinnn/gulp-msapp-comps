// plugins/components/godknowyou.js
Component({
    /**
     * 组件的属性列表
     */
    properties: {

    },
    externalClasses: [
        'ext-class'
    ],

    /**
     * 组件的初始数据
     */
    data: {
        valuec: 333,
        valued: 444
    },

    /**
     * 组件的方法列表
     */
    methods: {
        changeB: function (evt) {
            let self = this;
            evt.data = self.data;
            this.triggerEvent('eventg', evt, {})
        }
    },
    attached: function (c) {
        let k = require('../../index');
        let self = this;
        k.setDataFn('godknowyou',function (data) {
            self.setData(data);
        });
    }
})