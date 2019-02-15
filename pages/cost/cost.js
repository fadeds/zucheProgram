//var md5 = require("../MD5.js")
Page({
  data:{
    truckage:false,
    pay: 1.0,//骑行金额
    time: 0,//骑行时间
    amount:0,//账户余额
    distance: 0,//骑行距离
    give_amount: 0,//赠送红包
    sub_amount:0,//搬运费
    pays:0,//总支付费用(骑行费用+搬运费)
    //查询余额接口
    queryWalletUrl: getApp().globalData.request_url + "/account/amount",
  },
  onLoad:function(options){
    console.log("进入cost页面onload方法,options为：")
    console.log(options)
    // 生命周期函数--监听页面加载
    var that = this 
    that.setData({
      "time": options.time,
      "distance": options.distance,
      "amount": options.amount,
      "pay": options.pay,
      "give_amount": options.give_amount,
      "sub_amount": options.sub_amount,
      "pays": parseInt(options.pay) + parseInt(options.sub_amount),      
    })
    if (options.sub_amount > 0) {
      that.setData({
         truckage:true
       })
    }
    // if (options.sub_amount > 0) {
    //   truckage:true;
    // }
  },
  onReady:function(){
    // 生命周期函数--监听页面初次渲染完成
    
  },
  onShow:function(){
    // 生命周期函数--监听页面显示
    
  },
  onHide:function(){
    // 生命周期函数--监听页面隐藏
    
  },
  onUnload:function(){
    // 生命周期函数--监听页面卸载
    
  },
  onPullDownRefresh: function() {
    // 页面相关事件处理函数--监听用户下拉动作
    
  },
  onReachBottom: function() {
    // 页面上拉触底事件的处理函数
    
  },
  onShareAppMessage: function() {
    // 用户点击右上角分享
    return {
      desc: '我刚刚使用挽乘智能车完成了一场愉快的骑行,朋友们一起来体验一下吧', // 分享描述
      path: '/cost/cost' // 分享路径
    }
  },
  //完成
  finishAct: function() {
    getApp().globalData.isRidingBike = 0;//骑行状态为0
    console.log("点击完成设置骑行状态为0")
    wx.navigateBack();
    // wx.navigateTo({
    //   url: '../index/index'
    // })
  }
})