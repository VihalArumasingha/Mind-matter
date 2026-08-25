import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import OrganizerDashboardScreen from '../features/organizer/screens/OrganizerDashboardScreen'
import CircleDetailScreen from '../features/organizer/screens/CircleDetailScreen'
import CircleFormScreen from '../features/organizer/screens/CircleFormScreen'
import ProfileScreen from '../features/profile/screens/ProfileScreen'

const Stack = createNativeStackNavigator()

const OrganizerNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="OrganizerDashboard"
                component={OrganizerDashboardScreen}
            />
            <Stack.Screen
                name="CircleDetail"
                component={CircleDetailScreen}
            />
            <Stack.Screen
                name="CircleForm"
                component={CircleFormScreen}
            />
            <Stack.Screen
                name="OrganizerProfile"
                component={ProfileScreen}
            />
        </Stack.Navigator>
    )
}

export default OrganizerNavigator