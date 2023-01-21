const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const fs = require("fs");
const path = require("path");

const webpack = require('webpack')
module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.module.rules.push({
    test: /\.mjs$/,
    type: 'javascript/auto'
  }) 
  config.module.rules.push({
    test: /\.ts$/,
include:"/Users/jarettdunn/showing/newnew/client/generated",
    loader: 'ts-loader'
  })
    

  // keep everything the same for expo start
  if(env.mode === "development") {
    return config;
  }

  config.output = {
    globalObject: 'this',
    path: __dirname + "/dist/.artifacts/",
    filename: 'index.js',
  };

  config.optimization.splitChunks = {
    cacheGroups: {
      default: false,
    },
  };
  config.optimization.runtimeChunk = false;


  config.plugins = config.plugins.filter(
    (plugin) => ["DefinePlugin", "CleanWebpackPlugin"].includes(plugin.constructor.name)
  )
  config.plugins.push(...[
    // Work around for Buffer is undefined:
    // https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
    }),
    new webpack.ProvidePlugin({
        process: 'process/browser',
    }),
])
config.resolve.alias = {
  ...config.resolve.alias,      buffer: path.resolve("./node_modules/buffer")}

  config.plugins.push(
    new InlineJSPlugin({
      template: "template.html",
      filename: "index.html"
    })
  );

  // this is brittle but works for now.
  const loaders = config.module.rules.find(rule => typeof rule.oneOf !== "undefined");
  const urlLoader = loaders.oneOf.find((loader) => typeof loader.use === "object" && loader.use.loader && loader.use.loader.includes("url-loader"));

  urlLoader.use.options.limit = true;
  urlLoader.test = /\.(gif|jpe?g|png|svg|css|woff2?|eot|ttf|otf)$/;

  return config;

};

// const logger = console.log.bind(console);

class InlineJSPlugin {
  constructor({ template, filename }) {
    this.options = {
      template,
      filename
    }
  }
  apply(compiler) {
    compiler.hooks.done.tap('InlineJSPlugin', (stats) => {
      const filename = stats.compilation.outputOptions.filename;
      const path = stats.compilation.outputOptions.path;
      const asset = stats.compilation.assets[filename];
      const JSBundle = asset.children[0]._value;
      const template = fs.readFileSync(this.options.template).toString().split("####JS####");
      fs.writeFileSync(path + "/../" + this.options.filename, template[0] + JSBundle + template[1]);
    });
  }
}