//var md5 = require("../MD5.js")queryWalletUrl: getApp().globalData.request_url + "/account/amount"

// pages/loading/loading.js  
var app = getApp();
var p = 1
var url = app.globalData.request_url + "/raffle/queryuserrafflelist";
var GetList = function (that) {
  that.setData({
    hidden: false
  });
  var token = wx.getStorageSync('token') || '';//用户token
  if (token != ''){
    wx.request({
      url: url,
      //method: 'POST', // OPTIONS, GET, HEAD, POST, PUT, DELETE, TRACE, CONNECT
      method: 'post',
      data: {
        page_size: 10, //每页数量，默认20条
        page: p, //第几页默认第一页(请求的次数序号)
        order_type:'d',	//false	string	排序方式 a正序 d倒序
        token: wx.getStorageSync('token')
      },
      header: {
        'content-type': 'application/json'
      },
      success: function (res) {
        console.log("coupon.js>>请求优惠券返回:")
        console.log(res)
        var l = that.data.list
        var list = res.data.data.list
        // list = [
        //   {
        //     "id": 2,
        //     "user_id": 2,
        //     "raffle_id": "2",
        //     "state": 2,
        //     "raffle_name": "",
        //     "raffle_url": "image/coupon.png",
        //     "gt_amount": 2,
        //     "lt_amount": 2,
        //     "create_time": "2017-11-21 17:55:31",
        //     "expire_time": "2017-11-21 17:55:31",
        //     "raffle_type": 0,
        //     "raffle_amount": 0
        //   },
        //   {
        //     "id": 3,
        //     "user_id": 3,
        //     "raffle_id": "2",
        //     "state": 3,
        //     "raffle_name": "",
        //     "raffle_url": "image/coupon.png",
        //     "gt_amount": 3,
        //     "lt_amount": 3,
        //     "create_time": "2017-11-21 17:55:31",
        //     "expire_time": "2017-11-21 17:55:31",
        //     "raffle_type": 0,
        //     "raffle_amount": 0
        //   },
        //   {
        //     "id": 1,
        //     "user_id": 1,
        //     "raffle_id": "1",
        //     "state": 1,
        //     "raffle_name": "",
        //     "raffle_url": "image/coupon.png",
        //     "gt_amount": 1,
        //     "lt_amount": 1,
        //     "create_time": "2017-11-21 14:37:39",
        //     "expire_time": "2017-11-21 14:37:39",
        //     "raffle_type": 0,
        //     "raffle_amount": 0
        //   }
        // ]
        if(list && list != null && list.length>0){
          for (var i = 0; i < list.length; i++) {
            console.log("格式化时间:" + transDate(list[i].create_time))
            list[i].create_time = transDate(list[i].create_time)
            list[i].expire_time = transDate(list[i].expire_time)
            // console.log("list:")
            // console.log(list[i])
            l.push(list[i])
          }
          that.setData({
            list: l
          });
        }
        console.log("最终集体list:")
        console.log(l);
        p++;
        that.setData({
          hidden: true
        });
      }
    });
  }else{//本地token为空,提示登陆
      console.log("coupon.js>>获取token失败!")
  }
};
//时间格式化 只显示年月日
function transDate(mescStr) {
  console.log("接收到的日期mescStr是:" + mescStr)
  
  var time = mescStr;
  time = time.replace(/-/g, ':').replace(' ', ':');
  time = time.split(':');
  var n = new Date(time[0], (time[1] - 1), time[2], time[3], time[4], time[5]);
  
  // var n = mescStr;
  var date = new Date(n);
  var Y = date.getFullYear() + '-';
  var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';
  var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
  console.log("date:" + date)
  console.log("date.getFullYear():" + date.getFullYear())
  console.log("date.getMonth():" + date.getMonth())
  console.log("date.getDate():" + date.getDate())
  return (Y + M + D)
}
Page({
  data: {
    list: []
  },
  // transDate:function (mescStr){
  //   var n= mescStr;  
  //   var date = new Date(n);  
  //   var Y = date.getFullYear() + '-';  
  //   var M = (date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1) + '-';  
  //   var D = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();  
  //   return(Y+M + D)
  // },
  onLoad: function (options) {
    // 页面初始化 options为页面跳转所带来的参数  
    var that = this
    GetList(that)
  },
  onPullDownRefresh: function () {
    //下拉  
    console.log("下拉");
    p = 1;
    this.setData({
      list: [],
    });
    var that = this
    GetList(that)
  },
  onReachBottom: function () {
    //上拉  
    console.log("上拉")
    var that = this
    GetList(that)
  }
})