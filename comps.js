var _ = require("lodash")
var path = require("path")
var fs = require("fs-extra")
var Deps = require("gulp-msapp-require/deps")
var vinylFile = require('vinyl-file')
var Vinyl = require('vinyl')

var REGEXP_NOT_MODULE = /^\.$|^\.[\\\/]|^\.\.$|^\.\.[\/\\]|^\/|^[A-Z]:[\\\/]/i;

var Comps = {
    parse: function(pth, json, config) {
        if( !json.usingComponents || !_.isObject(json.usingComponents) ) {
            return json
        }
        var dist, srcList = []
        var usingComponents = json.usingComponents
        var newUsingComponents = _.extend({}, usingComponents)
        var dir = path.dirname(pth)

        _.forIn(usingComponents, function(val, key) {
            if( !Comps.isAbsolute(val) ) {
                return
            }
            if( _.isArray(config.src) ) {
                srcList = _.map(config.src, function(item) {
                    return path.resolve(item, val)
                })
            }else {
                srcList.push(path.resolve(config.src, val))
            }
            dist = path.resolve(config.dist, val)
            if( Comps.copy(srcList, dist, val, config) ) {
                newUsingComponents[key] = unix(Comps.getCompsMainFile(dir, dist))
            }
        })
        json["usingComponents"] = newUsingComponents
        return json
    },

    copy: function(srcList, dest, comps, config) {
        // 对小程序自定义组件的基本校验
        var srcDir
        var destDir = path.dirname(dest)
        var filename = path.basename(dest)
        if( !_.find(srcList, function(src) {
                if( _.every([".js", ".wxml", ".json"], _.partial(Comps.existsFileSync, src)) ) {
                    srcDir = path.dirname(src)
                    return true
                }
                return false
            })
        ) {
            throw new Error("Component is Irregular: " + comps);
            return
        }
        // src and dest to be the same
        if( unix(srcDir) === unix(destDir) ) return true
        try {
            fs.copySync(srcDir, destDir)
            this.syncDeps(dest, config)
        }catch(e) {
           return console.error(e)            
        }
        return true
    },

    existsFileSync: function(src, extname) {
        var pth = src + extname
        return fs.existsSync(pth)
    },

    syncDeps: function(pth, config) {
        // 同步自定义组件中引用到的外部模块或者npm模块
        // pth = path.resolve(pth, "index.js")
        if( !/\.js$/.test(pth) ) {
            pth += ".js"
        }
        var dep, contents = ""
        var file = this.getVinylFile({
            path: pth
        })
        if( !file.isNull() ) {
            dep = new Deps({
                entry: file.path,
                output: config.output,
                resolve: config.resolve
            })
            dep.parseDeps()
            contents = dep.transfrom(file.path)
            fs.outputFileSync(pth, contents)
        }
    },

    getVinylFile: function(opts) {
        try {
            return vinylFile.readSync(opts.path, opts)
        }catch(e) {
            return new Vinyl({
                path: opts.path
            })
        }
    },

    isAbsolute: function(pth) {
        return !REGEXP_NOT_MODULE.test(pth)
    },

    getCompsMainFile: function(origin, dist) {
        return path.relative(origin, dist)
    }
}

function unix(url) {
    return url.replace(/\\/g, "/");
}


module.exports = function(pth, json, config) {
    return Comps.parse(pth, json, config)
}