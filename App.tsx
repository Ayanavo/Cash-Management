import { NavigationContainer } from '@react-navigation/native';
// import 'react-native-gesture-handler';
import TabNavigator from './components/TabNavigation';

export default function App() {
  return (
    <NavigationContainer>
      <TabNavigator />
    </NavigationContainer>
  );
};
