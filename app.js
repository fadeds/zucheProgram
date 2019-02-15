//app.js
const httpsRequest = require('./utils/util.js');
// const toastPannel = require('./components/Toast/toast.js');
import {ToastPannel} from './components/Toast/toast.js';
App({
    httpsRequest:httpsRequest,
    ToastPannel,
    globalData: {
      //  request_url: 'https://api.kyzlc.com',//正式----服务器接口请求地址-http
      //  websocket_url: 'wss://ws.kyzlc.com/socket/conn',//正式----服务器接口请求地址-websocket

       
         request_url: 'https://apitest.kyzlc.com', //测试----服务器接口请求地址-http
          websocket_url: 'wss://wstest.kyzlc.com/socket/conn', //测试----服务器接口请求地址-websocket
        token: '', //用户token,登陆时服务器返回，用于用户标识
        app_id: 'wxf4d4ad5ba914f0e7', //小程序appid
        openid: '', //微信用户的openid
        flag: false, //标记服务器返回开锁失败
        main_color: '#3692fc', //主颜色值，状况颜色值
        codeHttp: 'https://www.kyzlc.com/bicycle/index.html?m=', //二维码链接前缀，用以判断扫描到的二维码是否符合规则
        //骑行状态0表示正常,1表示骑行中,2表示结束了骑行
        isRidingBike: 0,
        websocketParams: {
            type: 0, //req
            heartType: 3, //心跳请求type
            seq: 1, //消息序列号
            seq_heart: 1, //心跳响应序列号
            url: {
                heartBeat: "/socket/heart/ping", //socket心跳，数据层兼容
                heartPong: "/socket/heart/pong", //服务器响应socket心跳
                useBike: "/socket/bike/use", //租车 扫码后开锁
                returnBike: "/socket/bike/return", //还车
                tempunlock: "/socket/bike/tempunlock", //临时解锁
                templock: "/socket/bike/templock", //临时锁车
                usingStatu: "/socket/bike/status/using" //用车状态-车辆位置及电池等实时数据
            }
        },

        indexPage: {},
        //请求开锁后返回的json数据
        unlockJson: {
            res: {},
            params: {}
        },
        //骑行中相关数据
        ridingBikeData: {},
        //微信用户信息
        wx_userinfo: {
            code: '',
            iv: '',
            encrypted_data: ''
        }
    },

    getToken: function() {
        return this.globalData.token
    },

    setToken: function(token) {
        this.globalData.token = token;
    },

    onLaunch: function() {
        var that = this;
        //调用API从本地缓存中获取数据
        var logs = wx.getStorageSync('logs') || []
        logs.unshift(Date.now())
        wx.setStorageSync('logs', logs)
        //调用系统API获取设备的信息
        wx.getSystemInfo({
            success: function(res) {
                console.log("手机设备信息")
                console.log(res)
                var kScreenW = res.windowWidth / 375
                var kScreenH = res.windowHeight / 603
                wx.setStorageSync('kScreenW', kScreenW)
                wx.setStorageSync('kScreenH', kScreenH)
                 // 设备信息
                var client_info = "|" + res.brand + " " + res.model + "|" + res.system + "|";
                wx.setStorageSync('client_info', client_info)
            }
        })
    },

    getWx_info: function(cb) {
        var that = this
        //1.获取当前登录微信用户的登录凭证(code)---
        wx.login({
            success: function(res) {
                var code = res.code; //微信用户code
                if (code) {
                    that.globalData.wx_userinfo.code = code;

                    // 2.发送凭证到服务器端并在服务端使用该凭证向微信服务器换取该微信用户的唯一标识(openid)和会话密钥(session_key)
                    wx.getUserInfo({
                            withCredentials: true,
                            success: function(res_user) {
                                console.log('获取用户信息数据res_user:')
                                console.log(res_user)
                                var encrypted_data = res_user.encryptedData; //微信用户encryptedData
                                var iv = res_user.iv; //微信用户iv
                                that.globalData.wx_userinfo.iv = iv;
                                that.globalData.wx_userinfo.encrypted_data = encrypted_data;
                                that.login(cb); //执行login
                            },
                            fail: function() {
                            }
                        })
                        
                } else {
                    console.log('获取用户登录态失败：' + res.errMsg);
                }
            }
        });
    },

    login: function(cb) {
        var that = this;
        var datainfo = {
                app_id: that.globalData.app_id,
                code: that.globalData.wx_userinfo.code,
                iv: that.globalData.wx_userinfo.iv,
                encrypted_data: that.globalData.wx_userinfo.encrypted_data,
                client_info: wx.getStorageSync('client_info'),
                pn: '',
                type: 2 //1-密码登录 2-微信小程序免密登录 3-三方登录
            }

        var pn = wx.getStorageSync('phone') || ''; //用户手机号
        if (pn != "") datainfo.pn = pn;
        //3.直接向服务器提交用户信息，实现用户免登陆
        wx.request({
            url: that.globalData.request_url + "/auth/login", //请求登陆
            data: datainfo,
            method: 'POST',
            header: {
                'content-type': 'application/json'
            },
            success: function(res) {
                var state = res.data.state; //返回状态码,00成功,07用户未注册
                if (state == '00') { //登陆成功
                    var token = res.data.token;
                    //将token保存到本地小程序内
                    that.globalData.token = token;
                    wx.setStorageSync('token', token)
                    typeof cb == "function" && cb(wx.getStorageSync('token'))
                } else {
                    typeof cb == "function" && cb("")
                }
            }
        })
    },

    //获取openid
    getOpenId: function(code) {
        var that = this;
        wx.request({
            url: 'https://www.see-source.com/weixinpay/GetOpenId',
            method: 'POST',
            header: {
                'content-type': 'application/x-www-form-urlencoded'
            },
            data: { 'code': code },
            success: function(res) {
                var openId = res.data.openid;
                that.globalData.openid = openId;
            }
        })
    },

    //获取用户授权
    tapToAuthorize: function() {
        var that = this
        //再授权
        wx.openSetting({
            success: (res) => {
                /*
                 * res.authSetting = {
                 *   "scope.userInfo": true,
                 *   "scope.userLocation": true
                 * }
                 */

                //因为openSetting会返回用户当前设置，所以通过res.authSetting["scope.userInfo"]来判断用户是否勾选了【用户信息】这一项
                // if (res.authSetting["scope.userInfo"] === true) {
                //   console.log("再次获取用户信息")
                // }
                // else {
                //   wx.showModal({
                //     title: '用户未授权',
                //     content: '如需正常使用小程序，请点击授权按钮，勾选用户信息并点击确定。',
                //     showCancel: false,
                //     success: function (res) {
                //       if (res.confirm) {
                //         console.log('用户点击确定')
                //       }
                //     }
                //   })
                // }
            }
        })
    }

})