/*
    聊天室的主要功能
*/
/*
    1.连接socket io服务
*/
// var socket = io('http://localhost:3000')


var socket = io('//')
var username, avatar, password, sex
/*
    2.登录功能
*/

//点击按钮登录
$('#loginBtn').on('click', function () {
  // 获取用户名
  username = $("#username").val().trim()
  password = $('#password').val().trim()
  if (!username || !password) {
    alert('用户名或密码未填写，请填写完成再登陆')
    return
  }
  // // 获取选择头像
  // //这里的.now很精妙 既加了边框，醒目 又可以通过它来找到所选的头像
  // //attr 获取属性
  // avatar = $('#login_avatar li.now img').attr('src')
  // // console.log(username,avatar)

  console.log(username, password)
  //需要告诉服务器用户名和密码，让其验证
  socket.emit('checkoutLogin', {
    username: username,
    password: password
  })

})

//点击用户列表项目选择


//所有class为demo1的span标签都会绑定此右键菜单
// $('div.demo1').contextMenu('myMenu1',
// {
//      bindings: 
//      {
//        'open': function(t) {
//          alert('Trigger was '+t.id+'\nAction was Open');
//        },
//        'email': function(t) {
//          alert('Trigger was '+t.id+'\nAction was Email');
//        },
//        'save': function(t) {
//          alert('Trigger was '+t.id+'\nAction was Save');
//        },
//        'delete': function(t) {
//          alert('Trigger was '+t.id+'\nAction was Delete');
//        }
//      }
// });

//接受返回查询结果
socket.on('checkoutAnswer', data => {
  console.log(data.msg)
  if (data.msg === '用户名不存在') {
    //用户名不存在
    alert('此用户不存在')
  } else if (data.msg === '用户密码正确') {
    //跳转到聊天室
    $('.login_box').fadeOut()
    $('.container').fadeIn()
    // 需要告诉socket io服务，登录
    //这里的头像需要查询数据库获取，在app.js实现 
    //之前验证登录时查询过数据库，让其返回登录头像data.avatar
    socket.emit('login', {
      username: username,
      avatar: data.avatar
    })
  } else if (data.msg === '用户密码错误') {
    //密码错误
    alert('密码输入错误，请重新输入')
    return
  }
})


//监听登陆失败的请求
socket.on('loginError', data => {
  alert('登陆失败了')
})

//监听登陆成功的请求
socket.on('loginSuccess', data => {
  var clientWidth = document.documentElement.clientWidth || document.body.clientWidth
  var clientHeight = document.documentElement.clientHeight || document.body.clientHeight
  // 更新canvas宽高
  $("#bg_canvas").attr("width", clientWidth);
  $("#bg_canvas").attr("height", clientHeight);
  $("#bg_canvas").hide();
  // 需要显示聊天窗口 淡入效果
  // 需要隐藏登陆窗口 淡出效果
  $('.login_box').fadeOut()
  $('.container').fadeIn()
  //设置个人信息 显示在界面上
  $('.avatar_url').attr('src', data.avatar)
  $('.user-list .username').text(data.username)

  username = data.username
  avatar = data.avatar
})


//监听添加用户的消息
socket.on('addUser', data => {
  //添加一条系统消息
  $('.box-bd').append(`
    <div class="system">
        <p class="message_system">
            <span class="content">"${data.username}"加入了群聊</span>
        </p>
    </div>
    `)
  scrollIntoView()
})

