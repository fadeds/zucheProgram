//var md5 = require("../MD5.js")
Page({
  data: {
    activityList:[],
    //查询余额接口
    activityListUrl: getApp().globalData.request_url + '/activity/queryactivityinfo',
  }, 
  onLoad: function (options) {
    console.log("进入cost页面onload方法,options为：")
    console.log(options)
    // 生命周期函数--监听页面加载
    var that = this
    wx.request({
      url: that.data.activityListUrl,
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // 设置请求的 header
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log('请求活动列表成功，返回结果：')
        console.log(res)
        // success
        var state = res.data.state //'00'表示成功返回正确的金额
        var message = res.data.state_info;//返回状态说明
        if(state == "00"){//返回列表成功
          console.log("设置活动列表集合数据：activityList:")
          console.log(res.data.data.list)
          var activity = res.data.data.list;
          //循环集合截取活动开始和结束时间去掉时分秒
          // if (activity && activity !== null && activity.length > 0) {
          //   for (var i = 0; i < activity.length; i++) {
          //     var start_time = activity.activity_start_time.Split(0,4);
          //     var startTime = start_time[0];
          //     activity.activity_start_time = startTime;
          //     var end_time = activity.activity_end_time.Split(0, 4);
          //     var endTime = end_time[0];
          //     activity.activity_end_time = endTime;

          //   }
          // }
          console.log("截取时间段后集合数据：activityList:")
          console.log(res.data.data.list)
          that.setData({
            "activityList": res.data.data.list
          });
        }else{
          console.log("获取活动列表失败,返回码为："+state)
          wx.showToast({
            title: '获取活动列表失败!',
            icon: 'loading',
            duration: 2000,
          })
        }
      },
      fail: function () {
        // fail
        console.log("请求活动列表失败！")
        wx.showToast({
          title: '请求活动列表失败，稍后请重试!',
          icon: 'loading',
          duration: 2000,
        })
      },
      complete: function () {
        // complete
      }
    })
  },
  onReady: function () {
    // 生命周期函数--监听页面初次渲染完成

  },
  onShow: function () {
    // 生命周期函数--监听页面显示

  },
  onHide: function () {
    // 生命周期函数--监听页面隐藏

  },
  onUnload: function () {
    // 生命周期函数--监听页面卸载

  },
  onPullDownRefresh: function () {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function () {
    // 页面上拉触底事件的处理函数

  },
  onShareAppMessage: function () {
    // 用户点击右上角分享
    return {
      desc: '我刚刚使用挽乘智能车完成了一场愉快的骑行,朋友们一起来体验一下吧', // 分享描述
      path: '/cost/cost' // 分享路径
    }
  },
  format: function (time) {
    return {
      date: time.substring(0, 10)
    }
  }
})