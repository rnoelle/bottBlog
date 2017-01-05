const gulp = require('gulp');
const concat = require('gulp-concat');
const babel = require('gulp-babel');
const sass = require('gulp-sass');
const plumber = require('gulp-plumber');

gulp.task('js', () => {
  gulp.src(['./js/app.js', './js/**/*.js'])
  .pipe(plumber())
  .pipe(babel({
    presets: ['es2015']
  }))
  .pipe(concat('bundle.js'))
  .pipe(gulp.dest('./dist'));
});

gulp.task('css', () => {
  gulp.src('./styles/**/*.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(concat('bundle.css'))
  .pipe(gulp.dest('./dist'));
});

gulp.task('default', ['css', 'js']);
gulp.watch('./js/**/*.js', ['js']);
gulp.watch('./styles/**/*.scss', ['css']);
