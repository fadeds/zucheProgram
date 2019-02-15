// pages/trip/trip.js

var app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
      pages: 1,                        //请求页面
      dataSources: [],               //数据源
      container: 0,                   //容器高度
      isShowFooter: false,         //是否显示已到底了
      isRequsetMoreData: true  //是否请求更多数据
  },


  /**          -----生命周期函数--------         ***/
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
      var that = this;
      //初始化一个组件实例
      new app.ToastPannel();

      let containerHeight = wx.getSystemInfoSync().windowHeight;
      that.setData({
          container: containerHeight + 'px'
      })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
      var that = this
      that.requsetMyTripData(that.data.pages);
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },
  /**          -----上拉加载 下拉刷新--------         ***/

  /**
  * --刷新数据
  */
  refreshMyTripData: function () {
      var that = this;
      that.setData({
          pages: 1,
          dataSources: [],
          isShowFooter: false,
          isRequsetMoreData: true
      })
      that.requsetMyTripData(that.data.pages);
  },

  /**
   * --加载更多数据
   */
  loadMoreMyTripData: function () {
      var that = this;
      that.data.pages++;
      if (that.data.isRequsetMoreData) {
          that.requsetMyTripData(that.data.pages);
      } else {
          that.show('已经到底了...');
      }
  },


  /**          -----https request --------         ***/
  //请求我的行程数据
  requsetMyTripData: function (pages) {
      var that = this;
      var url = app.globalData.request_url + "/user/trip";
      var token = wx.getStorageSync("token") || "";
      var params = { token: token, page: pages,size: 15};

      wx.showLoading({
          title: '加载中',
      })

      app.httpsRequest.requestPostApi(url, params, this,
          function (success_res, selfObj) {//成功
              console.log('success_res0000000000', success_res)
              wx.hideLoading(); 
              var state = success_res.state;
              var message = success_res.state_info;
      
              if (state == '00') {

                  if (success_res.data == null){
                      selfObj.show("没有更多的骑行数据");
                      return;
                  }
                  for (var i = 0; i < success_res.data.length; i++) {
                      selfObj.data.dataSources.push(success_res.data[i])
                  }
                  selfObj.setData({
                      dataSources: selfObj.data.dataSources
                  })

                  //已经到底了
                  if (success_res.data.length < 15) {
                      selfObj.setData({
                          isShowFooter: true,
                          isRequsetMoreData: false
                      })
                  }
              }else{
                  selfObj.show(message ? message : "网络异常稍后重试");
              }
          },

          function (faild_res, selfObj) {//失败
              wx.hideLoading();
              console.log('failFun', faild_res)
          },

          function (complete_res, selfObj) {//完成
              wx.hideLoading();
              console.log('complete_res', complete_res)
          })
  }
})