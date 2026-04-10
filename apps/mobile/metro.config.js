const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// react-native-css-interop (NativeWind) requires 'react-native-worklets/plugin'
// but the package is published as 'react-native-worklets-core' — alias it.
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  "react-native-worklets": path.resolve(
    __dirname,
    "../../node_modules/react-native-worklets-core"
  ),
};

module.exports = withNativeWind(config, {
  input: "./global.css",
  projectRoot: __dirname,
});
