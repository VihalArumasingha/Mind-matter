import React from 'react'
import {ActivityIndicator, StyleSheet, View} from 'react-native'
import {NavigationContainer} from '@react-navigation/native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'
import {useAuth} from '../context/AuthContext'

import LoginScreen from '../features/authentication/screens/LoginScreen'
import RegisterScreen from '../features/authentication/screens/RegisterScreen'
import ForgotPasswordScreen from '../features/authentication/screens/ForgotPasswordScreen'

import UserNavigator from './UserNavigator'
import VolunteerNavigator from './VolunteerNavigator'
import OrganizerNavigator from './OrganizerNavigator'
import AdminNavigator from './AdminNavigator'

const Stack = createNativeStackNavigator()

const AuthenticationNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="Login"
                component={LoginScreen}
            />

            <Stack.Screen
                name="Register"
                component={RegisterScreen}
            />

            <Stack.Screen
                name="ForgotPassword"
                component={ForgotPasswordScreen}
            />
        </Stack.Navigator>
    )
}

const LoadingScreen = () => {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator
                size="large"
                color="#4E8C4A"
            />
        </View>
    )
}

const RootNavigator = () => {
    const {user, isLoading} = useAuth()

    if (isLoading) {
        return <LoadingScreen />
    }

    const renderRoleNavigator = () => {
        if (!user) {
            return <AuthenticationNavigator />
        }

        switch (user.role) {
            case 'user':
                return <UserNavigator />

            case 'volunteer':
                return <VolunteerNavigator />

            case 'communityOrganizer':
                return <OrganizerNavigator />

            case 'admin':
                return <AdminNavigator />

            default:
                return <AuthenticationNavigator />
        }
    }

    return (
        <NavigationContainer>
            {renderRoleNavigator()}
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
    },
})

export default RootNavigator