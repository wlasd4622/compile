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
	autoprefixer = require('gulp-autoprefixer'),
	gulpif = require('gulp-if');

var fs = require('fs'),
	path = require('path'),
	del = require('del'),
	mergeStream = require('merge-stream');

var config = {
	name: 'aiOneteamWorkshop',
	version: 'v1.0.0',
	oss: `http://image.fcyun.com/aiOneteamWorkshop/`,
	replaceFileArr: [],
	projSrc: `F:/workspace/xteams/ai-oneteam-workshop/src/main/resources`
};

config.ossDoMain = `${config.oss}${config.version}/`;

const ossConfig = {
	connect: {
		accessKeyId: 'nfIeLiRQ0NQ6pvyf',
		accessKeySecret: 'SYZTfDUz7bEEcKJKlWiIcHiispzioG',
		region: 'oss-cn-beijing',
		bucket: 'fcyun'
	},
	setting: {
		dir: `/aiOneteamWorkshop/${config.version}`,
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
//-----------------------------------------------------------------------------------------------------------
gulp.task('main', function (done) {
	return runSequence(['_clean'], ['_login'], ['_templates'], ['_rev_assets'], ['_rev_css', '_rev_js'], ['_production'], ['_html'], ['_replaceAllFile'], ['_oss', '_htmlmin', '_jsmin'], done);
});


gulp.task('_static', function (done) {
	return gulp.src([path.resolve(config.projSrc, './static/**/*.*')])
		.pipe(gulp.dest('./dist/static/'));
});


gulp.task('_rev_assets', done => {
	return gulp.src([path.resolve(config.projSrc, './static/**/*.png'), path.resolve(config.projSrc, './static/**/*.gif'), path.resolve(config.projSrc, './static/**/*.jpg'), path.resolve(config.projSrc, './static/**/*.svg')])
		.pipe(rev())
		.pipe(gulp.dest('./dist/static'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('./dist/rev/img'))
})

gulp.task('_rev_css', done => {
	return gulp.src(['./dist/rev/**/*.json', path.resolve(config.projSrc, './static/**/*.css')])
		.pipe(revCollector())
		.pipe(rev())
		.pipe(gulp.dest('./dist/static/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('./dist/rev/css/'));
})

gulp.task('_rev_js', done => {
	return gulp.src([path.resolve(config.projSrc, './static/**/*.js')])
		.pipe(rev())
		.pipe(gulp.dest('./dist/static/'))
		.pipe(rev.manifest())
		.pipe(gulp.dest('./dist/rev/js/'));
});

gulp.task('_production', done => {
	return gulp.src('./dist/static/js/fc-env-*.js')
		.pipe(replace(/.+/, function (str) {
			return 'var ENV="production";';
		}))
		.pipe(gulp.dest('./dist/static/js/'))
});

gulp.task('_login', function (done) {
	return gulp.src([path.resolve(config.projSrc, './templates/login.html')])
		.pipe(replace('</html>', function (m) {
			return `<script>console.log('发版时间：${new Date().Format("yyyy-MM-dd-hh:mm")}')</script>${m}`;
		}))
		.pipe(gulp.dest(path.resolve(config.projSrc, './templates/')));
});

gulp.task('_templates', function (done) {
	return gulp.src([path.resolve(config.projSrc, './templates/**/*.*')])
		.pipe(gulp.dest('./dist/templates/'));
});


gulp.task('_js', done => {
	return gulp.src([path.resolve(config.projSrc, './static/**/*.js')])
		.pipe(gulp.dest('./dist/static/'))
});


gulp.task('_html', ['_js'], function (done) {
	return gulp.src(['./dist/rev/**/*.json', './dist/templates/**/*.html'])
		.pipe(revCollector())
		.pipe(useref())
		.pipe(gulpif('*.js', uglify().on('error', function (err) {
			console.log(err);
			this.emit('end');
		})))
		.pipe(gulpif('*.css', autoprefixer({
			browsers: ['last 2 versions', 'Android >= 4.0'],
			cascade: true,
			remove: true
		})))
		.pipe(gulpif('*.css', minifyCss()))
		//替换css 里面的路径
		.pipe(gulpif('*.css', replace('/static', '/fcZljk/' + config.version)))
		//替换html 里面的路径
		.pipe(gulpif('*.html', replace(/.*?static.+/g, function (str) {
			if (str.indexOf('<img') > -1 || str.indexOf('rel="icon"') > -1 || str.indexOf('<meta') > -1 || str.indexOf('rel="apple-touch-icon-precomposed"') > -1) {
				if (str.indexOf('src=') > -1) {
					var src = str.match(/src\=\"(.*?)\"/)[1];
					str = str.replace(src, src.replace(/^.*?static\//, config.ossDoMain));
				} else if (str.indexOf('href=') > -1) {
					var href = str.match(/href\=\"(.*?)\"/)[1];
					str = str.replace(href, href.replace(/^.*?static\//, config.ossDoMain));
				} else if (str.indexOf('content=') > -1) {
					var content = str.match(/content\=\"(.*?)\"/)[1];
					str = str.replace(content, content.replace(/^.*?static\//, config.ossDoMain));
				}
			}
			return str;
		})))

		.pipe(rev())
		.pipe(revReplace({
			modifyReved: function (filename) {
				if (filename.indexOf('.html') > -1) {
					var src = `./dist/templates/${filename}`;
					if (config.replaceFileArr.indexOf(src) == -1) {
						config.replaceFileArr.push(src);
					}
				} else if (filename.indexOf('.css') > -1 || filename.indexOf('.js') > -1) {
					filename = config.oss + filename.replace(/^.*?build\//, '')
				}
				return filename;
			}
		}))
		.pipe(gulp.dest('./dist/templates/'))
});

gulp.task('_htmlmin', function (done) {
	return gulp.src(path.resolve(config.projSrc, './templates/**/*.html'))
		.pipe(htmlmin({
			removeComments: true, //清除HTML注释
			collapseWhitespace: true, //压缩HTML
			collapseBooleanAttributes: true, //省略布尔属性的值 <input checked="true"/> ==> <input />
			removeEmptyAttributes: true, //删除所有空格作属性值 <input id="" /> ==> <input />
			removeScriptTypeAttributes: true, //删除<script>的type="text/javascript"
			removeStyleLinkTypeAttributes: true, //删除<style>和<link>的type="text/css"
			minifyJS: true, //压缩页面JS
			minifyCSS: true //压缩页面CSS
		}))
		.pipe(gulp.dest(path.resolve(config.projSrc, './templates/')))
});

/**
 * 压缩业务逻辑js
 */
gulp.task('_jsmin', function (done) {
	return gulp.src('./dist/static/modules/**/*.js')
		/*.pipe(babel({
			presets: ['es2015']
		}))*/
		.pipe(uglify().on('error', function (err) {
			console.log(err);
			this.emit('end');
		}))
		.pipe(gulp.dest(path.resolve(config.projSrc, './static/modules/')))
});

gulp.task('_replaceAllFile', function (done) {
	var arr = [];

	config.replaceFileArr.forEach(file => {
		var projFileSrc = path.resolve(config.projSrc, file.replace(/\-\w+\.html/, '.html').replace('dist/', ''));
		del.sync([projFileSrc], {
			force: true
		});
		arr.push(gulp.src(file)
			.pipe(rename(function (path) {
				path.basename = path.basename.replace(/\-\w+$/, '');
			}))
			.pipe(gulp.dest(projFileSrc.replace(/\w+\.html$/, ''))))
	});
	return mergeStream(arr);
})

gulp.task('_oss', function (done) {
	return gulp
		.src([
			`./dist/build/${config.version}/**`,
			'./dist/static/**/*.png',
			'./dist/static/**/*.gif',
			'./dist/static/**/*.jpg',
			'./dist/static/**/*.svg'
		])
		.pipe(ossSync(ossConfig))
});

gulp.task('_clean', function () {
	return gulp.src('dist', {
		read: false
	}).pipe(clean());
});


gulp.task('url', ['_clean'], function () {
	return gulp.src(path.resolve(config.projSrc, './static/modules/**/*.js'))
		.pipe(through.obj(function (file, enc, cb) {
			var content = file.contents.toString();
			if (content.indexOf('//@ sourceURL=') == -1) {
				var url = file.path.replace(/^.*?static/, '\\static').replace(/\\/g, '/');
				console.log(url)
				content = `//@ sourceURL=${url}\n\n` + content;
				file.contents = new Buffer(content);
			}
			this.push(file);
			cb();
		}))

		.pipe(gulp.dest(path.resolve(config.projSrc, './static/modules')));
});

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
	var o = {
		"M+": this.getMonth() + 1, //月份 
		"d+": this.getDate(), //日 
		"h+": this.getHours(), //小时 
		"m+": this.getMinutes(), //分 
		"s+": this.getSeconds(), //秒 
		"q+": Math.floor((this.getMonth() + 3) / 3), //季度 
		"S": this.getMilliseconds() //毫秒 
	};
	if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
	for (var k in o)
		if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
	return fmt;
}