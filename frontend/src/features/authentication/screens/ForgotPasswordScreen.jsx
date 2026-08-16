import React from 'react'
import {Pressable, StyleSheet, Text, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'

const ForgotPasswordScreen = ({navigation}) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}>
                    <Text style={styles.backArrow}>‹</Text>
                </Pressable>

                <View style={styles.content}>
                    <Text style={styles.icon}>🌿</Text>

                    <Text style={styles.title}>Password Recovery</Text>

                    <Text style={styles.description}>
                        Password recovery will be available soon. For now,
                        please contact the support team if you need help
                        accessing your account.
                    </Text>

                    <Pressable
                        style={styles.button}
                        onPress={() => navigation.navigate('Login')}>
                        <Text style={styles.buttonText}>Back to Login</Text>
                    </Pressable>
                </View>
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
        paddingHorizontal: 20,
    },

    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },

    backArrow: {
        fontSize: 39,
        color: '#273027',
    },

    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 25,
    },

    icon: {
        fontSize: 55,
        marginBottom: 18,
    },

    title: {
        fontSize: 25,
        fontWeight: '700',
        color: '#3F7540',
        textAlign: 'center',
    },

    description: {
        marginTop: 12,
        fontSize: 15,
        lineHeight: 23,
        textAlign: 'center',
        color: '#687068',
    },

    button: {
        width: '100%',
        height: 52,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#4E8C4A',
        marginTop: 28,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
})

export default ForgotPasswordScreen