import React, {useState} from 'react'
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAuth} from '../../../context/AuthContext'
import {registerUser} from '../services/authService'

const RegisterScreen = ({navigation}) => {
    const {login} = useAuth()

    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [acceptedTerms, setAcceptedTerms] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleRegister = async () => {
        if (!name.trim() || !email.trim() || !password || !confirmPassword) {
            Alert.alert(
                'Missing details',
                'Please complete all required fields.'
            )
            return
        }

        if (password !== confirmPassword) {
            Alert.alert(
                'Passwords do not match',
                'Please make sure both passwords are the same.'
            )
            return
        }

        if (!acceptedTerms) {
            Alert.alert(
                'Terms & Conditions',
                'Please agree to the Terms & Conditions and Privacy Policy.'
            )
            return
        }

        try {
            setIsSubmitting(true)

            await registerUser({
                name: name.trim(),
                email: email.trim(),
                password,
            })

            await login({
                email: email.trim(),
                password,
            })
        } catch (error) {
            Alert.alert('Registration failed', error.message)
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}>
                    <Pressable
                        style={styles.backButton}
                        onPress={() => navigation.goBack()}>
                        <Text style={styles.backArrow}>‹</Text>
                    </Pressable>

                    <View style={styles.brandSection}>
                        <View style={styles.logoCircle}>
                            <Text style={styles.logoLeaf}>♧</Text>
                        </View>

                        <Text style={styles.brandText}>
                            Mind<Text style={styles.brandGreen}>Matter</Text>
                        </Text>

                        <Text style={styles.tagline}>
                            You matter. Your mind matters.
                        </Text>
                    </View>

                    <View style={styles.card}>
                        <Text style={styles.title}>Create Account 🌿</Text>

                        <Text style={styles.subtitle}>
                            Join our supportive community.
                        </Text>

                        <View style={styles.form}>
                            <View>
                                <Text style={styles.label}>Full name</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputIcon}>♙</Text>

                                    <TextInput
                                        style={styles.input}
                                        value={name}
                                        onChangeText={setName}
                                        placeholder="Enter your full name"
                                        placeholderTextColor="#A1A8A1"
                                        autoCapitalize="words"
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Email address</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputIcon}>✉</Text>

                                    <TextInput
                                        style={styles.input}
                                        value={email}
                                        onChangeText={setEmail}
                                        placeholder="Enter your email"
                                        placeholderTextColor="#A1A8A1"
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>Password</Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputIcon}>♙</Text>

                                    <TextInput
                                        style={styles.input}
                                        value={password}
                                        onChangeText={setPassword}
                                        placeholder="Create a password"
                                        placeholderTextColor="#A1A8A1"
                                        secureTextEntry={!showPassword}
                                    />

                                    <Pressable
                                        onPress={() =>
                                            setShowPassword(!showPassword)
                                        }
                                        hitSlop={10}>
                                        <Text style={styles.eyeIcon}>
                                            {showPassword ? '◉' : '◌'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            <View>
                                <Text style={styles.label}>
                                    Confirm password
                                </Text>

                                <View style={styles.inputContainer}>
                                    <Text style={styles.inputIcon}>♙</Text>

                                    <TextInput
                                        style={styles.input}
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        placeholder="Confirm your password"
                                        placeholderTextColor="#A1A8A1"
                                        secureTextEntry={
                                            !showConfirmPassword
                                        }
                                    />

                                    <Pressable
                                        onPress={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                        hitSlop={10}>
                                        <Text style={styles.eyeIcon}>
                                            {showConfirmPassword ? '◉' : '◌'}
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>

                            <Pressable
                                style={styles.termsRow}
                                onPress={() =>
                                    setAcceptedTerms(!acceptedTerms)
                                }>
                                <View
                                    style={[
                                        styles.checkbox,
                                        acceptedTerms &&
                                            styles.checkboxSelected,
                                    ]}>
                                    {acceptedTerms && (
                                        <Text style={styles.checkmark}>✓</Text>
                                    )}
                                </View>

                                <Text style={styles.termsText}>
                                    I agree to the{' '}
                                    <Text style={styles.termsLink}>
                                        Terms & Conditions
                                    </Text>{' '}
                                    and{' '}
                                    <Text style={styles.termsLink}>
                                        Privacy Policy
                                    </Text>
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.primaryButton,
                                    isSubmitting &&
                                        styles.primaryButtonDisabled,
                                ]}
                                onPress={handleRegister}
                                disabled={isSubmitting}>
                                <Text style={styles.primaryButtonText}>
                                    {isSubmitting
                                        ? 'Creating account...'
                                        : 'Sign Up'}
                                </Text>

                                {!isSubmitting && (
                                    <Text style={styles.arrow}>→</Text>
                                )}
                            </Pressable>

                            <View style={styles.accountRow}>
                                <Text style={styles.accountText}>
                                    Already have an account?
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Login')
                                    }>
                                    <Text style={styles.linkText}>Login</Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    keyboardContainer: {
        flex: 1,
    },

    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 30,
    },

    backButton: {
        width: 44,
        height: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },

    backArrow: {
        fontSize: 39,
        lineHeight: 39,
        color: '#273027',
    },

    brandSection: {
        alignItems: 'center',
        marginBottom: 20,
        marginTop: -4,
    },

    logoCircle: {
        width: 58,
        height: 58,
        borderRadius: 29,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2EEDB',
        marginBottom: 6,
    },

    logoLeaf: {
        fontSize: 35,
        color: '#4E8C4A',
    },

    brandText: {
        fontSize: 31,
        fontWeight: '500',
        color: '#151B15',
    },

    brandGreen: {
        color: '#4E8C4A',
        fontWeight: '600',
    },

    tagline: {
        marginTop: 3,
        fontSize: 14,
        color: '#626862',
    },

    card: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 21,
        paddingTop: 25,
        paddingBottom: 25,
        borderRadius: 25,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#E7ECE4',
        shadowColor: '#233522',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.07,
        shadowRadius: 18,
        elevation: 4,
    },

    title: {
        textAlign: 'center',
        fontSize: 24,
        fontWeight: '700',
        color: '#3F7540',
    },

    subtitle: {
        textAlign: 'center',
        marginTop: 6,
        marginBottom: 20,
        fontSize: 14,
        color: '#6C726C',
    },

    form: {
        gap: 14,
    },

    label: {
        marginBottom: 7,
        fontSize: 13,
        fontWeight: '600',
        color: '#343A35',
    },

    inputContainer: {
        height: 52,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCE1DB',
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 13,
    },

    inputIcon: {
        width: 28,
        fontSize: 18,
        color: '#707770',
        textAlign: 'center',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 8,
        fontSize: 14,
        color: '#252A25',
    },

    eyeIcon: {
        fontSize: 20,
        color: '#707770',
        paddingLeft: 8,
    },

    termsRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 9,
        marginTop: 1,
    },

    checkbox: {
        width: 21,
        height: 21,
        borderRadius: 5,
        borderWidth: 1.5,
        borderColor: '#9AA49A',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 1,
    },

    checkboxSelected: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    checkmark: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
    },

    termsText: {
        flex: 1,
        fontSize: 12,
        lineHeight: 18,
        color: '#646B64',
    },

    termsLink: {
        color: '#4E824D',
        fontWeight: '600',
    },

    primaryButton: {
        height: 53,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#4E8C4A',
        marginTop: 3,
    },

    primaryButtonDisabled: {
        opacity: 0.65,
    },

    primaryButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    arrow: {
        position: 'absolute',
        right: 18,
        fontSize: 25,
        color: '#FFFFFF',
    },

    accountRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 5,
        marginTop: 4,
    },

    accountText: {
        fontSize: 13,
        color: '#666C66',
    },

    linkText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#4E824D',
    },
})

export default RegisterScreen