# wechat_node
微信公众号开发 , 后台基本搭建(基于node的express框架)

查看源码 
## 1 申请公众号测试账号
https://mp.weixin.qq.com/debug/cgi-bin/sandboxinfo?action=showinfo&t=sandbox/index
- 申请成功之后页面会给出appID和appsecret(用于获取access_token)
![申请测试账号](http://img.blog.csdn.net/20171027101958412)
- 在填写接口配置信息的时候需要后台配合验证才能配置成功

### 1.1 验证服务器
- 输入服务器ip地址和端口号(只支持80端口)
	- 在公众号上的操作微信服务器都会转发到此服务器
	- Token 可以随意命名, 微信服务器会用此token验证你的服务器, 验证的时候需要根据哈希算法进行加密, 成功之后才能绑定, 不然会一直提示绑定失败
```javascript
router.get('/', function(req, res, next) {

    var token = config.wechat.token
    var signature = req.query.signature
    var nonce = req.query.nonce
    var timestamp = req.query.timestamp
    var echostr = req.query.echostr
    var str = [token, timestamp, nonce].sort().join('')
    var sha = sha1(str)

    if (sha === signature) {
        res.send(echostr + '');
    } else {
        res.send(wong);
    }
});
```
- 授权列表中的网页授权获取用户基本信息一栏需要填写服务器的域名

## 2 设置公众号菜单
### 2.1 用测试账号的appid和appsecret获取access_token
```javascript
// 获取access_token
var url = 'https://api.weixin.qq.com/cgi-bin/token';
axios.get( url , {
    params:{
        grant_type:'client_credential',
        appid:config.wechat.appID,
        secret:config.wechat.appsecret
    }
}).then((userinfo)=>{
    
    var access_token = userinfo.data.access_token ;

     
 });

```

### 2.2 根据access_token设置公众号测试号的自定义菜单
```javascript
    var url = `https://api.weixin.qq.com/cgi-bin/menu/create?access_token=${access_token}`

var menu =  {
	"button":[
	{	
	 "type":"view",  //view表示跳转
	 "name":"**商城",
	 "url":"http://***.cn/shop"
	},
	{
	     "type":"click",   //表示事件
	     "name":"戳一下",
	     "key":"clickEvent"   //事件的key可自定义,微信服务器会发送到指定的服务器用于识别事件做出相应回应
	},
	{
	  "name":"菜单",
	  "sub_button":[  //二级菜单
	  {	
	      "type":"view",
	      "name":"搜索",
	      "url":"http://***.cn/shop"
	   },
	   {
	      "type":"click",
	      "name":"赞一下我们",
	      "key":"V1001_GOOD"
	   }]
	}]
}

//创建菜单,发送http请求
axios.post( url ,menu,{
	headers:{
	'content-type':'application/x-www-form-urlencoded'
	}
}).then(function(dt){
	console.log( '创建菜单请求已发出' , dt.data )

})
```


## 3 回复用户消息
- 用户点击菜单或者发送文字, 微信服务器都会将操作转发至服务器, 消息是xml格式
- 可下载xml2js包来将xml转换为json格式
```html
<xml>
	<ToUserName><![CDATA[toUser]]></ToUserName>
	<FromUserName><![CDATA[fromUser]]></FromUserName>
	<CreateTime>1348831860</CreateTime>
	<MsgType><![CDATA[text]]></MsgType>
	<Content><![CDATA[用户发送的文字内容]]></Content>
</xml>
```
### 3.1 用户发送文字
- 用户发送的文字消息, 微信服务器会以xml格式发送到服务器 , xml里包含了消息类型MsgType如果为event则此消息是一个事件如点击事件, 如果是text则此消息是一个文字消息
- node解析xml格式
```javascript
// 响应用户发送来的消息
var xml2js=require('xml2js');

router.post('/',(req, res)=>{
	var xml = ''
	var json = null
	req.on('data',(chunk)=>{
		xml += chunk
	})
	req.on('end',()=>{
		//将接受到的xml数据转化为json
		xml2js.parseString(xml,  {explicitArray : false}, function(err, json) {  

			var backTime = new Date().getTime();  //创建发送时间，整数
  			
			if( json.xml.MsgType == 'event' ){  //消息为事件类型

				if( json.xml.EventKey == 'clickEvent' ){
					res.send( getXml( json , backTime , '你戳我干啥...' ) )  //回复用户的消息
				}
			}else if( json.xml.MsgType == 'text' ){  //消息为文字类型

				res.send( getXml( json , backTime , `你发"${json.xml.Content}"过来干啥？` ) )  //回复用户的消息
			}


		}); 
	})

	function getXml( json , backTime , word ){
		var backXML = `
				<xml>
					<ToUserName><![CDATA[${json.xml.FromUserName}]]></ToUserName>
					<FromUserName><![CDATA[${json.xml.ToUserName}]]></FromUserName>
					<CreateTime>${backTime}</CreateTime>
					<MsgType><![CDATA[text]]></MsgType>
					<Content><![CDATA[${word}]]></Content>
				</xml>
			`
		return backXML;
	};

})
```

## 4 授权
- 让用户跳转到授权页
- 授权完成之后会自动跳转到redirect_uri并且会把code作为参数带去
```javascript
 var APPID = '************'
 var rui = 'http://****.cn/response'
 var code = 'code'
 var SCOPE = 'snsapi_userinfo'  // 需要用户授权
 location.href = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${APPID}&redirect_uri=${rui}&response_type=${code}&scope=${SCOPE}&state=STATE#wechat_redirect`
```
- 用户授权之后跳转到redirect_uri 根据openID获取用户基本信息
```javascript
// 获取用户权限后跳转到response
router.get('/response',(req,ress)=>{
  // 授权成功之后跳转到response路由，携带code. 根据code拿到access_token
  axios.get('https://api.weixin.qq.com/sns/oauth2/access_token',{
    params:{
      appid:config.wechat.appID,
      secret:config.wechat.appsecret,
      code:req.query.code,
      grant_type:'authorization_code'
    }
  }).then(function(response){
      // 拿到access_token和openId值
      access_token = response.data.access_token
      openId = response.data.openid


      // 获取用户信息
      axios.get( 'https://api.weixin.qq.com/sns/userinfo' , {
      	params:{
      		access_token:response.data.access_token,
      		openid:response.data.openid,
      		lang:'zh_CN'
      	}
      }).then((userinfo)=>{
      	// userinfo.data.nickname 
      	//userinfo.data.sex  
      	//userinfo.data.province  
      	//userinfo.data.city 
      	
      	ress.render('shop' , { ...userinfo.data })
      });

  })
})
```


## 在spa页面中调用微信的接口
- 到此为止你已经用微信公众号测试账号完成
	- 增加或修改公众号的菜单
	- 在公众号发送消息/事件到后台并且得到后台回应
	- 从公众号跳转到spa(单页应用) 并携带用户信息
- spa和微信还两套独立的系统所以不能直接调用微信的api, 就像浏览器的网页不能直接调用Windows底层接口一样, 如果要调用也要通过浏览器
	- 在spa中调用wx.config()配置信息, 
- 前端页面代码
```javascript
$.ajax({
	type:'get',
	url:'http://***.cn/getWxConfig',  
	data:{  nonceStr:'getoperateaccess' , url:location.href  },
	dataType:'json',
	success:function(data){
		
		//开始验证
		wx.config({
			debug:true,
			appId:data.appId,
			timestamp:data.timestamp,
			nonceStr:'getoperateaccess',
			signature:data.signature,
			jsApiList: ['onMenuShareTimeline',
				'onMenuShareAppMessage',
				'onMenuShareQQ',
				'onMenuShareWeibo',
				'onMenuShareQZone',
				'scanQRCode'
			]
		});



		wx.ready(function(){
			//验证成功
			点击页面按钮
			$('.openCamera').on('click',function(){
				//打开微信扫描二维码
				wx.scanQRCode({
				    needResult: 0, // 默认为0，扫描结果由微信处理，1则直接返回扫描结果，
				    scanType: ["qrCode","barCode"], // 可以指定扫二维码还是一维码，默认二者都有
				    success: function (res) {
				    
					}
				});
			})
			
		});


		wx.error(function(err){
			//验证失败
		})
	}
})		
```

- 后台代码
```javascript
// 获取用户权限后跳转到response路由
router.get('/response', responseShop.shop)

// 生成签名用于wx.config
router.get('/getWxConfig', (req, res) => {
  var noncestr = req.query.nonceStr //前端传过来的随机字符串

  var timestamp = parseInt(new Date().getTime() / 1000) + '' //获取当前时间戳, 单位秒

  var url = req.query.url //获取前端页面的url, 不包括#及之后的内容

  //按照微信的官方说法要将用于生成签名的noncestr timestamp url jsapi_ticket 按照ASCII码由小到大排序, 以键值对的形式
  //拼接成字符串, "jsapi_ticket".charCodeAt()可查询
  var str = `jsapi_ticket=${data.jsapi_ticket}&noncestr=${noncestr}&timestamp=${timestamp}&url=${url}`

  // 使用哈希加密成签名
  var signature = sha1(str)   //npm install sha1

  // 返回给前端
  res.json({
    appId: config.wechat.appID,
    signature: signature,
    timestamp: timestamp,
    jsapi_ticket22: data.jsapi_ticket,
    noncestr: noncestr,
  })
})

```


![发送文字-点击按钮](http://img.blog.csdn.net/20171027110339367)


![验证成功, debug弹出信息](http://img.blog.csdn.net/20171027110613590)


![点击按钮调用微信的扫描二维码的功能](http://img.blog.csdn.net/20171027111009375)


![debug提示调用相机成功](http://img.blog.csdn.net/20171027111143126)


![扫描二维码](http://img.blog.csdn.net/20171027111237261)