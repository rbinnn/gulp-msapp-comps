/**
 * @author: zimyuan;
 * @last-edit-date: 2017-02-14
 */

var webpack = require('webpack');
var path    = require('path');

module.exports = {
    entry: {
        "game": "./src/index"
    },
    output: {
        path           : __dirname + '/dist',
        publicPath     : '/',
        filename       : './[name].js',
        chunkFilename  : './[chunkhash:8]_chunk.js',
    },
    resolve: {
        /**
         * 如果webpack的版本比较低就用root属性
         * 版本大于2.0之后，用下面的modules属性
         */
        // root: path.resolve('../js'),
        // 模块的别名
        alias: {
            zim : path.resolve('../zim_library')
        },

        modules: [path.resolve(__dirname, "../js"), "node_modules"]
    },
    module: {
        loaders:[
            {
                test    : /\.js[x]?$/,
                include : path.resolve(__dirname, 'src'),
                exclude : /node_modules/,
                loader  : 'babel-loader',
                query   : {
                    presets: ["es2015"]
                }
            }
        ]
    }
};