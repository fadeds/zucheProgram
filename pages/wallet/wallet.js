//var md5 = require("../MD5.js")
var app = getApp();
Page({
  data: {
    wallet: 0,
    deposit: 0,
    red:0,
    container: 0,                   //容器高度
    depositFun: "movetoDeposit",//充值押金，returnDeposit押金退款
    id :0,//0为未交押金，显示充值押金;1为已交押金，显示押金退款
    ticket:0,
    depositTitle: "    充值押金",
    credit:0,
    //查询余额接口
    //queryWalletUrl: getApp().globalData.request_url + "/account/amount",//请求余额的接口
    queryWalletUrl: app.globalData.request_url + "/user/getinfo",//请求用户个人信息的接口(有返回优惠券数量)
    //押金退款相关
    amountFunParams: {//充值请求参数（ 微信小程序账户充值在发起10分钟内有效）
      token: '', //string	用户登录token
      refund_type: 1, //		int	退款类型 1押金退款 2账户余额退款
      refund_reason: '小程序退款' //false	string	退款原因
    },
    //退款接口
    amountFunUrl: app.globalData.request_url + "/account/refund"
  },

  onShow: function () {
      var that = this
      that.requestUserInfo();
  },

  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    //查询余额
    var that = this

    let containerHeight = wx.getSystemInfoSync().windowHeight;
    console.log('tttttttttttt' + containerHeight)
    containerHeight = containerHeight;

    console.log('00000000000' + containerHeight)
    that.setData({
      container: containerHeight + 'px'
    })
    //初始化一个组件实例
    new app.ToastPannel();

    that.requestUserInfo();
  },

requestUserInfo:function(){
    var that = this
    var token = wx.getStorageSync('token') || ''
    if (token && token != "" && token.length > 0) {

      wx.showLoading({
            title: '加载中'
        })

        wx.request({
            url: that.data.queryWalletUrl,
            data: {
                token: token
            },
            method: 'POST',

            header: {
                'content-type': 'application/json'
            },
            success: function (res) {
                wx.hideLoading();
                console.log('请求余额成功，返回结果：')
                console.log(res)
                // success
                var state = res.data.state //'00'表示成功返回正确的金额
                var message = res.data.state_info;//返回状态说明
                //查询成功

                if (state == '00') {
                    var wallet = parseInt(res.data.data.amount.amount) / 100;//余额
                    var deposit = parseInt(res.data.data.amount.deposit) / 100;//押金
                    var red = parseInt(res.data.data.amount.gift_amount) / 100;//红包金额
                    var ticket = res.data.data.coupon;//优惠券数量
                    var credit = parseInt(res.data.data.credit);//用户的信用分
                    that.setData({
                        "wallet": wallet,
                        "deposit": deposit,
                        "ticket": ticket,
                        "red": red,
                        "credit":credit
                    })
                    //查询成功
                    //var deposit = 299
                    console.log("用户余额为deposit：" + deposit)
                    if (deposit > 0) {
                        that.setData({
                            "id": 1,
                            "depositTitle": "   押金退款",
                            "depositFun": "returnDeposit"
                        })
                    }
                }
                else if (state == '09' || state == '10') {//token失效、token过期
                    wx.showModal({
                        title: '请求余额失败',
                        content: '登陆失效，请重新登陆!',
                        showCancel: false,
                        confirmText: "好的",
                        confirmColor: app.globalData.main_color,
                        success: function (res) {
                            //跳转登陆界面
                            wx.navigateTo({
                                url: '../login/login'
                            })
                        }
                    })
                }
                //检查是否登录失效
                else {
                    // disabledToken.reLogin(-2) 登录失效跳转登录界面
                    console.log('获取余额失败!' + message)
                    wx.showToast({
                        title: '获取余额失败!' + message,
                        icon: 'loading',
                        duration: 1000,
                    })
                }
            },
            fail: function () {
                // fail
                that.show("网络异常请稍后重试");
                wx.hideLoading();

            },
            complete: function () {
                // complete
            }
        })
    } else {
        wx.showModal({
            title: '请求余额失败',
            content: '登陆失效，请重新登陆!',
            showCancel: false,
            confirmText: "好的",
            confirmColor: app.globalData.main_color,
            success: function (res) {
                //跳转登陆界面
                wx.navigateTo({
                    url: '../login/login'
                })
            }
        })
    }
}
,
  //如何退押金
  returnDeposit: function () {

      //点击确定退款按钮
      var that = this
      
    if (that.data.id == 0) {
      //充押金
      //调取充值接口
    } else if (that.data.id == 1) {

      that.setData({
        "amountFunParams.token": wx.getStorageSync('token'),
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
              "deposit": 0,
              "id": 0,
              "depositTitle": "   充值押金",
              "depositFun": "movetoDeposit"
            })
           
            wx.showModal({
              title: '押金退款申请成功!',
              content: '(到账时间以银行实际到账时间为准)',
              showCancel: false,
              confirmText: "好的",
              confirmColor: app.globalData.main_color
            })
          } else {
            wx.showToast({
              title: '退款失败' ,
              content: message,
              image: '../images/faild@2x.png',
              duration: 1000,
            })
          }

        },
        fail: function () {
          //fail cancel	用户取消支付
          console.log("请求退款失败")
          wx.showToast({
            title: '请求失败:',
            content: message,
            image: '../images/faild@2x.png',
            duration: 1000,
          })
        },
        complete: function () {
          // complete
        }
      })
    }
  },

  //充值余额
  movetoCharge: function () {
    wx.navigateTo({
      url: '../recharge/recharge'
    })
  },

  //充值押金
  movetoDeposit: function () {
    console.log("点击了充值押金")
    wx.navigateTo({
      url: '../deposit/deposit'
    })
  },
//我的行程
trip:function(){
  wx.navigateTo({
    url: '../trip/trip'
  })
},
//我的账户明细
details:function(){
  wx.navigateTo({
    url: '../details/details',
  })
},
  //下载app
  downloadApp:function(){

      wx.showModal({
        title: '下载APP',
        content: '挽乘智能车小程序暂未支持直接下载APP,您可以自行到应用商店进行下载。',
        showCancel: false,
        confirmText: "我知道了",
        confirmColor: app.globalData.main_color
      })
  },

  //跳转我的用车券页面
  coupon:function () {
    console.log("点击了coupon")
    wx.navigateTo({
      url: '../coupon/coupon'
    })
  },

  //余额退还
  amountFun: function () {
    var that = this;
    wx.navigateTo({
      url: '../amountFun/amountFun?amount=' + that.data.wallet
    })
  },

  //余额说明
  balance:function(){
    wx.navigateTo({
      url: '../balance/balance'
    })
  }
})