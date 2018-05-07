var app = getApp();
app.block_location = false;

function  getLocation(successCb, failCb, completeCb) {
    var ts = app.location_ts || 0,
        ts_interval = new Date().getTime() - ts;

    if(app.location && ts_interval < 60000){
        console.log("old app.location" + app.location);
        successCb(app.location);
    }else{
        wx.getLocation({
            type: 'gcj02',
            success: function(res) {
                // 兼容getLocationByGcj02
                //app.location_gcj02_res = res;
                
                app.location_ts = new Date().getTime();

                wx.setStorageSync("LOCATION_GCJ02", res);

                app.location = {
                    speed    : res.speed,
                    accuracy : res.accuracy,
                    lat      : res.latitude,
                    lng      : res.longitude,
                };
                console.log("new: wx.getLocation" + app.location);
                wx.setStorageSync("LOCATION_NORMAL", app);

                successCb(app.location);
            },
            fail: failCb,
            complete: function(res){
                //completeCb(res);
                console.log('请求地址：' + new Date());
            }
        });
    }   
}

// 专供地图使用，解决客户端频繁调用被限制的问题
function  getLocationByGcj02(successCb, failCb, completeCb) {
    var ts = app.location_ts || 0,
        ts_interval = new Date().getTime() - ts;

    if(app.location_gcj02_res && ts_interval < 60000){
        console.log("old app.location_gcj02_res" + app.location_gcj02_res);
        successCb(app.location_gcj02_res);
    }else{
        wx.getLocation({
            type: 'gcj02',
            success: function(res) {
                
                app.location_ts = new Date().getTime();

                // 兼容上面的getLocation
                app.location = {
                    speed    : res.speed,
                    accuracy : res.accuracy,
                    lat      : res.latitude,
                    lng      : res.longitude,
                };
                wx.setStorageSync("LOCATION_NORMAL", app);

                app.location_gcj02_res = res;
                wx.setStorageSync("LOCATION_GCJ02", res);

                console.log("new app.location_gcj02_res" + app.location_gcj02_res);
                successCb(res);
            },
            fail: failCb,
            complete: function(res){
                completeCb(res);
                console.log('请求地址：' + new Date());
                /*wx.showToast({
                    title: '地址请求太快：' + JSON.stringify(res),
                    icon: 'loading',
                    duration: 100000
                });*/
            }
        });
    }   
}


module.exports = {
    getLocation : getLocation,
    getLocationByGcj02 : getLocationByGcj02
};
