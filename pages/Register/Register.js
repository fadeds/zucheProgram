var md5 = require("../MD5.js")
var checkNetWork = require("../CheckNetWork.js")
var app = getApp();
Page({
  data:{
    getCodeBtnProperty: {
      titileColor: '#B4B4B4',
      disabled: true,
      loading: false,
      title: '获取验证码'
    },
    loginBtnProperty: {
      disabled: true,
      loading: false,
      opacity: 0.4    //设置透明度
    },
    getCodeParams: {
      pn:'', //string|手机号
      type: 1 //int|类型|1-注册验证码 2-手机号码更换验证码 3-忘记密码
    },
    registerParams: {
      //mobile: '',
      //code: '', 
      //checksum: '',
      pn:'', //string|手机号码
      pw:'', //string|密码
      real_name : '',//姓名
      id_card: '',//身份证号
      vc: '',//短信验证码
      type: 2,  //int|注册类型|1-app 2-微信小程序
      app_id: getApp().globalData.app_id,
      code: '',
      iv: '',
      encrypted_data: ''
    },
    password: '',//原始密码
    //校验码
    SALT: "KUAYUEBIKE",
    codeTfFocus: false,
    CfBikeUrl: {
      getcode: getApp().globalData.request_url+"/auth/requestsmsvc",//短信验证码
      //register: "http://www.kycfdc.com:1010/api/accounts/CheckVerifyCode"
      register: getApp().globalData.request_url+"/auth/register"//注册
    },
    //微信用户信息
    wx_userinfo: {
      code: '',
      iv: '',
      encrypted_data: ''
    } 
  },
  onLoad:function(options){
    // 生命周期函数--监听页面加载
    var that = this;
    //-----1.获取当前登录微信用户的登录凭证(code)---
    wx.login({
      success: function (res) {
        console.log('获取用户登录凭证：');
        console.log(res)
        var code = res.code;//微信用户code
        if (code) {
          //console.log('获取用户登录凭证：' + code);
          that.data.registerParams.code = code;
          //app.getOpenId(code);//获取用户的openid
          // 2.发送凭证到服务器端并在服务端使用该凭证向微信服务器换取该微信用户的唯一标识(openid)和会话密钥(session_key)
          wx.getUserInfo({
            withCredentials: true,
            success: function (res_user) {
              console.log('获取用户信息数据res_user:')
              console.log(res_user)
              var encrypted_data = res_user.encryptedData;//微信用户encryptedData
              var iv = res_user.iv;//微信用户iv
              that.data.registerParams.iv = iv;
              that.data.registerParams.encrypted_data = encrypted_data;
              //that.login();//执行login
              console.log("用户微信信息为(注册页面):2.code:" + code + ";2.iv:" + iv + ";3.encrypted_data：" + encrypted_data)
              //console.log(that.data.registerParams)
            }
          })
          // 2.end------------------------------------
        } else {
          console.log('获取用户登录态失败：' + res.errMsg);
        }
      }
    });
  //-----end获取当前登录微信用户的登录凭证(code)---
  },

  //输入手机号
  phoneTfInput: function(e) {
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    if (length == 11) {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'getCodeParams.pn': inputValue,
        'registerParams.pn': inputValue,
        'getCodeBtnProperty.titileColor':'#34B5E3',
        'getCodeBtnProperty.disabled': false
      })
    }else {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'getCodeParams.pn': '',
        'registerParams.pn': '',
        'getCodeBtnProperty.titileColor':'#B4B4B4',
        'getCodeBtnProperty.disabled': true
      })
    }
  },
  //监控姓名框变化值，赋值姓名字段
  nameTfInput:function(e){
    var that = this
    var name = e.detail.value
    that.setData({
       'registerParams.real_name': name,
    })
      //console.log('11姓名为:' + that.data.registerParams.real_name)
  },
  //监控身份证框变化值，赋值身份证字段
  cardTfInput: function (e) {
    var that = this
    var idCard = e.detail.value
    that.setData({
      'registerParams.id_card': idCard,
    })
    //console.log('idCard为:' + that.data.registerParams.idCard)
  },
  //监控密码框变化值，赋值密码字段
  pwdTfInput: function (e) {
    var that = this
    var pw = e.detail.value
    that.setData({
      'password': pw,
    })
    //console.log('pw为:' + that.data.registerParams.pw)
  },
  //检验姓名合法性
  checkName:function(name){
    var that = this
    //var length = name.length
    console.log("name:" + name)
    var re1 = /^[\u4e00-\u9fa5]{2,4}$/i; 
    console.log('re1.test(name):' + re1.test(name))
    if (!re1.test(name)) { //姓名长度小于2(文本框已限制最多只能输入4个)
      console.log('真实姓名填写有误')
      that.failMessage('姓名填写有误')
      return true;
    } else return false;

  },
  //检验身份证合法性
  checkIdCard: function (id_card) {
    var that = this
    console.log("id_card:" + id_card)
    var re1 = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;  
    console.log('re1.test(id_card):' + re1.test(id_card))
    if (!re1.test(id_card)) { //由15位数字或18位数字（17位数字加“x”）组成
      console.log('身份证填写有误')
      that.failMessage('身份证填写有误')
      return true;
    } else return false;

  },
  //检验密码合法性
  checkPwd: function (pwd) {
    var that = this
    //var length = pwd.length
    console.log("pwd:" + pwd)
    var re1 = /^[A-Za-z0-9]{6,20}$/;  //密码6-12位，只能是字母、数字和下划线
    console.log('re1.test(pwd):' + re1.test(pwd))
    if (!re1.test(pwd)) { 
      console.log('密码填写有误')
      that.failMessage('密码填写有误')
      return true;
    } else return false;

  },


  //获取验证码
  getCodeAct: function() {
    var that = this
    //请求接口
    if (checkNetWork.checkNetWorkStatu() == false) {
      console.log('网络错误')
    }else {
     
     // var checksum = that.data.getCodeParams.token + that.data.getCodeParams.pn + that.data.SALT
      //var checksumMd5 = md5.hexMD5(checksum)
      that.setData({
        //'getCodeParams.checksum': checksumMd5,
        //显示loading
        'getCodeBtnProperty.loading': true
      })
      wx.request({
        url: that.data.CfBikeUrl.getcode,
        data: that.data.getCodeParams,
        method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
        // header: {}, // 设置请求的 header
        header: {
        //'content-type': 'application/x-www-form-urlencoded'
          'content-type': 'application/json'
        },
        success: function(res){
          console.log('请求获取验证码返回结果：'),
          console.log(res)
          // success
          console.log(that.data.getCodeParams),
          console.log(res.data)
          var message = res.data.state_info
          var statu = res.data.state
          if (statu == '00') {
            wx.showToast({
              title: '成功！',
              icon: 'success',
              duration: 2000,
            })
            //启动定时器
            var number=60;
            console.log("打开定时器")
            var time = setInterval(function(){
              number--;
             that.setData({
                'getCodeBtnProperty.title':number + '秒',
                'getCodeBtnProperty.disabled': true
              })
             if(number==0){
                that.setData({
                  'getCodeBtnProperty.title':'重新获取',
                  'getCodeBtnProperty.disabled': false
                })
                clearInterval(time);
              }
            },1000);
          }else {
            wx.showToast({
              title: '失败！' + message,
              icon: 'loading',
              duration: 2000,
            })
          }
          //光标下移
          that.setData({
            'codeTfFocus': true
          })
        },
        fail: function(res) {
          // fail
          console.log(res)
          that.failMessage('连接服务器失败')
        },
        complete: function() {
          // complete
          //隐藏loading
          that.setData({
            'getCodeBtnProperty.loading': false
          })
        }
      })
    }
  },

  //输入验证码
  codeTfInput: function(e) {
    var that = this
    var inputValue = e.detail.value
    var length = e.detail.value.length
    if (length == 6) {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'loginBtnProperty.disabled': false,
        'registerParams.vc': inputValue,
        'loginBtnProperty.opacity': 1
      })
    }else {
      //给接口的mobile参数赋值,以及改变获取验证码的状态
      that.setData({
        'loginBtnProperty.disabled': true,
        'registerParams.vc': '',
        'loginBtnProperty.opacity': 0.4
      })
    }
  },

  //注册
  loginAct: function() {
    var that = this
    //console.log('姓名为:' + that.data.registerParams.real_name)
    //1.先检查数据合法性
    var flag_name = that.checkName(that.data.registerParams.real_name);//检查姓名是否合法
    var flag_card = that.checkIdCard(that.data.registerParams.id_card);//检查身份证号是否合法
    var flag_pwd = that.checkPwd(that.data.password);//检查密码是否合法
    console.log('flag_name:' + flag_name + 'flag_card:' + flag_card + 'flag_pwd:' + flag_pwd);
    if (flag_name || flag_card || flag_pwd) return; //任何一项不合法则不继续执行注册

    //光标取消
    that.setData({
      'codeTfFocus': true
    })
    //请求接口
    if (checkNetWork.checkNetWorkStatu() == false) {
      console.log('网络错误')
    }else {
      //var checksum = that.data.registerParams.mobile + that.data.registerParams.code + that.data.SALT
     // var checksumMd5 = md5.hexMD5(checksum)
      var checksum = that.data.password+ that.data.SALT
      console.log("checksum:" + checksum)
      var checksumMd5 = md5.hexMD5(checksum)
      that.setData({
        'registerParams.pw': checksumMd5,
        //显示loading
        'loginBtnProperty.loading': true
      })
      console.log('注册参数为：')
      console.log(that.data.registerParams)
      //发送注册请求
          wx.request({
            url: that.data.CfBikeUrl.register,
            //method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
            method: 'post',
            data: that.data.registerParams,
            header: {
              'content-type': 'application/json'
            },
            success: function (res) {
              console.log("成功！res:")
              console.log(res)
              // success
              var state = res.data.state//成功返回状态码
              var message = res.data.state_info //返回说明 
              var result = res.data.data //返回用户信息结果集
              if (state == '00') {//状态码为'00'表示注册成功，返回用户信息
                //1表示注册
                wx.showToast({
                  title: '注册成功！',
                  icon: 'success',
                  duration: 2000,
                })
                //注册成功再调用一次登陆获取token
                var that = this;
                getApp().getWx_info();//再做一次登陆
                //转回主界面
                setTimeout(function () {
                  wx.navigateBack()
                }, 1500)
              } else if (state == '12'){
                wx.showModal({
                  title: '注册失败',
                  content: '手机号已注册',
                  confirmText: "立即登陆",
                  showCancel: true,
                  success: function (res) {
                    if (res.confirm) {
                      //返回res.confirm为true时，表示用户点击确定按钮
                      //发送强制还车请求
                      that.login();
                    }
                  }
                })
              } else {
                wx.showModal({
                  title: '注册失败',
                  content: message,
                  confirmText: "我知道了",
                  showCancel: false,
                  confirmColor: app.globalData.main_color
                })
               
              }
          
        },
        fail: function() {
          // fail
          that.failMessage('连接服务器失败')
        },
        complete: function() {
          // complete
          //隐藏loading
          that.setData({
            'loginBtnProperty.loading': false
          })
        }
      })
    }
  },

  //用车服务条款
  serviceAct: function() {
    wx.navigateTo({
        url: '../service/service'
      })
  },
  //跳转登陆页面
  login: function () {
    wx.navigateTo({
      url: '../login/login'
    })
  },
  failMessage: function(text) {
    wx.showToast({
        title: text,
        icon: 'loading',
        duration: 1500,
     })
  }
})