var express = require('express')
var app = express()

app.get('/auth', (req,res) => {
  var status = req.query.status
  switch (status) {
    case "log_pass":
      var login = req.query.login
      var password = req.query.password
      var vktoken = require('vk-token-FIXED')

      vktoken.getAccessToken(login, password, function(error, token, response){
        switch (token) {
          case 'notoken':
            res.send(`Bad login or password<br>
                      <form action="#" method="get">
                        <input type="hidden" name="status" value="log_pass">
                        <input type="text" name="login">
                        <input type="password" name="password">
                        <button type="submit">Enter</button>
                      </form>`);
            break;
          case 'need_code':
            res.send(`
                    <form action="#" method="get">
                      <input type="hidden" name="status" value="twostep">
                      <input type="hidden" name="response" value="`+response+`">
                      <input type="text" name="sms" placeholder="enter code from vk admin">
                      <button type="submit">Enter</button>
                    </form>
                    `)
            break;
          default:
            // I get token!
            getList(function(json, token){
              //console.log(json);
              var string = "<h2>Список удаленных/забаненных друзей: </h2><br>";
              //console.log(json.response);
              for (var i = 0; i < json.response.items.length; i++) {
                if(json.response.items[i].deactivated){
                  string = string + "id: " + json.response.items[i].id + " name: " + json.response.items[i].first_name + " " + json.response.items[i].last_name + "<a target='_blank' href='https://vk.com/id"+json.response.items[i].id+"'>Ссылка</a><a style='margin-left:20px' target='_blank' href='https://api.vk.com/method/friends.delete?v=5.80&user_id="+json.response.items[i].id+"&access_token="+token+"'>Удалить из друзей</a><br>"
                }
              }
              res.send(string);
            }, token)
        }
      })
      break;
    case 'twostep':
      var response = req.query.response
      var code = req.query.sms
      console.log(response);
      var vktoken = require('vk-token-FIXED')
      vktoken.twoStep(response, code, function(token, error){
        getList(function(json, token){
          //console.log(json);
          var string = "<h2>Список удаленных/забаненных друзей: </h2><br>";
          //console.log(json.response);
          for (var i = 0; i < json.response.items.length; i++) {
            if(json.response.items[i].deactivated){
              string = string + "id: " + json.response.items[i].id + " name: " + json.response.items[i].first_name + " " + json.response.items[i].last_name + "<a target='_blank' href='https://vk.com/id"+json.response.items[i].id+"'>Ссылка</a><a style='margin-left:20px' target='_blank' href='https://api.vk.com/method/friends.delete?v=5.80&user_id="+json.response.items[i].id+"&access_token="+token+"'>Удалить из друзей</a><br>"
            }
          }
          res.send(string);
        }, token)
      })
    break;
    default:
      res.send(`
              <form action="#" method="get">
                <input type="hidden" name="status" value="log_pass">
                <input type="text" name="login">
                <input type="password" name="password">
                <button type="submit">Enter</button>
              </form>
              `)
  }
})

function getList(backFunc, token){
  getUserId(
    ((error, statusCode, headers, body) => {
      var user_id = JSON.parse(body);
      user_id = user_id.response[0].id
      if(error == null){
        getFriends(
          ((error, statusCode, headers, body) => {
            var json = JSON.parse(body)
            backFunc(json, token);
        }), token, user_id)

        //console.log(user_id.response[0].id);
      }
  }), token)
}
function getFriends(callback, token, user_id) {
    'use strict';

    const httpTransport = require('https');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'api.vk.com',
        port: '443',
        path: '/method/friends.get?access_token='+token+'&v=5.80&user_id=90327755&order=name&count=5000&fields=domain',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';

        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ?
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;

            callback(null, res.statusCode, res.headers, responseStr);
        });

    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();


}
function getUserId(callback, token) {
    'use strict';

    const httpTransport = require('https');
    const responseEncoding = 'utf8';
    const httpOptions = {
        hostname: 'api.vk.com',
        port: '443',
        path: '/method/users.get?access_token='+token+'&v=5.80',
        method: 'GET',
        headers: {}
    };
    httpOptions.headers['User-Agent'] = 'node ' + process.version;
    const request = httpTransport.request(httpOptions, (res) => {
        let responseBufs = [];
        let responseStr = '';

        res.on('data', (chunk) => {
            if (Buffer.isBuffer(chunk)) {
                responseBufs.push(chunk);
            }
            else {
                responseStr = responseStr + chunk;
            }
        }).on('end', () => {
            responseStr = responseBufs.length > 0 ?
                Buffer.concat(responseBufs).toString(responseEncoding) : responseStr;

            callback(null, res.statusCode, res.headers, responseStr);
        });

    })
    .setTimeout(0)
    .on('error', (error) => {
        callback(error);
    });
    request.write("")
    request.end();
}
//getList("4cb9f0ad2100395565e191d552a6df80cedeab2575f955c5e74f1a5d46de87b44857e9dcb18b9d85162d4");
app.get('/getlist', (req, res) => {
  res.send('yo')
})

app.listen(1338, function(){
  console.log('Server listening on port 1338');
})
