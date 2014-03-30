// Gulp.js for building production files
// Install npm install gulp -g to execute gulp <task> in console
var gulp = require('gulp'),
gutil = require('gulp-util'),
rename = require('gulp-rename');

//compiles and concats CoffeesScript to maker-console.js and in root directory
// Also adds minified version maker-console.min.js
var coffee = require('gulp-coffee'),
concatJS = require('gulp-concat'),
uglify = require('gulp-uglify'),
file_order = ['./lib/maker-console.coffee', './lib/util.coffee', './lib/models/*.coffee', './lib/views/*.coffee', './lib/console/.*coffee'];

gulp.task('build', function(){
  gulp.src(file_order)
    .pipe(coffee({bare:true}).on('error', gutil.log))
    .pipe(concatJS('maker-console.js'))
    .pipe(gulp.dest('.'))
    .pipe(uglify())
    .pipe(rename('maker-console.min.js'))
    .pipe(gulp.dest('.'));
});
