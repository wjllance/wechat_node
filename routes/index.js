var express = require("express");
var router = express.Router();
var axios = require("axios");
var api = require("../service/api");
var config = require("../config/config.js").config;
var responseShop = require("../controller/responseShop.js");
var sha1 = require("sha1");

var handleEvent = require("../controller/handleEvent.js");
// var handleEvent = import("../controller/handleEvent.mjs");

var data = {
  access_token_main: "", //通过网页授权access_token可以进行授权后接口调用
  jsapi_ticket: "", //jsapi_ticket是公众号用于调用微信JS接口的临时票据
  openId: "", //用户的唯一标识码
};

// 获取access_token和jsapi_ticket
api.getToken_JsApi().then((obj) => {
  data.access_token_main = obj.access_token;

  data.jsapi_ticket = obj.jsapi_ticket;
});

// 处理用户发送来的消息, 包括文字和点击事件
router.post("/", handleEvent.msg);

router.get("/", function (req, res, next) {
  var token = config.wechat.token;
  var signature = req.query.signature;
  var nonce = req.query.nonce;
  var timestamp = req.query.timestamp;
  var echostr = req.query.echostr;
  var str = [token, timestamp, nonce].sort().join("");
  var sha = sha1(str);

  if (sha === signature) {
    res.send(echostr + "");
  } else {
    res.send(wong);
  }
});

// 响应shop路由
router.get("/shop", (req, res) => {
  res.render("shop");
});

// 获取用户权限后跳转到response路由
router.get("/response", responseShop.shop);

// 生成签名用于wx.config
router.get("/getWxConfig", (req, res) => {
  var noncestr = req.query.nonceStr; //前端传过来的随机字符串

  var timestamp = parseInt(new Date().getTime() / 1000) + ""; //获取当前时间戳, 单位秒

  var url = req.query.url; //获取前端页面的url, 不包括#及之后的内容

  //按照微信的官方说法要将用于生成签名的noncestr timestamp url jsapi_ticket 按照ASCII码由小到大排序, 以键值对的形式
  //拼接成字符串, "jsapi_ticket".charCodeAt()可查询
  var str = `jsapi_ticket=${data.jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`;

  // 使用哈希加密成签名
  var signature = sha1(str);

  // 返回给前端
  res.json({
    appId: config.wechat.appID,
    signature: signature,
    timestamp: timestamp,
    jsapi_ticket22: data.jsapi_ticket,
    noncestr: noncestr,
    test: 123,
  });
});

module.exports = router;