// 监听用户列表消息
socket.on('userList', data => {
  //打印出来
  // console.log(data)
  //更新列表之前先清空
  $('.user-list ul[id="user-item"]').html('')
  data.forEach(item => {
    $('.user-list ul[id="user-item"]').append(`
      <li class="user" id="a-user">
        <div class="avatar" ><img src="${item.avatar}" alt="" /></div>
        <div class="name" >${item.username}</div>
        <div class="video"><img src="images/video.svg" alt="" /></div>
        <div class="privateChat"><img src="images/privateChat.svg" alt="" /></div>
      </li> 
      
        `)
  })


  /* <li class="level1">
            <li class="user" >
              <div class="avatar" ><img src="${item.avatar}" alt="" /></div>
              <div class="name" >${item.username}</div>
            </li> 
            <ul class="level2">
              <div class="name" >私聊</div>
              <div class="name" >视频通话</div>
            </ul>
        </li> */
  //等待dom元素加载完毕.
  // $('.level1>li').on("click",function(){
  //   $(this).addClass('current')   //给当前元素添加"current"样式
  //   .find('i').addClass('down')   //小箭头向下样式
  //   .parent().next().slideDown('slow','easeOutQuad')  //下一个元素显示
  //   .parent().siblings().children('a').removeClass('current')//父元素的兄弟元素的子元素去除"current"样式
  //   .find('i').removeClass('down').parent().next().slideUp('slow','easeOutQuad');//隐藏
  //    return false; //阻止默认时间
  // });


  //等待dom元素加载完毕.
  // $(function(){
  // 	$(".level1>a").click(function(){
  // 		$(this).addClass('current')   //给当前元素添加"current"样式
  // 		.find('i').addClass('down')   //小箭头向下样式
  // 		.parent().next().slideDown('slow','easeOutQuad')  //下一个元素显示
  // 		.parent().siblings().children('a').removeClass('current')//父元素的兄弟元素的子元素去除"current"样式
  // 		.find('i').removeClass('down').parent().next().slideUp('slow','easeOutQuad');//隐藏
  // 		 return false; //阻止默认时间
  // 	});
  // })


  //更新用户数
  $('#userCount').text(data.length)
})

//监听用户离开的消息
socket.on('deleteUser', data => {
  //添加一条系统消息
  $('.box-bd').append(`
    <div class="system">
        <p class="message_system">
            <span class="content">"${data.username}"离开了群聊</span>
        </p>
    </div>
    `)
  scrollIntoView()
})

$('#btn-send').on('click', function () {
  //获取到聊天的内容
  //html()可加入到表情元素
  var content = $('#content').html()
  // console.log(content)
  //清空输入框
  $('#content').html('')
  if (!content) return alert('请输入内容')

  let message = {
    content: content,
    username: username,
    avatar: avatar,
    type: 'html'
  }
  //发送给服务器
  socket.emit('sendMessage', message)
  console.log(message)
})

//监听聊天的消息
socket.on('receiveMessage', data => {
  console.log(data)
  //把接收到的消息显示到聊天窗口中
  if (data.username === username) {
    //自己的消息
    $('.box-bd').append(`
      <div class="message-box">
        <div class="my message">
          <img class="avatar" src="${avatar}" alt="" />
          <div class="content">
            <div style="margin-bottom: 3px;margin-right: 3px;font-size: 12px;color: #4f4f4f;">${data.time}</div>
            <div class="bubble">
              <div class="bubble_cont">${data.content}</div>
            </div>
          </div>
        </div>
      </div>
        `)
  } else {
    //别人的消息
    $('.box-bd').append(`
         <div class="message-box">
            <div class="other message">
              <img class="avatar" src="${data.avatar}" alt="" />
              <div class="content">
                <div class="nickname">${data.username} <span>${data.time}</span></div>
                <div class="bubble">
                  <div class="bubble_cont">${data.content}</div>
                </div>
              </div>
            </div>
          </div>
        `)
  }
  // socket.emit('ok next');
  scrollIntoView()
})

function scrollIntoView() {
  //当前元素（最近一条消息）底部滚动到可视区
  //找到.box-bd最后一个子元素
  $('.box-bd').children(':last').get(0).scrollIntoView(false)
}

// 发送图片功能
//onchange() 表示文件被选择 换文件
$('#file').on('change', function () {
  var file = this.files[0]

  //需要把这个文件发送到服务器，借助于H5新增的fileReader
  var fr = new FileReader()
  fr.readAsDataURL(file)
  console.log(file);
  fr.onload = function () {
    socket.emit('sendImage', {
      username: username,
      avatar: avatar,
      img: fr.result,
      type: 'image'
    })
  }
})

