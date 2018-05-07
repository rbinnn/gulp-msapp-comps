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
        "t-video": "tvideo/index"
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

##### options.output
自定义组件引用的公共库存放的目标目录

Type: `String`<br>

##### options.resolve
自定义组件内部可以通过 resolve 配置依赖

Type: `Object`

| Field                    | Default                     | Description                                                                        |
| ------------------------ | --------------------------- | ---------------------------------------------------------------------------------- |
| alias                    | []                          | A list of module alias configurations or an object which maps key to value |
| aliasFields              | []                          | A list of alias fields in description files |
| cacheWithContext         | true                        | If unsafe cache is enabled, includes `request.context` in the cache key  |
| descriptionFiles         | ["package.json"]            | A list of description files to read from |
| enforceExtension         | false                       | Enforce that a extension from extensions must be used |
| enforceModuleExtension   | false                       | Enforce that a extension from moduleExtensions must be used |
| extensions               | [".js", ".json", ".node"]   | A list of extensions which should be tried for files |
| mainFields               | ["main"]                    | A list of main fields in description files |
| mainFiles                | ["index"]                   | A list of main files in directories |
| modules                  | ["node_modules"]            | A list of directories to resolve modules from, can be absolute path or folder name |
| unsafeCache              | false                       | Use this cache object to unsafely cache the successful requests |
| plugins                  | []                          | A list of additional resolve plugins which should be applied |
| symlinks                 | true                        | Whether to resolve symlinks to their symlinked location |
| cachePredicate           | function() { return true }; | A function which decides whether a request should be cached or not. An object is passed to the function with `path` and `request` properties. |
| moduleExtensions         | []                          | A list of module extensions which should be tried for modules |
| resolveToContext         | false                       | Resolve to a context instead of a file |
| fileSystem               |                             | The file system which should be used |
| resolver                 | undefined                   | A prepared Resolver to which the plugins are attached |

