const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add support for web builds
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Handle dotenv for web builds
config.resolver.alias = {
  '@env': require.resolve('./env-config.js')
};

module.exports = config;
