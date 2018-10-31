const path = require('path')
let HtmlWebpackPlugin = require('html-webpack-plugin');
module.exports = {
  node: {
    global: true
  },
  mode: "none",
  entry: ['@babel/polyfill','./src/index.js'],
  output: {
    filename: 'mybundle.js',
    path: path.resolve(__dirname, 'dist')
  },
  resolve:{
    extensions: [
      ".js",
      ".jsx",
      ".json",
    ],
  },
  plugins: [new HtmlWebpackPlugin({
    template: './dist/index.html',
    filename: 'index.html',
    inject: false,
  })],
  devServer: {
    historyApiFallback: true,
    inline: true,
    port: 1111,
    //contentBase needs to be set if you are serving static assets
  },
  module:{
    rules:[
      {
      test: /\.(js|jsx)$/,
      exclude: /node_modules/,
      use:[{
        loader: 'babel-loader',
        query:{
          presets: ['@babel/preset-env', '@babel/react']
        }
      }]
    },
    {
      test: /(\.css)$/,
      use:[{
        loader: 'style-loader, css-loader',
      }]
    }
  ]
  }
}