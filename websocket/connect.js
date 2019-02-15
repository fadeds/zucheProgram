module.exports = (function() {

    var webSocketUrl = getApp().globalData.websocket_url,
    socketOpened = false, // 标记websocket是否已经打开
    socketMsgQueue = [],
    connCallback = null,
    msgReceived = {};

    function connect(callback) { // 发起链接
            if (socketOpened) return;
            
            //没连接上会一直重连，设置延迟避免请求过多
            setTimeout(function () {
                wx.connectSocket({
                        url: webSocketUrl + '?token=' + wx.getStorageSync('token'),
                        success: function (res) {
                            socketOpened = true;
                        }, 
                        fail: function () {
                            socketOpened = false;
                            connect();//连接失败继续连接
                        },
                        complete:function(){
                        }
                });

                connCallback = callback;
                socketOpened = false;
            }, 2000);        
    }

    function initEvent() { // 初始化一些webSocket事件
        wx.onSocketOpen(function(res){         
            socketOpened = true;
            while(socketMsgQueue.length > 0) {
                var msg = socketMsgQueue.pop();
                sendSocketMessage(msg);
            }
            connCallback && connCallback.call(null);
        });

        wx.onSocketMessage(function(res) {
            msgReceived.callback && msgReceived.callback.call(null, res.data, ...msgReceived.params);
        });

        wx.onSocketError(function(res){ // 链接出错时的处理
            socketOpened = false;
            connect();
        });

        wx.onSocketClose(function (res) { // 链接关闭时的处理
          socketOpened = false;
          connect();
        });
    }

    function sendSocketMessage(msg) {
      if (typeof (msg.data) === 'object') {
        msg = JSON.stringify(msg.data);
        }

        if (socketOpened) {
            wx.sendSocketMessage({
                data:msg
            });
        } else { // 发送的时候，链接还没建立 
            socketMsgQueue.push(msg);
        }
    }

    function setReceiveCallback(callback, ...params) {
        if (callback) {
            msgReceived.callback = callback;
            msgReceived.params = params;
        }
    }

    function init() {
        initEvent();
    }

    init();
    return {
        connect: connect,
        send: sendSocketMessage,
        setReceiveCallback: setReceiveCallback,
        socketOpened: socketOpened
    };
})();
