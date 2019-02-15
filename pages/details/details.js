// pages/details/details.js
var app = getApp();
Page({

  data: { 
          pages: 1,                        //请求页面
          dataSources:[],               //数据源
          container: 0,                   //容器高度
          scrollTop:0,                    //滚动到顶部
          isShowFooter:false,         //是否显示已到底了
          isRequsetMoreData:true  //是否请求更多数据
  },


  /**          -----生命周期函数--------         ***/

  /**
   * --监听页面加载
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
   * --监听页面初次渲染完成
   */
  onReady: function () {
  
  },

  /**
   * --监听页面显示
   */
  onShow: function () {
      var that = this;
      that.requestBillListData(that.data.pages);
      
  },

  /**
   * --监听页面隐藏
   */
  onHide: function () {
  
  },

  /**
   * --监听页面卸载
   */
  onUnload: function () {
  
  },

  /**
   * --监听用户下拉动作
   */
  onPullDownRefresh: function () {
  
  },

  /**
   * --页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
  
  },

  /**
   * --用户点击右上角分享
   */
  onShareAppMessage: function () {
  
  },

  /**          -----上拉加载 下拉刷新--------         ***/

   /**
   * --刷新数据
   */
  refreshBillsData: function () {
      var that = this;
      that.data.pages = 1;
      that.setData({
          pages:1,
          dataSources: [],
          isShowFooter: false,
          isRequsetMoreData:true
      })
      that.requestBillListData(1);
  },

  /**
   * --加载更多数据
   */
  loadMoreBillsData: function () {
      var that = this;
      that.data.pages ++;
      if (that.data.isRequsetMoreData){
          that.requestBillListData(that.data.pages);
      }else{
          that.show('已经到底了...');
      }
  },

    /**
   * --滚动视图触发函数
   */
  scrolling: function (event){
      console.log('bindscroll',event.detail)
  },

  /**          -----https request --------         ***/

    /**
   * --请求账单列表数据
   */
  requestBillListData: function (pages) {
      var that = this;
      var url = app.globalData.request_url + "/account/billlist";
      var token = wx.getStorageSync("token") || "";
      var params = {
          order_type: 'd',
          token: token,
          page: pages,
          page_size: 15
      };
      
      wx.showLoading({
          title: '加载中',
      })

      //发送请求
      app.httpsRequest.requestPostApi(url, params, this,
          function (success_res, selfObj) {//成功
              wx.hideLoading();
              var state = success_res.state;
              var message = success_res.state_info;
              if (state == '00') {

                  if (success_res.data == null) {
                      selfObj.show("没有更多的账单数据");
                      return;
                  }

                  for (var i = 0; i < success_res.data.list.length; i++) {
                      var tmp = success_res.data.list[i];
                      if (tmp.pay_type == '0'){
                          tmp.pay_type = '系统代扣' 
                      } else if (tmp.pay_type == '1'){
                          tmp.pay_type = '支付宝'
                      }else{
                          tmp.pay_type = '微信支付'
                      }
                      selfObj.data.dataSources.push(tmp)
                  }
                  selfObj.setData({
                      dataSources: selfObj.data.dataSources
                  })

                  //已经到底了
                  if (success_res.data.list.length < 15){
                      selfObj.setData({
                          isShowFooter: true,
                          isRequsetMoreData: false
                      })
                  }
              }else{
                  selfObj.show(message ? message:"网络异常稍后重试");
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