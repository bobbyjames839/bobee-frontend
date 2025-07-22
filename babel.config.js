module.exports = function (api) {
  api.cache(true)
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // any other plugins you need…
      'react-native-reanimated/plugin',   // ← must be last
    ],
  }
}
