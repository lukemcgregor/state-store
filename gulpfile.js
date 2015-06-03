const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const watchify = require('watchify');
const browserify = require('browserify');
const browserifyShim = require('browserify-shim');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const gutil = require('gulp-util');
const sourcemaps = require('gulp-sourcemaps');
const assign = require('lodash.assign');
const esperanto = require('esperanto');
const mkdirp = require('mkdirp');
const fs = require('fs');
const path = require('path');

// add custom browserify options here
var customOpts = {
  entries: ['./example/src/app.js'],
  debug: true
};
var opts = assign({}, watchify.args, customOpts);
var b = watchify(browserify(opts));

// add transformations here
b.transform(browserifyShim);

gulp.task('dev-watch', bundle); // so you can run `gulp js` to build the file
b.on('update', bundle); // on any dep update, runs the bundler
b.on('log', gutil.log); // output build logs to terminal

function bundle() {
  return b.bundle()
    // log errors if they happen
    .on('error', gutil.log.bind(gutil, 'Browserify Error'))
    .pipe(source('app.js'))
    // optional, remove if you don't need to buffer file contents
    .pipe(buffer())
    // optional, remove if you dont want sourcemaps
    .pipe(sourcemaps.init({loadMaps: true})) // loads map from browserify file
       // Add transformation tasks to the pipeline here.
    .pipe(sourcemaps.write('./')) // writes .map file
    .pipe(gulp.dest('./example/scripts/'));
}


gulp.task("dist", function (done) {
  var exportFileName = 'state-store';
  var exportVarName = 'stateStore';
  var entryFileName = 'state-store';
  var destinationFolder = 'dist'

  esperanto.bundle({
    base: 'src',
    entry: 'state-store',
  }).then(function(bundle) {
    var res = bundle.toUmd({
      sourceMap: true,
      sourceMapSource: entryFileName + '.js',
      sourceMapFile: exportFileName + '.js',
      name: exportVarName
    });

    mkdirp.sync(destinationFolder);
    fs.writeFileSync(path.join(destinationFolder, exportFileName + '.js'), res.map.toString());

    $.file(exportFileName + '.js', res.code, { src: true })
      .pipe($.plumber())
      .pipe($.sourcemaps.init({ loadMaps: true }))
      .pipe($.sourcemaps.write('./', {addComment: false}))
      .pipe(gulp.dest(destinationFolder))
      .pipe($.filter(['*', '!**/*.js.map']))
      .pipe($.rename(exportFileName + '.min.js'))
      .pipe($.sourcemaps.init({ loadMaps: true }))
      .pipe($.uglify())
      .pipe($.sourcemaps.write('./'))
      .pipe(gulp.dest(destinationFolder))
      .on('end', done);
    })
    .catch(done);
});