//监听图片的聊天信息
socket.on('receiveImage', data => {
  //把接收到的消息显示到聊天窗口中
  if (data.username === username) {
    //自己的消息
    $('.box-bd').append(`
    <div class="message-box">
      <div class="my message">
        <img class="avatar" src="${data.avatar}" alt="" />
        <div class="content">
          <div style="margin-bottom: 3px;margin-right: 3px;font-size: 12px;color: #4f4f4f;">${data.time}</div>
          <div class="bubble">
            <div class="bubble_cont">
              <img src="${data.content}" class="imgclass"/>
            </div>
          </div>
        </div>
      </div>
    </div>
      `)
  } else {
    //别人的消息
    $('.box-bd').append(`
       <div class="message-box">
          <div class="other message">
            <img class="avatar" src="${data.avatar}" alt="" />
            <div class="content">
            <div class="nickname">${data.username} <span>${data.time}</span></div>
              <div class="bubble">
                <div class="bubble_cont">
                  <img src="${data.content}" class="imgclass"/>
                </div>
              </div>
            </div>
          </div>
        </div>
      `)
  }

  //等待图片加载完成
  $('.box-bd img :last').on('load', function () {
    scrollIntoView()
  })

})

  //图片点击放大
  $('.box-bd').on('click','.imgclass',function(){
      //  document.getElementById("bigimg").style.display = "-webkit-box";
      console.log($(this).attr("src"));
      $('#bigimg').css("display","-webkit-box");
      $('#bigimg').html('');
      $('#bigimg').append(`
        <img src='${$(this).attr('src')}'/>
      `)
      } )
      
  //图片放大取消
  $('#bigimg').on('click',function(){
      $('#bigimg').css("display","none")
  })


//显示表情
$('.face').on('click', function () {
  $('#content').emoji({
    button: '.face',
    showTab: true,
    animation: 'slide',
    position: 'topRight',
    icons: [{
      name: "Genshin",
      path: "lib/jquery-emoji/img/Genshin/",
      maxNum: 69,
      file: ".png",
      placeholder: "#Genshin_{alias}#"
    }, {
      name: "贴吧表情",
      path: "lib/jquery-emoji/img/tieba/",
      maxNum: 50,
      file: ".jpg",
      placeholder: ":{alias}:",
      alias: {
        1: "hehe",
        2: "haha",
        3: "tushe",
        4: "a",
        5: "ku",
        6: "lu",
        7: "kaixin",
        8: "han",
        9: "lei",
        10: "heixian",
        11: "bishi",
        12: "bugaoxing",
        13: "zhenbang",
        14: "qian",
        15: "yiwen",
        16: "yinxian",
        17: "tu",
        18: "yi",
        19: "weiqu",
        20: "huaxin",
        21: "hu",
        22: "xiaonian",
        23: "neng",
        24: "taikaixin",
        25: "huaji",
        26: "mianqiang",
        27: "kuanghan",
        28: "guai",
        29: "shuijiao",
        30: "jinku",
        31: "shengqi",
        32: "jinya",
        33: "pen",
        34: "aixin",
        35: "xinsui",
        36: "meigui",
        37: "liwu",
        38: "caihong",
        39: "xxyl",
        40: "taiyang",
        41: "qianbi",
        42: "dnegpao",
        43: "chabei",
        44: "dangao",
        45: "yinyue",
        46: "haha2",
        47: "shenli",
        48: "damuzhi",
        49: "ruo",
        50: "OK"
      },
      title: {
        1: "呵呵",
        2: "哈哈",
        3: "吐舌",
        4: "啊",
        5: "酷",
        6: "怒",
        7: "开心",
        8: "汗",
        9: "泪",
        10: "黑线",
        11: "鄙视",
        12: "不高兴",
        13: "真棒",
        14: "钱",
        15: "疑问",
        16: "阴脸",
        17: "吐",
        18: "咦",
        19: "委屈",
        20: "花心",
        21: "呼~",
        22: "笑脸",
        23: "冷",
        24: "太开心",
        25: "滑稽",
        26: "勉强",
        27: "狂汗",
        28: "乖",
        29: "睡觉",
        30: "惊哭",
        31: "生气",
        32: "惊讶",
        33: "喷",
        34: "爱心",
        35: "心碎",
        36: "玫瑰",
        37: "礼物",
        38: "彩虹",
        39: "星星月亮",
        40: "太阳",
        41: "钱币",
        42: "灯泡",
        43: "茶杯",
        44: "蛋糕",
        45: "音乐",
        46: "haha",
        47: "胜利",
        48: "大拇指",
        49: "弱",
        50: "OK"
      }
    }, {
      name: "QQ高清",
      path: "lib/jquery-emoji/img/qq/",
      maxNum: 91,
      excludeNums: [41, 45, 54],
      file: ".gif",
      placeholder: "#qq_{alias}#"
    }, {
      name: "emoji高清",
      path: "lib/jquery-emoji/img/emoji/",
      maxNum: 84,
      file: ".png",
      placeholder: "#emoji_{alias}#"
    }]

  })
})

