# 请尽快fork或者备份文件，本仓库不排除删除可能性，谢谢
## 本人不对本程序承担任何责任，也不接受任何形式的赞助或赞赏，更不会以此牟利或分享用户数据。

# 更新介绍
1. 修复无法获取验证码导致无法登录的问题
2. BDUSS登录时无法处理异常信息
3. 下载在无下载参数情况下(分享下载/locate下载/默认下载)，默认使用locate方式下载，以获取更高的速度，非SVIP会员注意可能触发限速。
4. 刷新后无法获取原来的下载数据，会自动恢复下载列表
5. 初步增加aria2下载功能，暂时只支持RPC-Secret验证
6. 版本更新到3.7.1，关闭消息通知和在线更新功能

# 下载地址
https://github.com/Erope/baidupcs-web/releases

## Aria2下载功能
### 配置
```shell
--aria2, -a                      启用aria2下载，停用自带下载
--aria2url value, --au value     aria2的url (default: "http://localhost:6800/jsonrpc")
--aria2secret value, --as value  aria2-RPC的secret，默认为空
```
-a参数控制aria2是否开启，-au控制aria2-RPC的URL，-as控制aria2-RPC的令牌  
注意，这个url是基于Baidu-PCS运行的主机而言的，并非基于客户端  
开启后默认的下载列表会失效，请自行使用其他软件来控制下载  
最高线程上限设置为了16线程，因为默认的Aria2的源码中写的就是16线程，超过会报错，建议仅使用4线程下载以防拉黑  
如果不会配置Aria2，建议暂时还是不要尝试  

例子:  
    ./BaiduPCS-Go -a -au "http://10.0.0.1:6800/jsonrpc" -as "xxxxxxxxxxxxxxxxxxxxx"

欢迎讨论:
1. QQ群: 343564194
2. 博客: www.shinenet.cn
3. TG: https://t.me/ShineNet_Q