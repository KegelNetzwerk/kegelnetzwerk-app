const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Remove server.tls which was dropped from Metro's schema in newer versions
// but is still set by Expo's getDefaultConfig, causing a validation warning.
if (config.server) delete config.server.tls;

const webStubs = {
  'expo-notifications': path.resolve(__dirname, 'src/web-stubs/expo-notifications.ts'),
  'expo-background-fetch': path.resolve(__dirname, 'src/web-stubs/expo-background-fetch.ts'),
  'expo-task-manager': path.resolve(__dirname, 'src/web-stubs/expo-task-manager.ts'),
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && webStubs[moduleName]) {
    return { filePath: webStubs[moduleName], type: 'sourceFile' };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withNativeWind(config, { input: './global.css' });
