import React from 'react'
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from 'react-native'

const OnboardingResultScreen = ({
    recommendations,
    onContinue
}) => {
    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.container}>
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>✓</Text>
                </View>

                <Text style={styles.title}>
                    We've got some ideas for you
                </Text>

                <Text style={styles.subtitle}>
                    Based on your answers, these are some
                    support areas that may be useful to explore.
                </Text>

                <View style={styles.card}>
                    <Text style={styles.cardTitle}>
                        Recommended for you
                    </Text>

                    {recommendations.map(recommendation => (
                        <View
                            key={recommendation}
                            style={styles.recommendation}>
                            <View style={styles.dot} />

                            <Text style={styles.recommendationText}>
                                {recommendation}
                            </Text>
                        </View>
                    ))}
                </View>

                <Text style={styles.disclaimer}>
                    These recommendations are based on your
                    answers and preferences. They are not a
                    medical diagnosis.
                </Text>

                <Pressable
                    style={styles.button}
                    onPress={onContinue}>
                    <Text style={styles.buttonText}>
                        Continue to MindMatter
                    </Text>
                </Pressable>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5'
    },

    container: {
        flexGrow: 1,
        padding: 24,
        justifyContent: 'center'
    },

    iconContainer: {
        alignSelf: 'center',
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: '#E5F1E2',
        alignItems: 'center',
        justifyContent: 'center'
    },

    icon: {
        fontSize: 32,
        color: '#4E8C4A',
        fontWeight: '700'
    },

    title: {
        marginTop: 24,
        textAlign: 'center',
        fontSize: 27,
        fontWeight: '700',
        color: '#243224'
    },

    subtitle: {
        marginTop: 10,
        textAlign: 'center',
        fontSize: 14,
        lineHeight: 21,
        color: '#71806F'
    },

    card: {
        marginTop: 28,
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#E3E9DF'
    },

    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#243224',
        marginBottom: 16
    },

    recommendation: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 13
    },

    dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#4E8C4A',
        marginRight: 10
    },

    recommendationText: {
        flex: 1,
        fontSize: 14,
        color: '#4D594D'
    },

    disclaimer: {
        marginTop: 18,
        fontSize: 12,
        lineHeight: 18,
        color: '#899287',
        textAlign: 'center'
    },

    button: {
        marginTop: 24,
        height: 52,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A'
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700'
    }
})

export default OnboardingResultScreen