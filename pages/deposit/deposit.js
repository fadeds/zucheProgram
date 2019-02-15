var app = getApp();
Page({
  data: {
    hasBtn: false,
    depositData:{
      isPayPosit:false,//判断是否交纳押金
      depositNum: "0"//押金金额
    },
    chargeListParams: {//充值请求参数（ 微信小程序账户充值在发起10分钟内有效）
      token: '', //string	用户登录token
      pay_amount: 0, //	int	支付金额，最低一元，单位分
      //pay_amount: 1, //	测试时假数据，真正上线需上方
      trade_type: 1, //int	支付类型 1押金充值 2账户充值
      pay_channel: 2 //int	支付渠道 1支付宝支付 2微信支
    },
    //账户充值接口
    chargeUrl: app.globalData.request_url + "/account/charge",
    chargecbUrl: app.globalData.request_url + "/account/chargecb", //客户端支付结果回调服务端
    depositmoneyUrl: app.globalData.request_url + "/account/getchargelist", //请求可充值金额列表
    //充值请求支付结果参数
    chargecbListParams: {
      token: '', //string	用户登录token
      //pay_amount: 30*100, //	int	支付金额，最低一元，单位分
      order_id: '',// string	内部订单id
      pay_result: 0	//true	int	客户端支付结果 1-支付成功 其他为支付取消或者支付失败
    }
  },
  scanCode:function(){
    //扫码
    
  },
  wxpay:function(){
    //点击微信支付按钮
    var that = this
    console.log("点击充值按钮,token为:" + wx.getStorageSync('token'))
    if (that.data.hasBtn) {
      return;
    }
    that.setData({
      hasBtn: true,
      "chargeListParams.token": wx.getStorageSync('token'),
      "chargecbListParams.token": wx.getStorageSync('token')
    })
    console.log(that.data.chargeListParams);
    //1.请求服务器充值押金
    wx.request({
      url: that.data.chargeUrl,
      data: that.data.chargeListParams,
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // 设置请求的 header
      header: {
        'content-type': 'application/json'
      },
      success: function(res){
        console.log("提交用户充值押金请求返回：")
        console.log(res)
        var state = res.data.state;//返回状态码,00成功,07用户未注册
        if (state == '00') {//登陆成功
          console.log("提交用户充值请求返回00：")
          var data = res.data.data;//返回订单所需信息集
          var order_id = data.order_id;//内部订单号
          that.setData({
            "chargecbListParams.order_id": order_id//内部订单号
          })
          var charge_token = data.charge_token;//支付宝或者微信支付所需要字符串
          var we_chat = data.we_chat;//微信小程序所需字断集合
          var timeStamp = we_chat.time_stamp //时间戳
          var nonceStr = we_chat.nonce_str//随机字符串
          var prepay_id = we_chat.package//统一下单接口返回的 prepay_id 参数值，
          var sign = we_chat.sign //签名
          var sign_type = we_chat.sign_type //签名类型
          //console.log("timeStamp:" + timeStamp + "||nonceStr:" + nonceStr + "||prepay_id:" + prepay_id + "||sign:" + sign + "||sign_type:" + sign_type)
          //向微信调起支付窗口
          wx.requestPayment({
            //时间戳从1970年1月1日00:00:00至今的秒数,即当前的时间
            timeStamp: timeStamp,
            //随机字符串，长度为32个字符以下。
            nonceStr: nonceStr,
            //统一下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=*
            package: prepay_id,
            // package: charge_token,
            //签名算法，暂支持 MD5
            //signType: 'MD5',
            signType: sign_type,
            //签名
            paySign: sign,
            success: function (res) {
              // success
              console.log("支付success")
              console.log(res.data)
              that.setData({
                "chargecbListParams.pay_result": 1 //支付结果( 1-支付成功 其他为支付取消或者支付失败)
              })
              that.chargecb();
              setTimeout(function () {
                wx.showToast({
                  title: '支付成功',
                  icon: 'loading',
                  duration: 1000,
                })
              })
              setTimeout(function () {//返回主面面
                  wx.navigateBack();
              }, 1000)
            },
            fail: function (res) {
              // fail
              //fail (detail message)	调用支付失败，其中 detail message 为后台返回的详细失败原因
              //fail cancel	用户取消支付
              console.log("支付押金失败fail,原因为：")
              console.log(res)
              that.chargecb();
              setTimeout(function () {
                wx.showToast({
                  title: '支付失败',
                  image: '../images/faild@2x.png',
                  duration: 1000,
                })
              })
            },
            complete: function (res) {
              // complete
              console.log("complete")
              console.log(res)
              that.setData({
                hasBtn: false,

              })
            }
          })
        } else {
          console.log("提交用户充值请求返回state：" + state)
        }
        
      },
      fail: function() {
        //fail cancel	用户取消支付
        console.log("支付fail")
        console.log(res)
        that.setData({
          "chargecbListParams.pay_result": 0 //支付结果( 1-支付成功 其他为支付取消或者支付失败)
        })
        that.chargecb();
      },
      complete: function() {
        // complete
      }
     })

  },
  //通知后台支付结果
  chargecb: function () {
    var that = this;
    wx.request({
      url: that.data.chargecbUrl,//请求登陆
      data: that.data.chargecbListParams,
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("通知后台充值结果返回：")
        console.log(res)
        var state = res.data.state;//返回状态码,00成功,07用户未注册
        if (state == '00') {//登陆成功
          console.log("通知成功！")
        } else {
          console.log("通知失败！")
        }
      }
    })
  },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数
    var that = this
    //请求押金金额
    wx.request({
      url: that.data.depositmoneyUrl,//请求可充值金额
      //data: that.data.chargemoneyListParams,
      method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      // header: {}, // 设置请求的 header
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("请求押金金额返回：")
        console.log(res)
        var state = res.data.state;//返回状态码,00成功,07用户未注册
        if (state == '00') {//登陆成功
          console.log("请求金额列表成功！")
          var moneyList = null;
          if (state == '00') {//登陆成功
            console.log("请求金额列表成功！")
            moneyList = res.data.data.list;//金额列表集合
            if (moneyList != null && moneyList.length > 0) {
              console.log("集合内容为：")
              console.log(moneyList[0])
              var deposit = parseInt(moneyList[0].charge_amount) / 100
              console.log("押金金额deposit为:" + deposit)
              that.setData({
                "depositData.depositNum": deposit,//显示给用户看的押金，以元为单位
                "chargeListParams.pay_amount": moneyList[0].charge_amount//提交给服务器的金额，以分为单位
              })
            }
          } else {
            console.log("请求金额列表失败！")
          }
          

        } else {
          console.log("请求金额列表失败！")
        }
      }
    })

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