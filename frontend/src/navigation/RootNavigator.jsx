import React from 'react'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useAuth } from '../context/AuthContext'

import LoginScreen from '../features/authentication/screens/LoginScreen'
import RegisterScreen from '../features/authentication/screens/RegisterScreen'
import ForgotPasswordScreen from '../features/authentication/screens/ForgotPasswordScreen'
import UserHomeScreen from '../features/profile/screens/UserHomeScreen'
import ProfileScreen from '../features/profile/screens/ProfileScreen'
import EditProfileScreen from '../features/profile/screens/EditProfileScreen'

const Stack = createNativeStackNavigator()

const RootNavigator = () => {
    const { isAuthenticated, isLoading } = useAuth()

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
            </View>
        )
    }

    return (
        <NavigationContainer>
            {isAuthenticated ? (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen
                        name="UserHome"
                        component={UserHomeScreen}
                    />
                    <Stack.Screen
                        name="Profile"
                        component={ProfileScreen}
                    />
                    <Stack.Screen
                        name="EditProfile"
                        component={EditProfileScreen}
                    />
                </Stack.Navigator>
            ) : (
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="Register" component={RegisterScreen} />
                    <Stack.Screen
                        name="ForgotPassword"
                        component={ForgotPasswordScreen}
                    />
                </Stack.Navigator>
            )}
        </NavigationContainer>
    )
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F5F7EF',
    },
})

export default RootNavigator