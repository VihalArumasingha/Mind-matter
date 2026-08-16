import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {createNativeStackNavigator} from '@react-navigation/native-stack'

const Stack = createNativeStackNavigator()

const AdminInitialScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Admin</Text>
            <Text style={styles.subtitle}>
                Admin features are under development.
            </Text>
        </View>
    )
}

const AdminNavigator = () => {
    return (
        <Stack.Navigator screenOptions={{headerShown: false}}>
            <Stack.Screen
                name="AdminInitial"
                component={AdminInitialScreen}
            />
        </Stack.Navigator>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
        padding: 24,
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    subtitle: {
        marginTop: 10,
        textAlign: 'center',
        color: '#687068',
    },
})

export default AdminNavigator