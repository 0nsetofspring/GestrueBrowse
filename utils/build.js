// Do this as the first thing so that any code reading it knows the right env.
process.env.BABEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.ASSET_PATH = '/';

var webpack = require('webpack'),
  path = require('path'),
  fs = require('fs'),
  config = require('../webpack.config'),
  ZipPlugin = require('zip-webpack-plugin');

// chromeExtensionBoilerplate 속성이 있으면 삭제
if (config.chromeExtensionBoilerplate) {
  delete config.chromeExtensionBoilerplate;
}

config.mode = 'production';

var packageInfo = JSON.parse(fs.readFileSync('package.json', 'utf-8'));

config.plugins = (config.plugins || []).concat(
  new ZipPlugin({
    filename: `${packageInfo.name}-${packageInfo.version}.zip`,
    path: path.join(__dirname, '../', 'zip'),
  })
);

webpack(config, function (err, stats) {
  if (err) {
    console.error('Webpack build error:', err);
    throw err;
  }

  if (stats.hasErrors()) {
    console.error('Webpack build failed with errors:', stats.toString({
      colors: true,
      errorDetails: true
    }));
    process.exit(1);
  }

  console.log('Build completed successfully!');
  console.log('Build stats:', stats.toString({
    colors: true,
    chunks: false,
    modules: false
  }));
});
