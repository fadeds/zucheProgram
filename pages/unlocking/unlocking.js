var checkNetWork = require("../CheckNetWork.js")
var websocket = require('../../websocket/connect.js');
var msgReceived = require('../../websocket/msgHandler.js');
var app = getApp();

Page({
  data: {
    timer:null,
    progress: 1,
    bikeQr:0
  },

  onLoad: function (options) {
    var that = this
    // that.bikeQr = options.bikeQr;


    //开锁成功,锁平台状态正常,需要再请求服务器查看锁的状态
    var second = 0
    var persents = second / 14.0;

    //开启定时器  准备开锁
    var timer = setInterval(function () {
      second++;
      if (second == 15) {//开锁请求超过   没收到服务器响应，判定且提示开锁失败
            that.destructTimer();//停止定时器

            if (app.globalData.isRidingBike != 2) {
                 that.showUnlockStatuMessage("开锁超时请重试")
            }
      } else {
            if (second > 0 && second < 15) {
                    persents = second / 14.0;
                    that.setData({
                        'progress': (persents * 100).toFixed(0)
                    })
            } else {
                    console.log("进度条继续滚动:" + second)
            }
      }
    }, 1000)
    
    that.data.timer = timer;

    //请求开锁
    // that.networkOpenLock();

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
    var that = this;
      that.destructTimer();//停止定时器
  },
  onPullDownRefresh: function () {
    // 页面相关事件处理函数--监听用户下拉动作

  },
  onReachBottom: function () {
    // 页面上拉触底事件的处理函数

  },
  //提示信息
  showUnlockStatuMessage: function (message) {
    wx.showModal({
      title: '扫码开锁提示',
      content: message,
      showCancel: false,
      success: function (res) {
            if (res.confirm) {
                  wx.navigateBack()
            }
      }
    })
  },

  //销毁定时器
  destructTimer: function () {
      var that = this;
      if (that.data.timer != null) {
          clearInterval(that.data.timer);
      }
  }

})