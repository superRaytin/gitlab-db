var nodeExternals = require('webpack-node-externals')

module.exports = {
  mode: 'production',
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.js$/,
        use: 'babel-loader'
      }
    ]
  }
}