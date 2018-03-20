var _ = require("lodash")
var path = require("path")
var fs = require("fs-extra")

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
            if( Comps.copy(src, dist, val) ) {
                newUsingComponents[key] = unix(path.relative(pth, dist))
            }
        })
        json["usingComponents"] = newUsingComponents
        return json
    },

    copy: function(src, dist, comps) {
        // 对小程序自定义组件的基本校验
        if( !_.every([".js", ".wxml", ".json"], _.partial(Comps.existsFileSync, src)) ) {
            throw new Error("Component is Irregular: " + comps);
            return;
        }
        try {
            fs.copySync(src, dist)
        }catch(e) {
           console.error(e)
           return ;
        }
        return true
    },

    existsFileSync: function(src, extname) {
        return _.find([extname, "index" + extname], function(pth) {
            pth = path.resolve(src, pth)
            return fs.existsSync(pth)
        })
    }
}

function unix(url) {
    return url.replace(/\\/g, "/");
}


module.exports = function(pth, json, config) {
    return Comps.parse(pth, json, config)
}