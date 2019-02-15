var app = getApp();
Page({
  data: {
    real_price:"",
    pay_amount:"",
    qita: false,
    hasBtn: false,
    loading: false, //是否显示加载图标（用于ajax请求时显示loading图标)
    spa: 120, //充值金额，每行间间隔
    base_top: 120, //起始顶部
    but_color: "#cacaca", //未被选中的金额按钮颜色值
    first_left: "40rpx", //左边充值按键距离屏幕左边
    two_left: "395rpx", //右边充值按键距离屏幕左边
    recharge: { //充值区域高度
      height: "160rpx",
      rowHeight: 130 //单行高度
    },

    //请求的接口
    chargeUrl: app.globalData.request_url + "/account/charge", //账户充值
    chargecbUrl: app.globalData.request_url + "/account/chargecb", //客户端支付结果回调服务端
    chargemoneyUrl: app.globalData.request_url + "/account/getactivitychargelist", //请求可充值金额列表
    
    //账户充值请求参数
    chargeListParams: {
      token: '', //string	用户登录token
      pay_amount: 0, //	int	支付金额，最低一元，单位分
      trade_type: 2, //int	支付类型 1押金充值 2账户充值
      pay_channel: 2 //int	支付渠道 1支付宝支付 2微信支
    },

    //充值请求支付结果参数
    chargecbListParams: {
      token: '', //string	用户登录token
      order_id: '', // string	内部订单id
      pay_result: 0 //true	int	客户端支付结果 1-支付成功 其他为支付取消或者支付失败
    },

    //充值金额列表参数
    chargemoneyListParams: {
      charge_type: 1 //int	1 用户账户余额充值 2押金充值 默认为2
    },
    
    //记录上一次点击的充值选项的id
    lastMoneyId: 0
  },

  onLoad: function (options) {
    // 生命周期函数--监听页面加载
    var that = this
    that.chargeMoney(function (list) { //确保请求到token后再做接下来的动作
      if (list != null) {
        var monList = [];
        for (var i = 0; i < list.length; i++) {
          var array = {}; //单个充值按键模板
          var arr = list[i]
          var money = parseInt(arr.price) / 100; //可充值金额
          array.content = money + "元";
          var discount = parseInt(arr.discount) / 100;//赠送的金额
          var real_price = parseInt(arr.real_price) / 100; //实际所得金额
          if (i == 0) { //
            that.data.currentMoney = money * 100; //默认第一个为选中金额
            array.background = app.globalData.main_color;
            array.color = that.data.but_color;
          } else {
            array.background = that.data.but_color;
            array.color = app.globalData.main_color;
          }
          array.id = money;
          var num = parseInt(i / 2);
          array.top = (that.data.base_top + num * that.data.spa) + "rpx";
          if (((i & 1) === 0)) array.left = that.data.first_left;
          else array.left = that.data.two_left;
          monList.push(array);
        }
        var height = that.data.recharge.rowHeight;
        if (list.length > 2) { //充值选项大于2（每2个显示在一行)
          var num = parseInt((list.length - 1) / 2);         
          // var num = parseInt(list.length)
          height = that.data.recharge.rowHeight * (num + 1);
          console.log('list.length', list.length) //5
          console.log('num', num) //2
        }
        monList.push({
          background: "#cacaca",
          color: "#3692fc",
          index: 5,
          content:"其他金额",
          discount:"不参与优惠活动",
          real_price:" ",
        })
        that.setData({
          "moneyArr": monList,
          "recharge.height": height + "rpx",
          "chargeListParams.pay_amount": that.data.currentMoney
        })

      }
    })

  }, 
  bindKeyInput: function (e) {
    var that = this
    if (e.detail.value > 0) {
      var pay_amount = e.detail.value
      var charge_amount = e.detail.value
      var discount = 0;
      that.setData({
        "chargeListParams.pay_amount": parseInt(pay_amount) * 100
      })
    }
    console.log('e.detail.value', e.detail.value)
    console.log('pay_amount的值是',pay_amount)
  },
 
//用户须知
  tipUserInfo: function () {
    var webUrl = ' https://www.kyzlc.com/wc/userInstructions/userInstructions.html';
    wx.navigateTo({
      url: '../WebView/webView?webUrl=' + webUrl
    })
  },
  //充值协议
  chargeAgree: function () {
    var webUrl = 'https://www.kyzlc.com/wc/userchange.html';
    wx.navigateTo({
        url: '../WebView/webView?webUrl=' + webUrl
    })
  },


  //点击充值选项
  chioceAct: function (res) {
    var that = this
    var index = res.currentTarget.dataset.index;//新加的当前选中金额的ID
    var id = res.currentTarget.dataset.currentid //当前选中金额的ID
    var arrList = that.data.moneyArr; //金额的集合
    for (var arr of arrList) {
      var arr_id = arr.id; //当前集合的ID（ID与金额相同)
      if (arr_id == id) {
        arr.color = that.data.but_color;
        arr.background = app.globalData.main_color
      } else {
        arr.color = app.globalData.main_color;
        arr.background = that.data.but_color;
      }
    }

    that.setData({
      "moneyArr": arrList,
      "chargeListParams.pay_amount": id * 100
    })
    if (index == 5) {
      that.setData({
        qita: true
      })
    } else {
      that.setData({
        qita: false,
      })
    }
  },

  //点击去充值
  gotoRecharged: function () {
    var that = this;
    if (that.data.hasBtn) {
      return;
    }
    that.setData({
      hasBtn: true,
      'loading': true,
      "chargeListParams.token": wx.getStorageSync('token'),
      "chargecbListParams.token": wx.getStorageSync('token'),
    })

    console.log('00000000000000', that.data.chargeListParams)
    
    //3.直接向服务器提交用户信息，实现用户免登陆
    wx.request({
      url: that.data.chargeUrl,
      data: that.data.chargeListParams,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        var state = res.data.state; //返回状态码,00成功,07用户未注册
        console.log('state的值是'+state) //01
        if (state == '00') { //登陆成功

          var data = res.data.data; //返回订单所需信息集
          var order_id = data.order_id; //内部订单号
          that.setData({
            "chargecbListParams.order_id": order_id //内部订单号
          })
          var charge_token = data.charge_token; //string	支付宝或者微信支付所需要字符串
          var we_chat = data.we_chat; //微信小程序所需字段集合
          var timeStamp = we_chat.time_stamp //时间戳
          var nonceStr = we_chat.nonce_str //随机字符串
          var prepay_id = we_chat.package //统一下单接口返回的 prepay_id 参数值，
          var sign = we_chat.sign //签名
          var sign_type = we_chat.sign_type //签名类型
          wx.requestPayment({
            //时间戳从1970年1月1日00:00:00至今的秒数,即当前的时间
            timeStamp: timeStamp,
            //随机字符串，长度为32个字符以下。
            nonceStr: nonceStr,
            //统一下单接口返回的 prepay_id 参数值，提交格式如：prepay_id=*
            package: prepay_id,
            signType: sign_type,
            //签名
            paySign: sign,
            success: function (res) {
              that.setData({
                "chargecbListParams.pay_result": 1 //支付结果( 1-支付成功 其他为支付取消或者支付失败)
              })
              that.chargecb();
              setTimeout(function () {
                wx.showToast({
                  title: '充值成功',
                  icon: 'success',
                  duration: 1000,
                })
              })

              setTimeout(function () {
                wx.navigateBack();
              }, 1000)
            },

            fail: function (res) {
              that.chargecb();
              setTimeout(function () {
                wx.showToast({
                  title: '充值失败',
                  image: '../images/faild@2x.png',
                  duration: 1000,
                })
              })
            },
            complete: function (res) {
              that.setData({
                hasBtn: false,

              })
            }
          })
        } else {
          console.log("提交用户充值请求返回state：" + state) //
        }
      },
      fail: function () {
        that.setData({
          "chargecbListParams.pay_result": 0 //支付结果( 1-支付成功 其他为支付取消或者支付失败)
        })
        that.chargecb();
      },

    })
  },

  //请求可充值金额
  chargeMoney: function (list) {
    var that = this;

    wx.showLoading({
        title: '加载中',
    })
    wx.request({
      url: that.data.chargemoneyUrl, //请求可充值金额
    
      data: that.data.chargemoneyListParams,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        wx.hideLoading();
        var state = res.data.state; //返回状态码,00成功,07用户未注册
        console.log('state11111' + state)
        console.log('res的值是',res)
        console.log('res.data.data.list的值是',res.data.data.list[0])
        var moneyList = null;
        if (state == '00') { //登陆成功
          moneyList = res.data.data.list; //金额列表集合
        } else { 
          console.log("请求金额列表失败！") 
        }
        typeof list == "function" && list(moneyList)
      },
      fail:function(res){
          
          wx.hideLoading();
      }
    })
  },
  //通知后台支付结果,并返回钱包界面
  chargecb: function () {
    var that = this;
    wx.request({
      url: that.data.chargecbUrl, //请求登陆
      data: that.data.chargecbListParams,
      method: 'POST',
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("通知后台充值结果返回：")
        console.log(res)
      
        var state = res.data.state; //返回状态码,00成功,07用户未注册
        console.log('state' + state)
        if (state == '00') { //登陆成功
          console.log("通知成功")
        } else {
          console.log("通知失败！")
        }

      }
    })
  },
})