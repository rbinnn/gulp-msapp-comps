var _ = require("lodash")
var path = require("path")
var fs = require("fs-extra")
var Deps = require("gulp-msapp-require/deps")
var vinylFile = require('vinyl-file')
var Vinyl = require('vinyl')

var Comps = {
    parse: function(pth, json, config) {
        if( !json.usingComponents || !_.isObject(json.usingComponents) ) {
            return json
        }
        var src, dist
        var usingComponents = json.usingComponents
        var newUsingComponents = _.extend({}, usingComponents)

        pth = path.resolve(pth, "../")
        _.forIn(usingComponents, function(val, key) {
            src = path.resolve(config.src, val)
            dist = path.resolve(config.dist, val)
            if( Comps.copy(src, dist, val, config) ) {
                newUsingComponents[key] = unix(path.relative(pth, dist))
            }
        })
        json["usingComponents"] = newUsingComponents
        return json
    },

    copy: function(src, dist, comps, config) {
        // 对小程序自定义组件的基本校验
        if( !_.every([".js", ".wxml", ".json"], _.partial(Comps.existsFileSync, src)) ) {
            throw new Error("Component is Irregular: " + comps);
            return;
        }
        try {
            fs.copySync(src, dist)
            this.syncDeps(dist, config)
        }catch(e) {
           console.error(e)
           return 
        }
        return true
    },

    existsFileSync: function(src, extname) {
        return _.find([extname, "index" + extname], function(pth) {
            pth = path.resolve(src, pth)
            return fs.existsSync(pth)
        })
    },

    syncDeps: function(pth, config) {
        // 同步自定义组件中引用到的外部模块或者npm模块
        pth = path.resolve(pth, "index.js")
        var dep, contents = ""
        var file = this.getVinylFile({
            path: pth
        })
        if( !file.isNull() ) {
            dep = new Deps({
                entry: file.path,
                npm: config.npm,
                custom: config.custom
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
    }
}

function unix(url) {
    return url.replace(/\\/g, "/");
}


module.exports = function(pth, json, config) {
    return Comps.parse(pth, json, config)
}