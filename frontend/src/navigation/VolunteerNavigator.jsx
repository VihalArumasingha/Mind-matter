import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import VolunteerDashboardScreen from '../../features/volunteer/screens/VolunteerDashboardScreen'
import VolunteerApplicationsScreen from '../../features/volunteer/screens/VolunteerApplicationsScreen'
import VolunteerReportsScreen from '../../features/volunteer/screens/VolunteerReportsScreen'
import ProfileScreen from '../../features/profile/screens/ProfileScreen'

const Stack = createNativeStackNavigator()

const VolunteerNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="VolunteerDashboard"
                component={VolunteerDashboardScreen}
            />
            <Stack.Screen
                name="VolunteerApplications"
                component={VolunteerApplicationsScreen}
            />
            <Stack.Screen
                name="VolunteerReports"
                component={VolunteerReportsScreen}
            />
            <Stack.Screen
                name="Profile"
                component={ProfileScreen}
            />
        </Stack.Navigator>
    )
}

export default VolunteerNavigator