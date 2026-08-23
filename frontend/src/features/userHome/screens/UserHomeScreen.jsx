import React from 'react'
import {StyleSheet, Text, View, TouchableOpacity, Pressable} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'

const UserHomeScreen = () => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Home</Text>
                <Text style={styles.subtitle}>
                    Welcome to MindMatter
                </Text>
            </View>
            
            <TouchableOpacity 
                style={styles.fab}
                onPress={() => {}}
                accessible={true}
                accessibilityLabel="Talk to a professional"
                accessibilityRole="button"
            >
                <View style={styles.fabContent}>
                    <View style={styles.fabIconContainer}>
                        <Icon name="volunteer-activism" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.fabLabel}>Professional help</Text>
                </View>
            </TouchableOpacity>
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
        position: 'relative',
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

    fab: {
        position: 'absolute',
        bottom: 80,
        right: 24,
        alignItems: 'center',
    },

    fabContent: {
        alignItems: 'center',
    },

    fabIconContainer: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#4E8C4A',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },

    fabLabel: {
        marginTop: 8,
        fontSize: 12,
        fontWeight: '600',
        color: '#4E8C4A',
    },
})

export default UserHomeScreen