import React, {useState} from 'react'
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from 'react-native'

import {useAuth} from '../../../context/AuthContext'
import {onboardingQuestions} from '../data/onboardingQuestions'

const OnboardingScreen = ({navigation}) => {
    const {token} = useAuth()

    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState({})
    const [selectedOption, setSelectedOption] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const currentQuestion = onboardingQuestions[currentIndex]

    const selectOption = value => {
        setSelectedOption(value)
        setError('')
    }

    const goNext = async () => {
        if (!selectedOption) {
            setError('Please select an option to continue')
            return
        }

        const updatedAnswers = {
            ...answers,
            [currentQuestion.id]: selectedOption,
        }

        if (currentIndex < onboardingQuestions.length - 1) {
            setAnswers(updatedAnswers)
            setCurrentIndex(currentIndex + 1)
            setSelectedOption(null)
            return
        }

        setLoading(true)
        setError('')

        try {
            navigation.navigate('OnboardingResult', {
                answers: updatedAnswers,
            })
        } catch (error) {
            setError(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>
                    Let's get to know you
                </Text>

                <Text style={styles.subtitle}>
                    Your answers help us personalize your MindMatter
                    experience.
                </Text>

                <View style={styles.progressContainer}>
                    <View
                        style={[
                            styles.progress,
                            {
                                width: `${((currentIndex + 1) /
                                    onboardingQuestions.length) *
                                    100}%`,
                            },
                        ]}
                    />
                </View>

                <Text style={styles.progressText}>
                    Question {currentIndex + 1} of 5
                </Text>

                <View style={styles.questionContainer}>
                    <Text style={styles.question}>
                        {currentQuestion.question}
                    </Text>

                    {currentQuestion.options.map(option => (
                        <Pressable
                            key={option.value}
                            style={[
                                styles.option,
                                selectedOption === option.value &&
                                    styles.selectedOption,
                            ]}
                            onPress={() =>
                                selectOption(option.value)
                            }>
                            <Text
                                style={[
                                    styles.optionText,
                                    selectedOption === option.value &&
                                        styles.selectedOptionText,
                                ]}>
                                {option.label}
                            </Text>
                        </Pressable>
                    ))}

                    {error ? (
                        <Text style={styles.error}>
                            {error}
                        </Text>
                    ) : null}
                </View>

                <Pressable
                    style={[
                        styles.button,
                        !selectedOption && styles.disabledButton,
                    ]}
                    onPress={goNext}
                    disabled={!selectedOption || loading}>
                    {loading ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.buttonText}>
                            {currentIndex === 4
                                ? 'Finish'
                                : 'Continue'}
                        </Text>
                    )}
                </Pressable>
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F8FAF5',
    },

    container: {
        flex: 1,
        padding: 24,
    },

    title: {
        marginTop: 30,
        fontSize: 28,
        fontWeight: '700',
        color: '#243224',
    },

    subtitle: {
        marginTop: 8,
        fontSize: 14,
        lineHeight: 21,
        color: '#71806F',
    },

    progressContainer: {
        height: 7,
        marginTop: 25,
        backgroundColor: '#E2E9DF',
        borderRadius: 10,
        overflow: 'hidden',
    },

    progress: {
        height: '100%',
        backgroundColor: '#4E8C4A',
    },

    progressText: {
        marginTop: 8,
        fontSize: 12,
        color: '#71806F',
    },

    questionContainer: {
        flex: 1,
        paddingTop: 40,
    },

    question: {
        fontSize: 21,
        lineHeight: 29,
        fontWeight: '700',
        color: '#243224',
        marginBottom: 22,
    },

    option: {
        padding: 16,
        borderRadius: 15,
        borderWidth: 1,
        borderColor: '#DCE5D9',
        backgroundColor: '#FFFFFF',
        marginBottom: 10,
    },

    selectedOption: {
        backgroundColor: '#E5F1E2',
        borderColor: '#4E8C4A',
    },

    optionText: {
        fontSize: 15,
        color: '#4D594D',
    },

    selectedOptionText: {
        color: '#356D32',
        fontWeight: '700',
    },

    error: {
        marginTop: 10,
        color: '#B64C4C',
        fontSize: 13,
    },

    button: {
        height: 52,
        borderRadius: 15,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A',
    },

    disabledButton: {
        opacity: 0.5,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
})

export default OnboardingScreen