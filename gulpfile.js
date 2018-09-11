const process = require('process');
const gulp = require('gulp');
const rollupUglify = require('rollup-plugin-uglify');
const rollup = require('rollup');
const rollupTypescript = require('rollup-plugin-typescript2');

const plugins = [rollupTypescript({ clean: true })];

if (process.env.NODE_ENV === 'production') {
  plugins.push(rollupUglify.uglify());
}

gulp.task('build', () => {
  return rollup
    .rollup({
      input: './src/ngx-translate-properties-loader.ts',
      plugins
    })
    .then(bundle => {
      return bundle.write({
        file: './dist/ngx-translate-properties-loader.js',
        format: 'umd',
        name: 'ngxTranslatePropertiesLoader',
        sourcemap: true
      });
    });
});
