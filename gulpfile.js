const { src, dest, watch, series, parallel } = require('gulp');
const rename        = require('gulp-rename');
const sass 			= require('gulp-sass')(require('sass'));
const sourcemaps    = require('gulp-sourcemaps');
const postcss 		= require('gulp-postcss');
const autoprefixer	= require('autoprefixer');
const gulpif 		= require('gulp-if');
const parseArgs 	= require('minimist');
const php 			= require('gulp-connect-php');
const browserSync 	= require('browser-sync');

const paths = {
	styles: {
		input: "./assets/scss/**/*.scss",
		output: "./public/assets/css",
	},
	php: {
		input: [
			'./public/**/*.html',
			'./public/**/*.php',
		]
	}
};

const config = {
	sass: {
		outputStyle: "compressed"
	},
	rename: {
		styles: {
			suffix: ".min"
		},
		critical: {
			extname: ".php"
		}
	},
	sourceMaps: determineEnv() === 'development'
}

// Determine the environment
function determineEnv() {
	if (process.env.EMBER_ENV) {
		return process.env.EMBER_ENV;
	}

	const args = parseArgs(process.argv);
	let env = args.e || args.env || args.environment;

	// Default: Production env does not produce sourcemaps
	if(!env) {
		env = 'production';
	}

	// Development env produces sourcemaps
	if (env && process.argv.indexOf('--dev') > -1) {
		env = 'development';
	}

	return env;
}

/* -----------------------------------
	Styles
--------------------------------------------------------------------------------------------- */

function compileStyles(input,output) {
	return src(input)
		.pipe(gulpif(config.sourceMaps, sourcemaps.init()))
		.pipe(sass(config.sass).on("error", sass.logError))
		.pipe(postcss([autoprefixer()]))
		.pipe(rename(config.rename.styles))
		.pipe(gulpif(config.sourceMaps, sourcemaps.write('.')))
		.pipe(dest(output));
};

function styles(cb) {
	compileStyles(paths.styles.input,paths.styles.output);
	cb();
}

/* -----------------------------------
	Scripts
--------------------------------------------------------------------------------------------- */

function sync() {
    php.server({
        port: 8000,
        keepalive: true,
        base: './public/'
    }, function (){
        browserSync({
            proxy: '127.0.0.1:8000'
        });
    });
}

function watchStyles() {
	watch(paths.styles.input, styles).on('change', browserSync.reload);
}

function watchPhp() {
	watch(paths.php.input).on('change', browserSync.reload);
}

exports.build = parallel(sync, watchStyles, watchPhp);

exports.default = series(
	styles,
	parallel(sync, watchStyles, watchPhp)
);
