/*
    启动服务端程序
*/
const app = require('express')()
const server = require('http').Server(app)
const path = require('path');
const db = require('./db/db.js')
const chinaTime = require('china-time')
// const io = require('socket.io')(server)

var fs=require('fs');
let sslOptions = {
        key: fs.readFileSync('C:/privkey.key'),//生成的私钥
        cert: fs.readFileSync('C:/cacert.pem')//生成的证书
    };
const https = require('https').createServer(sslOptions, app);
var io = require('socket.io')(https)
var imgCount=0;//记录数据库记录的图片数目，以便按照编号查找服务器磁盘上存储的历史记录图片
https.listen(444, () => {
    console.log('即时通讯系统启动完毕！https listen on：444');
    fs.readFile('./public/saveImg/record.txt',function(err,data){
        if(err){
            console.log(err);
        }else{
            imgCount=parseInt(data.toString());
            console.log("数据库记录的图片数："+imgCount);
        }
    })
});
setInterval(function(){
    fs.writeFile('./public/saveImg/record.txt',imgCount.toString(),(err)=>{
        if(err){
            console.log(err);
        }else{
            console.log("写入成功,目前数据库记录的图片数： "+imgCount);
        }
    })
},1000)
// //支持截图功能
// const webshot = require('webshot');
//记录所有已经登陆过的用户
const users = []
var id_now = 1

//启动了服务器
// server.listen(3000, () => {
//     console.log('服务器启动成功了')
// })

//express处理静态资源
//把public目录设置为静态资源
app.use(require('express').static(path.join(__dirname, 'public')))
app.get('/', function (req, res) {
    res.redirect('/index.html')
})

app.get('/camera', (_req, res) => {  //使用摄像头的路由
    res.sendFile(__dirname + '/camera1.html');  //发送名为“camera.html”的静态文件
});

/*摄像头相关的js*/


/*摄像头相关的js --END*/

db.selectAll('select count(*) as sum from message', (e, r) => {
    //id 按照消息发送的先后顺序递增
    console.log('数据库共有' + r[0].sum + '条历史消息记录')
    id_now = r[0].sum + 1
})

//一进入聊天室就加载信息 传个socket对象
function initMessage(socket) {
    db.selectAll('select * from message order by id asc', (e, res) => {
        // console.log(r)
        // console.log(r[0])
        for (var i = 0; i < res.length; i++) {
            // console.log(res[i])
            var obj=res[i];
            if(res[i].type ==='image') {
                //广播给当前进入聊天室的用户
                fs.readFile(res[i].content,(err,data)=>{
                    if(err){
                        console.log(err);
                    }else{
                        
                        obj.content=data.toString();
                        socket.emit('receiveImage', obj)
                        console.log('历史消息图片：')
                        // console.log(res[i])
                        // socket.on('ok next',()=>{
                        //     continue;
                        // })
                    }
                })
            }else{
                //广播给当前进入聊天室的用户
            socket.emit('receiveMessage', res[i])
            console.log('历史消息：')
            // console.log(res[i])
            // socket.on('ok next',()=>{
            //     continue;
            // })
            }

        }
    })
}


/*
    此处有个bug，如果用户没通过验证，就会显示一名undefined用户离开了聊天室，因为它connection了
    已修复 解决方案：disconnect的时候不当他是位用户 
    另一种不好的思路：在客户端连接数据库判断，这样暴露安全隐患
 */
