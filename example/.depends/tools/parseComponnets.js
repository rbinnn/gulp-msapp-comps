var fs               = require('fs');
var url              = require("url")
var path             = require('path');
var gulp             = require('gulp');
var mkdirs           = require('mkdirp');
var cheerio          = require('cheerio');
var fsHelper         = require("./fsHelper");
var through          = require('through2').obj;
var getRemoteContent = require('remote-content');

module.exports = {
    dealComponentsXml: dealComponentsXml,
    parseWatchXmlAndWxss: parseWatchXmlAndWxss,
    copyFile: copyFile,
    getFileNameByFullPath: getFileNameByFullPath
}

function copyFile(src, dist) {
    var dir = path.dirname(dist);

    if (!fs.existsSync(dir)) {
        mkdirs(dir)
    }
    if (!fs.existsSync(src)) {
        console.log(('文件不存在' + src).red)
        return;
    }
    // console.log(`${src}--->${dist}\n`)
    fs.writeFile(dist, fs.readFileSync(src), function(err){
        if(err){
            console.log(('保存文件失败:'+src+'-->'+dist+'\n').red, err);
            return;
        }
        console.log(('保存文件成功: '+dist).green)
    });

}

function parseWatchXmlAndWxss(event, distPath, projectName){
    gulp.src(event.path)
        .pipe(through(function(file, enc, cb) {
            if(/\.wxml$/i.test(event.path)){
                var content = file.contents.toString();
                var $ = cheerio.load(content,{xmlMode:true});
                var importsTag = $('import');
                for(var i = 0; i < importsTag.length; i++){
                    var src = $(importsTag[i]).attr('src');
                    // 引用的是公共组件的模板
                    if(/(^|\/)js\/components/i.test(src)){
                        var osrc = src;
                        src = src.replace(/^\//,'');
                        // console.log(51, '../' + src, '../../release/' + projectName + '/' + src)
                        copyFile('../' + src, '../../release/' + projectName + '/' + src);
                        content = content.replace(osrc, '../../' + src);
                    }
                }

                $ = cheerio.load(content,{xmlMode:true});
                var includesTag = $('include');
                for(var i = 0; i < includesTag.length; i++){
                    var src = $(includesTag[i]).attr('src');
                    // 引用的是公共组件的模板
                    if(/(^|\/)js\/components/i.test(src)){
                        var osrc = src;
                        src = src.replace(/^\//,'');
                        // console.log(65, '../' + src, '../../release/' + projectName + '/' + src)
                        copyFile('../' + src, '../../release/' + projectName + '/' + src);
                        content = content.replace(osrc, '../../' + src);
                    }
                }
                file.contents = new Buffer(content, enc);
            }else if(/\.wxss$/i.test(event.path)){
                var content = file.contents.toString();
                var ret = content.match(/@import(.*?);/ig);
                if(ret){
                    for(var i = 0; i < ret.length; i++){
                        // 引用的是公共组件的模板
                        var src = ret[i].match(/"(.*?)";/i);
                        if(src && /(^|\/)js\/components/i.test(src[1])){
                            var o = src[1];
                            var s = src[1].replace(/^\//,'');
                            // console.log(81, '../' + s, '../../release/' + projectName + '/' + s)
                            copyFile('../' + s, '../../release/' + projectName + '/' + s);
                            content = content.replace(o, '../../' + s);
                        }else if( src && isRemotePath(src[1]) && /\.css$/.test(src[1]) ) {
                            // 外链的css文件
                            var s = src[1];
                            var filenamePieces = getFileNameByFullPath(s).split(".")
                            var filename = filenamePieces.slice(0, filenamePieces.length - 1).join(".");
                            var releasePath = fsHelper.unix(path.resolve(process.cwd(), "../../release/" + projectName + "/css/" + filename + ".wxss"));
                            var relativePath = fsHelper.unix(path.relative(distPath, releasePath));
                            // 解决循环里面异步问题，闭包解决咯
                            ;(function(releasePath) {
                                getRemoteContent(url.resolve("http:", s), function(err, cssContent) {
                                    if( err ) {
                                        console.log(err)
                                    }
                                    fsHelper.writeFile(releasePath, cssContent);
                                });
                            })(releasePath);
                            content = content.replace(s, relativePath)
                        }
                    }
                }
                
                file.contents = new Buffer(content, enc);
            }
            cb(null, file);
        }))
        .pipe(gulp.dest(distPath));
}

function dealComponentsXml(projectName, requireFilePath, sourcePath){
    // 如果JS 依赖了组件，那么就同步相对应的wxml,wxss
    if(/^js\/components/i.test(requireFilePath)){
        var parentPath = getParentPathByFilePath(requireFilePath);
        gulp.src('../' + parentPath + '/**')
            .pipe(gulp.dest('../../release/' + projectName + '/' + parentPath));

        var requireFileName = getFileNameByFullFileName(getFileNameByFullPath(requireFilePath));

        var sourcePathRet = getParentPathByFilePath(sourcePath);
        var filename = getFileNameByFullFileName(getFileNameByFullPath(sourcePath));

        insertImportFileByType(sourcePathRet, filename, parentPath, requireFileName, '.wxml', sourcePathRet);
        insertImportFileByType(sourcePathRet, filename, parentPath, requireFileName, '.wxss', sourcePathRet);
    }
}

function insertImportFileByType(sourcePathRet, filename, parentPath, requireFileName, type, sourcePathRet){
    // 如果组件含有wxml,引用组件页也有wxml
    var sourceWxmlPath = sourcePathRet + '/' + filename + type;
    var requireWxmlPath = '../' + parentPath + '/' + requireFileName + type;
    var targetWxmlPath = parentPath + '/' + requireFileName + type;
    insertImportFile(sourceWxmlPath, requireWxmlPath, targetWxmlPath, sourcePathRet, type);
}

function insertImportFile(sourceWxmlPath, requireWxmlPath, targetWxmlPath, sourcePathRet, type){
    if(fs.existsSync(sourceWxmlPath) && fs.existsSync(requireWxmlPath)){
        gulp.src(sourceWxmlPath)
            .pipe(through(function(file, enc, cb) {
                var content = file.contents.toString();
                
                if(type === '.wxml'){
                    var $ = cheerio.load(content);
                    var importsTag = $('import');
                    var includesTag = $('include');
                    var flag = false;
                    for(var i = 0; i < importsTag.length; i++){
                        // 页面已经有了
                        if(targetWxmlPath === $(importsTag[i]).attr('src')){
                            flag = true;
                        }
                    }
                    for(var i = 0; i < includesTag.length; i++){
                        // 页面已经有了
                        if(targetWxmlPath === $(includesTag[i]).attr('src')){
                            flag = true;
                        }
                    }
                }else{
                    var reg = new RegExp(targetWxmlPath, 'i');
                    if(reg.test(content)){
                        flag = true;
                    }
                }
                
               
                if(!flag){
                    if(type === '.wxml'){
                        if(targetWxmlPath.indexOf('js/components')!=-1){
                            var append = '<include src="/' + targetWxmlPath.replace(/^\//,'') +'" />';
                            if(content.indexOf(append) == -1){
                                content += '\n'+append;
                            }
                        }else{
                            content = '<import src="' + targetWxmlPath + '"/>\n' +content;
                        }
                    }else{
                        content = '@import "' + targetWxmlPath + '";\n' +content;
                    }
                }

                file.contents = new Buffer(content, enc);
                cb(null, file);
            }))
            .pipe(gulp.dest(sourcePathRet))
    }
}

function getParentPathByFilePath(path){
    var ret = path.split('/');
    ret.pop();
    return ret.join('/');
}
function getFileNameByFullPath(path){
    var ret = path.split('/');
    return ret.pop();
}
function getFileNameByFullFileName(filename){
    var ret = filename.split('.');
    ret.pop();
    return ret.join('.');
}
// 判断是否是绝对路径
function isRemotePath(path) {
	if( /^https?|\/\//.test(path) ){
		return true;
	}
	return false
}
