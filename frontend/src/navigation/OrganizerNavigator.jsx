import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import OrganizerDashboardScreen from '../features/organizer/screens/OrganizerDashboardScreen'

const Stack = createNativeStackNavigator()

const OrganizerNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="OrganizerDashboard"
                component={OrganizerDashboardScreen}
            />
        </Stack.Navigator>
    )
}

export default OrganizerNavigator