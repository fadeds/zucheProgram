//index.js
//var md5 = require("../MD5.js")
var checkNetWork = require("../CheckNetWork.js")
var websocket = require('../../websocket/connect.js');
var msgReceived = require('../../websocket/msgHandler.js');
var app = getApp();
var testScan = /^\d{12}$/;//验证二维码为12位数字的正则表达式

//获取应用实例
Page({
  data: {
    //地图的宽高 
    mapHeight: '100%',
    mapWidth: '100%',
    mapTop: '0',
    down:0,//控制骑行详情显示上拉与下滑。默认0为展开状态，需要上拉，1为收缩状态，需要下滑
    radioCheckVal: '0',//区分电单车与停车点的值  值为0时 代表是电单车
    temLocking: false,//是否临时停车状态中(默认否)
    disabled: false,//用来控制临时停车、临时锁车在发送请求过程中不可点击
    loading: false,//是否显示加载图标（用于ajax请求时显示loading图标)
    serverTel: '', //获取服务电话

    bikeRiding: {
      show: false,
      ridingTime: 0,//骑行时间
      ridingDistance: 0,
      statu: '正常',//车辆状态
      pay: 0,//骑行费用
      batt: 0,//电量
      distance: 0,//int	车辆续航= 额定续航 * 电量百分比
      bike_qr: 0,
      width: '100%',
      topLineHeight: "0rpx",
      bottomLineHeight: "0rpx"
    },

    coordinate:{},//存储所有车辆坐标集合

    //计费异常的视图的属性
    bikeAbnormity: {
      show: false,
      height: '15%',
      width: '100%',
    },

    //接口
    CfBikeUrl: {
      getUserInfo: app.globalData.request_url + "/user/getinfo",//请求用户信息
      getList: app.globalData.request_url + "/map/nearbike",//请求附近车辆
      usingloca: app.globalData.request_url + "/bike/usingloca",//请求骑行中车辆位置
      forcereturnUrl: app.globalData.request_url + "/bike/forcereturn",//强制还车
      nearfenceUrl: app.globalData.request_url + "/map/nearfav", //请求附近电子围栏(停车点)信息
      getServerTel: app.globalData.request_url + "/fence/companyinfo",//获取服务电话
    },

    //临时停车按钮文字(点击临时停车后，变为继续用车)
    temLockText: "临时停车",
    //是否能查询附近单车: 主要根据骑行中状态判断
    isCanGetBikeList: true,

    //查询附近单车请求参数
    getBikeListParams: {
      token: '', //string
      lng: 0, //float
      lat: 0, //float
      scale: '16', //string|比例尺
      limit: 50 //int|车辆数（0-100）
    },

    //查询电子围栏
    getNearFavParams: {
        token: '', //string
        lng: 0, //float
        lat: 0, //float
        scale: '16', //string|比例尺
        limit: 50, //int|车辆数（0-100
        types:1
    },

    //请求单车开锁参数  
    unlockBikeParams: {
      device_id: '' //设备ID(扫描二维码获取)
    },

    //重启APP后查询接口完成的标识
    completeStatu: true,
    //用户当前位置
    point: {
      latitude: 0,
      longitude: 0
    },

    //单车标注物
    markers: [],

    //电子围栏
    polyline: [],
    //当前地图的缩放级别
    mapScale: 14,
    //地图上不可移动的控件
    controls: [],
    //当前扫描的车辆ID
    currentBikeId: '',

    
    //已登录的地图组件
    hasLoginMapControls: [  

      //右下角定位按键
      {
        id: 11,
        position: {
            left: 35 * wx.getStorageSync("kScreenW"),
            top: 483 * wx.getStorageSync("kScreenH"),
            width: 50 * wx.getStorageSync("kScreenW"),
            height: 50 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_main_location@2x.png', //定位按钮
        clickable: true,
      },
      //扫描二维码控件按钮
      { 
        id: 12,
        position: {
          left: 127.5 * wx.getStorageSync("kScreenW"),
          top: 450 * wx.getStorageSync("kScreenH"),
          width: 120 * wx.getStorageSync("kScreenW"),
          height: 120 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_custom_scan@2x.png', //扫码开锁的按钮
        clickable: true,
      },
      //个人中心控件按钮
      {
        id: 13,
        position: {
            left: 295 * wx.getStorageSync("kScreenW"),
            top: 483 * wx.getStorageSync("kScreenH"),
            width: 50 * wx.getStorageSync("kScreenW"),
            height: 50 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_menu_wallet@2x.png',
        clickable: true,
      },
      //地图中心位置扫码按钮
      {
        id: 14,
        position: {
          left: 177.5 * wx.getStorageSync("kScreenW"),
          top: 261.5 * wx.getStorageSync("kScreenH"),
          width: 40 * wx.getStorageSync("kScreenW"),
          height: 40 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_main_center@2x.png',//地图上的实心位置按钮
        clickable: false,
      },
      //客服电话按钮
      {
        id: 15,
        position: {
          left: 295 * wx.getStorageSync("kScreenW"),
          top: 430 * wx.getStorageSync("kScreenH"),
          width: 50 * wx.getStorageSync("kScreenW"),
          height: 50 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/serviceTel.png',
        clickable: true,
      },

      //用车说明
      {
          id: 30,
          position: {
              left: 320 * wx.getStorageSync("kScreenW"),
              top: 210 * wx.getStorageSync("kScreenH"),
              width: 55 * wx.getStorageSync("kScreenW"),
              height: 130 * wx.getStorageSync("kScreenW")
          },
          iconPath: '../images/useBikeInstro.png',
          clickable: true,
      }
    ],

    //正在用车地图组件
    usingBikeMapControls: [

        //右下角定位按键
        {
            id: 11,
            position: {
                left: 35 * wx.getStorageSync("kScreenW"),
                top: 483 * wx.getStorageSync("kScreenH"),
                width: 50 * wx.getStorageSync("kScreenW"),
                height: 50 * wx.getStorageSync("kScreenW")
            },
            iconPath: '../images/imgs_main_location@2x.png', //定位按钮
            clickable: true,
        },
        //个人中心控件按钮
        {
            id: 13,
            position: {
                left: 295 * wx.getStorageSync("kScreenW"),
                top: 483 * wx.getStorageSync("kScreenH"),
                width: 50 * wx.getStorageSync("kScreenW"),
                height: 50 * wx.getStorageSync("kScreenW")
            },
            // iconPath: '../images/myself1.png',//我的钱包按钮
            iconPath: '../images/imgs_menu_wallet@2x.png',
            clickable: true,
        },
 
        {
            id: 14,
            position: {
                left: 177.5 * wx.getStorageSync("kScreenW"),
                top: 261.5 * wx.getStorageSync("kScreenH"),
                width: 40 * wx.getStorageSync("kScreenW"),
                height: 40 * wx.getStorageSync("kScreenW")
            },
            iconPath: '../images/imgs_main_center@2x.png',//地图上的实心位置按钮
            clickable: false,
        },
        //客服电话按钮
        {
            id: 15,
            position: {
                left: 295 * wx.getStorageSync("kScreenW"),
                top: 430 * wx.getStorageSync("kScreenH"),
                width: 50 * wx.getStorageSync("kScreenW"),
                height: 50 * wx.getStorageSync("kScreenW")
            },
            iconPath: '../images/serviceTel.png',
            clickable: true,
        },
        //用车说明
        {
            id: 30,
            position: {
                left: 320 * wx.getStorageSync("kScreenW"),
                top: 210 * wx.getStorageSync("kScreenH"),
                width: 55 * wx.getStorageSync("kScreenW"),
                height: 130 * wx.getStorageSync("kScreenW")
            },
            iconPath: '../images/useBikeInstro.png',
            clickable: true,
        }
    ],

    //没有登录的地图组件
    notLoginMapControls: [
     //登录
      {
        id: 16,
        position: {
          left: 132.5 * wx.getStorageSync("kScreenW"),
          top: 483 * wx.getStorageSync("kScreenH"),
          width: 110 * wx.getStorageSync("kScreenW"),
          height: 40 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/login_register.png',
        clickable: true,
      },
      //定位按钮
      {
        id: 11,
        position: {
            left: 40 * wx.getStorageSync("kScreenW"),
            top: 483 * wx.getStorageSync("kScreenH"),
            width: 50 * wx.getStorageSync("kScreenW"),
            height: 50 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_main_location@2x.png',
        clickable: true,
      },
      //个人中心控件按钮
      {
        id: 13,
        position: {
            left: 300 * wx.getStorageSync("kScreenW"),
            top: 483 * wx.getStorageSync("kScreenH"),
            width: 50 * wx.getStorageSync("kScreenW"),
            height: 50 * wx.getStorageSync("kScreenW")
        },
        // iconPath: '../images/myself1.png',
        iconPath: '../images/imgs_menu_wallet@2x.png',
        clickable: true,
      },
      
      //地图中心位置按钮
      {
        id: 14,
        position: {
          left: 177.5 * wx.getStorageSync("kScreenW"),
          top: 261.5 * wx.getStorageSync("kScreenH"),
          width: 40 * wx.getStorageSync("kScreenW"),
          height: 40 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/imgs_main_center@2x.png',
        clickable: false,
      },
      //客服电话按钮
      {
        id: 15,
        position: {
          left: 300 * wx.getStorageSync("kScreenW"),
          top: 430 * wx.getStorageSync("kScreenH"),
          width: 50 * wx.getStorageSync("kScreenW"),
          height: 50 * wx.getStorageSync("kScreenW")
        },
        iconPath: '../images/serviceTel.png',
        clickable: true,
      },
      //用车说明
      {
          id: 30,
          position: {
              left: 320 * wx.getStorageSync("kScreenW"),
              top: 210 * wx.getStorageSync("kScreenH"),
              width: 55 * wx.getStorageSync("kScreenW"),
              height: 130 * wx.getStorageSync("kScreenW")
          },
          iconPath: '../images/useBikeInstro.png',
          clickable: true,
      }
     ],

      //检测骑行中的定时器是否已创建
     isCreateTimerStatu: false
  },

  //控件的点击事件
  controltap: function (e) {

    var that = this
    var id = e.controlId
    if (id == 11) {
      //定位当前位置
      that.getUserCurrentLocation()
    } else if (id == 12) {

 
        if (checkNetWork.checkNetWorkStatu() == false) {
           
            // that.show("网络异常请检查网络");
        }else{

            //先请求用户信息,1.信用分低于100的检查押金，必须先交押金;2.余额小于0的先充值。然后再进行扫码操作
            var token = wx.getStorageSync('token') || '';//用户token
            var datas = {
                'token': token
            }

            if (token != '') {//token不为空，可提交请求
                wx.request({
                    url: that.data.CfBikeUrl.getUserInfo,
                    method: 'post',
                    data: datas,
                    header: {
                        'content-type': 'application/json'
                    },
                    success: function (res) {
                        var state = res.data.state//成功返回状态码
                        var message = res.data.state_info //返回说明 
                        var msg = res.data.data //返回用户信息结果集
                        if (state == "00") {
                            //判断用户信用分是否大于100
                            var credit = msg.credit;//用户信用分
                            var deposit = msg.amount.deposit;//用户押金
                            var amount = msg.amount.amount;//充值余额
                            var gift_amount = msg.amount.gift_amount;//赠送余额
                            var amounts = amount + gift_amount;//总金额
                            var auth_status = msg.auth_status;

                            if (auth_status == 0) {//正常扫码开车
                                wx.scanCode({
                                    success: function (res) {
                                        var fl = res.result.indexOf(app.globalData.codeHttp);//是否含有指定链接地址
                                        if (fl != -1) {//二维码验证前缀链接固定内容
                                            var code = res.result.replace(app.globalData.codeHttp, '');
                                            var flag = testScan.test(code);//是否符合二维码正则表达式
                                            if (flag) {//二维码结果符合12位数字的规则
                                                that.setData({
                                                    'unlockBikeParams.device_id': code
                                                })
                                            }

                                            //扫码之后请求接口
                                            that.scanBikeQr(code)
                                        } else {//二维码结果验证失败
                                            wx.showModal({
                                                title: '扫码失败',
                                                content: "请扫描正确的二维码!",
                                                showCancel: false,
                                                confirmText: "我知道了",
                                                confirmColor: app.globalData.main_color
                                            })
                                        }
                                    },
                                    fail: function () {
                                        // wx.showModal({
                                        //   title: '扫码失败',
                                        //   // content: "请扫描正确的二维码!",
                                        //   showCancel: false,
                                        //   confirmText: "我知道了",
                                        //   confirmColor: app.globalData.main_color
                                        // })
                                    },
                                    complete: function () {

                                    }
                                })
                            } else if (auth_status == -1) {
                                if (!(deposit && deposit > 0)) {//没有交押金
                                    wx.showModal({
                                        title: '温馨提示',
                                        content: "由于您信用分低于100，请先缴纳押金再用车!",
                                        showCancel: true,
                                        confirmText: "去充值",
                                        cancelText: "我再看看",
                                        confirmColor: "#34B5E3",
                                        success: function (res) {
                                            if (res.confirm) {//跳转充值页面
                                                wx.navigateTo({
                                                    url: '../deposit/deposit'
                                                })
                                            }
                                        }
                                    })
                                }
                            } else if (auth_status == -2) {//余额不足
                                wx.showModal({
                                    title: '温馨提示',
                                    content: "余额不足，请先充值再用车!",
                                    showCancel: true,
                                    confirmText: "去充值",
                                    cancelText: "我再看看",
                                    confirmColor: "#34B5E3",
                                    success: function (res) {
                                        if (res.confirm) {//跳转充值页面
                                            wx.navigateTo({
                                                url: '../recharge/recharge'
                                            })
                                        }
                                    }
                                })
                            } else if (auth_status == -3) {//账户已冻结
                                wx.showModal({
                                    title: '温馨提示',
                                    content: "您的账户已冻结",
                                    showCancel: true,
                                    confirmText: "去充值",
                                    cancelText: "我再看看",
                                    confirmColor: "#34B5E3",
                                    success: function (res) {
                                        if (res.confirm) {//跳转充值页面
                                            wx.navigateTo({
                                                url: '../recharge/recharge'
                                            })
                                        }
                                    }
                                })
                            } else if (auth_status == -4) {//需要实名认证
                                wx.showModal({
                                    title: '温馨提示',
                                    content: "您还没有实名认证",
                                    showCancel: true,
                                    confirmText: "去认证",
                                    cancelText: "我再看看",
                                    confirmColor: "#34B5E3",
                                    success: function (res) {
                                        if (res.confirm) {
                                            wx.navigateTo({
                                                url: '../realname/realname'
                                            })
                                        }
                                    }
                                })


                            } else {

                            }

                        }


                        else {//返回用户信息失败
                            //设置底部控件为扫码用车状态
                            that.setData({
                                'controls': that.data.notLoginMapControls,
                            })

                            //移除token
                            wx.removeStorageSync("token")

                            // wx.showToast({
                            //     title: message,
                            //     icon: 'loading',
                            //     duration: 2000,
                            // })


                            wx.showModal({
                                title: '用户信息过期',
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
                })
            }
        }


    } else if (id == 13) {
      var token = wx.getStorageSync('token') || ''
      if (token.length > 0) {
        //进入钱包
        wx.navigateTo({
          url: '../wallet/wallet'
        })
      } else {
        //注册登录 
        wx.navigateTo({
          url: '../login/login'
        })
      }
      //id=15是拨打客服电话按钮
    } else if (id == 15) {
      var token = wx.getStorageSync('token') || ''
      if (token.length > 0) {
        wx.makePhoneCall({
          phoneNumber: that.data.serverTel
          // ph: that.data.serverTel
        });
      } else {
        wx.navigateTo({
          url: '../login/login'
        })
      }

    } else if (id == 16) {
      //注册登录 
      wx.navigateTo({
        url: '../login/login'
      })
    } else if (id == 30) {
        that.onTapTipUserInfo();
    }
  },

  //扫描二维码返回的事件
  scanBikeQr: function (bikeQr) {
    //检查网络
    if (checkNetWork.checkNetWorkStatu() == false) {
    //   console.log('网络错误')
      that.show("网络异常请检查网络");
    } else {
      var that = this

      that.networkOpenLock(bikeQr);

      
      //跳转到开锁界面
      wx.navigateTo({
          url: '../unlocking/unlocking'
      })
    }
  },

  //网络开锁
  networkOpenLock: function (bikeQr) {
      var that = this;
      if (!websocket.socketOpened) {//websocket没有连接，则进行连接操作
          // setMsgReceiveCallback 
          websocket.setReceiveCallback(msgReceived, that);
          // connect to the websocket 
          websocket.connect();
      }
      var seq = Math.round(new Date().getTime() / 1000);
      app.globalData.websocketParams.seq = seq;
      var message = {
          'type': app.globalData.websocketParams.type,
          'seq': seq,
          'url': app.globalData.websocketParams.url.useBike,
          'data': {
              'bike_qr': bikeQr,
              'type': 1
          }
      }

      websocket.send({
          data: message
      });

  },

  //请求电话号码
  getTelPhone: function (e) {
    var that = this
    //检查网络
    if (checkNetWork.checkNetWorkStatu() == false) {
      console.log('网络错误')
    } else {
      wx.request({
        url: that.data.CfBikeUrl.getServerTel,
        data: {},
        method: 'POST',
        header: {
          'content-type': 'application/json'
        },
        success: function (res) {
          var message = res.data.state_info
          var state = res.data.state
          if (state = '00') {
            var serTel = res.data.ph;
            that.setData({//4000980588
              'serverTel': serTel ? serTel : '4000980588'
            })
            console.log('服务电话' + serTel);
          } else {
            that.setData({
              'serverTel': '4000980588'
            })
            console.log(11111111111111111111111111111111111111111111)
          }
        },

        fail: function () {
          that.setData({
            'serverTel': '4000980588'
          })
        },
        complete: function () {
        }
      })
    }
  },
  //请求附近单车列表
  getBikeList: function (e) {
    var that = this
    that.setData({
      'polyline': [],
      'markers': [],
      radioCheckVal: 0,//radioCheckVal 值为0时 代表是电单车
      down: 0//显示全部详情
    })
    //检查网络
    if (checkNetWork.checkNetWorkStatu() == false) {
        that.show("网络异常请检查网络");
    } else {

        that.setData({
            'getNearFavParams.types': 1
        })
        that.getNearfence();//运营区

      if (that.data.isCanGetBikeList) {//车辆骑行状态，不进行操作

        wx.showToast({
          title: '刷新车辆信息',
          icon: 'loading',
          duration: 1000,
        })

        wx.request({
          url: that.data.CfBikeUrl.getList,
          data: that.data.getBikeListParams,
          method: 'POST', 
          header: {
            'content-type': 'application/json'
          },

          success: function (res) {
             
            wx.hideToast();

            var message = res.data.state_info
            var state = res.data.state

            if (state = '00') {
              var bikeArr = res.data.data
              var markers = []
              var coordinate = {};//存储车辆坐标

              if (bikeArr && bikeArr !== null && bikeArr.length > 0) {

                for (var i = 0; i < bikeArr.length; i++) {
                  var bikeLat = Number(bikeArr[i].lat)
                  var bikeLong = Number(bikeArr[i].lng)

                  var id = Number(bikeArr[i].device_id)//设备ID

                  var bike_qr = Number(bikeArr[i].bike_qr) //string|车辆二维码=车辆编号=02100001
                  var use_status = Number(bikeArr[i].use_status)//int|状态
                  var device_id = Number(bikeArr[i].device_id)//int
                  var batt = Number(bikeArr[i].batt) //int|电量百分比
                  var distance = Number(bikeArr[i].distance)//int|车辆续航=额定续航*电量百分比
                  var bike_type = Number(bikeArr[i].bike_type) //int|车类型
                  var status = Number(bikeArr[i].status) // 车辆状态 0-正常 2-红包车 3-搬运车
                  var png = "../images/bike.png"//车辆显示图标
          
                  var width = 40 * wx.getStorageSync("kScreenW");//图标宽度
                  var height = 40 * wx.getStorageSync("kScreenW");//图标高度
                  coordinate[device_id] = { "lat": bikeLat, "lng": bikeLong}
                  if (status === 0){
                      var marker = {
                          latitude: bikeLat,
                          longitude: bikeLong,
                          iconPath: png,
                        //   id: id,
                          width: width,
                          height: height
                      }

                      markers.push(marker)
                  }   
                }

                that.setData({
                    'markers': markers,
                    'coordinate': coordinate//车辆坐标集合
                })

              }else{
                console.log('附近没有车辆')
                that.setData({
                  'markers': [],
                  'coordinate':{}
                })
              }
            }
 
          },
          fail: function () {
            wx.hideToast()
            that.failMessage("请求车辆信息服务器连接失败")
          },

          complete: function () {
            setTimeout(function () {
              wx.hideToast()
            }, 1000)
          }
        })
      }
    }
  },


  //请求附近电子围栏信息
  getNearfence: function (e) {
    var that = this
    //检查网络
    if (checkNetWork.checkNetWorkStatu() == false) {
      console.log('网络错误')
      that.show("网络异常请检查网络");
    } else {
      wx.request({
        url: that.data.CfBikeUrl.nearfenceUrl,
        data: that.data.getNearFavParams,
        method: 'POST', 
        header: {
          'content-type': 'application/json'
        },
        
        success: function (res) {
          var message = res.data.state_info
          var state = res.data.state
        
          if (state = '00') {
            var bikeArr = res.data.data
            var markers = []
            var polyline = []

            if (bikeArr && bikeArr !== null && bikeArr.length > 0) {
                            for (var i = 0; i < bikeArr.length; i++) {
                                
                                            var points = [];
                                            if (bikeArr[i].mars_gps_list) {
                                                var mars_gps_list = bikeArr[i].mars_gps_list;
                                                for (var j = 0; j < mars_gps_list.length; j++) {
                                                    points.push({
                                                        longitude: mars_gps_list[j].lng,
                                                        latitude: mars_gps_list[j].lat
                                                    })
                                                }
                                            }

                                            //当前电子围栏（多边形)
                                            var poly = {
                                                points: [],
                                                color: "#FF0000DD",//电子围栏虚线颜色
                                                width: 2,
                                                dottedLine: true //是否虚线
                                            }
                                            poly.points = points;//多边形区域点坐标集

                                            polyline.push(poly)
                            }

                            that.setData({
                                'polyline': polyline
                            })
                            
                            
            }
          }
        },
        fail: function () {
          that.failMessage()
        },
        complete: function () {
        }
      })
    }
  },

  //请求停车点
  getBikeSports: function (e) {
    var that = this
    that.setData({
        'getNearFavParams.types': 2,
        'radioCheckVal': 1,
        'polyline':[],
        down: 1//详情收缩状态
    })
      


      //检查网络
      if (checkNetWork.checkNetWorkStatu() == false) {
          console.log('网络错误')
          that.show("网络异常请检查网络");
      } else {

          wx.showToast({
              title: '刷新停车点',
              icon: 'loading',
              duration: 1000,
          })

          wx.request({
              url: that.data.CfBikeUrl.nearfenceUrl,
              data: that.data.getNearFavParams,
              method: 'POST',
              header: {
                  'content-type': 'application/json'
              },

              success: function (res) {
                  wx.hideToast()

                  var message = res.data.state_info
                  var state = res.data.state

                  if (state = '00') {
                      var bikeArr = res.data.data
                      var markers = []

                      if (bikeArr && bikeArr !== null && bikeArr.length > 0) {
                          for (var i = 0; i < bikeArr.length; i++) {
                                  var bikeLat = Number(bikeArr[i].fence_mars_lat)
                                  var bikeLong = Number(bikeArr[i].fence_mars_lng)
                                  var width = 40 * wx.getStorageSync("kScreenW")
                                  var height = 40 * wx.getStorageSync("kScreenW")
                                  var png = "../images/stop_point.png";

                                  var marker = {
                                      latitude: bikeLat,
                                      longitude: bikeLong,
                                      iconPath: png,
                                      width: width,
                                      height: height
                                  }
                                  markers.push(marker)
                          }

     
                        that.setData({
                            'markers': markers
                        })
                      }
                  }else{
                      that.setData({
                          'markers': []
                      })
                  }
              },
              fail: function () {
                  wx.hideToast()
                  that.failMessage()
              },
              complete: function () {
              }
          })
      }
  },


  //位置变化的时候
  regionchange: function (e) {

    //得到地图中心点的位置
    var that = this
    that.mapCtx.getCenterLocation({
      success: function (res) {
      
        //调试发现地图在滑动屏幕开始和结束的时候都会走这个方法,需要判断位置是否真的变化来判断是否刷新单车列表
        //经纬度保留6位小数
        // var longitudeFix = res.longitude.toFixed(6)
        // var latitudeFix = res.latitude.toFixed(6)

        var longitudeFix = res.longitude
        var latitudeFix = res.latitude

        if (e.type == "begin") {
          console.log('位置相同,不执行刷新操作')
        } else {

            var latitude = wx.getStorageSync('latitude');
            var longitude = wx.getStorageSync('longitude');
            if ((Math.abs(latitude - latitudeFix)) < 0.0001) {

                console.log('位置相同,不执行刷新操作')
                return;
            }


            wx.setStorageSync('latitude', latitudeFix);
            wx.setStorageSync('longitude', longitudeFix);
            console.log('end====' + 'latitudeFix ====' + latitudeFix + 'longitudeFix' + longitudeFix)
            var point = {
                latitude: latitudeFix,
                longitude: longitudeFix
            };

         

          //刷新单车列表
          if (that.data.isCanGetBikeList) {
            if (that.data.radioCheckVal == "0"){
                that.setData({
                    'getBikeListParams.lng': longitudeFix,
                    'getBikeListParams.lat': latitudeFix,
                    'point': point
                })
                that.getBikeList()
            
            } else{
                that.setData({
                    'getNearFavParams.lng': longitudeFix,
                    'getNearFavParams.lat': latitudeFix,
                    'point': point
                })
                that.getBikeSports()
            }
              
          }
        }
      }
    })
  },

  //点击标注点
  markertap: function (e) {
    // var that = this;
    // var coordinate = that.data.coordinate;//车辆坐标集合
    // var bike_loca = coordinate[e.markerId]

    // //打开微信内置导航地址
    // wx.openLocation({
    //   latitude: bike_loca.lat,
    //   longitude: bike_loca.lng,
    //   scale: 16
    // })  
  },

  //定位到用户当前位置
  getUserCurrentLocation: function () {
    this.mapCtx.moveToLocation();
  },

  failMessage: function () {
    wx.showToast({
      title: '连接服务器失败',
      icon: 'loading',
      duration: 2000,
    })
  },
  
//   locking_tem: function () {//临时停车
//     //检查网络
//     if (checkNetWork.checkNetWorkStatu() == false) {

//     } else {
//       var that = this
//       that.getLocation(function (state) {//确保请求到位置状态信息

//         //连接websocket，连接成功，若有骑行中的车辆服务器会返回一条骑行状态信息。
//         if (state == "") {//获取不到用户信息
//           wx.showModal({
//             title: '用户信息异常',
//             content: '用户信息异常，请退出小程序重新进入！',
//             showCancel: false,
//             confirmText: "我知道了",
//             confirmColor: app.globalData.main_color
//           })
//         } else if (state == "0") {//服务器返回信息状态码非"00",车辆位置信息异常
//           wx.showModal({
//             title: '车辆位置信息异常',
//             content: '车辆位置信息异常，请稍后重试！',
//             showCancel: false,
//             confirmText: "我知道了",
//             confirmColor: app.globalData.main_color
//           })
//         } else {
//           if (state == "10" || state == "11" || state == "12") {//运营区域外，不予开锁(需提示用户)
//             wx.showModal({
//               title: '临时停车失败',
//               content: '运营区域外禁止临时停车,请骑回运营区内！',
//               showCancel: false,
//               confirmText: "我知道了",
//               confirmColor: app.globalData.main_color
//             })
//           } else {//可正常锁车（发送锁车请求

//             if (!websocket.socketOpened) {//websocket没有连接，则进行连接操作
        
//               websocket.setReceiveCallback(msgReceived, this);
    
//               websocket.connect();

//             }
//             var seq = Math.round(new Date().getTime() / 1000);
//             app.globalData.websocketParams.seq = seq;
//             console.log("当前seq:"+seq)
//             var message = {
//               'type': app.globalData.websocketParams.type,
//               'seq': seq,
//               'url': app.globalData.websocketParams.url.templock,
//               'data': {
//                 'bike_qr': app.globalData.ridingBikeData.data.bike_qr,
//                 'type': 2//int|开锁方式|1-网络
//               }
//             }

//             websocket.send({
//               data: message
//             });
//           }
//         }
//       })

//     }
//   },

//   unlocking_tem: function () {//临时解锁、继续用车
//     //检查网络
//     if (checkNetWork.checkNetWorkStatu() == false) {
 
//     } else {
//       var that = this
//       that.getLocation(function (state) {//确保请求到位置状态信息
//         //连接websocket，连接成功，若有骑行中的车辆服务器会返回一条骑行状态信息。
//         if (state == "") {//获取不到用户信息
//           wx.showModal({
//             title: '用户信息异常',
//             content: '用户信息异常，请退出小程序重新进入！',
//             confirmText: "我知道了",
//             confirmColor: app.globalData.main_color
//           })
//         } else if (state == "0") {//服务器返回信息状态码非"00",车辆位置信息异常
//           wx.showModal({
//             title: '车辆位置信息异常',
//             content: '车辆位置信息异常，请稍后重试！',
//             showCancel: false,
//             confirmText: "我知道了",
//             confirmColor: app.globalData.main_color
//           })
//         } else {
//           if (state == "10" || state == "11" || state == "12") {//运营区域外，不予开锁(需提示用户)
//             wx.showToast({
//               title: '车辆位置非法',
//               icon: 'loading',
//               duration: 2000,
//             })
//           } else {

//             if (!websocket.socketOpened) {//websocket没有连接，则进行连接操作
//               websocket.setReceiveCallback(msgReceived, this);
//               websocket.connect();
//             }

//             var seq = Math.round(new Date().getTime() / 1000);
//             app.globalData.websocketParams.seq = seq;
//             console.log("当前seq:" + seq)
//             var message = {
//               'type': app.globalData.websocketParams.type,
//               'seq': seq,
//               'url': app.globalData.websocketParams.url.tempunlock,
//               'data': {
//                 'bike_qr': app.globalData.ridingBikeData.data.bike_qr,
//                 'type': 2//int|开锁方式|1-网络
//               }
//             }
//             websocket.send({
//               data: message
//             });
//           }
//         }
//       })

//     }
//   },

  locking: function () {//结束行驶/锁车锁车
    
     var that = this;

    //  if (isRidingBike != 1) {//用户没有用车
    //      getApp().globalData.isRidingBike = 0;
    //      that.setData({
    //          "isCanGetBikeList": true,
    //          "bikeRiding.show": false,
    //          'controls': hasLoginMapControls,
    //          "mapHeight": "100%",
    //          "bikeAbnormity.show": false,
    //          "isCanGetBikeList": true,
    //      })
    //      //隐藏加载图
    //      wx.hideToast()
    //      return;
    //  }

    


    //检查网络
    if (checkNetWork.checkNetWorkStatu() == false) {
        that.show("网络异常请检查网络");
        
    } else {
        var that = this
        that.getBikeLocation(function (data) {//确保请求到位置状态信息
        var state = data.loca;
        var msg = data.desc;
        //连接websocket，连接成功，若有骑行中的车辆服务器会返回一条骑行状态信息。
        if (state == "") {//获取不到用户信息
          wx.showModal({
            title: '用户信息异常',
            content: msg,
            showCancel: false,
            confirmText: "去登录",
            confirmColor: app.globalData.main_color,
            success: function (res) {
                if (res.confirm) {
                    wx.navigateTo({
                        url: '../login/login'
                    })
                }
            }
          })
        } else if (state == "0") {//服务器返回信息状态码非"00",车辆位置信息异常
        //   wx.showModal({
        //     title: '登录异常',
        //     content: msg,
        //     showCancel: false,
        //     confirmText: "去登录",
        //     confirmColor: app.globalData.main_color,
        //     success: function (res) {
        //           if (res.confirm) {
        //               wx.navigateTo({
        //                   url: '../login/login'
        //               })
        //           } 
        //       }


        //   })

            that.onShow;
        } else {
          if (state == "4" || state == "7") {//运营区域外，不予开锁(需提示用户)
            var desc = data.desc;
            wx.showModal({
              title: '您确定要结束用车吗?',
              content: desc ? desc : '您当前还车位置不在固定停车点，结束骑车扣除一定的搬运费!',
              cancelText:"取消",
              confirmText: "确定",
              confirmColor: app.globalData.main_color,
              success: function(res){
                   if(res.confirm){//确定停车
                       that.lockingBikeWithSocket();
                   }else if(res.cancel){//取消停车
                       that.setData({
                           'disabled': false
                       })
                   }
              }
            })
          }else {//可正常锁车（发送锁车请求
            wx.showToast({
              title: '锁车中....',
              icon: 'loading',
              duration: 3000,
            })
              that.lockingBikeWithSocket();
          }
        }
      })

    }
  },


  getBikeLocation: function (cb) {
      var that = this
      //1.先请求查询车辆状态
      var token = wx.getStorageSync('token') || '';//用户token
      if (token != '') {//token不为空，可提交请求
                    that.setData({
                        'disabled': true
                    })

                    wx.request({
                        url: that.data.CfBikeUrl.usingloca,
                        method: 'post',
                        data: {
                            'token': token
                        },
                        header: {
                            'content-type': 'application/json'
                        },
                        success: function (res) {
                            var state = res.data.state//成功返回状态码
                            var message = res.data.state_info //返回说明 
                            var msg = res.data.data //返回用户信息结果集
                            if (state == "00") {//返回车辆位置信息成功
                                // typeof cb == "function" && cb(msg.loca)
                                typeof cb == "function" && cb(msg)
                            } else {
                                // app.globalData.indexPage.setData({
                                //     'disabled': false
                                // })
                                var data = {
                                    loca:'0',
                                    desc:message
                                }
                                typeof cb == "function" && cb(data)
                            }
                        },

                        fail: function () {

                        },
                        complete: function () {

                        }
                    })
      } else {
                    var data = {
                        loca: '',
                        desc: '登录已过期请重新登录'
                    }
                    typeof cb == "function" && cb(data)
      }

  },

  lockingBikeWithSocket:function(){

      if (!websocket.socketOpened) {//websocket没有连接，则进行连接操作
          websocket.setReceiveCallback(msgReceived, this);
          websocket.connect();

      }

      if (app.globalData.ridingBikeData.data.order_id && app.globalData.ridingBikeData.data.order_id != '') {
          var seq = Math.round(new Date().getTime() / 1000);
          app.globalData.websocketParams.seq = seq;
          var message = {
              'type': app.globalData.websocketParams.type,
              'seq': seq,
              'url': app.globalData.websocketParams.url.returnBike,
              'data': {
                  'order_id': app.globalData.ridingBikeData.data.order_id,
                  'type': 1
              }
          }

          websocket.send({
              data: message
          });
      } else {
          //   wx.showToast({
          //     title: '获取订单数据异常锁车失败',
          //     icon: 'loading',
          //     duration: 3000,
          //   })
      }

  }
,
  //跳转设置页面，获取地理位置授权
  getAuthor: function () {
    var that = this
    wx.getSetting({
      success(res) {
        if (!res.authSetting['scope.userLocation']) {
          wx.openSetting({
            success: (res) => {
              console.log(res)
              if (!res.authSetting['scope.userLocation']) {
                wx.showModal({
                  title: '温馨提醒',
                  content: '需要获取您的地理位置才能使用小程序',
                  cancelText: '不使用',
                  confirmText: '获取位置',
                  confirmColor: app.globalData.main_color,
                  success: function (res) {
                    if (res.confirm) {
                      that.getAuthor();
                    } else if (res.cancel) {
                      wx.showModal({
                        title: '温馨提醒',
                        content: '您可点击左下角 定位按钮 重新获取位置',
                        showCancel: false,
                        confirmText: "我知道了",
                        confirmColor: app.globalData.main_color
                      })
                    }
                  }
                })
              } else {
                wx.showModal({
                  title: '温馨提醒',
                  content: '请点击左下角定位按钮重新获取位置，或者重新进入小程序',
                  showCancel: false,
                  confirmText: "我知道了",
                  confirmColor: app.globalData.main_color
                })
              }
            }
          })
        }
      }
    })

  },

  //页面加载的函数
  onLoad: function () {
    
    //初始化一个组件实例
    new app.ToastPannel();

    wx.setStorageSync('token', '');
    var that = this
    that.getTelPhone();
    //获取用户的当前位置位置
    wx.getLocation({
      type: 'gcj02', // 默认为 wgs84 返回 gps 坐标，gcj02 返回可用wx.openLocation 的坐标
      success: function (res) {
        var latitude = res.latitude
        var longitude = res.longitude

        var point = {
          latitude: latitude,
          longitude: longitude
        };

        that.setData({
          'getBikeListParams.lng': longitude,
          'getBikeListParams.lat': latitude,
          'getNearFavParams.lng': longitude,
          'getNearFavParams.lat': latitude,
          'radioCheckVal':0,
          'point': point
        })

        that.getBikeList();//请求附近车辆信息

        
      },
      fail: function () {
        wx.showModal({
          title: '温馨提醒',
          content: '需要获取您的地理位置才能使用小程序',
          showCancel: false,
          success: function (res) {
            if (res.confirm) {//经过提示后，用户同意授权，再获取一次授权信息
              that.getAuthor()
            } else {
            }
          }
        })
      }
    })
    //计算屏幕的高度
    var h = wx.getStorageSync("kScreenH")
    var top = h * 0.25 * 0.7
    var bottom = h * 0.25 * 0.3
    that.setData({
      'bikeRiding.topLineHeight': top,
      'bikeRiding.bottomLineHeight': bottom
    })

    app.getWx_info(function (token) {//确保请求到token后再做接下来的动作
      console.log("--------------------------回调函数获取到的token:" + token);
      //连接websocket，连接成功，若有骑行中的车辆服务器会返回一条骑行状态信息。
      console.log("本地token为:" + wx.getStorageSync('token'));
      if (token && token != "" && token.length > 0) {
        //设置底部控件为扫码用车状态
        that.setData({
          'controls': that.data.hasLoginMapControls,
        })
      }

      //如果APP被微信强制关闭或异常杀死,重启的情况下,检查用户的用车状态
      //如果未登录,则不做处理,否则请求查询接口
      if (checkNetWork.checkNetWorkStatu() == false) {
          that.show("网络异常请检查网络");
      } else {
        if (token && token != "" && token.length > 0) {
          if (!websocket.socketOpened) {//websocket没有连接，则进行连接操作
    

            websocket.setReceiveCallback(msgReceived, this);
   
            websocket.connect();
      
            var timer_ping = setInterval(function () {
             
              var seq = Math.round(new Date().getTime() / 10);
              app.globalData.websocketParams.seq_heart = seq;
  
              var message = {
                'type': app.globalData.websocketParams.heartType,
                'seq': seq,
                'url': getApp().globalData.websocketParams.url.heartBeat
              }

              websocket.send({
                data: message
              });
            }, 15000)
          }
        }
      }
    })

  },

  onReady: function (e) {
    //通过id获取map,然后创建上下文
    this.mapCtx = wx.createMapContext("myMap");
  },

  onShow: function () {
    var that = this
    app.globalData.indexPage = that;
    app.globalData.indexPage.setData({//设置转圈与暂时停车、结束用车可点击
      'disabled': false
    })
    wx.hideToast();
    var isRidingBike = app.globalData.isRidingBike
    // 生命周期函数--监听页面显示
    var networkStatu = checkNetWork.checkNetWorkStatu()
    if (isRidingBike != 1){
      that.setData({
        //"mapScale": 16,//
        "isCanGetBikeList": true,//地图上方活动条是否显示
        "temLockText": '临时停车',
        "temLocking": false
        
      })
    }

    var checkTimer = setInterval(function () {
      var completeStatu = that.data.completeStatu

      if (completeStatu) {
   
        clearInterval(checkTimer)
        //完成界面的加载
        //获取tokn
        var token = wx.getStorageSync('token') || ''

 
        //获取骑行状态

        //已登录的map组件
        var hasLoginMapControls = that.data.hasLoginMapControls
        //未登录的map组件
        var notLoginMapControls = that.data.notLoginMapControls
        if (token && token != "" && token.length > 0) {
          //表示已登录
          //1.给扫码接口的token赋值
          that.setData({
            'unlockBikeParams.token': token
          })


          if (isRidingBike == 0) {//骑行状态0表示正常,1表示骑行中,2表示结束了骑行
            //正常状态
            //2.显示骑行中的视图,隐藏map控件
            that.setData({
              'controls': hasLoginMapControls,
            })
            //隐藏加载图
            wx.hideToast()
          } else if (isRidingBike == 1) {//骑行状态0表示正常,1表示骑行中,2表示结束了骑行
            //正在骑行中
            //3.显示骑行中的视图,隐藏map控件,改变地图高度,不能查询附近的单车了
            
            that.setData({
              "mapScale": 14,//用车状态中，放大地图，以显示出电子围栏
              "isCanGetBikeList": false,
              "bikeRiding.show": true,
              "markers": [{
                latitude: that.data.point.latitude,
                longitude: that.data.point.longitude,
                iconPath: "../images/hidden_explain.png",
                width: 1,
                height: 1
              }],
              'controls': that.data.usingBikeMapControls,
            //   'controls': [
            //     {
            //       position: {
            //         width: 1,
            //         height: 1
            //       },
            //       iconPath: '../images/hidden_explain.png',
            //       clickable: false,
            //     }],
              "mapHeight":"100%"//停车点页面的地图宽度
            })
            //计费异常视图还存在时,继续显示异常视图
            if (that.data.bikeAbnormity.show) {
              that.setData({
                "mapHeight": "85%",
                "bikeRiding.show": false
              })
            }
            //隐藏加载图
            wx.hideToast()
            //创建定时器,检查骑行是否结束
            var networkStatu = checkNetWork.checkNetWorkStatu()
            //console.log("that.data.isCreateTimerStatu:" + that.data.isCreateTimerStatu )
            if (that.data.isCreateTimerStatu == false) {
              that.setData({
                "isCreateTimerStatu": true
              })
              //var ridingTimer = setInterval(function(){
              //--------检查骑行的状态，展示骑行的数据在骑行视图中-------------------
              //检查骑行的状态，展示骑行的数据在骑行视图中
              var ridingBikeData = getApp().globalData.ridingBikeData;//骑行相关数据

              if (typeof (ridingBikeData) == 'object' && JSON.stringify(ridingBikeData) != "{}") {
                //var message = res.data.message
                var time = Math.round(ridingBikeData.data.use_time) //使用时长
                var pay = parseInt(ridingBikeData.data.use_price) / 100;//骑行费用 服务器返回单位为分，除以100计量为元
                var distance = parseFloat(parseInt(ridingBikeData.data.distance) / 1000).toFixed(2); //续航里程
                var batt = ridingBikeData.data.batt;//电量
                var bike_qr = ridingBikeData.data.bike_qr; //车辆ID
                var use_status = ridingBikeData.data.use_status;//int	用车状态 >0-用车中 5-临时锁车

                if (use_status == 5) {
                  that.setData({
                    "temLockText": '继续用车',
                    "temLocking": true//车辆在临时停车状态中
                  })
                }
                var bike_status = ridingBikeData.data.bike_status;//int车辆状态 0-正常 2-红包车 3-搬运车
            
                var statu_text = "正常";//车辆状态说明
     
                if (bike_status == 2) {
                  statu_text = "红包车"
                } else if (bike_status == 3) {
                  statu_text = "搬运车"
                }
      
                //设置骑行视图界面参数
                that.setData({
                  "bikeRiding.ridingTime": time,
                  "bikeRiding.ridingDistance": distance,
                  "bikeRiding.pay": pay,
                  "bikeRiding.batt": batt,
                  "bikeRiding.statu": statu_text,
                  "bikeRiding.bike_qr": bike_qr
                })
              } else {
               
              }
            }

          } else if (isRidingBike == 2) {
            //结束骑行
            //修改全局骑行状态为1即正常状态
            getApp().globalData.isRidingBike = 0
            that.setData({
              "isCanGetBikeList": true,
              "bikeRiding.show": false,
              'controls': hasLoginMapControls,
              "mapHeight": "100%",
              "bikeAbnormity.show": false,
              "isCanGetBikeList": true,
            })
            //隐藏加载图
            wx.hideToast()
          }
        } else {

          //没有登录
          //所有数据恢复到初始值
          that.setData({
            'controls': notLoginMapControls,
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
            },
            //计费异常的视图的属性
            "bikeAbnormity": {
              show: false,
            },
          })
          //隐藏加载图
          wx.hideToast()
        }
      } else {
 
      }
    }, 1000)
  },

//   forcereturn: function () {//强制还车
//     var that = this;
//     var token = wx.getStorageSync('token') || '';//用户token
//     var order_id = app.globalData.ridingBikeData.data.order_id;//用户订单id
//     var datas = {
//       'token': token,
//       'order_id': order_id
//     }

//     if (token != '') {
//       wx.request({
//         url: that.data.CfBikeUrl.forcereturnUrl,
//         method: 'post',
//         data: datas,
//         header: {
//           'content-type': 'application/json'
//         },
//         success: function (res) {
//           var state = res.data.state//成功返回状态码
//           var message = res.data.state_info //返回说明 
//           var msg = res.data.data //返回用户信息结果集
//           if (state == '00') {//状态码为'00'表示注册成功，返回用户信息
//             app.globalData.isRidingBike = 2;//骑行状态改为2，表示骑行结束
//             //1表示注册
//             wx.showToast({
//               title: '强制还车:\n' + 'OK',
//               icon: 'success',
//               duration: 2000,
//             })
//             that.setData({
//               "bikeRiding.show": false,
//               'controls': that.hasLoginMapControls,
//               "mapHeight": "100%",
//               "bikeAbnormity.show": false,
//               "isCanGetBikeList": true,
//             })

//             //所有数据恢复到初始值
//             that.setData({
//               'controls': that.notLoginMapControls,
//               //地图的宽高
//               "mapHeight": '100%',
//               "mapWidth": '100%',
//               "mapTop": '0',
//               //正在骑行中的视图的属性
//               bikeRiding: {
//                 show: false,
//                 ridingTime: 0,//骑行时间
//                 ridingDistance: 0,
//                 statu: '正常',//车辆状态
//                 pay: 0,//骑行费用
//                 batt: 0,//电量
//                 distance: 0,//int	车辆续航= 额定续航 * 电量百分比
//                 bike_qr: 0,
//                 height: '50%',
//                 width: '100%',
//                 topLineHeight: "0rpx",
//                 bottomLineHeight: "0rpx",
//               }
//             })

//             app.globalData.ridingBikeData = msg;//骑行状态相关数据

//             var time = msg.usetime;//骑行时间 
//             var pay = parseInt(msg.pay) / 100;//骑行费用
//             var distance = msg.distance;//骑行距离（米）
//             var amount = parseInt(msg.amount) / 100;//账户余额
//             var give_amount = msg.give_amount;//赠送红包
//             var distance = msg.distance;//骑行距离
//             var sub_amount = parseInt(msg.sub_amount) / 100;//扣除搬运费
//             //骑行结束,跳到骑行结算界面
//             wx.navigateTo({
//               url: '../cost/cost?time=' + time + "&pay=" + pay + "&distance=" + distance + "&amount=" + amount + "&give_amount=" + give_amount + "&sub_amount=" + sub_amount,
//             })

//           } else {
//             wx.showToast({
//               title: message + '强制还车失败！',
//               icon: 'loading',
//               duration: 2000,
//             })
//           }

//         },
//         fail: function () {
    
//           that.failMessage('强制还车连接服务器失败')
//         },
//         complete: function () {
//         }
//       })
//     }
//   },

  toActivity: function () {
    wx.showToast({
      title: '点击了首页活动栏',
      icon: 'loading',
      duration: 2000,
    })
    wx.navigateTo({
      url: '../activity/activity'
    })
  },

  //获取链接中的参数
  GetQueryString: function (url, name) {
    var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)");
    var r = url.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
  },

  //骑行详情页面，控制上拉下滑显示
  down_up:function(){
      var that = this
      var down = (that.data.down == 1) ? 0 : 1
      console.log('down',down)
      that.setData({
        'down':down
      })
  },

  //用户须知
  onTapTipUserInfo:function(){
      var webUrl = ' https://www.kyzlc.com/wc/userInstructions/userInstructions.html';
      wx.navigateTo({
          url: '../WebView/webView?webUrl=' + webUrl
      })
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
      desc: '我刚刚发现了一款便宜又好用的智能助力车,分享给大家看看吧', // 分享描述
      path: '/index/index' // 分享路径
    }
  }
})

