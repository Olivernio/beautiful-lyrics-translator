const path = require('path');

module.exports = {
  entry: './src/core/index.ts',
  output: {
    filename: 'extension.js',
    path: path.resolve(__dirname, 'dist'),
    library: {
      type: 'umd',
      name: 'BeautifulLyricsTranslator'
    },
    globalObject: 'this'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              api: 'modern',  // ← Cambio aquí: 'modern' no 'modern-compiler'
              sassOptions: {
                silenceDeprecations: ['import']
              }
            }
          }
        ]
      }
    ]
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core'),
      '@translation': path.resolve(__dirname, 'src/translation'),
      '@ui': path.resolve(__dirname, 'src/ui'),
      '@api': path.resolve(__dirname, 'src/api'),
      '@types': path.resolve(__dirname, 'src/types'),
      '@utils': path.resolve(__dirname, 'src/utils')
    }
  },
  mode: 'production'
};
