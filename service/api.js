var http = require("./http");
var config = require("../config/config.js").config;

//获取accexx_token和jsapi_ticket
exports.getToken_JsApi = async function () {
  var token = await http.get("https://api.weixin.qq.com/cgi-bin/token", {
    grant_type: "client_credential",
    appid: config.wechat.appID,
    secret: config.wechat.appsecret,
  });

  var jsapi_ticket = await http.get(
    "https://api.weixin.qq.com/cgi-bin/ticket/getticket",
    {
      access_token: token.access_token,
      type: "jsapi",
    }
  );

  console.log("getToken_JsApi", token, jsapi_ticket);

  return {
    access_token: token.access_token,
    jsapi_ticket: jsapi_ticket.ticket,
  };
};

// 获取普通access_token和code , 并据此获得用户信息
exports.accessToken_openId = async function (req, res) {
  // access_token和code
  var token = await http.get(
    "https://api.weixin.qq.com/sns/oauth2/access_token",
    {
      appid: config.wechat.appID,
      secret: config.wechat.appsecret,
      code: req.query.code,
      grant_type: "authorization_code",
    }
  );

  //用户信息
  var info = await http.get("https://api.weixin.qq.com/sns/userinfo", {
    access_token: token.access_token,
    openid: token.openid,
    lang: "zh_CN",
  });

  return {
    access_token: token.access_token,
    openId: token.openid,
    info: info,
  };
};