//截图功能
$(".screen-cut").on('click',function () {
  $("#bg_canvas").show()
  //调用选取截屏
  clipScreenshots("bg_canvas");
});


/*私聊按键*/
$('#user-item').on('click', '.user .privateChat', function (e) {
  console.log("点击了私聊功能！！！！！！！！")
})

/*视频功能*/
$('#user-item').on('click', '.user .video', function (e) {
  console.log("点击了视频功能！！！！！！！！")

  /*ADD */
  initCamera();
  $('.contianer').fadeOut();
  $('.container').css("display", "none");
  $('.video-container').css("display"," ");
  $('.video-container').fadeIn();
  $('#user-id').text(username+"的摄像头");  //将自己的用户名称打印在网页上
  pc.push(socket.id); //建立连接时初始化此点的连接情况的数组
  socket.emit('new user greet', { sender: socket.id, senderName:username,msg: 'hello' });  // 形成一个greet


  /*ADD END*/

})

$('.video-over').on('click',()=>{

  socket.emit('video-over',{sended: socket.id,senderName:username,msg:'拜拜'})
  $('.video-container').fadeOut();
  $('.video-container').css("display","none");
  $('.container').css("display", " ");
  $('.container').fadeIn();
})


/*ADD*/
socket.on('need connect', (data) => {   //建立点对点连接请求
  console.log(data);
  //$('user-list').append($(<li></li>).text(data.sender));
  //以下打印的列表均是此连接及其以后的用户
  let li = $('<li></li>').text(data.senderName).attr('user-id', data.sender);//打印连接的用户列表
  $('#user-list').append(li);

  let button = $('<button class="call">通话</button>'); //在用户列表后添加通话按钮
  button.appendTo(li);
  $(button).click(function () { //监听通话按钮事件
    console.log($(this).parent().attr('user-id'));
    startCall($(this).parent().attr('user-id'), true);  //连接时自动进行视频连接
  })

  socket.emit('ok we connect', { sender: socket.id, senderName:username,receiver: data.sender });

})

socket.on('user disconnected', (socket_id) => {
  console.log('disconnect: ' + socket_id)
  $('#user-list li[user-id="' + socket_id + '"]').remove();  //去除失去连接的用户
  /*除去失去连接的窗口*/
  $('#' + socket_id + '-video').remove();
  //$('#videos li[user-id="' + socket_id + '"]').remove();  //去除失去连接的视频

})

socket.on('ok we connect', (data) => {
  console.log(data);
  //以下打印的列表均是此连接前的用户

  let li = $('<li></li>').text(data.senderName).attr('user-id', data.sender);////打印连接的用户列表
  $('#user-list').append(li);

  let button = $('<button class="">通话</button>'); //在用户列表后添加通话按钮
  button.appendTo(li);
  $(button).click(function () { //监听通话按钮事件
    console.log($(this).parent().attr('user-id'));
    startCall($(this).parent().attr('user-id'), true);  //进行视频连接
  })
})

