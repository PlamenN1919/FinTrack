/**
 * @format
 */

// IMPORTANT: react-native-reanimated must be imported BEFORE anything else
import 'react-native-reanimated';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
