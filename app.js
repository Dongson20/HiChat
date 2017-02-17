//引入http模块
// var http = require('http');
// //创建服务器
// http.createServer(function(req,res){
// 	res.writeHead(200,{'content-type':'text/html'});
// 	res.write('<h1>Node.js</h1>');
// 	res.end('<p>Hello world</p>');
// }).listen(3000);//监听3000端口
// console.log("HTTP server is listening at port 3000.");

// 使用express模块返回静态页面
var express = require("express"),
	app = express(),
	server = require('http').createServer(app),
	//引入socket.io模块并绑定到服务器
	io = require('socket.io').listen(server),
	//保存所有在线用户的昵称
	users = [];
app.use('/',express.static(__dirname + '/www'));//返回指定HTML文件的位置
server.listen(3000);
console.log("HTTP server is listening at port 3000.");

// socket 部分
// io.on('connection',function(socket){
// 	//接送并处理客户端发送的foo事件
// 		socket.on('foo',function(data){
// 			//输出到控制台
// 			console.log(data);
// 		})
// })

io.on('connection',function(socket){
	//昵称设置
	socket.on('login',function(nickname){
		if(users.indexOf(nickname) > -1){
			socket.emit('nickExisted');
		}else{
			socket.usersIndex = users.length;
			socket.nickname = nickname;
			users.push(nickname);
			socket.emit('loginSuccess');
			io.sockets.emit('system',nickname,users.length,'login');//向所有连接服务器的客户端发送当前登陆用户的昵称
		}
	});

	//断开连接的事件
	socket.on("disconnect",function(){
		//将断开连接的用户从 users 中删除
		users.splice(socket.userIndex,1);
		//通知除自己以外的所有人 
		socket.broadcast.emit('system',socket.nickname,users.length,'logout');
	});

	//接收新消息 并发送到 客户端
	socket.on('postMsg',function(){
		//将消息发送到自己外的所有用户
		socket.broadcast.emit('newMsg',socket.nickname,msg);
	});

	//接收用户发过来的图片
	socket.on('img',function(imgData){
		//通过一个newImg事件分发到除自己外的每个用户
		socket.broadcast.emit('newImg',socket.nickname,imgData);
	});
})