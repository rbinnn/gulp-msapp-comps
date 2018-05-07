/**
 * 所有项目的gulpfile文件都是从此处拷贝，遇到升级等，请从此拷贝 gulp tbgulpfile
 * @last-edit-date: 2018-05-03
 */
let fs      = require('fs');
let path    = require('path');
let gulp    = require('gulp');
let colors  = require('colors');
let dest    = require('gulp-dest');
let babel   = require('gulp-babel');
let rename  = require('gulp-rename');
let uglify  = require('gulp-uglify');
let webpack = require('gulp-webpack');
let through = require('through2').obj;
let gutil   = require('webpack-stream');

let fsHelper        = require('../../.depends/tools/fshelper');
let drequire        = require('../../.depends/tools/gulp-drequire');
let ParseComponnets = require('../../.depends/tools/ParseComponnets');
let projectName     = ParseComponnets.getFileNameByFullPath(fsHelper.unix(__dirname));

let PROJECT_PATH = path.resolve();
let basePath     = '../../.depends/';
let STATIC_PATH  = './' + projectName + '/';
let RELEASE_PATH = '../../release/' + projectName + '/';
let babel_option = { presets: ['es2015'] }

let argv      = process.argv;  // 0:node; 1:gulp.js; 2:task; 3:......
let taskName  = argv[2];
let taskParam = {};            // [].slice.call(argv,3);

for (let i = 0; i < argv.length; i++) {
    if (argv[i].indexOf('-') === 0) {
        if (argv[i + 1] && argv[i + 1].indexOf('-') === 0) {
            taskParam[argv[i]] = '';
        } else {
            taskParam[argv[i]] = argv[i + 1] || '';
            i++;
        }
    }
}

/* ---------------------------------new page------------------------------- */
gulp.task('new', function () {
    let pageName = taskParam['-n'];
    if (!pageName) {
        console.log(('错误，需要页面名称, gulp new -n [pageName]').red);
        return;
    }
    let path = 'pages/' + pageName;
    if (fs.existsSync(path)) {
        console.log(('错误，页面已经存在: pages/' + pageName).red);
        return;
    }
    gulp.src('../../.depends/project_tpl/pages/index/**')
        .pipe(rename(function (p) {
            if (p.basename) {
                p.basename = pageName;
            }
        }))
        .pipe(gulp.dest(path))
        .pipe(gulp.dest(RELEASE_PATH + path));
    writeAppJSON(pageName);
});

/* ----------------------new page------------------------------------------ */
let jeditor = require('gulp-json-editor');

function writeAppJSON(pageName, secPage) {
    gulp.src("./app.json")
        .pipe(jeditor(function (json) {
            let path = "pages/" + pageName + "/" + (secPage || pageName);
            if (json.pages.indexOf(path) === -1) {
                json.pages.push(path);
            }
            return json;
        }).on('error', function (e) { console.log('json editor error', e.toString().red) }))
        .pipe(gulp.dest("./"))
        .pipe(gulp.dest(RELEASE_PATH));
}

/* -----------------------同步文件----------------------------------------- */

gulp.task('tb', function () {
    gulp.src([
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.wxml',
        '**/*.wxss',
        '**/*.json',
    ]).pipe(gulp.dest(RELEASE_PATH))

    gulp.src(['./**/*.js', '!gulpfile.js', '!readme.md'])
        .pipe(drequire({
            src: basePath,
            dist: RELEASE_PATH,
            projectName: projectName
        }))
        .pipe(babel(babel_option).on('error', function (e) { console.log('babel error', e.toString().red); }))
        .pipe(uglify().on('error', function (e) { console.log('uglify error ', e) }))
        .pipe(gulp.dest(RELEASE_PATH))
    console.log('成功同步项目所有文件'.green);
});


gulp.task('tbgulpfile', function () {
    gulp.src(basePath + 'project_tpl/gulpfile.js')
        .pipe(gulp.dest('./'));
    console.log('成功同步gulpfile.js'.green);
});

