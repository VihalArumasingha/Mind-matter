import React from 'react'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

import UserBottomTabs from './UserBottomTabs'
import EditProfileScreen from '../features/profile/screens/EditProfileScreen'

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
        </Stack.Navigator>
    )
}

export default UserNavigator