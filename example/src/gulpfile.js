var gulp = require("gulp")
var comps = require("../../index")
var path = require("path")

gulp.task('tb', function () {
    gulp.src([
        '**/*'
    ])
    .pipe(gulp.dest("../dist"))
    .on("end", function() {
        gulp.src(['../dist/**/*'])
            .pipe(comps({
                src: path.resolve(process.cwd(), "../.depends/components"),
                dist: path.resolve(process.cwd(), "../dist/components"),
                output: path.resolve(process.cwd(), "../dist/custom_modules"),
                resolve: {
                    extensions: [".js", ".json"],
                    modules: [path.resolve(process.cwd(), "../.depends")],
                }
            }))
            .pipe(gulp.dest("../dist"))
    })

});