import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VolunteerDashboardScreen from '../features/volunteer/screens/VolunteerDashboardScreen';
import VolunteerProfileScreen from '../features/volunteer/screens/VolunteerProfileScreen';

const Stack = createNativeStackNavigator();

const VolunteerNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="VolunteerDashboard"
        component={VolunteerDashboardScreen}
      />
      <Stack.Screen
        name="VolunteerProfile"
        component={VolunteerProfileScreen}
      />
    </Stack.Navigator>
  );
};

export default VolunteerNavigator;