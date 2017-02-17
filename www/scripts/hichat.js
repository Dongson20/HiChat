window.onload = function() {
	//实例并初始化 我们的htchat程序
	var hichat = new HiChat();
	hichat.init();
};

//定义一个我们的一个hichat类型
var HiChat = function() {
	this.socket = null;
};

// 向 原型添加业务方法
HiChat.prototype = {
	init: function() { //初始化程序
		var that = this;
		//建立到服务器的socket 连接
		this.socket = io.connect();
		//监听 socket 的connect 事件 此事件表示已经连接	
		this.socket.on('connect', function() {
			//连接到服务器后，显示输入框和昵称
			document.getElementById('info').textContent = "报上你的大名(Your Name)";
			document.getElementById('nickWrapper').style.display = 'block';
			document.getElementById('nicknameInput').focus();
		});

		//昵称设置的确定按钮
		document.getElementById('loginBtn').addEventListener('click', function() {
			var nickName = document.getElementById('nicknameInput').value;
			//检查昵称输入框是否为空
			if (nickName.trim().length != 0) {
				//不为空，则发起一个login事件并将输入的昵称发送到服务器
				that.socket.emit('login', nickName);
			} else {
				//否则输入框获取焦点
				document.getElementById('nicknameInput').focus();
			}
		}, false);

		this.socket.on('nickExisted', function() {
			document.getElementById('info').textContent = "!用户名称已经被占用(nickname is taken,choose another pls)"; //显示用户昵称被占用的提示
		})

		// 登陆成功 移除遮罩层
		this.socket.on('loginSuccess', function() {
			document.title = "hichat | " + document.getElementById('nicknameInput').value;
			document.getElementById('loginWrapper').style.display = 'none'; //隐藏遮罩层显示聊天界面
			document.getElementById('messageInput').focus(); //让输入框获的焦点
		})

		// 离线退出
		this.socket.on('system', function(nickName, userCount, type) {
			//判断用户是连接还是离开显示不同的消息
			var msg = nickName + (type == 'login' ? 'joined' : 'left');
			// var p = document.createElement('p');

			// p.textContent = msg;

			// document.getElementById('historyMsg').appendChild(p);
			//指定系统消息显示为红色
			that._displayNewMsg('system', msg, 'red');
			//将在线人数显示到页面顶部
			document.getElementById('status').textContent = userCount + (userCount > 1 ? 'users' : 'user') + '在线';
		})

		//发送 消息的 到服务器
		document.getElementById('sendBtn').addEventListener('click', function() {
			var messageInput = document.getElementById('messageInput'),
				// 获取输入框的消息
				msg = messageInput.value,
				// 获取颜色值
				color = document.getElementById('colorStyle').value;
			// 消息默认为空
			messageInput.value = '';
			//自动聚焦
			messageInput.focus();
			if (msg.trim().length != 0) {
				//显示和发送是带上颜色值参数
				that.socket.emit('postMsg', msg, color);
				// 把自己的消息显示到自己的窗口中；
				that._displayNewMsg('me', msg ,color);
			}
		}, false);

		//接送 服务器返回的消息 显示到 页面
		this.socket.on('newMsg', function(user, msg ,color) {
			that._displayNewMsg(user, msg, color);
		})

		// 文件发送
		document.getElementById('sendImage').addEventListener('change', function() {
			//检查 是否 有文件 被选中
			if (this.files.length != 0) {
				//获取文件并用FileReader 进行读取
				var file = this.files[0],
					reader = new FileReader();
				if (!reader) {
					that._displayNewMsg('system', '!your browser doesnot support fileReader', 'red');
					this.value;
					return;
				};
				reader.onload = function(e) {
					//读取成功，显示到页面并发送到服务器
					this.value = '';
					that.socket.emit('img', e.target.result);
					that._displayNewMsg('me', e.target.result);
				};
				reader.readAsDataURL(file);
			}
		}, false);

		//接收用户发来的图片（服务器发送回来的）
		// 将图片显示到页面
		this.socket.on('newImg', function(user, img) {
			that._displayNewMsg(user, img);
		})

		// 调用表情
		this._initialEmoji();
		document.getElementById('emoji').addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			emojiwrapper.style.display = 'block';
			e.stopPropagation();
		},false);
		document.body.addEventListener('click',function(e){
			var emojiwrapper = document.getElementById('emojiWrapper');
			if(e.target != emojiwrapper){
				emojiwrapper.style.display = 'none';
			}
		});

		//获取被点击的表情
		document.getElementById('emojiWrapper').addEventListener('click',function(e){

			var target = e.target;
			if(target.nodeName.toLowerCase() == 'img'){
				var messageInput = document.getElementById('messageInput');
				messageInput.focus();
				messageInput.value = messageInput.value + '[emoji:'+ target.title +']';
			}
		},false);

		// 按回车发送消息
		document.getElementById('nicknameInput').addEventListener('keyup',function(e){
			// 回车键码值
			if(e.keyCode == 13){
				var nickName = document.getElementById('nicknameInput').value;
				if(nickname.trim().legnth != 0){
					that.socket.emit('login',nickName);
				}
			}
		},false);
		document.getElementById('messageInput').addEventListener('keyup', function(e){
			var messageInput = document.getElementById('messageInput'),
			msg = messageInput.value,
			color = document.getElementById('colorStyle').value;
			if(e.keyCode == 13 && msg.trim().length != 0){
				messageInput.value = '';
				that.socket.emit('postMsg',msg.color);
				that._displayNewMsg('me',msg,color);
			}
		}, false)
	},

	//显示消息 图片 的方法
	_displayNewMsg: function(user, msg, color) {
		var container = document.getElementById('historyMsg'),
			msgToDisplay = document.createElement('p'),
			date = new Date().toTimeString().substr(0, 8);

		// 将消息中的表情转换为图片
		msg = this._showEmoji(msg);
		msgToDisplay.style.color = color || "#000";
		msgToDisplay.innerHTML = user + '<span class="timespan">(' + date +  '):</span>' + msg;
		// 发送的消息放进 聊天的容器中 
		container.appendChild(msgToDisplay);
		container.scrollTop = container.scrollHeight;
		// 全局的高度，滚动条顶端到 上滚动按钮的距离
		console.log(container.scrollTop);
		// 容器的高度
		console.log(container.scrollHeight);
	},

	//表情部分
	_initialEmoji:function(){
		var emojiContainer = document.getElementById('emojiWrapper'),
		//document.cearteDocumentFragment() 创建文档碎片
		docFragment = document.createDocumentFragment();
		for(var i = 69;i > 0;i--){
			var emojiItem = document.createElement('img');
		    emojiItem.src = '../content/emoji/' + i + '.gif';
			emojiItem.title = i;
			docFragment.appendChild(emojiItem);
		};
		emojiContainer.appendChild(docFragment);
	},
	//显示表情
	_showEmoji:function(msg){
		var match,result = msg,
		reg = /\[emoji:\d+\]/g,
		emojiIndex,
		totalEmojiNum = document.getElementById('emojiWrapper').children.length;
		while(match = reg.exec(msg)){
			emojiIndex = match[0].slice(7,-1);
			if(emojiIndex > totalEmojiNum){
				result = result.replace(match[0],'[X]');
			}else{
				result = result.replace(match[0],'<img class="emoji" src="../content/emoji/' + emojiIndex + '.gif">');
			};
		};
		return result;
	}


}