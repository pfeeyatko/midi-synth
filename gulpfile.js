/**
* @desc
* This is a Gulpfile for task running.
* For development tasks run command 'gulp'
*
* Include all required plugins at the top of this file.
*/

const {src, dest, watch, series} = require('gulp');

const babel = require('gulp-babel');
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const uglify = require('gulp-uglify');
const cleanCSS = require('gulp-clean-css');

// define the paths to your project's assets
let config = {
    js: {
        in: 'src/js/*.js',
        out: 'dist/js'
    },

    css: {
        in:  'src/css/*.css',
        out: 'dist/css'
    }
};

// define gulp tasks
function css() {
    return src([
        config.css.in
    ])
    .pipe(cleanCSS({compatibility: 'ie8'}))
    .pipe(concat('style.min.css'))
    .pipe(dest(config.css.out));
}

function js() {
	return src([
        config.js.in
    ])
    .pipe(babel({
        presets: ['@babel/env']
    }))
    .pipe(uglify())
    .pipe(concat('main.min.js'))
    .pipe(dest(config.js.out));
}

function lint() {
    return src(config.js.in)
        .pipe(jshint())
        .pipe(jshint.reporter('default', {verbose: true}));  
}

exports.default = function() {
    watch(config.js.in, {ignoreInitial: false}, series(lint, js));
    watch(config.css.in, {ignoreInitial: false}, series(css));
};