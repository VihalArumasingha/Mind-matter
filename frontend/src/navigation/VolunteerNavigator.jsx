import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import VolunteerMainScreen from '../features/volunteer/screens/VolunteerMainScreen';
import ProfessionalPostFormScreen from '../features/volunteer/screens/ProfessionalPostFormScreen';
import ViewProfessionalPostsScreen from '../features/volunteer/screens/ViewProfessionalPostsScreen';
import ProfessionalNotificationsScreen from '../features/volunteer/screens/ProfessionalNotificationsScreen';

const Stack = createNativeStackNavigator();

/**
 * VolunteerNavigator mounts VolunteerMainScreen for all volunteer sub-routes.
 * Registering all route aliases ensures that even if legacy/cached navigation dispatches
 * hit React Navigation (e.g. 'Availability', 'Requests', 'Dashboard'), React Navigation handles
 * them cleanly without throwing payload errors.
 */
const VolunteerNavigator = () => {
  return (
    <Stack.Navigator
      key="volunteer-main-stack"
      initialRouteName="VolunteerMain"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen
        name="VolunteerMain"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="VolunteerDashboard"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Dashboard"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Availability"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="VolunteerAvailability"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Requests"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Sessions"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="VolunteerRequests"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Messages"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="VolunteerMessages"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="VolunteerProfile"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="Profile"
        component={VolunteerMainScreen}
      />
      <Stack.Screen
        name="ProfessionalPostForm"
        component={ProfessionalPostFormScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ViewProfessionalPosts"
        component={ViewProfessionalPostsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProfessionalNotifications"
        component={ProfessionalNotificationsScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default VolunteerNavigator;