// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");

module.exports = (async () => {
  const config = await getDefaultConfig(__dirname);

  // ── Firebase (and some other cjs-based modules) require these two lines ──
  config.resolver.sourceExts.push("cjs");
  config.resolver.unstable_enablePackageExports = false;

  // ── DO NOT manually override `config.transformer` here ──
  // Expo’s "nativewind" plugin will inject the correct Tailwind→RN transformer.

  return config;
})();
