/*
*	@desc 这是一个用于弥补wx.request问题的，特别是数据上报。会有很多接口调用。
*   wx.request不允许一次发多于5个的请求。这是一个全局的。
*   因此，这个module也是全局的。
*/

/*
*	@desc 先取得一个全局的__app__对象。
*/
var __app__ = wx;
/*
*	@desc 设置当前最大 的请求数
*/
__app__.MAX_REQUEST_COUNT = __app__.MAX_REQUEST_COUNT || 5;
/*
*	@desc 记录当前有多少个请求正在Running，以计算有多少个可以出列。
*/
__app__.currentRunning = 0;
/*
*	@desc 记录请求队列，它并不限制请求大小。
*/
__app__.requestQueue = [];
/*
*	@desc 定义一下请求队列的每一项结构。
*/
var requestQueueItem = {
    context:__app__,    //请求可能需要保存的context
    reqData:null    //请求用的真实数据。
};

/**
 * 
 * @desc 封装那个5个限制的请求。
 * @doc https://mp.weixin.qq.com/debug/wxadoc/dev/api/network-request.html#wxrequestobject
 * @param {Object} data 
 */
var request = function(data){
    
    /*
    *	@desc 克隆一下请求队列的Item
    */
    var rqi     = Object.create(requestQueueItem);
    rqi.reqData = data;
    
    /*
    *	@desc 把请求入队。不论是什么状态。生产者
    */
    __app__.requestQueue.push(rqi);
    /*
    *	@desc 定义消费这个队列的消费者,消费者可以是在多个页面里。
    */
    var comsumer = function(){
        if(__app__.currentRunning < __app__.MAX_REQUEST_COUNT){
            __app__.currentRunning++;
            var _qdata = __app__.requestQueue.shift();
            var wxRequestData = _qdata.reqData;

            var tempComplete = wxRequestData.complete;
            wxRequestData.complete = function(res){
                
                tempComplete && tempComplete.call(rqi.context,res);
                __app__.currentRunning--;

                /*
                *	@desc 如果有一个请求没完。则由上一个请求重新发起。
                */
                if(__app__.requestQueue.length > 0){
                    comsumer.call(__app__);
                }
            }
            wx.request(wxRequestData);
        }
    }
    /*
    *	@desc 开始消费
    */
    comsumer();
}
module.exports = request;