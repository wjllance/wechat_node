var http = require('../service/http')
var config = require('../config/config.js').config
var api = require('../service/api.js')

//用户点击按钮进入商城
exports.shop = function(req, res) {
  //进入商城首先获取用户权限
  api.accessToken_openId(req, res).then(function(data) {
    // 获取权限之后获取用户信息然后将首页展示给用户
    res.render('shop', { name: data.info.nickname, img: data.info.headimgurl })
  })
}
