import { AppRegistry, YellowBox } from 'react-native';
import Main from './App';
import { name as appName } from './app.json';

// Disable error overlays for testing
if (__DEV__) {
  import('react-native').then((RN) => {
    RN.LogBox?.ignoreAllLogs?.(true);
  });
}

AppRegistry.registerComponent(appName, () => Main);
