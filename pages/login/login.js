var md5 = require("../MD5.js")
var checkNetWork = require("../CheckNetWork.js");
var app = getApp();
Page({
    data: {
        getCodeBtnProperty: { //验证码
            titileColor: '#B4B4B4',
            disabled: true,
            loading: false,
            title: '获取验证码'
        },
        getCodeParams: { //获取验证码需提交参数
            pn: '', //string|手机号
            type: 1 //int|类型|1-注册验证码 2-手机号码更换验证码 3-忘记密码
        },
        loginBtnProperty: {
            disabled: true,
            loading: false,
            opacity: 0.4, //设置透明度  
        },
        //正常登陆参数
        commonLoginParams: {
            pn: '',
            vc: '',
            type: 1
        },
        codeTfFocus: false,
        CfBikeUrl: {
            getcode: getApp().globalData.request_url + "/auth/requestsmsvc", //短信验证码
            //loginUrl: app.globalData.request_url + "/auth/login"
            loginUrl: app.globalData.request_url + "/auth/register",
            userInfoUrl: app.globalData.request_url + "/user/getinfo",
        },
        password: '', //原始密码
        //校验码
        SALT: "KUAYUEBIKE",
        autoFoucs: false,
        showModel: false,
    },
    onLoad: function(options) {
        // 生命周期函数--监听页面加载
        wx.getSetting({
            success: (res) => {
                var that = this
                    //没有授权过
                if (!res.authSetting['scope.userInfo']) {
                    that.setData({
                        showModel: true
                    })
                } else { //已授权
                    that.setData({
                        showModel: false,
                        autoFoucs: true
                    })
                }
            },

            fail: function() {
                wx.showToast({
                    title: '系统提示:网络错误',
                    icon: 'warn',
                    duration: 1500,
                })
            }
        })
    },

    //输入手机号
    phoneTfInput: function(e) {
        var that = this
        var inputValue = e.detail.value
        var length = e.detail.value.length
        if (length == 11) {
            that.setData({
                    'getCodeParams.pn': inputValue,
       
                    'getCodeBtnProperty.titileColor': app.globalData.main_color,
                    'getCodeBtnProperty.disabled': false,
                    'commonLoginParams.pn': inputValue
                })

        } else {
            that.setData({
                'getCodeParams.pn': '',
                'getCodeBtnProperty.titileColor': '#B4B4B4',
                'getCodeBtnProperty.disabled': true,
                'commonLoginParams.pn': ''
            })
        }
    },

    //获取验证码
    getCodeAct: function() {
        var that = this
        //请求接口
        if (checkNetWork.checkNetWorkStatu() == false) {
            console.log('网络错误')
        } else {
            that.setData({
                'getCodeBtnProperty.loading': true,
                'getCodeBtnProperty.disabled': true
            })
            wx.request({
                url: that.data.CfBikeUrl.getcode,
                data: that.data.getCodeParams,
                method: 'POST', 
                header: {
                    'content-type': 'application/json'
                },
                success: function(res) {
                    var message = res.data.state_info
                    var statu = res.data.state
                    if (statu == '00') {
                        wx.showToast({
                                title: '发送成功！',
                                icon: 'success',
                                duration: 2000,
                            })
                            //启动定时器
                        var number = 60;
                        console.log("打开定时器")
                        var time = setInterval(function() {
                            number--;
                            that.setData({
                                'getCodeBtnProperty.title': number + '秒',
                                'getCodeBtnProperty.disabled': true
                            })
                            if (number == 0) {
                                that.setData({
                                    'getCodeBtnProperty.title': '重新获取',
                                    'getCodeBtnProperty.disabled': false
                                })
                                clearInterval(time);
                            }
                        }, 1000);
                    } else {
                        wx.showToast({
                            title: '获取失败！',
                            content: message,
                            image: '../images/faild@2x.png',
                            duration: 2000,
                        })
                        that.setData({
                            'getCodeBtnProperty.loading': false,
                            'getCodeBtnProperty.disabled': false
                        })
                    }
                    //光标下移
                    that.setData({
                        'codeTfFocus': true,
                    })
                },
                fail: function(res) {
                    that.failMessage('连接服务器失败')
                },
                complete: function() {
                    that.setData({
                        'getCodeBtnProperty.loading': false
                    })
                }
            })
        }
    },
    //输入验证码
    codeTfInput: function(e) {
        var that = this;
        var inputValue = e.detail.value
        var length = e.detail.value.length
        if (length == 6) {
            //给接口的mobile参数赋值,以及改变获取验证码的状态
            that.setData({
                'loginBtnProperty.disabled': false,
                'commonLoginParams.vc': inputValue,
                'loginBtnProperty.opacity': 1
            })
        } else {
            //给接口的mobile参数赋值,以及改变获取验证码的状态
            that.setData({
                'loginBtnProperty.disabled': true,
                'registerParams.vc': '',
                'loginBtnProperty.opacity': 0.4
            })
        }
    },

    //登录
    loginAct: function() {
        //光标取消
        var that = this
        if (that.data.loginBtnProperty.disabled) return;

        if (checkNetWork.checkNetWorkStatu() == false) {
            wx.showToast({
                title: '网络异常！',
                icon: 'warn',
                duration: 1500,
            })
        } else {
            that.loginServers(that.data.commonLoginParams);
        }
    },
    //获取用户信息
    agreeGetUserInfo: function(e) {
        var that = this;
        that.setData({
            autoFoucs: true,
            showModel: false
        });
    },
    //登录
    loginServers: function(loginParams) {
        //光标取消
        var that = this;
        wx.request({
            url: that.data.CfBikeUrl.loginUrl,
            method: 'post',
            data: loginParams,
            header: {
                'content-type': 'application/json'
            },
            success: function(res) {

                var state = res.data.state //成功返回状态码
                var message = res.data.state_info //返回说明 
                var result = res.data //返回用户信息结果集
                if (state == '00') {

                    wx.showToast({
                        title: '登录成功！',
                        icon: 'success',
                        duration: 2000,
                    })

                    //将token保存到本地小程序内
                    var token = res.data.token;

                    wx.removeStorageSync("token")
                    
                    wx.setStorageSync('token', token)
                    wx.setStorageSync('phone', that.data.commonLoginParams.pn)

                    setTimeout(function() {
                        wx.navigateBack()
                    }, 500)

                } else {
                    wx.showModal({
                        title: '登录失败',
                        content: message,
                        confirmText: "我知道了",
                        showCancel: false,
                        confirmColor: app.globalData.main_color
                    })
                }
            },

            fail: function() {
                that.failMessage('连接服务器失败')
            },

            complete: function() {}
        })


    },

    //用车服务条款
    serviceAct: function() {
        var webUrl = 'https://www.kyzlc.com/wc/UserAgree.html';
        wx.navigateTo({
            url: '../WebView/webView?webUrl=' + webUrl
        })
    },

    //跳转注册页面
    Register: function() {
        wx.navigateTo({
            url: '../Register/Register'
        })
    },
    failMessage: function() {
        wx.showToast({
            title: '连接服务器失败',
            icon: 'loading',
            duration: 2000,
        })
    },
    hideModal: function() {
        this.setData({
        });
    },

    onCancel: function() {
        this.setData({
            autoFoucs: true,
            showModel: false
        });
    },

    preventTouchMove: function() {

    }
})