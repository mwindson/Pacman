const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const packageInfo = require('./package.json')

module.exports = {
  context: __dirname,
  target: 'web',

  entry: [__dirname + '/src/index.ts'],

  output: {
    path: path.resolve(__dirname, 'build', packageInfo.version),
    filename: '[name].js'
  },

  mode: 'development',
  resolve: {
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.json']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: ['ts-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        loaders: ['style-loader', 'css-loader']
      },
      {
        test: /\.styl$/,
        loaders: ['style-loader', 'css-loader', 'stylus-loader']
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: 'index.html',
      template: path.resolve(__dirname, 'src/index.tmpl.html')
      // chunks: ['commons', 'main'],
    }),
    new webpack.HotModuleReplacementPlugin()
  ],

  devServer: {
    contentBase: __dirname,
    host: '0.0.0.0',
    hot: true,
    port: 8080
  }
}
