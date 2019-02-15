var app = getApp();
Page({
    data: {
        realData: {
            real_dis: true,//显示认证按钮状态
            vcode_error_dis: false,//显示错误信息
            error_detail: '请输入正确的身份证号!'//错误信息的文字
        },
        realUrl: getApp().globalData.request_url + "/auth/realname",//实名认证URL

    },
    //监控姓名框变化值，赋值姓名字段
    nameTfInput: function (e) {
        var that = this
        var name = e.detail.value
        that.setData({
            'realParams.real_name': name,
        })
    },
    //监控身份证框变化值，赋值身份证字段
    cardTfInput: function (e) {
        var that = this
        var idCard = e.detail.value
        that.setData({
            'realParams.id_card': idCard,
        })
        if (idCard && (idCard.length == 15 || idCard.length == 18)) {
            that.setData({
                'realData.real_dis': false,
            })
        }

    },
    //检验身份证合法性
    checkIdCard: function (id_card) {
        var that = this
        console.log("id_card:" + id_card)
        var re1 = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
        console.log('re1.test(id_card):' + re1.test(id_card))
        if (!re1.test(id_card)) { //由15位数字或18位数字（17位数字加“x”）组成
            console.log('身份证填写有误')
            that.setData({
                'realData.vcode_error_dis': true,
            })
            return true;
        } else {
            that.setData({
                'realData.vcode_error_dis': false,
            })
            return false;
        }

    },
    realname: function () {

        var that = this;
        var token = wx.getStorageSync('token') || '';//用户token
        that.setData({
            'realParams.token': token
        })
        var CardIf = that.checkIdCard(that.data.realParams.id_card);//检验身份证合法性
        if (CardIf) return;//身份证填写有误，下边的代码不执行

        if (that.data.realParams.real_name == '' || that.data.realParams.real_name.length < 2) {
            that.setData({
                'realData.error_detail': '请输入正确的姓名！',//显示错误信息
                'realData.vcode_error_dis': true//显示错误信息
            })
            return;
        }
        wx.request({
            url: that.data.realUrl,
            method: 'post',
            data: that.data.realParams,
            header: {
                'content-type': 'application/json'
            },
            success: function (res) {

                var state = res.data.state
                var message = res.data.state_info 
                var result = res.data.data 
                if (state == '00') {
            
                    wx.showToast({
                        title: '认证成功！',
                        icon: 'success',
                        duration: 2000,
                    })
                    //转回主界面
                    setTimeout(function () {
                        wx.navigateBack()
                    }, 1500)
                } else if (state == "09" || state == "10") {
                    //设置底部控件为扫码用车状态
                    that.setData({
                        'controls': that.data.notLoginMapControls,
                    })
                    wx.showModal({
                        title: '用户信息过期',
                        content: message,
                        showCancel: false,
                        confirmText: "好的",
                        confirmColor: app.globalData.main_color,
                        success: function (res) {
                            wx.navigateTo({
                                url: '../login/login'
                            })
                        }
                    })
                } else {
                    wx.showToast({
                        title: message,
                        image: '../images/faild@2x.png',
                        duration: 2000,
                    })
                }

            },
            fail: function () {
                that.failMessage('连接服务器失败')
            },
            complete: function () {

            }
        })
    },
    failMessage: function () {
        wx.showToast({
            title: '连接服务器失败',
            image: '../images/faild@2x.png',
            duration: 2000,
        })
    },
    del: function (e) {//删除处理程序
        console.log("进入删除处理程序")
        console.log(e)
        var that = this
        that.setData({
            'realData.realname': ''
        })
    },
    onLoad: function (options) {
        // 页面初始化 options为页面跳转所带来的参数
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