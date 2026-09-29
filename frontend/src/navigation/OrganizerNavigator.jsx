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
import EditProfileScreen from '../features/profile/screens/EditProfileScreen'
import MyPostsScreen from '../features/profile/screens/MyPostsScreen'
import MemberCircleDetailScreen from '../features/userCommunities/screens/MemberCircleDetailScreen'
import UserHomeScreen from '../features/userHome/screens/UserHomeScreen'
import CommunitiesScreen from '../features/userCommunities/screens/CommunitiesScreen'
import CreatePostScreen from '../features/posts/screens/CreatePostScreen'

const Stack = createNativeStackNavigator()

const OrganizerNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            {/* ── Organizer dashboard ── */}
            <Stack.Screen
                name="OrganizerDashboard"
                component={OrganizerDashboardScreen}
            />

            {/* ── Normal MindMatter user experience ── */}
            <Stack.Screen
                name="Home"
                component={UserHomeScreen}
            />
            <Stack.Screen
                name="Communities"
                component={CommunitiesScreen}
            />
            <Stack.Screen
                name="Create"
                component={CreatePostScreen}
            />

            {/* ── Circle management ── */}
            <Stack.Screen
                name="CircleDetail"
                component={CircleDetailScreen}
            />
            <Stack.Screen
                name="CircleForm"
                component={CircleFormScreen}
            />

            {/* ── Membership management ── */}
            <Stack.Screen
                name="JoinRequests"
                component={JoinRequestsScreen}
            />
            <Stack.Screen
                name="MemberList"
                component={MemberListScreen}
            />

            {/* ── Session management ── */}
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
            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
            />
            <Stack.Screen
                name="MyPosts"
                component={MyPostsScreen}
            />

            {/* ── Member view ── */}
            <Stack.Screen
                name="MemberCircleDetail"
                component={MemberCircleDetailScreen}
            />
        </Stack.Navigator>
    )
}

export default OrganizerNavigator
