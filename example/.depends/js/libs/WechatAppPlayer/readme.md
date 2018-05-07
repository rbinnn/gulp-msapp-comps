# 腾讯小程序播放器SDK

## 接入指引

1. 各业务接入前请先[申请](http://git.code.oa.com/tencentvideo_project/WechatAppPlayer/issues/1)一个平台号
2. 为您的小程序添加域名的白名单。
  * `https://livew.l.qq.com` 允许前帖广告的业务需要
  * `https://h5vv.video.qq.com` 点播业务需要
  * `https://info.zb.video.qq.com` 直播业务需要
  * `https://btrace.qq.com` 都需要
3. 使用git子模块功能引入播放SDK代码
  * `git submodule add http://git.code.oa.com/tencentvideo_project/WechatAppPlayer.git`
  * `git submodule update --init --recursive`
  * 后续每次更新代码时，注意使用`git submodule update --remote --recursive`更新播放器代码
4. 目前SDK还在快速迭代中，有疑问尽管与`zombieyang`联系

## 使用详解

### 组件模式 (js + wxml + wxss)
待定

### js模块模式
该模式下播放sdk与以往的腾讯视频统一播放器不一样。

js模块只提供了视频播放的**流程管理**，不会为您在页面上生成可见的UI元素，也不会帮您控制wxml组件。

这种方法的好处在于您可以自己定义跟播放器有关的UI展现，不需要受限于我们的设计。

我们提供了一个详细的demo让您理解如何通过这个js模块实现腾讯视频播放。(demo只在`dev`分支有)

您可以使用开发者工具打开demo目录，在这之前需要在sdk根目录下运行`gulp demo`
#### 使用说明
Txv会帮您创建一次视频播放的生命周期，你需要：

1. 监听播放内容变更(contentchange)时改变播放器所播放的视频地址。
2. 在小程序video元素抛出事件时，调用视频生命周期的对应方法，以便我们做出应对。

由于小程序**目前的请求白名单限制**以及播放器的上报需要，你还需要：

1. 监听Txv对象的report事件，并且把里面带出来的url设置到某个image元素上，为我们上报播放成功率等数据。

#### state取值说明

1. stop 播放前
2. playing 播放中
3. error 播放出现错误，无法继续
4. ended 播放完结
