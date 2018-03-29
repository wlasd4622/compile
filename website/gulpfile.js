var gulp = require('gulp'),
	cheerio = require('gulp-cheerio'),
	domSrc = require('gulp-dom-src'),
	concat = require('gulp-concat'),
	cssmin = require('gulp-cssmin'),
	useref = require('gulp-useref'),
	minifyCss = require('gulp-minify-css'),
	runSequence = require('run-sequence'),
	uglify = require('gulp-uglify'),
	clean = require('gulp-clean'),
	jshint = require('gulp-jshint'),
	rev = require('gulp-rev'),
	csslint = require('gulp-csslint'),
	stylish = require('jshint-stylish'),
	revReplace = require('gulp-rev-replace'),
	revCollector = require('gulp-rev-collector'),
	imagemin = require('gulp-imagemin'),
	ossSync = require('gulp-oss-sync'),
	rename = require("gulp-rename"),
	replace = require('gulp-replace'),
	babel = require("gulp-babel"),
	assetpaths = require('gulp-assetpaths'),
	through = require('through2'),
	htmlmin = require('gulp-htmlmin'),
	webp = require('gulp-webp'),
	gulpif = require('gulp-if');

var fs = require('fs'),
	path = require('path'),
	del = require('del'),
	mergeStream = require('merge-stream');

/**
 * 悟空便利
 */

var config = {
	name: 'wukong',
	version: 'v1.0.0',
	oss: `http://image.fcyun.com/assets/wukong`,
	replaceFileArr: [],
	projSrc: `E:/SVN/FC-SVN/03_web20/FCGuanWangRetail/`
};

const ossConfig = {
	connect: {
		accessKeyId: 'nfIeLiRQ0NQ6pvyf',
		accessKeySecret: 'SYZTfDUz7bEEcKJKlWiIcHiispzioG',
		region: 'oss-cn-beijing',
		bucket: 'fcyun'
	},
	setting: {
		dir: `/assets/wukong`,
		noClean: false,
		force: true,
		quiet: true
	},
	controls: {
		headers: {
			'Cache-Control': 'max-age=' + 60 * 60 * 24 * 365 * 10,
			'Access-Control-Allow-Origin': '*'
		}
	}
};

gulp.task('_webp', function() {
	return gulp.src([path.resolve(config.projSrc, './assets/wk-images/**/*.png')])
		.pipe(webp({
			quality: 100
		}))
		.pipe(gulp.dest('./dist/assets/wk-images-webp/'));
});


gulp.task('_minImages', function(done) {
	return gulp.src([path.resolve(config.projSrc, './assets/wk-images/**/*.png')])
		.pipe(imagemin())
		.pipe(gulp.dest('./dist/assets/wk-images'))
});

gulp.task('_oss', function(done) {
	ossConfig.setting.dir = `/assets/wukong`;
	return gulp.src([
			`./dist/assets/wk-images-webp/**/*.*`,
			`./dist/assets/wk-images/**/*.*`
		])
		.pipe(ossSync(ossConfig))
});

gulp.task('_clean', function() {
	return gulp.src('./dist', {
		read: false
	}).pipe(clean());
});

gulp.task('pc', function(done) {
	return runSequence(['_minImages', '_webp'], ['_oss'], done);
})
/*-----------------------*/
gulp.task('_m_webp', function() {
	return gulp.src([path.resolve(config.projSrc, './mobile/assets/wk-images/**/*.png')])
		.pipe(webp({
			quality: 100
		}))
		.pipe(gulp.dest('./dist/mobile/assets/wk-images-webp/'));
});


gulp.task('_m_minImages', function(done) {
	return gulp.src([path.resolve(config.projSrc, './mobile/assets/wk-images/**/*.png')])
		.pipe(imagemin())
		.pipe(gulp.dest('./dist/mobile/assets/wk-images'))
});

gulp.task('_m_oss', function(done) {

	ossConfig.setting.dir = `/assets/wukong/mobile`;

	return gulp.src([
			`./dist/mobile/assets/wk-images-webp/**/*.*`,
			`./dist/mobile/assets/wk-images/**/*.*`
		])
		.pipe(ossSync(ossConfig))
});
gulp.task('mobile', function(done) {
	return runSequence(['_m_minImages', '_m_webp'], ['_m_oss'], done);
})
/*-----------------------*/

gulp.task('default', function(done) {
	return runSequence(['_clean'], ['mobile', 'pc'], done);
})