module.exports = function (msg, page) { // page -> index page
    var app = getApp();
    msg = JSON.parse(msg);
    var state = msg.state;//返回状态码 "00"为成功
    var url = msg.url;//区分是响应的什么内容的数据
    var seq = msg.seq;//接收响应的序列号
    if (url != app.globalData.websocketParams.url.usingStatu && url != app.globalData.websocketParams.url.heartPong) {

        if (app.globalData.websocketParams.seq != 1 && seq != app.globalData.websocketParams.seq_heart) {

            if (seq != app.globalData.websocketParams.seq) {
                return;
            } else {
                setTimeout(function () {
                    app.globalData.indexPage.setData({
                        'disabled': false
                    })
                    wx.hideToast();
                }, 1000)//延迟1秒给后续处理的时间
            }
        }
    }
    var flag_ride = false;//标记是否是骑行中,用于首次状态变为骑行中时设置界面刷新 
    if (url === app.globalData.websocketParams.url.useBike) { //1.开锁

        if (state == '00') {
            //服务器返回开锁成功
            //将骑行中的接口参数赋值
            var order_id = msg.data.order_id;//租车成功订单号
            app.globalData.riding_order = order_id;
            //一旦接口返回了正常信息,就跳到开锁界面,并传值过去
            //修改全局骑行状态为1
            app.globalData.isRidingBike = 1;

            wx.navigateBack();

        }else {
       
            // if (state == '17') {//车辆正在使用中
            //     app.globalData.isRidingBike = 1;//表示开过锁了，但开锁失败
            //     setTimeout(function () {//延迟3秒给滚动条显示的时间再提示
            //         wx.showModal({
            //             title: '开锁失败',
            //             content: msg.state_info,
            //             showCancel: false,
            //             confirmText: "我知道了",
            //             confirmColor: "#34B5E3",
            //             success: function (res) {
            //                 if (res.confirm) {
            //                     wx.navigateBack();
            //                 }
            //             }
            //         })
            //     })
            // } else {
                // app.globalData.isRidingBike = 2;//表示开过锁了，但开锁失败
                if (msg.state_info == '无效参数') {//移除token 重新登录
                    wx.removeStorageSync("token")
                }

                wx.showModal({
                    title: '开锁失败',
                    content: msg.state_info,
                    showCancel: false,
                    confirmText: "我知道了",
                    confirmColor: "#34B5E3",
                    success: function (res) {
                        if (res.confirm) {
                            wx.navigateBack();
                        }
                    }
                })
           
            // }

        }
        console.log("进入22222222222")
    } else if (url === app.globalData.websocketParams.url.usingStatu) { // 2.车辆正在使用中
        console.log("响应'/socket/bike/status/using'")
        

        //将骑行中的接口参数赋值
        if (app.globalData.isRidingBike != 1 && app.globalData.isRidingBike != 2) flag_ride = true;

        if (typeof page == "undefined") page = app.globalData.indexPage;

        app.globalData.isRidingBike = 1;//骑行状态0表示正常,1表示骑行中,2表示结束了骑行
        app.globalData.ridingBikeData = msg;//骑行状态相关数据

        if (flag_ride) {//说明是首次设置骑行状态为1
            page.onShow();//刷新界面
            app.globalData.indexPage = page;
            flag_ride = false;//设置为false 下次进入不是首次，不需再刷新
        } else {//不是第一次则更新骑行视图中参数
            //设置骑行视图界面参数
            
            var time = Math.round(msg.data.use_time) //使用时长
            var distance = parseFloat(parseInt(msg.data.distance) / 1000).toFixed(2) //骑行距离 !:batt其实是电量剩余量
            var pay = parseInt(msg.data.use_price) / 100 //当前计费值
            var bike_qr = msg.data.bike_qr //用车编号
            var batt = msg.data.batt;//电量
            var bike_status = msg.data.bike_status;//int车辆状态 0-正常 2-红包车 3-搬运车
            var statu_text = "正常";//车辆状态说明
            if (bike_status == 2) {
                statu_text = "红包车"
            } else if (bike_status == 3) {
                statu_text = "搬运车"
            }

            if (typeof page == "undefined" || typeof page.setData != "function")
            page = app.globalData.indexPage;
            page.setData({

                "bikeRiding.ridingTime": time,
                "bikeRiding.ridingDistance": distance,
                "bikeRiding.pay": pay,
                "bikeRiding.statu": statu_text,
                "bikeRiding.batt": batt,
                "bikeRiding.bike_qr": msg.data.bike_qr
            })
        }
    }else if (url === app.globalData.websocketParams.url.templock) { // 3."/socket/bike/tempunlock", //临时停车
        if (typeof page == "undefined" || typeof page.setData != "function")
            page = app.globalData.indexPage;
        if (state == '00') {
            wx.showToast({
                title: "临时停车成功!",
                icon: 'loadding',
                duration: 2000
            })
            page.setData({
                "temLockText": '继续用车',
                "temLocking": true
            })
        } else {
            wx.showToast({
                title: msg.state_info,
                icon: 'loadding',
                duration: 2000
            })
        }
    }else if (url === app.globalData.websocketParams.url.tempunlock) { // 4."/socket/bike/tempunlock", //临时停车解锁

        if (state == '00') {
            wx.showToast({
                title: "开锁成功!",
                icon: 'loadding',
                duration: 2000
            })

            if (typeof page == "undefined" || typeof page.setData != "function") {
                page = app.globalData.indexPage;
                page.setData({
                    "temLockText": '临时停车',
                    "temLocking": false
                })
            }
        } else {
            wx.showModal({
                title: '开锁异常',
                content: '继续用车失败，错误码为：' + state,
                confirmText: "我知道了",
                confirmColor: app.globalData.main_color
            })
        }
    }else if (url === app.globalData.websocketParams.url.returnBike) { // 5.returnBike: "/socket/bike/return", //还车
            //隐藏加载图
            wx.hideToast();
            if (state == '00') {//正常锁车成功
                app.globalData.isRidingBike = 2;//骑行状态改为2，表示骑行结束
                app.globalData.ridingBikeData = msg;//骑行状态相关数据
                var time = msg.data.usetime;//骑行时间 
                var pay = parseInt(msg.data.pay) / 100;//骑行费用
                var distance = msg.data.distance;//骑行距离（米）
                var amount = parseInt(msg.data.amount) / 100;//账户余额
                var give_amount = parseInt(msg.data.give_amount) / 100;//赠送红包
                var sub_amount = parseInt(msg.data.sub_amount) / 100;//扣除搬运费

                //骑行结束,跳到骑行结算界面
                wx.navigateTo({
                    url: '../cost/cost?time=' + time + "&pay=" + pay + "&distance=" + distance + "&amount=" + amount + "&give_amount=" + give_amount + "&sub_amount=" + sub_amount,
                })

                if (typeof page == "undefined" || typeof page.setData != "function") page = app.globalData.indexPage;

                page.setData({
                    "bikeRiding.show": false,
                    // 'controls': page.hasLoginMapControls,
                    "mapHeight": "100%",
                    "bikeAbnormity.show": false,
                    "isCanGetBikeList": true,
                })

                //所有数据恢复到初始值
                page.setData({
                    // 'controls': page.notLoginMapControls,
                    //地图的宽高
                    "mapHeight": '100%',
                    "mapWidth": '100%',
                    "mapTop": '0',
                    //正在骑行中的视图的属性
                    bikeRiding: {
                        show: false,
                        ridingTime: 0,//骑行时间
                        ridingDistance: 0,
                        statu: '正常',//车辆状态
                        pay: 0,//骑行费用
                        batt: 0,//电量
                        distance: 0,//int	车辆续航= 额定续航 * 电量百分比
                        bike_qr: 0,
                        height: '50%',
                        width: '100%',
                        topLineHeight: "0rpx",
                        bottomLineHeight: "0rpx",
                    }
                })
            } else {//锁车异常
                
                if (msg.state_info == '无效参数'){
                    wx.removeStorageSync("token")
                }

                wx.showModal({
                    title: '锁车失败',
                    content: msg.state_info,
                    confirmText: "我知道了",
                    confirmColor: app.globalData.main_color
                })
            }
    }else if (url === app.globalData.websocketParams.url.heartPong) { // 6.heartPong: "/socket/heart/pong",//服务器响应socket心跳  
        if (state == '00') {
            console.log("心跳响应" + msg.state_info + "，序列号为:" + msg.seq)
        } else {
            console.log("心跳响应异常!" + msg.state_info)
        }
    }
}
