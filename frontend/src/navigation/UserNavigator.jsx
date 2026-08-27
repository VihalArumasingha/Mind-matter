import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import UserBottomTabs from './UserBottomTabs'
import EditProfileScreen from '../features/profile/screens/EditProfileScreen'
import ProfessionalHelpScreen from '../features/professionalSupport/screens/ProfessionalHelpScreen'
import ProfessionalPostsScreen from '../features/professionalSupport/screens/ProfessionalPostsScreen'
import ProfessionalAvailabilityBookingScreen from '../features/professionalSupport/screens/ProfessionalAvailabilityBookingScreen'
import MoodHistoryScreen from '../features/mood/screen/MoodHistoryScreen'
import MyPostsScreen from '../features/profile/screens/MyPostsScreen'

const Stack = createNativeStackNavigator()

const UserNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="UserTabs"
                component={UserBottomTabs}
            />

            <Stack.Screen
                name="EditProfile"
                component={EditProfileScreen}
            />

            <Stack.Screen
                name="ProfessionalHelp"
                component={ProfessionalHelpScreen}
            />

            <Stack.Screen
                name="ProfessionalPosts"
                component={ProfessionalPostsScreen}
            />

            <Stack.Screen
                name="ProfessionalAvailabilityBooking"
                component={ProfessionalAvailabilityBookingScreen}
            />

            <Stack.Screen
                name="MoodHistory"
                component={MoodHistoryScreen}
            />

            <Stack.Screen
                name="MyPosts"
                component={MyPostsScreen}
            />
        </Stack.Navigator>
    )
}


export default UserNavigator