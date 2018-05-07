// pages/index.js
var app = getApp();
Page({

    /**
     * 页面的初始数据
     */
    data: {

    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        this.nywishes = requirePlugin('nywishes');
        var sess = app.session();
        setTimeout(()=>{
            this.setData({
                appid : app.config.appid,
                session_id: sess.sessionId
            });
            console.log(this.data)
        }, 300)
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow: function () {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide: function () {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload: function () {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    },
    showModal: function(){
        this.setData({
            showModal: true,
            title : '自定义对话框',
            content: '自定义对话框正文内容，仔细看看'
        })
    },
    showRegion : function(){
        this.setData({
            showRegion: true,
            appid: 'wx95a3a4d7c627e07d',
            session_id : this.data.session_id
        })
    },
    updateSessionId: function(){
        var sess = app.session();
        var self = this;
        self.setData({
            session_id: sess.sessionId
        })
    },
    showMsg: function (evt) {
        wx.showModal({
            title: '主程序事件绑定',
            content: '主程序内元素被点击，主程序事件',
            showCancel: false
        })
    },
    changeMe: function(){
        this.setData({ click_data: this.data.click_data ? "": "《你点我了》"})
        wx.showModal({
            title: "主小程序弹框",
            content: "主小程序内事件响应弹框",
            showCancel: false
        })
    },
    getGift: function(){
        console.log("you click me");
    },
    changePartA: function(evt){
        this.setData({ partA: '新属性值，插件内响应并通知到主小程序' })
    },
    changeValueA: function (evt) {
        this.nywishes.setData('nywishes', { valuea: Math.random(), valueb: Date.now() });
    },
    changeValueB: function (evt) {
        this.nywishes.setData('godknowyou', {valuec:Math.random(), valued:Date.now()});
    }
})