const { src, dest, watch, parallel, series } = require("gulp");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const concat = require("gulp-concat");
const postcss = require("gulp-postcss");
const sass = require("gulp-sass");
const replace = require("gulp-replace");
const sourcemaps = require("gulp-sourcemaps");
const uglify = require("gulp-uglify");
const babel = require("gulp-babel");
const del = require("del");
const browserSync = require("browser-sync").create();
const imageMin = require("gulp-imagemin");
const pngquant = require("imagemin-pngquant");
const mozjpeg = require("imagemin-mozjpeg");

const origin = "src";
const destination = "build";

// cleans/deletes the destination folder
async function clean() {
  return await del(destination);
}
exports.clean = clean;

// moves html
function html() {
  return src(`${origin}/**/*.html`).pipe(dest(destination));
}
// exports.html = html;

// scss
function scss() {
  return src(`${origin}/scss/**/*.scss`)
    .pipe(sourcemaps.init())
    .pipe(sass().on("error", sass.logError))
    .pipe(postcss([autoprefixer(), cssnano()]))
    .pipe(sourcemaps.write("./map"))
    .pipe(dest(`${destination}/scss`))
    .pipe(browserSync.stream());
}
// exports.scss = scss;

//  js
function js() {
  return (
    src(`${origin}/js/**/*.js`)
      .pipe(sourcemaps.init())
      .pipe(sourcemaps.identityMap())
      .pipe(
        babel({
          compact: false,
          presets: ["@babel/env"],
        })
      )
      // .pipe(concat("bundle.js"))
      .pipe(uglify())
      .pipe(sourcemaps.write("./maps"))
      .pipe(dest(`${destination}/js`))
  );
}
// exports.js = js;

function images() {
  return src(`${origin}/images/*`)
    .pipe(
      imageMin([pngquant({ quality: [0.7, 0.7] }), mozjpeg({ quality: 70 })])
    )
    .pipe(dest(`${destination}/images`));
}
// exports.images = images;

// cachebusting
const cbString = new Date().getTime();
function cacheBust() {
  return src(`${origin}/**/*.html`)
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest(destination));
}

// exports.cacheBustTask = cacheBustTask;

function watcher(cb) {
  // look at these files and on change perform
  // a series of tasks css, html, js and then browserSync.reload
  watch(`${origin}/**/*.html`).on("change", series(html, browserSync.reload));
  watch(`${origin}/**/*.scss`).on("change", series(scss, browserSync.reload));
  watch(`${origin}/images/*`).on("change", series(images, browserSync.reload));
  watch(`${origin}/**/*.js`).on("change", series(js, browserSync.reload));
  cb();
}

// exports.watcher = watcher;

function server() {
  return browserSync.init({
    //   no message in the corner
    notify: false,
    // do not open a new window
    open: false,
    //   letting it know which folder to run
    server: {
      baseDir: destination,
    },
  });
}

// exports.server = server;
exports.default = series(
  clean,
  parallel(html, scss, images, js),
  cacheBust,
  parallel(server, watcher)
);
