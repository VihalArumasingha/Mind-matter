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

const LoginScreen = ({navigation}) => {
    const {login} = useAuth()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const handleLogin = async () => {
        if (!email.trim() || !password) {
            Alert.alert(
                'Missing details',
                'Please enter your email and password.'
            )
            return
        }

        try {
            setIsSubmitting(true)

            await login({
                email: email.trim(),
                password,
            })
        } catch (error) {
            Alert.alert('Login failed', error.message)
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
                    <View style={styles.backgroundLeafTopLeft}>
                        <Text style={styles.leaf}>🍃</Text>
                    </View>

                    <View style={styles.backgroundLeafTopRight}>
                        <Text style={styles.leaf}>🌿</Text>
                    </View>

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
                        <Text style={styles.title}>Welcome Back 🌿</Text>

                        <Text style={styles.subtitle}>
                            Glad to see you again!
                        </Text>

                        <View style={styles.form}>
                            <View>
                                <Text style={styles.label}>Email</Text>

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
                                        placeholder="Enter your password"
                                        placeholderTextColor="#A1A8A1"
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
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

                            <Pressable
                                style={styles.forgotButton}
                                onPress={() =>
                                    navigation.navigate('ForgotPassword')
                                }>
                                <Text style={styles.forgotText}>
                                    Forgot password?
                                </Text>
                            </Pressable>

                            <Pressable
                                style={[
                                    styles.primaryButton,
                                    isSubmitting &&
                                        styles.primaryButtonDisabled,
                                ]}
                                onPress={handleLogin}
                                disabled={isSubmitting}>
                                <Text style={styles.primaryButtonText}>
                                    {isSubmitting ? 'Logging in...' : 'Login'}
                                </Text>

                                {!isSubmitting && (
                                    <Text style={styles.arrow}>→</Text>
                                )}
                            </Pressable>

                            <View style={styles.accountRow}>
                                <Text style={styles.accountText}>
                                    Don't have an account?
                                </Text>

                                <Pressable
                                    onPress={() =>
                                        navigation.navigate('Register')
                                    }>
                                    <Text style={styles.linkText}>
                                        Sign up
                                    </Text>
                                </Pressable>
                            </View>
                        </View>
                    </View>

                    <View style={styles.backgroundLeafBottom}>
                        <Text style={styles.bottomLeaf}>🌱</Text>
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
        paddingTop: 18,
        paddingBottom: 30,
        justifyContent: 'center',
        overflow: 'hidden',
    },

    brandSection: {
        alignItems: 'center',
        marginBottom: 24,
    },

    logoCircle: {
        width: 68,
        height: 68,
        borderRadius: 34,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#E2EEDB',
        marginBottom: 8,
    },

    logoLeaf: {
        fontSize: 40,
        color: '#4E8C4A',
    },

    brandText: {
        fontSize: 34,
        fontWeight: '500',
        color: '#151B15',
        letterSpacing: -1,
    },

    brandGreen: {
        color: '#4E8C4A',
        fontWeight: '600',
    },

    tagline: {
        marginTop: 4,
        fontSize: 15,
        color: '#626862',
    },

    card: {
        width: '100%',
        maxWidth: 520,
        alignSelf: 'center',
        paddingHorizontal: 22,
        paddingTop: 28,
        paddingBottom: 26,
        borderRadius: 26,
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
        borderWidth: 1,
        borderColor: '#E7ECE4',
        shadowColor: '#233522',
        shadowOffset: {
            width: 0,
            height: 8,
        },
        shadowOpacity: 0.08,
        shadowRadius: 20,
        elevation: 4,
    },

    title: {
        textAlign: 'center',
        fontSize: 25,
        fontWeight: '700',
        color: '#3F7540',
    },

    subtitle: {
        textAlign: 'center',
        marginTop: 7,
        marginBottom: 25,
        fontSize: 15,
        color: '#6C726C',
    },

    form: {
        gap: 17,
    },

    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#343A35',
    },

    inputContainer: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#DCE1DB',
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 14,
    },

    inputIcon: {
        width: 28,
        fontSize: 19,
        color: '#707770',
        textAlign: 'center',
    },

    input: {
        flex: 1,
        height: '100%',
        paddingHorizontal: 9,
        fontSize: 15,
        color: '#252A25',
    },

    eyeIcon: {
        fontSize: 20,
        color: '#707770',
        paddingLeft: 8,
    },

    forgotButton: {
        alignSelf: 'flex-end',
        marginTop: -5,
    },

    forgotText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4E824D',
    },

    primaryButton: {
        height: 54,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#4E8C4A',
        marginTop: 2,
    },

    primaryButtonDisabled: {
        opacity: 0.65,
    },

    primaryButtonText: {
        fontSize: 17,
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
        alignItems: 'center',
        justifyContent: 'center',
        gap: 5,
        marginTop: 7,
    },

    accountText: {
        fontSize: 14,
        color: '#666C66',
    },

    linkText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4E824D',
    },

    backgroundLeafTopLeft: {
        position: 'absolute',
        top: 8,
        left: -10,
        opacity: 0.22,
    },

    backgroundLeafTopRight: {
        position: 'absolute',
        top: 24,
        right: -4,
        opacity: 0.18,
    },

    backgroundLeafBottom: {
        position: 'absolute',
        bottom: -8,
        left: -2,
        opacity: 0.2,
    },

    leaf: {
        fontSize: 78,
    },

    bottomLeaf: {
        fontSize: 72,
    },
})

export default LoginScreen