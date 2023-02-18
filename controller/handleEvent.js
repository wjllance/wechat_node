var xml2js = require("xml2js");
var tools = require("../config/tools.js");
const { config } = require("../config/config.js");
const { getToken_JsApi } = require("../service/api.js");

let chatGPTAPI;

// TODO: redis/cache
const userConversationId = {};

const getChatGPTAPI = () =>
  new Promise((resolve) => {
    if (chatGPTAPI) {
      resolve(chatGPTAPI);
    } else {
      import("chatgpt").then(({ ChatGPTAPI }) => {
        chatGPTAPI = new ChatGPTAPI({
          apiKey: config.openai.apiKey,
          debug: true,
        });
        resolve(chatGPTAPI);
      });
    }
  });

// 处理用户发送过来的文字消息和点击事件
exports.msg = (req, res) => {
  var xml = ""; //存储将要回复给公众号的文字
  var json = null; //用于存储xml转换为json

  //接收post内容
  req.on("data", (chunk) => {
    xml += chunk;
  });

  //接收结束
  req.on("end", () => {
    //将接受到的xml数据转化为json
    xml2js.parseString(xml, { explicitArray: false }, function (err, json) {
      var backTime = new Date().getTime(); //创建发送时间，整数

      console.log("json", json);

      //event表示事件,
      if (json.xml.MsgType == "event") {
        // EventKey是在自定义菜单的时候定义的事件名称
        if (json.xml.EventKey == "clickEvent") {
          res.send(tools.getXml(json, backTime, "你戳我干啥..."));
        }
        //text表示文字信息
      } else if (json.xml.MsgType == "text") {
        const userId = json.xml.FromUserName;
        res.send("success");
        const conversation_id = userConversationId[userId];

        getChatGPTAPI().then((api) => {
          const options = {};
          if (conversation_id) {
            options.conversationId = conversation_id;
          }

          api.sendMessage(json.xml.Content, options).then((ans) => {
            // console.log(json.xml.Content, "res:", ans.text);

            if (!conversation_id) {
              userConversationId[userId] = ans.conversationId;
            }

            testSendCustomMsg(userId, ans.text);
          });
        });
      }
    });
  });
};

const testSendCustomMsg = async (touser, content = "test text") => {
  const { access_token } = await getToken_JsApi();
  const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`;

  const json = {
    touser,
    msgtype: "text",
    text: {
      content,
    },
  };

  const options = {
    method: "POST",
    body: JSON.stringify(json),
  };

  fetch(url, options)
    .then((res) => {
      if (res.ok) {
        return res.json();
      }
    })
    .then((data) => {
      console.log(url + " ", options, "\nres:", data);
    });
};
