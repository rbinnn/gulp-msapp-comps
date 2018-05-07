// 一些公共的处理函数

var DEFAULT_IMG = 'https://mmocgame.qpic.cn/wechatgame/mEMdfrX5RU3YnFFdslRaeMLfdlRDm8oNYgLUWEPObWdgQcnxgA0vuXX58XknIUo7/0';

var CommonUtil = {
    // 获取默认头像
	getUserHeadImgUrl: function(img, needStr){
        return img ? (needStr ? (img + '/0') : img) : DEFAULT_IMG;
    },
    // 弹窗提示
    showTips: function(txt){
        wx.showModal({
            title: '温馨提示',
            content: txt,
            showCancel: false,
            confirmText: '确定',
            success: function(res) {
                if (res.confirm) {
                    console.log('用户点击确定')
                }
            }
        });
    },
    // 获取字符串长度，大于255的字符长度算2
    getStringLength: function(str){
        var sum = 0;
        for(var i = 0; i < str.length; i++){
            if(str.charCodeAt(i) >= 0 && str.charCodeAt(i) <= 255){
                sum += 1;
            }else{
                sum += 2;
            }
        }
        return sum;
    }
};
module.exports = CommonUtil;

