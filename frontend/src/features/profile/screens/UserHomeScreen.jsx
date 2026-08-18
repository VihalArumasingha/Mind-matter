import React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAuth} from '../../../context/AuthContext'

const UserHomeScreen = ({navigation}) => {
    const {user, logout} = useAuth()

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.emoji}>🌿</Text>

                <Text style={styles.title}>
                    Welcome, {user?.name || 'there'}!
                </Text>

                <Text style={styles.subtitle}>
                    Welcome to the MindMatter community.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Your Account</Text>

                    <Text style={styles.label}>Name</Text>
                    <Text style={styles.value}>{user?.name}</Text>

                    <Text style={styles.label}>Email</Text>
                    <Text style={styles.value}>{user?.email}</Text>

                    <Text style={styles.label}>Role</Text>
                    <Text style={styles.value}>{user?.role}</Text>
                </View>

                <Pressable
                    style={styles.primaryButton}
                    onPress={() => navigation.navigate('Profile')}>
                    <Text style={styles.primaryButtonText}>
                        View Profile
                    </Text>
                </Pressable>

                <Pressable style={styles.logoutButton} onPress={logout}>
                    <Text style={styles.logoutText}>Log Out</Text>
                </Pressable>
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
        padding: 24,
        justifyContent: 'center',
    },

    emoji: {
        fontSize: 55,
        textAlign: 'center',
        marginBottom: 12,
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#3F7540',
        textAlign: 'center',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 15,
        color: '#687068',
        textAlign: 'center',
        marginBottom: 28,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 22,
        borderWidth: 1,
        borderColor: '#E2E9DF',
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#343A35',
        marginBottom: 20,
    },

    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7A827A',
        marginTop: 10,
    },

    value: {
        fontSize: 16,
        color: '#252A25',
        marginTop: 3,
    },

    primaryButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A',
        borderRadius: 15,
        marginTop: 22,
    },

    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    logoutButton: {
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9E1D6',
        borderRadius: 15,
        marginTop: 12,
    },

    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4E824D',
    },
})

export default UserHomeScreen