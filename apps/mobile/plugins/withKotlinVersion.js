const { withProjectBuildGradle } = require('@expo/config-plugins');

/**
 * Expo config plugin to inject kotlinVersion into android/build.gradle.
 * The Expo SDK 53 template uses $kotlinVersion in buildscript.dependencies
 * but doesn't define it in an ext{} block. expo-build-properties injects
 * android.kotlinVersion into gradle.properties, but Groovy can't resolve
 * that as $kotlinVersion. This plugin adds ext.kotlinVersion to fix it.
 */
const withKotlinVersion = (config, { kotlinVersion = '1.9.25' } = {}) => {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;

    // Already patched
    if (contents.includes('ext.kotlinVersion')) {
      return config;
    }

    // Insert ext block right after "buildscript {"
    config.modResults.contents = contents.replace(
      /buildscript\s*\{/,
      `buildscript {\n  ext {\n    kotlinVersion = findProperty('android.kotlinVersion') ?: '${kotlinVersion}'\n  }`
    );

    return config;
  });
};

module.exports = withKotlinVersion;
