import React from 'react'
import {StyleSheet, Text, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

const UserHomeScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Home</Text>
                <Text style={styles.subtitle}>
                    Welcome to MindMatter
                </Text>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: '#687068',
    },
})

export default UserHomeScreen