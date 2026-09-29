import React, {useEffect, useState} from 'react'
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {
    getOnboardingStatus
} from './services/onboardingService'

import OnboardingFlow from './OnboardingFlow'

const OnboardingGate = ({
    token,
    children
}) => {
    const [loading, setLoading] = useState(true)
    const [completed, setCompleted] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const checkOnboarding = async () => {
            try {
                const data = await getOnboardingStatus(token)

                setCompleted(data.completed)
            } catch (error) {
                console.error(
                    '[Onboarding Status Error]',
                    error
                )

                setError(error.message)
            } finally {
                setLoading(false)
            }
        }

        checkOnboarding()
    }, [token])

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#4E8C4A"
                />

                <Text style={styles.loadingText}>
                    Preparing your experience...
                </Text>
            </View>
        )
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.errorTitle}>
                    Something went wrong
                </Text>

                <Text style={styles.errorText}>
                    {error}
                </Text>
            </View>
        )
    }

    if (!completed) {
        return (
            <OnboardingFlow
                token={token}
                onFinished={() => setCompleted(true)}
            />
        )
    }

    return children
}

const styles = StyleSheet.create({
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F8FAF5',
        padding: 24
    },

    loadingText: {
        marginTop: 15,
        fontSize: 14,
        color: '#71806F'
    },

    errorTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#243224'
    },

    errorText: {
        marginTop: 8,
        fontSize: 14,
        textAlign: 'center',
        color: '#B64C4C'
    }
})

export default OnboardingGate