var xml2js = require('xml2js')
var tools = require('../config/tools.js')

// 处理用户发送过来的文字消息和点击事件
exports.msg = (req, res) => {
  var xml = '' //存储将要回复给公众号的文字
  var json = null //用于存储xml转换为json

  //接收post内容
  req.on('data', chunk => { 
    xml += chunk
  })

  //接收结束
  req.on('end', () => {
    //将接受到的xml数据转化为json
    xml2js.parseString(xml, { explicitArray: false }, function(err, json) {
      var backTime = new Date().getTime() //创建发送时间，整数

      //event表示事件,
      if (json.xml.MsgType == 'event') {
        // EventKey是在自定义菜单的时候定义的事件名称
        if (json.xml.EventKey == 'clickEvent') {
          res.send(tools.getXml(json, backTime, '你戳我干啥...'))
        }
        //text表示文字信息
      } else if (json.xml.MsgType == 'text') {
        //回复公众号的文字信息
        res.send(tools.getXml(json, backTime, `你发"${json.xml.Content}"过来干啥？`))
      }
    })
  })
}
