Page({

  data: {
    text: "骑行前请注意查看地图中的可骑行范围，超出范围将扣除搬运费，详情请见用车主页面《用车说明》！！！",
    marqueePace: 1,//滚动速度
    marqueeDistance: 0,//初始滚动距离
    marquee_margin: 30,
    size: 14,
    interval: 20 // 时间间隔
  },

  /**
   * 生命周期函数--监听页面加载
   */
  // onLoad: function (options) {
  // },
  onShow: function () {
    // 页面显示

    var that = this;

    var length = that.data.text.length * that.data.size;//文字长度

    var windowWidth = wx.getSystemInfoSync().windowWidth;// 屏幕宽度
    //console.log(length,windowWidth);
    that.setData({
      length: length,
      windowWidth: windowWidth
    });
    that.scrolltxt();// 第一个字消失后立即从右边出现
  },

  scrolltxt: function () {
    var that = this;
    var length = that.data.length;//滚动文字的宽度
    var windowWidth = that.data.windowWidth;//屏幕宽度
    if (length > windowWidth) {
      var interval = setInterval(function () {
        var maxscrollwidth = length + that.data.marquee_margin;//滚动的最大宽度，文字宽度+间距，如果需要一行文字滚完后再显示第二行可以修改marquee_margin值等于windowWidth即可
        var crentleft = that.data.marqueeDistance;
        if (crentleft < maxscrollwidth) {//判断是否滚动到最大宽度
          that.setData({
            marqueeDistance: crentleft + that.data.marqueePace
          })
        }
        else {
          //console.log("替换");
          that.setData({
            marqueeDistance: 0 // 直接重新滚动
          });
          clearInterval(interval);
          that.scrolltxt();
        }
      }, that.data.interval);
    }
    else {
      that.setData({ marquee_margin: "1000" });//只显示一条不滚动右边间距加大，防止重复显示
    }
  }

})

// 组件数据
let _comData = {
  "text": "骑行前请注意查看地图中的可骑行范围，超出范围将扣除搬运费，详情请见用车主页面《用车说明》！！！",
  "marqueePace": 1,//滚动速度
  "marqueeDistance": 0,//初始滚动距离
  "marquee_margin": 30,
  "size": 14,
  "interval": 20 // 时间间隔
}
//组件事件
let _comEvent = {
  __lgpanel_ok: function () {
    console.log('OK')
    this.__lgpanel_hide()
  },
  __lgpanel_cancel: function () {
    console.log('Cancel')
    this.__lgpanel_hide()
  }
}
//方法
let _comMethod = {
  _onShow: function () {
    // 页面显示
    var that = this;
    var length = that.data.text.length * that.data.size;//文字长度
    var windowWidth = wx.getSystemInfoSync().windowWidth;// 屏幕宽度
    //console.log(length,windowWidth);
    that.setData({
      length: length,
      windowWidth: windowWidth
    });
    that._scrolltxt();// 第一个字消失后立即从右边出现
  },
  _scrolltxt: function () {
    var that = this;
    var length = that.data.length;//滚动文字的宽度
    var windowWidth = that.data.windowWidth;//屏幕宽度
    if (length > windowWidth) {
      var interval = setInterval(function () {
        var maxscrollwidth = length + that.data.marquee_margin;//滚动的最大宽度，文字宽度+间距，如果需要一行文字滚完后再显示第二行可以修改marquee_margin值等于windowWidth即可
        var crentleft = that.data.marqueeDistance;
        if (crentleft < maxscrollwidth) {//判断是否滚动到最大宽度
          that.setData({
            marqueeDistance: crentleft + that.data.marqueePace
          })
        }
        else {
          //console.log("替换");
          that.setData({
            marqueeDistance: 0 // 直接重新滚动
          });
          clearInterval(interval);
          that.scrolltxt();
        }
      }, that.data.interval);
    }
    else {
      that.setData({ marquee_margin: "1000" });//只显示一条不滚动右边间距加大，防止重复显示
    }
  }
}
//组件类
function LoginPanel() {
  let pages = getCurrentPages()
  let curPage = pages[pages.length - 1]
  //组件中调用页面
  this._page = curPage
  Object.assign(curPage, _comEvent, _comMethod)
  curPage.setData(_comData)

  curPage.loginPanel = this
  return this
}

export { LoginPanel }