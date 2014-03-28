// Gulp.js for building production files
// Install npm install gulp -g to execute gulp <task> in console
var gulp = require('gulp'),
gutil = require('gulp-util');

//saves production files to ./public/

//CoffeeScript Complier in .public/javascript/
var coffee = require('gulp-coffee');

gulp.task('coffee', function(){
  gulp.src('./lib/**/*.coffee')
    .pipe(coffee({bare:true}).on('error', gutil.log))
    .pipe(gulp.dest('./public/javascript'));
});

//concat production JS files in ./production/not_minified/
var concatJS = require('gulp-concat');

gulp.task('concatjs', function(){
  gulp.src('./public/javascript/**/*.js')
    .pipe(concatJS('all.js'))
    .pipe(gulp.dest('./production/not_minified/'));
});
