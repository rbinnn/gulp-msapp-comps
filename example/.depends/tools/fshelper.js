var fs   = require('fs');
var path = require('path');


module.exports = {
    unix           : unix,
//  parsePath      : parsePath,
    getPathDep     : getPathDep,
    getRelativePath: getRelativePath,
    getAbsolutePath: getAbsolutePath,
    writeFile      : writeFile,
    mkdirs         : mkdirs
};

// 解决windows系统下路径的反斜杠问题
function unix(url) {
    return url.replace(/\\/g, "/");
}

// 获得当前文件相对于项目目录的深度
function getPathDep(path, static_path) {

    var res = path.split(static_path);

    if (res.length > 1) {
        var res = res[1].split('/');
        return res.length - 1;
    }
    return 0;
}

// 根据文件相对于项目目录的深度来获取当前文件的相对路径
function getRelativePath(pathDep, filePath) {
    var pathStr = ''
    if (pathDep === 0) {
        pathStr = './'
    } else {
        for (var i = 0; i < pathDep; i++) {
            pathStr += '../';
        }
    }
    return pathStr + filePath;
}

// 获取文件的绝对路径
function getAbsolutePath(pathDep, sourcePath, filePath) {
    var relativePath = getRelativePath(pathDep, filePath);    
    return unix(path.resolve(path.dirname(sourcePath), relativePath));
}

// 写文件
function writeFile(filePath, fileStr) {
    var dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
        mkdirs(dir)
    }
    fs.writeFileSync(filePath, fileStr, 'utf8');
}

// 递归创建文件目录
function mkdirs(dir) {
    if (!fs.existsSync(dir)) {
        mkdirs(path.dirname(dir));
        fs.mkdirSync(dir);
    }
}