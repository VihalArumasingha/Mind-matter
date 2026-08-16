import React, { useEffect, useState } from 'react'
import {
    ActivityIndicator,
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
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '../../../context/AuthContext'
import { updateProfile } from '../services/profileService'

const EditProfileScreen = ({ navigation }) => {
    const { user, token, updateUser } = useAuth()

    const [name, setName] = useState('')
    const [bio, setBio] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        setName(user?.name || '')
        setBio(user?.bio || '')
    }, [user])

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Missing name', 'Please enter your name.')
            return
        }

        try {
            setIsSaving(true)

            const data = await updateProfile(token, {
                name: name.trim(),
                bio: bio.trim(),
            })

            updateUser(data.user)

            Alert.alert(
                'Profile updated',
                'Your profile has been updated successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => navigation.goBack(),
                    },
                ]
            )
        } catch (error) {
            Alert.alert('Update failed', error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView
                style={styles.keyboardContainer}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                <ScrollView
                    contentContainerStyle={styles.content}
                    keyboardShouldPersistTaps="handled">
                    <View style={styles.header}>
                        <Pressable
                            style={styles.backButton}
                            onPress={() => navigation.goBack()}>
                            <Text style={styles.backArrow}>‹</Text>
                        </Pressable>

                        <Text style={styles.headerTitle}>
                            Edit Profile
                        </Text>

                        <View style={styles.headerSpacer} />
                    </View>

                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                            </Text>
                        </View>

                        <Text style={styles.avatarHint}>
                            Profile picture
                        </Text>
                    </View>

                    <View style={styles.form}>
                        <View>
                            <Text style={styles.label}>Full name</Text>

                            <TextInput
                                style={styles.input}
                                value={name}
                                onChangeText={setName}
                                placeholder="Enter your name"
                                placeholderTextColor="#9AA19A"
                            />
                        </View>

                        <View>
                            <Text style={styles.label}>Email</Text>

                            <TextInput
                                style={[
                                    styles.input,
                                    styles.disabledInput,
                                ]}
                                value={user?.email || ''}
                                editable={false}
                            />

                            <Text style={styles.helperText}>
                                Email address cannot be changed here.
                            </Text>
                        </View>

                        <View>
                            <Text style={styles.label}>Bio</Text>

                            <TextInput
                                style={[styles.input, styles.bioInput]}
                                value={bio}
                                onChangeText={setBio}
                                placeholder="Tell the community a little about yourself"
                                placeholderTextColor="#9AA19A"
                                multiline
                                textAlignVertical="top"
                                maxLength={300}
                            />

                            <Text style={styles.characterCount}>
                                {bio.length}/300
                            </Text>
                        </View>

                        <Pressable
                            style={[
                                styles.saveButton,
                                isSaving && styles.disabledButton,
                            ]}
                            onPress={handleSave}
                            disabled={isSaving}>
                            {isSaving ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    Save Changes
                                </Text>
                            )}
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => navigation.goBack()}>
                            <Text style={styles.cancelButtonText}>
                                Cancel
                            </Text>
                        </Pressable>
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

    content: {
        paddingHorizontal: 20,
        paddingBottom: 35,
    },

    header: {
        height: 58,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },

    backButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
    },

    backArrow: {
        fontSize: 38,
        color: '#273027',
    },

    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#252A25',
    },

    headerSpacer: {
        width: 44,
    },

    avatarContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },

    avatar: {
        width: 92,
        height: 92,
        borderRadius: 46,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#DDEBD8',
    },

    avatarText: {
        fontSize: 36,
        fontWeight: '700',
        color: '#4E824D',
    },

    avatarHint: {
        marginTop: 8,
        fontSize: 13,
        color: '#7A827A',
    },

    form: {
        gap: 18,
    },

    label: {
        marginBottom: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#343A35',
    },

    input: {
        minHeight: 52,
        borderWidth: 1,
        borderColor: '#DCE1DB',
        borderRadius: 14,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 15,
        fontSize: 15,
        color: '#252A25',
    },

    disabledInput: {
        backgroundColor: '#EEF1EC',
        color: '#7A827A',
    },

    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: '#8A918A',
    },

    bioInput: {
        minHeight: 130,
        paddingTop: 14,
    },

    characterCount: {
        marginTop: -12,
        textAlign: 'right',
        fontSize: 11,
        color: '#8A918A',
    },

    saveButton: {
        height: 53,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#4E8C4A',
        marginTop: 3,
    },

    disabledButton: {
        opacity: 0.65,
    },

    saveButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },

    cancelButton: {
        height: 53,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 15,
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#D9E1D6',
    },

    cancelButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4E824D',
    },
})

export default EditProfileScreen