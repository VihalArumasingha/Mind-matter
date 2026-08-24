import React, {useState} from 'react'
import {Alert, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {useAuth} from '../../../context/AuthContext'
import {createPost} from '../services/postService'

const CreatePostScreen = ({navigation}) => {
    const {token} = useAuth()
    const [content, setContent] = useState('')
    const [isSaving, setIsSaving] = useState(false)

    const submitPost = async () => {
        if (!content.trim()) {
            Alert.alert('Write something first', 'Your post cannot be empty.')
            return
        }

        try {
            setIsSaving(true)
            await createPost(token, content)
            setContent('')
            navigation.navigate('Home')
        } catch (error) {
            Alert.alert('Unable to create post', error.message)
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <Text style={styles.title}>Create Post</Text>
                <Text style={styles.subtitle}>
                    Share something with your feed
                </Text>
                <TextInput
                    multiline
                    maxLength={5000}
                    placeholder="What is on your mind?"
                    placeholderTextColor="#8A918A"
                    value={content}
                    onChangeText={setContent}
                    style={styles.input}
                    textAlignVertical="top"
                />
                <TouchableOpacity
                    disabled={isSaving}
                    onPress={submitPost}
                    style={[styles.button, isSaving && styles.disabledButton]}>
                    <Text style={styles.buttonText}>{isSaving ? 'Posting...' : 'Post'}</Text>
                </TouchableOpacity>
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
    },

    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#4E8C4A',
    },

    subtitle: {
        marginTop: 6,
        fontSize: 15,
        color: '#687068',
    },

    input: {
        minHeight: 180,
        marginTop: 28,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        color: '#243024',
        fontSize: 16,
        borderWidth: 1,
        borderColor: '#D8E1D4',
    },

    button: {
        marginTop: 16,
        paddingVertical: 14,
        borderRadius: 10,
        alignItems: 'center',
        backgroundColor: '#4E8C4A',
    },

    disabledButton: {
        opacity: 0.6,
    },

    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
})

export default CreatePostScreen