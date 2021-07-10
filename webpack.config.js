const Autoprefixer = require('autoprefixer');
const PostCSSAssetsPlugin = require('postcss-assets-webpack-plugin');
const PostCSSCustomProperties = require('postcss-custom-properties');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");
const TerserPlugin = require('terser-webpack-plugin');
const rtl = require('postcss-rtl');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const pages = ['index'];
const entry = {};
const plugins = [];
const isDevServer = path.basename(require.main.filename).indexOf('webpack-dev-server.js') >= 0;

const babelOptions = {
  presets : ["@babel/preset-react", [ "@babel/preset-env", { "targets" : { "browsers": ["ie >= 11"] }, "useBuiltIns" : false }]],
  plugins : ['@babel/plugin-transform-object-assign', '@babel/plugin-syntax-object-rest-spread', '@babel/plugin-proposal-class-properties']
};

if (isDevServer) {
  plugins.push(new webpack.DefinePlugin({
    "IS_DEV_SERVER": true
  }))
} else {
  plugins.push(new webpack.DefinePlugin({
    "IS_DEV_SERVER": false
  }))
}

pages.forEach((page) => {
  entry[page] = path.resolve(path.join(__dirname, 'src', 'site', page));

  const plugin = new HtmlWebpackPlugin({
    chunks: [page],
    filename: `${page}.html`,
    template: path.join(__dirname, 'src', 'site', `${page}.html`)
  });

  plugins.push(plugin);
});

plugins.push(new MiniCssExtractPlugin({
  filename: `[name].css`,
}));

plugins.push(new PostCSSAssetsPlugin({
  test: /\.css$/,
  log: false,
  plugins: [
    PostCSSCustomProperties({ preserve: true }),
  ],
}));

plugins.push(new OptimizeCSSAssetsPlugin({
  cssProcessorPluginOptions: {
    preset: ['default', { discardComments: { removeAll : true } }],
  }
}));

// Create the app-level configuration
const config = {
  entry : entry,
  mode : isDevServer ? 'development' : 'production',
  output: {
    publicPath: '/usabmx-stats/',
    // publicPath: '/',
		path: path.join(__dirname, 'docs'),
		filename: '[name].js'
	},
  devtool: 'cheap-source-map',
  resolveLoader: {
    modules: [path.resolve(path.join(__dirname, 'node_modules')), 'node_modules'],
  },
  resolve: {
    extensions: ['.js', '.jsx'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
    alias: {
      'react' : path.resolve(__dirname, 'node_modules', 'react'),
      'react-dom' : path.resolve(__dirname, 'node_modules', 'react-dom')
    },
  },
  plugins : plugins,
  module: {
    rules: [
      {
        test: /\.Worker\.js$/,
        exclude: /node_modules\//,
        use: [
          {
            loader: 'worker-loader',
            options: {
              name: "[name].[ext]",
            }
          },
          {
            loader: 'babel-loader',
            options: babelOptions
          }
        ]
      },
      {
        test: /\.(jsx|js)$/,
        exclude: /node_modules\//,
        use: {
          loader: 'babel-loader',
          options: babelOptions
        }
      },
      {
        test: /\.(png|svg|jpg|gif|otf|eot|ttf|svg|woff|woff2|csv|xlsx|xls)$/,
        use: 'file-loader',
      },
      {
                test: /\.(glb|gltf|mp4|jsfont)$/,
                use:
                [
                    {
                        loader: 'file-loader',
                        options:
                        {
                            esModule: false
                        }
                    }
                ]
            },
      {
        test: /\.(css|scss)$/,
        use:  ['style-loader', MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader']
      }
    ]
  },
  optimization: {
    minimizer: [
      new TerserPlugin({
        extractComments: true,
        cache: true,
        parallel: true,
        sourceMap: isDevServer,
        terserOptions: {
          compress: {
            passes: 2,
            typeofs: false,
          },
          output: {
            beautify: false,
          }
        },
      })
    ],
  }
}

module.exports = config;