socket.on('sdp', (data) => {
  if (data.description.type === 'offer') {  //判断数据描述是offer还是answer
    startCall(data.sender, false); //是offer时，则为接收方，不需要创建offer
    //把发送者(offer)的描述，存储在接收者的remoteDesc远程描述中
    let desc = new RTCSessionDescription(data.description)  //将接受的流转换
    pc[data.sender].setRemoteDescription(desc).then(() => {

      pc[data.sender].createAnswer().then((answer) => { //创建一个应答
        return pc[data.sender].setLocalDescription(answer);  //将应答设置为本地描述
      }).then(() => {
        socket.emit('sdp', {    //将应答传递给呼叫者
          type: 'video-answer',
          description: pc[data.sender].localDescription,
          to: data.sender,
          sender: socket.id
        });
      }).catch();//catch error function empty
    })
  } else if (data.description.type === 'answer') {
    //应答
    let desc = new RTCSessionDescription(data.description);  //将接受的流转换
    pc[data.sender].setRemoteDescription(desc);  //将应答设置为远程描述
  }
})

socket.on('ice candidates', (data) => {  //接收ICE候选
  console.log('ice candidate: ' + data.candidate);
  //
  if (data.candidate) {
    var candidate = new RTCIceCandidate(data.candidate);
    pc[data.sender].addIceCandidate(candidate).catech();
  }
})
/*ADD END*/





/*
  注册功能
*/

//选择头像
$('#register_avatar li').on('click', function () {
  $(this)
    .addClass('now')
    .siblings()
    .removeClass('now')
})
//跳转注册页
$('#registerBtn').on('click', function () {
  // 需要显示注册窗口 淡入效果
  // 需要隐藏登陆窗口 淡出效果
  $('.login_box').fadeOut()
  $('.register_box').fadeIn()
})

//注册
$('#register').on('click', function () {
  //获取用户信息
  username = $('#register_username').val().trim()
  password = $('#register_password').val().trim()
  sex = $('#sex input[name=sex]:checked').val();
  avatar = $('#register_avatar li.now img').attr('src')
  console.log(username, password, sex, avatar)

  if (!username || !password || !sex || !avatar) {
    alert('请填写完整信息后再提交!')
    return
  }
  //提交用户信息到服务端
  socket.emit('registerUser', {
    username: username,
    password: password,
    sex: sex,
    avatar: avatar
  })

})

//监听注册失败的请求 先不写
socket.on('registerError', function () {
  alert('此用户名已被注册，请您更换一个')
})

//监听注册成功的请求
socket.on('registerSuccess', function () {
  alert('注册成功!')

  //在注册页登录
  $('#register_login').on('click', function () {
    // 需要告诉socket io服务，登录
    socket.emit('login', {
      username: username,
      avatar: avatar
    })
  })

})

/*视频代码*/

//封装两个函数，get指获得用户摄像头图像及音频；canget判断是否能获得
function getUserMedia(constrains, success, error) {  //三个参数：传入的函数（配置项）、传入成功后调用的函数、失败后调用的函数
  //let promise;
  if (navigator.mediaDevices.getUserMedia) { //navigator.mediaDevices.getUserMedia()用来捕捉本地媒体
    //最新标准API
    promise = navigator.mediaDevices.getUserMedia(constrains).then(success).catch(error);
  } else if (navigator.webkitGetUserMedia) {
    //webkit内核浏览器
    promise = navigator.webkitGetUserMedia(constrains).then(success).catch(error);
  } else if (navigator.mozGetUserMedia) {
    //Firefox浏览器
    promise = navagator.mozGetUserMedia(constrains).then(success).catch(error);
  } else if (navigator.getUserMedia) {
    //旧版API
    promise = navigator.getUserMedia(constrains).then(success).catch(error);
  }
  //return promise;
}
//封装判断摄像头是否能使用的函数 当这四个函数全为空时,那么我们无法打开用户摄像头
function canGetUserMediaUse() {
  return !!(navigator.mediaDevices.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia);
}

const localVideoElm = document.getElementById("video-local");

