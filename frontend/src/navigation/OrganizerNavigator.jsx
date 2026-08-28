import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import OrganizerDashboardScreen from '../features/organizer/screens/OrganizerDashboardScreen'
import CircleDetailScreen from '../features/organizer/screens/CircleDetailScreen'
import CircleFormScreen from '../features/organizer/screens/CircleFormScreen'
import JoinRequestsScreen from '../features/organizer/screens/JoinRequestsScreen'
import MemberListScreen from '../features/organizer/screens/MemberListScreen'
import SessionFormScreen from '../features/organizer/screens/SessionFormScreen'
import AttendanceScreen from '../features/organizer/screens/AttendanceScreen'
import ProfileScreen from '../features/profile/screens/ProfileScreen'

const Stack = createNativeStackNavigator()

const OrganizerNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            {/* ── Main flow ── */}
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

            {/* ── Membership management (FM-51, FM-53, FM-54) ── */}
            <Stack.Screen
                name="JoinRequests"
                component={JoinRequestsScreen}
            />
            <Stack.Screen
                name="MemberList"
                component={MemberListScreen}
            />

            {/* ── Session management (FM-57, FM-58, FM-59) ── */}
            <Stack.Screen
                name="SessionForm"
                component={SessionFormScreen}
            />
            <Stack.Screen
                name="Attendance"
                component={AttendanceScreen}
            />

            {/* ── Profile ── */}
            <Stack.Screen
                name="OrganizerProfile"
                component={ProfileScreen}
            />
        </Stack.Navigator>
    )
}

export default OrganizerNavigator