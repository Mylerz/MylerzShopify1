require("dotenv").config();
const withCSS = require('@zeit/next-css');
const webpack = require('webpack');

const apiKey = JSON.stringify(process.env.SHOPIFY_API_KEY);

console.log("next config ,API_Key: -->", apiKey);

module.exports = withCSS({
  webpack: (config) => {
    debugger
    const env = { API_KEY: apiKey};

    config.plugins.push(new webpack.DefinePlugin(env));
    return config;
  },
  // useFileSystemPublicRoutes: false,
  // basePath: '/merchant2',
  // distDir: '_next'

});