//STUN,TURN服务器配置参数
const iceServer = {
  iceServers: [{ urls: ["stun:ss-turn1.xirsys.com"] }, {
    username: "CEqIDkX5f51sbm7-pXxJVXePoMk_WB7w2J5eu0Bd00YpiONHlLHrwSb7hRMDDrqGAAAAAF_OT9V0dWR1d2Vi",
    credential: "446118be-38a4-11eb-9ece-0242ac140004",
    urls: ["turn:ss-turn1.xirsys.com:80?transport=udp", "turn:ss-turn1.xirsys.com:3478?transport=udp"]
  }]
};


//PeerConnection，保存点与点之间建立连接的数组
var pc = [];

var localStream = null;  //本地流

function initCamera() {   //初始化摄像头及其数据
  if (canGetUserMediaUse()) {
    getUserMedia({
      video: true,//是否打开视频图像
      audio: true//是否需要音频
    }, (stream) => {
      localStream = stream;
      localVideoElm.srcObject = stream;
      $(localVideoElm).width(800);
      $(localVideoElm).height(900);

    }, (err) => {
      console.log("访问用户媒体设备失败：", err.name, err.message);
    })
  } else {
    alert('您的浏览器不兼容，建议安装最新版Chrome');
  }
}

function startCall(parterName, createOffer) {  //发起通话，两个参数为接受方名称、是否创建一个offer

  pc[parterName] = new RTCPeerConnection(iceServer);

  if (localStream) { //判断是否有本地流
    localStream.getTracks().forEach((track) => {  //遍历本地流的每一条轨道
      pc[parterName].addTrack(track, localStream);  //将本地流加入数据中
    });
  } else {  //没有localstream的时候，创建一个
    if (canGetUserMediaUse()) {
      getUserMedia({
        video: true,
        audio: false
      }, function (stream) {
        localStream = stream;
        localVideoElm.srcObject = stream;
        $(localVideoElm).width(800);
      }, function (error) {
        console.log("访问用户媒体设备失败:", errorname, error.message);
      })
    } else {
      alert('您的浏览器不兼容');
    }
  }
  if (createOffer) {   //区别呼叫者和接收者，只有呼叫者需要创建offer
    //每当WebRTC基础结构需要你重新启动会话协商过程时，都会调用此函数
    pc[parterName].onnegotiationneeded = () => {
      pc[parterName].createOffer().then((offer) => {
        return pc[parterName].setLocalDescription(offer)  //将offer设置为本地的描述
      }).then(() => {
        //把发起者的描述信息通过Signal Server发送到接收者
        socket.emit('sdp', {
          type: 'video-offer',
          description: pc[parterName].localDescription,
          to: parterName,
          sender: socket.id
        });
      })
    }
  }


  //将ICE候选发送给另一个方
  pc[parterName].onicecandidate = ({ candidate }) => {
    socket.emit('ice candidates', {
      candidate: candidate,
      to: parterName,
      sender: socket.id
    });
  };

  //当向连接中添加磁道时，track事件的此处理程序由本地WebRTC层调用。例如，可以将传入媒体连接到元素以显示它。详见Receivingnew streams
  pc[parterName].ontrack = (ev) => {
    let str = ev.streams[0];  //获取首个流

    if (document.getElementById(`${parterName}-video`)) {  //判断是否此ID是否有可用的video，有的话则将流的地址赋值给它
      document.getElementById(`${parterName - video}`).srcObject = str;
    } else {  //不存在可用的则创建一个video框
      let newVideo = document.createElement('video');
      newVideo.id = `${parterName}-video`;
      newVideo.autoplay = true;
      newVideo.controls = true;
      //newVideo.className='remote-video';
      newVideo.srcObject = str;
      newVideo.width = 400;  //通话人视频大小

      document.getElementById('videos').appendChild(newVideo);  //将新建的vedio添加到vedios中
    }
  }

  //当需要你通过信令服务器将一个ICE候选发送给另一个对等端时，本地ICE层会调用你的icecandidate
  //事件处理程序。有关更多信息，参阅Sending ICE candidates 以查看此示例的代码。
  pc[parterName].onCandidate = ({ candidate }) => {
    socket.emit('ice candidates', {
      candidate: candidate,
      to: parterName,
      sender: socket.id
    });
  }
}
/*视频代码END*/