let fs              = require("fs");
let url             = require('url');
let path            = require("path");
let through         = require('through2');
let fshelper        = require('./fshelper');
let ParseComponnets = require('./parseComponnets');
let PLUGIN_NAME     = "gulp-drequire";
// gulp插件，用来解决js中的依赖同步
function drequire(options) {
    let static_path  = options.src;
    let release_path = options.dist;
    let projectName  = options.projectName;
    let stream       = through.obj(function(file, enc, callback){
        let fileStr = "";
        if (file.isNull()) {
            // return empty file
            callback();
            return;
        }
        if (file.isBuffer()) {
            fileStr = file.contents.toString();
        }
        if (file.isStream()) {
            this.emit('error', new PluginError(PLUGIN_NAME, 'Streams not supported!'));
            return callback();
        }
        fileStr = dealRequireFile(fileStr, file.path, static_path, release_path, projectName);

        file.contents = new Buffer(fileStr, enc);
        callback(null, file);
    });
    return stream;
}

module.exports = drequire;

/*
1、公共模块不要引用业务JS 
2、业务依赖的公共模块JS请直接写全路径 require('js/common/xxx.js') 
3、公共模块间的相互引用，用相对路径 require('../common/xxx.js')

http://tapd.oa.com/wechat11/markdown_wikis/#1010079491006175219
*/ 
function dealRequireFile(fileStr, sourcePath, static_path, release_path, projectName) {
    sourcePath = fshelper.unix(sourcePath);
    // 处理require的文件
    fileStr = fileStr.replace(/require\([^\)]*\)/g, function(filePath) {
        let prePath        = filePath;
        let absFilePath    = "";
        let originFilePath = "";
        let _path          = "";
        let resPath        = "";

        
        // 字符串处理，得到最后的路径
        filePath = filePath.replace(/^require\(/, "").replace(/\)$/, "");
        // require 是变量，直接跳出
        if(!/^\"|\'/.test(filePath)){
            return fileStr;
        }
        // 去掉引号
        filePath = filePath.replace(/^(\"|\')/, "").replace(/(\"|\')$/, "");
        if (!/\.js$/.test(filePath)) { // 文件名称不加".js"，程序自动补上
            filePath += ".js";
        }
        
        // 当前文件不是公共模块，而且require的不是公共模块, 不处理。
        if(!/^js/.test(sourcePath) && !/^js/.test(filePath)){
            return 'require("' + prePath + '")';
        }

        // 解决组件依赖
        ParseComponnets.dealComponentsXml(projectName, filePath, sourcePath);
        let parsrFilePath = parsePath(filePath, release_path);
        
        // 当前文件是公共模块，require了其他公共模块
        if( /^js\//.test(sourcePath) ) {
            absFilePath = path.resolve( release_path, url.resolve(sourcePath, filePath));
            originFilePath = path.resolve(static_path, "./" ,url.resolve(sourcePath, filePath))
            saveRequireFile(parsrFilePath, absFilePath, originFilePath, static_path, release_path, projectName);
            return prePath;
        }
        
        absFilePath = path.resolve( release_path, filePath);
        originFilePath = path.resolve( static_path, "./", filePath);

        // 保存require的文件
        saveRequireFile(parsrFilePath, absFilePath, originFilePath, static_path, release_path, projectName);
        
        let pathDep = fshelper.getPathDep(sourcePath, static_path);
        let relativePath = fshelper.getRelativePath(pathDep, filePath);

        // .depends/js/下的文件公共组件自动拷贝
        if (/^js\//.test(filePath)) {
            // ParseComponnets.copyFile(static_path + filePath, release_path + filePath);
            return 'require("/' + filePath + '")';
        }

        // 替换文件中的require目录
        return "require(\"" + relativePath + "\")";
    });
    return fileStr;
}

function saveRequireFile(filePath, destPath, originFilePath, static_path, release_path, projectName) {
    destPath = fshelper.unix(destPath);
    let dPath = destPath.replace(static_path, release_path);
    // console.log(Array.prototype.slice.call(arguments).join('\n'))
    try {
        let fileStr = fs.readFileSync(originFilePath, 'utf8');
        // console.log(`${dPath}--->${originFilePath}\n`.red)
        fshelper.writeFile(dPath, fileStr);
        dealRequireFile(fileStr, filePath, static_path, release_path, projectName);
    } catch (e) {
        console.log(e.message.red);
    }
}

/*
* 将公共模块内部的依赖转换为公共模块目录的绝对路径
* eg： js/common/autologin.js 里面 require('./request.js')
* 那么 ./request.js 会转换成 js/common/request.js
*/ 
function parsePath(filePath, sourcePath) {
    if (/^js\//.test(sourcePath)) {
        return url.resolve(sourcePath, filePath);
    }else{
        return filePath;
    }
}