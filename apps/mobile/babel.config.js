module.exports = function (api) {
  api.cache(true);
  const isTest = process.env.NODE_ENV === 'test';
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          // Disable auto-detected Reanimated saat test — plugin ini membutuhkan
          // react-native-worklets-core yang tidak tersedia di Jest environment
          reanimated: !isTest,
        },
      ],
      "nativewind/babel",
    ],
    plugins: isTest ? [] : ["react-native-reanimated/plugin"],
  };
};
