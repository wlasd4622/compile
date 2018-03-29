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
 * fcwangpu
 */
//http://image.fcyun.com/sitev2/images/banner1.png
var config = {
	name: 'fcwangpu',
	version: 'v1.0.0',
	oss: `http://image.fcyun.com/sitev2`,
	projSrc: `E:/SVN/fcsvn/03_web20/FCGuanWangV2/fcyun-web/src/main/webapp/resources/`
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

//pc 优化图片  上传oss STAER
gulp.task('_webp_pc', function() {
	return gulp.src([path.resolve(config.projSrc, './v2/assets/images/**/*.png'), path.resolve(config.projSrc, './v2/assets/images/**/*.jpg')])
		.pipe(webp({
			quality: 100
		}))
		.pipe(gulp.dest('./dist/images-webp/'));
});

gulp.task('_oss_pc', function(done) {
	ossConfig.setting.dir = `/sitev2/images`;
	return gulp.src([
			`./dist/images-webp/**/*.*`,
			`${path.resolve(config.projSrc, './v2/assets/images/**/*.*')}`
		])
		.pipe(ossSync(ossConfig))
});
gulp.task('_pc', function(done) {
	return runSequence(['_webp_pc'], ['_oss_pc'], done);
});
//pc 优化图片  上传oss END
//
//mobile 优化图片  上传oss STAER
gulp.task('_webp_mobile', function() {
	return gulp.src([path.resolve(config.projSrc, './v2-mobile/assets/imagesmobile/**/*.png'), path.resolve(config.projSrc, './v2-mobile/assets/imagesmobile/**/*.jpg')])
		.pipe(webp({
			quality: 100
		}))
		.pipe(gulp.dest('./dist/images-mobile-webp/'));
});

gulp.task('_oss_mobile', function(done) {
	ossConfig.setting.dir = `/sitev2/imagesmobile`;
	return gulp.src([
			`./dist/images-mobile-webp/**/*.*`,
			`${path.resolve(config.projSrc, './v2-mobile/assets/imagesmobile/**/*.*')}`
		])
		.pipe(ossSync(ossConfig))
});

gulp.task('_mobile', function(done) {
	return runSequence(['_webp_mobile'], ['_oss_mobile'], done);
});

//mobile 优化图片  上传oss END


gulp.task('_clean', function() {
	return gulp.src('./dist', {
		read: false
	}).pipe(clean());
});

gulp.task('default', function(done) {
	return runSequence(['_clean'], ['_pc', '_mobile'], done);
})