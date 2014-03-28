// Gulp.js for building production files
// Install npm install gulp -g to execute gulp <task> in console
var gulp = require('gulp'),
gutil = require('gulp-util');

//compiles and concats CoffeesScript to maker-console.js in root directory
var coffee = require('gulp-coffee');
var concatJS = require('gulp-concat');

gulp.task('concat-coffee', function(){
  gulp.src('./lib/**/*.js.coffee')
    .pipe(coffee({bare:true}).on('error', gutil.log))
    .pipe(concatJS('maker-console.js'))
    .pipe(gulp.dest('.'));
});
