module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    'react-native-reanimated/plugin',
  ],
  env: {
    production: {
      plugins: [
        // Remove console.log in production builds
        // console.error and console.warn are kept for debugging
        ['transform-remove-console', { exclude: ['error', 'warn'] }],
        'react-native-reanimated/plugin',
      ]
    }
  }
};
