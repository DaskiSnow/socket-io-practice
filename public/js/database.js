
var express = require('express');

var app = express();

 

var queryString = require('querystring');

var mysql = require('mysql');

 

app.get('/login', function(req, res) {

  var name = req.query.username;

  var pass = req.query.userpass;

  console.log(name);

  console.log(pass);

  //使用callback避免异步处理返回为空

  var message = getUserInfor(name, pass, function(json) {

    res.send(json);

  })

 

})

 

var server = app.listen(8081, function() {

 

  var host = server.address().address;

  var port = server.address().port;

 

  console.log("应用实例，访问地址为 http://%s:%s", host, port);

 

})

 

 

/**

 * [获取表中所有位置信息]

 * @return {[type]} [description]

 */

function getUserInfor(name, pass, callback) {

  var connection = mysql.createConnection({

    host: 'localhost',

    user: 'root',

    password: '123456abc',

    database: 'websocket'

  });

 

 

  connection.connect();

  //根据名字查询数据库信息

  var sql = 'SELECT password FROM usersInformation WHERE username = "' + name + '"';

 
try{
  connection.query(sql, function(err, result) {

 

    console.log('--------------------------result----------------------------');

    //转换json

    var message = JSON.stringify(result);

    message = JSON.parse(message);

    console.log(message);

    console.log(message[0].password);

 

    if (err) {

      callback('查询失败');

      console.log('查询失败');

    }

    if (message[0].password == pass) {

      callback('登陆成功');

    } else {

      callback('登陆失败');

    }

    console.log('------------------------------------------------------------\n\n');

  });
} catch(err){
  console.log(err.message)
}

 

  connection.end();

}

