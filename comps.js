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
            dist = path.resolve(config.dist, existComps.origin)
            if( Comps.copy(existComps, dist, key, config) ) {
                newUsingComponents[key] = unix(Comps.getCompsMainFile(dir, dist))
            }
        })
        json["usingComponents"] = newUsingComponents
        return json
    },

    copy: function(existComps, dist, comps, config) {
        // 对小程序自定义组件的基本校验
        if( 
            !_.every([".js", ".wxml", ".json"], _.partial(Comps.existsFileSync, existComps.src)) 
        ) {
            throw new Error("Component is Irregular: " + comps + ". Must be contains .js, .json, .wxml files");
            return
        }
        // src and dest to be the same
        if( unix(existComps.src) === unix(dist) ) return true
        try {
            fs.copySync(path.dirname(existComps.src), path.dirname(dist))
            this.syncDeps(existComps.origin, dist, config)
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
                origin: realCompsPath
            }
        }
    },

    existsFileSync: function(src, extname) {
        var pth = src + extname
        return fs.existsSync(pth)
    },

    syncDeps: function(origin, dist, config) {
        // 同步自定义组件中引用到的外部模块或者npm模块
        
        var dep, contents = ""
        var file = this.getVinylFile({
            path: path.resolve(path.dirname(dist), "./vinyl_tmp.js"),
            contents: new Buffer("require('" + origin + "')"),
            base: config.base
        })
        var modules = _.get(config, "resolve.modules") || []
        if( modules.indexOf(config.src) === -1 ) {
            modules.push(config.src)
        }
        if( !file.isNull() ) {
            dep = new Deps({
                entry: file.path,
                file: file,
                base: file.base,
                output: config.dist,
                resolve: _.extend({}, config.resolve, {
                    modules: modules
                }),
                cache: config.cache
            })
            dep.parseDeps()       
        }
    },

    getVinylFile: function(opts) {
        try {
            return vinylFile.readSync(opts.path, opts)
        }catch(e) {
            return new Vinyl(opts)
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