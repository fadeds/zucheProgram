var app = getApp();
Page({
  data: {
    loading:false,
    amountData: {
      amountNum: 0//金额
    },
    amountFunParams: {//充值请求参数（ 微信小程序账户充值在发起10分钟内有效）
      token: '', //string	用户登录token
      refund_type: 2, //		int	退款类型 1押金退款 2账户余额退款
      refund_reason: '小程序退款' //false	string	退款原因
    },
    //退款接口
    amountFunUrl: app.globalData.request_url + "/account/refund"
  },
  onLoad: function (options) {

    // 生命周期函数--监听页面加载
    var that = this
    console.log("余额：" + options.amount)
    console.log(options.amount && options.amount > 0 )
    if (options.amount && options.amount > 0 ){   
      that.setData({
        "amountData.amountNum": options.amount
      })
    }
  },
  //余额退款
  amountFun: function () {
    //点击确定退款按钮
    var that = this
    if (that.data.amountData.amountNum>0){
      
      that.setData({
        "amountFunParams.token": wx.getStorageSync('token'),
      })
      
      that.setData({
        'loading':true

      })
      wx.showToast({
        title:"正在加载",
        icon:'loading',
        duration: 10000, 
      })

      wx.request({
        url: that.data.amountFunUrl,
        data: that.data.amountFunParams,
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {

          var state = res.data.state//成功返回状态码
          var message = res.data.state_info //返回说明 
          if (state == "00") {
            //设置可退款余额为0
            that.setData({
              "amountData.amountNum": 0
            })
            wx.showModal({
              title: '申请退款成功!',
              content: '退款金额为：' + parseInt(res.data.data.amount) / 100 + '元，(到账时间以银行实际到账时间为准)。',
              showCancel: false,
              confirmText: "好的",
              confirmColor: app.globalData.main_color,
              success: function (res) {
                if (res.confirm) {
                    wx.navigateBack();
                }
              }
            })
          }else{
            wx.showToast({
              title: message,
              image: '../images/faild@2x.png',
              duration: 1000,
            })
          }

        },

        fail: function () {

          that.setData({
            'loading': false
          })
          wx.showToast({
            title: message,
            image: '../images/faild@2x.png',
            duration: 1000,
          })
        },
        complete: function () {

          that.setData({
            'loading': false
          })
        }
      })
    }else{
      wx.showToast({
        title: '没有可退余额!',
        image: '../images/faild@2x.png',
        duration: 1000,
      })
    }
  },
  onReady: function () {
    // 页面渲染完成
  },
  onShow: function () {
    // 页面显示
  },
  onHide: function () {
    // 页面隐藏
  },
  onUnload: function () {
    // 页面关闭
  }
})