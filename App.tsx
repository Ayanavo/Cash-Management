import { NavigationContainer } from '@react-navigation/native';
import 'react-native-gesture-handler';
import "./global.css"
import TabNavigator from './components/TabNavigation';
import Toast from 'react-native-toast-message';
import { RootSiblingParent } from 'react-native-root-siblings';

export default function App() {
  return (
    <RootSiblingParent>
      <NavigationContainer >
        <TabNavigator />
        <Toast />
      </NavigationContainer>
    </RootSiblingParent>
  );
};
