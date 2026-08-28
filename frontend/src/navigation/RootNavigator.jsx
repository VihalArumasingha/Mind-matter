import React from 'react'
import {ActivityIndicator, StyleSheet, View, Text} from 'react-native'
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
            <Text style={styles.loadingText}>Loading...</Text>
        </View>
    )
}

const RootNavigator = () => {
    const {user, isLoading, error} = useAuth()

    console.log('[RootNavigator] Render state:', { isLoading, error, hasUser: !!user, userRole: user?.role, user })

    if (isLoading) {
        console.log('[RootNavigator] Showing loading screen')
        return <LoadingScreen />
    }

    if (error) {
        console.log('[RootNavigator] Showing error screen:', error)
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
            </View>
        )
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

            case 'therapist':
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
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#4E8C4A',
        fontWeight: '600',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
        padding: 20,
    },
    errorText: {
        color: 'red',
        fontSize: 16,
        textAlign: 'center',
    },
})

export default RootNavigator