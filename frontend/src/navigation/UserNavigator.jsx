import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import UserBottomTabs from './UserBottomTabs'
import EditProfileScreen from '../features/profile/screens/EditProfileScreen'
import ProfessionalHelpScreen from '../features/professionalSupport/screens/ProfessionalHelpScreen'
import ProfessionalPostsScreen from '../features/professionalSupport/screens/ProfessionalPostsScreen'
import OrganizerApplicationScreen from '../features/profile/screens/OrganizerApplicationScreen'
import ProfessionalAvailabilityBookingScreen from '../features/professionalSupport/screens/ProfessionalAvailabilityBookingScreen'
import MoodHistoryScreen from '../features/mood/screen/MoodHistoryScreen'
import MyPostsScreen from '../features/profile/screens/MyPostsScreen'
import UserNotificationsScreen from '../features/userHome/screens/UserNotificationsScreen'
import MemberCircleDetailScreen from '../features/userCommunities/screens/MemberCircleDetailScreen'
import MemberCircleActivityScreen from '../features/userCommunities/screens/MemberCircleActivityScreen'
import VolunteerChatScreen from '../features/volunteer/screens/VolunteerChatScreen'
import ProfessionalNotificationsScreen from '../features/volunteer/screens/ProfessionalNotificationsScreen'
import GroupPostCreateScreen from '../features/userCommunities/screens/GroupPostCreateScreen'

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
                name="OrganizerApplication"
                component={OrganizerApplicationScreen}
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

            <Stack.Screen
                name="UserNotifications"
                component={UserNotificationsScreen}
            />

            <Stack.Screen
                name="UserChat"
                component={VolunteerChatScreen}
            />

            <Stack.Screen
                name="VolunteerChat"
                component={VolunteerChatScreen}
            />

            <Stack.Screen
                name="MemberCircleDetail"
                component={MemberCircleDetailScreen}
            />

            <Stack.Screen
                name="Notifications"
                component={ProfessionalNotificationsScreen}
       
            />

            <Stack.Screen
            name="MemberCircleActivity"
                component={MemberCircleActivityScreen}
                />

            <Stack.Screen
                name="GroupPostCreate"
                component={GroupPostCreateScreen}
            />
        </Stack.Navigator>
    )
}

export default UserNavigator