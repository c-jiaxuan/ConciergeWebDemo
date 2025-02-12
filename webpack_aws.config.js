import webpack from 'webpack'

//For dir
import { fileURLToPath } from "url";
//For 'Buffer is not definded' error(https://stackoverflow.com/questions/64557638/how-to-polyfill-node-core-modules-in-webpack-5) 
import NodePolyfillPlugin from "node-polyfill-webpack-plugin" 

const curDir = fileURLToPath(new URL(".", import.meta.url))

//ES module style
export default {
    entry: './src/aws_sdk_index.js',
    output: {
      filename: `demo_aws_sdk.js`,
      path: curDir + '/public'
    },
    mode: 'development',
    resolve: {
      extensions: ['.js', '.jsx'],
      fallback: {
        fs: false,
        path: false,
        http: false,
        https: false,
        crypto: false
      },
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
        },
        {
          test: /\.(css|scss)$/,
          use: ['style-loader', 'css-loader', 'sass-loader'],
        },
        {
          test: /\.(svg)$/,
          use: ['@svgr/webpack'],
        },
      ],
    },
    plugins: [
      //=== https://stackoverflow.com/questions/65018431/webpack-5-uncaught-referenceerror-process-is-not-defined
      // 'process is not defined' error 
      new webpack.ProvidePlugin({
        process: 'process/browser',
      }),
      //=== https://stackoverflow.com/questions/65018431/webpack-5-uncaught-referenceerror-process-is-not-defined

      //For 'Buffer is not definded'
      new NodePolyfillPlugin(),
    ],
};
