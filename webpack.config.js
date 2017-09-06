const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'index.js',
    path: path.resolve(__dirname, 'dist')
  },
  target: 'node',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['env']
          }
        }
      }
    ]
  },
  node: {
    __dirname: false,
    __filename: false,
    Buffer: false,
    console: false,
    global: true,
    process: true,
  },
  externals: require('webpack-node-externals')(), // eslint-disable-line
  resolve: {
    modules: ['node_modules'],
    extensions: [
      '.web.js',
      '.js',
      '.json',
      '.jsx',
    ],
  },
};
