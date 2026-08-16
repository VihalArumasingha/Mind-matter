import React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'

import UserHomeScreen from '../features/userHome/screens/UserHomeScreen'
import CommunitiesScreen from '../features/userCommunities/screens/CommunitiesScreen'
import CreatePostScreen from '../features/posts/screens/CreatePostScreen'
import MoodScreen from '../features/mood/screen/MoodScreen'
import ProfileScreen from '../features/profile/screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const UserBottomTabs = () => {
    return (
        <Tab.Navigator
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#4E8C4A',
                tabBarInactiveTintColor: '#8A918A',
            }}>
            <Tab.Screen
                name="Home"
                component={UserHomeScreen}
            />

            <Tab.Screen
                name="Communities"
                component={CommunitiesScreen}
            />

            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
            />

            <Tab.Screen
                name="Mood"
                component={MoodScreen}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
            />
        </Tab.Navigator>
    )
}

export default UserBottomTabs