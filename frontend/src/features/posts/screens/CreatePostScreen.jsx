import React, {useState} from 'react'
import {Alert, Image, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import {pick, types} from '@react-native-documents/picker'
import {useAuth} from '../../../context/AuthContext'
import {createPost} from '../services/postService'

const CreatePostScreen = ({navigation}) => {
    const {token} = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState(null)
    const [isSaving, setIsSaving] = useState(false)

    const submitPost = async () => {
        if (!title.trim() || !description.trim()) {
            Alert.alert('Complete your post', 'Add a title and description before posting.')
            return
        }

        try {
            setIsSaving(true)
            const postData = new FormData()
            postData.append('title', title.trim())
            postData.append('description', description.trim())
            if (image) postData.append('image', image)
            await createPost(token, postData)
            setTitle('')
            setDescription('')
            setImage(null)
            navigation.navigate('Home')
        } catch (error) {
            Alert.alert('Unable to create post', error.message)
        } finally {
            setIsSaving(false)
        }
    }

    const chooseImage = async () => {
        try {
            const [selectedImage] = await pick({type: [types.images]})
            setImage({
                uri: selectedImage.uri,
                name: selectedImage.name || `post-${Date.now()}.jpg`,
                type: selectedImage.type || 'image/jpeg',
            })
        } catch (error) {
            if (error?.code !== 'OPERATION_CANCELED') {
                Alert.alert('Unable to choose image', error.message)
            }
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
                    maxLength={200}
                    placeholder="Post title"
                    placeholderTextColor="#8A918A"
                    value={title}
                    onChangeText={setTitle}
                    style={styles.titleInput}
                />
                <TextInput
                    multiline
                    maxLength={5000}
                    placeholder="Write your description..."
                    placeholderTextColor="#8A918A"
                    value={description}
                    onChangeText={setDescription}
                    style={styles.input}
                    textAlignVertical="top"
                />
                {image && <Image source={{uri: image.uri}} style={styles.preview} />}
                <TouchableOpacity onPress={chooseImage} style={styles.imageButton}>
                    <Text style={styles.imageButtonText}>{image ? 'Change image' : 'Add an image (optional)'}</Text>
                </TouchableOpacity>
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

    titleInput: {
        minHeight: 52,
        marginTop: 24,
        padding: 16,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        color: '#243024',
        fontSize: 17,
        fontWeight: '700',
        borderWidth: 1,
        borderColor: '#D8E1D4',
    },

    preview: {
        width: '100%',
        height: 190,
        marginTop: 16,
        borderRadius: 12,
    },

    imageButton: {
        marginTop: 12,
        alignItems: 'center',
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: '#4E8C4A',
    },

    imageButtonText: {
        color: '#4E8C4A',
        fontWeight: '700',
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