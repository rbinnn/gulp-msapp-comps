# gulp-msapp-comps

检测小程序 page 页面中依赖的自定义组件，自动加载到项目中

## Install

```
npm install gulp-msapp-comps --save-dev
```

## Usage
```
var gulp = require("gulp")
var compsRequire = require("gulp-msapp-comps")

gulp.task("release", function() {
    gulp.src(["src/**/*"])
    .pipe(gulp.dest("./dist"))
    .pipe(compsRequire())
    .pipe(gulp.dest("./dist"))
})
```

小程序page页面的 json 配置只需要这样引用， `tvideo` 是外部的一个自定义组件，插件会将这个外部的自定义组件加载进项目中，并修改 json 配置的路径引用

```
{
    "usingComponents": {
        "t-video": "tvideo"
    }
}
```

## API

### compsRequire(options)

#### options.src

自定义组件存放的源目录

Type: `String`<br>
Default: `path.resolve(process.cwd(), "./components")`

#### options.dist

自定义组件存放的目标目录

Type: `String`<br>
Default: `path.resolve(process.cwd(), "./dist/components/")`

#### options.npm 

Type: `Object`

#### options.npm.src

自定义组件引用的 npm 模块源路径

Type: `String`<br>
Default: `path.resolve(process.cwd(), "./node_modules")`

#### options.npm.dist

自定义组件引用的 npm 模块目标路径

Type: `String`<br>
Default: `path.resolve(process.cwd(), "./dist/msapp_modules")`

#### options.custom

Type: `Object`

#### options.custom.src

自定义组件引用的外部模块源路径

Type: `String`<br>
Default: `process.cwd()`

#### options.custom.dist

自定义组件引用的外部模块目标路径

Type: `String`<br>
Default: `path.resolve(process.cwd(), "./dist/custom_modules")`