io.on('connection', function (socket) {

    socket.on('checkoutLogin', data => {
        // 连接数据库验证
        let msg = '',
            resultData = '';
        db.selectAll("select * from usersInformation where username ='" + data.username + "' ", (e, r) => {
            let tt = r.length;
            if (tt == 0) {
                msg = "用户名不存在";
            } else if (data.password != r[0].password) {
                msg = "用户密码错误";
            } else {
                resultData = r[0];
                msg = "用户密码正确"
            }
            socket.emit('checkoutAnswer', {
                msg: msg,
                avatar: resultData.avatar
            })
            // console.log(msg, resultData)
        })

    })
    socket.on('login', data => {
        //判断，如果在data在users中存在，说明该用户登陆过了，不允许登录
        //如果data在user中不存在，说明用户没有登陆，允许登录
        let user = users.find(item => item.username === data.username)
        if (user) {
            //表示用户在线
            socket.emit('loginError', {
                msg: '该用户已登陆！'
            })
            // console.log('登陆失败')
        } else {
            // //连接数据库获取用户头像
            // db.selectAll("select * from usersInformation where username ='" + data.username + "' ", (e, r) => {
            //     data.avatar = r[0].avatar
            //     console.log(r[0].avatar)
            // })
            //把登陆成功的用户信息存储起来
            //socket.username ? avatar 内置对象？ 不太像
            socket.username = data.username
            socket.avatar = data.avatar

            //表示用户不在线,把用户存入user数组
            users.push(data)
            //告诉用户，登陆成功
            socket.emit('loginSuccess', data)
            // console.log('登陆成功')

            //告诉所有人，有新用户加入到了聊天室，广播消息
            //socket.emit 给当前用户发消息 io.emit 给所有用户发消息
            io.emit('addUser', data)


            //告诉所有用户，当前聊天室用户列表以及数量
            io.emit('userList', users)

            //一进入聊天室就加载信息
            initMessage(socket)
        }
    })

    //用户断开连接功能
    //监听用户断开连接
    socket.on('disconnect', () => {
        if(socket.username === 'undefined') return
        //把当前用户信息从user中删除
        let idx = users.findIndex(item => item.username === socket.username)
        //删除掉断开连接的人
        users.splice(idx, 1)
        // 1.告诉所有人，有人离开了聊天室
        io.emit('deleteUser', {
            username: socket.username,
            avatar: socket.avatar
        })
        // 2.告诉所有人，userList发生更新
        io.emit('userList', users)

        //ADD
        socket.broadcast.emit('user disconnected', socket.id); 
    })

    //监听主动挂断的消息
    socket.on('video-over',()=>{
        socket.broadcast.emit('user disconnected', socket.id); 
    })

    //监听聊天的消息
    socket.on('sendMessage', data => {
        //存入数据库
        var time = chinaTime('YY/MM/DD HH:mm')
        let saveData = {
            id: id_now,
            username: data.username,
            content: data.content,
            time: time,
            avatar:data.avatar,
            type: data.type
        }
        db.insertData('message', saveData, (e, r) => {
            console.log('文字消息存入成功')
            id_now++
        })
        // console.log('聊天消息')
        // console.log(saveData)
        //广播给所有用户
        io.emit('receiveMessage', saveData)
    })

    //接受图片的信息 
    // 由于图片所占内存过大，为节省数据库空间，可以不做处理
    socket.on('sendImage', data => {
        var time = chinaTime('YY/MM/DD HH:mm')
        let saveData = {
            id: id_now,
            username: data.username,
            content: './public/saveImg/'+imgCount.toString()+'img.txt',
            time: time,
            avatar:data.avatar,
            type: data.type
        }
        let saveDataActive = {
            id: id_now,
            username: data.username,
            content: data.img,
            time: time,
            avatar:data.avatar,
            type: data.type
        }
        db.insertData('message', saveData, (e, r) => {
            console.log('图片消息存入成功')
            id_now++
        })
        // console.log('聊天消息')
        // console.log(saveData)
        //广播给所有用户
        io.emit('receiveImage', saveDataActive)

        //ADD
        fs.writeFile('./public/saveImg/'+imgCount.toString()+'img.txt',data.img,(err)=>{
            console.log("写入图片成功  地址： "+'./public/saveImg/'+imgCount.toString()+'img.txt');
        })
        imgCount++;
    })

    //实现截图功能
    // socket.on('webshot', url => {
    //     webshot(url, 'hello_world.png', {siteType:'html'}, function(err) {
    //         // screenshot now saved to hello_world.png
    //       })
    // })

    //注册用户
    socket.on('registerUser', data => {
        // console.log(data)
        //插入之前要查询一遍，确保用户名未被注册 
        db.selectAll("select * from usersInformation where username = '" + data.username + "' ", (e, r) => {
            let tt = r.length;
            if (tt == 1) {
                console.log("账号已经被注册")
                socket.emit('registerError')
            } else {
                let saveData = data
                //注册
                db.insertData('usersInformation', saveData, (e, r) => {
                    console.log('注册成功')
                    socket.emit('registerSuccess')

                })
            }
        })

    })
        socket.join(socket.id);   //连接进入子房间
    
        console.log("a user connected:" + socket.id);  //当有新的用户连接建立的时候，就输出其socket的id
    
        // socket.on("disconnect", () => {  //这里是在对 已在建立连接时就传进来的socket对象 进行监视（监视其失去连接事件）
        //     console.log("user disconnected:" + socket.id);
        // });
    
        socket.on("new user greet", (data) => {   //监听是否有新连接
            console.log(data);
            console.log(socket.id + ' greet ' + data.msg);
            socket.broadcast.emit('need connect', { sender: socket.id, senderName:data.senderName,msg: data })  //广播告诉其他用户，本机需要连接
        })
    
        socket.on('ok we connect', (data) => {  
            io.to(data.receiver).emit('ok we connect', { sender: data.sender, senderName:data.senderName,receiver: data.receiver })  //发送连接给所有已连接用户，试图建立点对点的连接
        })
    
        //sdp candidate
        socket.on('sdp',(data)=>{
            console.log('sdp')
            console.log(data.description);
            socket.to(data.to).emit('sdp',{
                description:data.description,    //描述消息的类型是offer还是answer
                sender:data.sender     //发送者
            });
        });
    
        socket.on('ice candidates',(data)=>{
            console.log('ice candidates: ');
            console.log(data);
            socket.to(data.to).emit('ice candidates',{
                candidate:data.candidate,   //描述消息的类型是offer还是answer
                sender:data.sender  //发送者
            });
        });
})