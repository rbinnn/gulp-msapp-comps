## 介绍
本文件从小游戏开发模板中拷贝而来。
小游戏的开发模式与常规小程序的开发模式有所不同，因为一个游戏最终只有一个入口文件game.js，可以不依赖于小程序的require机制，自己通过webpack打包。
这样做有两个好处：
- 减少了公共库拷贝的麻烦；
- 小程序的ES6转码方式是未知的，自己来打包可控性强一些；

## 开发命令
```
// 安装项目依赖包，如果src项目下面已经安装了依赖包，不需要执行该命令
tnpm instal

// 开始开发
npm start

// 打包压缩
npm run re

// 代码检查
npm run lint
```
## 文件目录介绍
```
./js
├── dist                                   // 小游戏的最终运行包，工具只会打包dist目录下的文件
│   ├── game.json                          // 小游戏配置
│   └── game.js                            // 小游戏入口文件
├── src                                    // 游戏逻辑源码文件
│	├── runtime                            // 游戏逻辑源码文件
│	│   └── api.js                         // 网络请求模块
│   └── index.js                           // 小游戏源码入口文件
├── .babelrc                               // Babel配置文件
├── .editorconfig                          // 编辑器配置文件
├── .eslintrc                              // ESLint配置文件
├── config.js                              // 小游戏全局配置文件
├── project.config.json                    // 小游戏项目配置文件，配置最终上传至客户端的目录，工具端使用
├── readme.md 							   // 项目说明文件
└── webpack.config.js                      // webpack配置文件
```