/* ---------------------------------------------------------------- */
let cheerio = require('cheerio');
// 监听静态文件
gulp.task('watch-static', function () {
    let watchPath = [
        '**/*.png',
        '**/*.jpg',
        '**/*.jpeg',
        '**/*.wxml',
        '**/*.wxss',
        '**/*.json',
    ];
    let opt = { cwd: './', mode: 'watch' };
    // 新增文件必须要加这个才能被watch到。
    gulp.watch(watchPath, opt, function (event) {
        let distPath = fsHelper.unix(
            path.resolve(
                process.cwd(),
                RELEASE_PATH,
                path.relative(process.cwd(), path.dirname(event.path))
            )
        );
        ParseComponnets.parseWatchXmlAndWxss(event, distPath, projectName);
        console.log(("保存文件成功: " + event.path).green);
    });
});

function copyFile(src, dist) {
    let dir = path.dirname(dist);
    if (!fs.existsSync(dir)) {
        mkdirs(dir)
    }
    if (!fs.existsSync(src)) {
        console.log(('文件不存在' + src).red)
        return;
    }
    fs.writeFileSync(dist, fs.readFileSync(src));
}
// 监听除了JS文件，处理引用库的问题。监听即合并一次。
gulp.task('watch-js', function () {
    let watchPath = ['**/*.js', "**/**/*.js"];
    let pathReg = new RegExp('src' + path.sep + projectName + path.sep, '')
    // todo:启动的时候将文件检查一遍，没打包的重新打包
    gulp.watch(watchPath, { cwd: './' }, function (event) {
        if (!/.js$/.test(event.path)) {
            // console.log(("Not JS, Maybe Dir:" , event.path).red);
            return;
        }
        if (/gulpfile.js$/.test(event.path)) {
            // console.log("NO COPY gulpfile.js || webpack.config.js");
            return;
        }
        let destPath = path.dirname(event.path.replace(pathReg, 'release' + path.sep + projectName + path.sep));
        gulp.src(event.path)
            .pipe(drequire({
                src: STATIC_PATH,
                dist: RELEASE_PATH,
                projectName: projectName
            }))
            .pipe(babel(babel_option).on('error', function (e) { console.log('babel error', e.toString().red); }))
            .pipe(uglify().on('error', function (e) { console.log('uglify error ', e) }))
            .pipe(gulp.dest(destPath))
        console.log(`同步JS文件: ${event.path}\n到        : ${destPath}.js`.green);
    });
});

gulp.task('watch', ['watch-static', 'watch-js']);
gulp.task('default', ['watch-static', 'watch-js']);

/* --------------------------PB task---------------------------------------*/
let Config = require('./config');
let gulpprotobuf = require('gulp-protobufjs');
let gulpJSONToAPI = require('gulp-pb-to-jsapi');
function getModuleName() {
    let ret = Config.pb_file_path.split('/');
    ret.pop();
    return ret.pop()
}
let ModuleName = getModuleName();

gulp.task('pb', ['mock'], function () {
    return gulp.src(Config.pb_file_base_path + Config.pb_file_path)
        .pipe(gulpprotobuf({
            ext: '.js',
            target: "json",
            path: Config.pb_file_base_path
        }
        ))
        .pipe(gulpJSONToAPI({
            type: 'api',
            FETCH_URL: Config.fetch_base_url,
            module: ModuleName
        }))
        .pipe(rename(function (p) {
            p.basename = 'API'
        }))
        .pipe(gulp.dest('pages/'));
});

gulp.task('mock', function () {
    return gulp.src(Config.pb_file_base_path + Config.pb_file_path)
        .pipe(gulpprotobuf({
            ext: '.js',
            target: "json",
            path: Config.pb_file_base_path
        }
        ))
        .pipe(gulpJSONToAPI({
            type: 'mock',
            module: ModuleName,
            needXss: false,
            needlongText: true
        }))
        .pipe(rename(function (p) {
            p.basename = 'mock'
        }))
        .pipe(gulp.dest('pages/'));
});