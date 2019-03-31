## BaiduPCS-Web

这个项目基于BaiduPCS-Go, 可以让你高效的使用百度云

#### 在公众号上用心写了一篇介绍，让大家更好地了解和使用BaiduPCS-Go Web版
https://w.url.cn/s/AdjX09Y

![avatar](https://user-images.githubusercontent.com/8407297/44954655-ba346e00-aed7-11e8-835d-59014e155aa7.png)
![avatar](https://user-images.githubusercontent.com/8407297/44954613-19de4980-aed7-11e8-963e-6366025bd9d7.png)
![avatar](https://user-images.githubusercontent.com/8407297/44954618-2e224680-aed7-11e8-8413-3a092f8ef9b6.png)
![avatar](http://qiniu.zoranjojo.top/20181219175412.png)

腾讯视频: https://v.qq.com/x/page/e0774xoeatv.html

### 运行
程序已经打包好放在 [release](https://github.com/liuzhuoling2011/baidupcs-web/releases) 页面, Windows版本直接双击就可以使用

对于 Linux 和 Mac 版本:
```
打开终端:
1. cd 到软件所在的目录
2. chmod a+x BaiduPCS-Go
3. ./BaiduPCS-Go
4. 打开浏览器, 在地址栏输入: localhost:5299 就可以看到界面了
```

### 运行出错
如果遇到程序启动错误, 应该是端口占用导致的, 可以指定端口运行

```./BaiduPCS-Go-xxx web --port 12345```

### 目前百度是针对账号进行限速，当一个非会员账号下载量达到一定阈值就会触发限速。账号被限速之后容易出现下载错误、掉连接数等问题，需要过几天或者开通会员才会恢复"
代码: 31326, 消息: user is not authorized, hitcode:123

### 对于老版登陆后没有内容, 只显示 "No permission to do this operation"
登陆后在右上角的设置里面把appid设置为```266719```就可以正常使用了
![avatar](http://oozw0y5q9.bkt.clouddn.com/20180918142033.png)

Enjoy, 如果觉得好用, 请不要吝啬 ```star``` 或者 ```follow``` 哦, 或者顺便 ```buy me a coffee```

|支付宝|微信|
|:-----:|:-----:|
|<img width="152" src="https://i.loli.net/2018/09/11/5b9762ccc140f.png">|<img width="150" src="https://i.loli.net/2018/09/11/5b9762ad8fcb3.png"/>|
