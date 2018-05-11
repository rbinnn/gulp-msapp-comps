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
        var existComps

        _.forIn(usingComponents, function(val, key) {
            if( !Comps.isAbsolute(val) || /^plugin:\/\//.test(val) ) {
                return
            }
            existComps = Comps.findCompsDirname(key, val, config.src)
            if( !existComps ) {
                throw new Error("Can't find components : " + key)
            }
            dist = path.resolve(config.dist, existComps.path)
            if( Comps.copy(existComps.src, dist, key, config) ) {
                newUsingComponents[key] = unix(Comps.getCompsMainFile(dir, dist))
            }
        })
        json["usingComponents"] = newUsingComponents
        return json
    },

    copy: function(src, dist, comps, config) {
        // 对小程序自定义组件的基本校验
        if( 
            !_.every([".js", ".wxml", ".json"], _.partial(Comps.existsFileSync, src)) 
        ) {
            throw new Error("Component is Irregular: " + comps + ". Must be contains .js, .json, .wxml files");
            return
        }
        // src and dest to be the same
        if( unix(src) === unix(dist) ) return true
        try {
            fs.copySync(path.dirname(src), path.dirname(dist))
            this.syncDeps(dist, config)
        }catch(e) {
           return console.error(e)            
        }
        return true
    },

    findCompsDirname: function(compsName, compsPath, src) {
        var checks = [
            compsPath,
            compsPath + "/index",
            compsPath + "/" + compsName
        ]
        var compsSrc
        var realCompsPath
        if( !_.isArray(src) ) {
            src = [src]
        }

        for(var i = 0, len = src.length; i < len; i++ ) {
            var exist = _.find(checks, function(pth) {
                pth = path.resolve(src[i], pth)
                return Comps.existsFileSync(pth, ".js")
            })
            if( exist ) {
                compsSrc = path.resolve(src[i], exist)
                realCompsPath = exist
                break
            }
        }
        if( compsSrc ) {
            return {
                src: compsSrc,
                path: realCompsPath
            }
        }
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
                resolve: config.resolve,
                cache: config.cache
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