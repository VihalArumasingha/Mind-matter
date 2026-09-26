import React, {useState} from 'react'
import {Alert, Image, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import Icon from 'react-native-vector-icons/MaterialIcons'
import {pick, types} from '@react-native-documents/picker'
import {useAuth} from '../../../context/AuthContext'
import {createPost} from '../services/postService'

const MOODS = [
    {value: 'happy', label: 'Happy', emoji: '😊'},
    {value: 'calm', label: 'Calm', emoji: '😌'},
    {value: 'anxious', label: 'Anxious', emoji: '😟'},
    {value: 'sad', label: 'Sad', emoji: '😢'},
    {value: 'tired', label: 'Tired', emoji: '😴'},
    {value: 'grateful', label: 'Grateful', emoji: '🍃'},
]

const CreatePostScreen = ({navigation}) => {
    const {token} = useAuth()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [image, setImage] = useState(null)
    const [isAnonymous, setIsAnonymous] = useState(true)
    const [mood, setMood] = useState(null)
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
            postData.append('isAnonymous', String(isAnonymous))
            if (mood) postData.append('mood', mood)
            if (image) postData.append('image', image)
            await createPost(token, postData)
            setTitle('')
            setDescription('')
            setImage(null)
            setMood(null)
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
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Icon name="close" size={26} color="#243024" />
                </TouchableOpacity>
                <View style={styles.headerTitleWrap}>
                    <Text style={styles.headerTitle}>Create a Post</Text>
                    <Text style={styles.headerSubtitle}>Share your thoughts. You matter.</Text>
                </View>
                <TouchableOpacity
                    disabled={isSaving}
                    onPress={submitPost}
                    style={[styles.postButton, isSaving && styles.disabledButton]}>
                    <Text style={styles.postButtonText}>{isSaving ? 'Posting...' : 'Post'}</Text>
                </TouchableOpacity>
            </View>

            <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.card}>
                    <View style={styles.anonymousRow}>
                        <View style={styles.anonymousIcon}>
                            <Icon name="masks" size={22} color="#4E8C4A" />
                        </View>
                        <View style={styles.anonymousTextWrap}>
                            <Text style={styles.anonymousTitle}>Post Anonymously</Text>
                            <Text style={styles.anonymousSubtitle}>Your name and profile will be hidden from other members.</Text>
                        </View>
                        <Switch
                            value={isAnonymous}
                            onValueChange={setIsAnonymous}
                            trackColor={{false: '#D8E1D4', true: '#4E8C4A'}}
                            thumbColor="#FFFFFF"
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.labelRow}>
                        <Icon name="eco" size={16} color="#4E8C4A" />
                        <Text style={styles.label}>Title</Text>
                    </View>
                    <TextInput
                        maxLength={100}
                        placeholder="Give your post a short, meaningful title..."
                        placeholderTextColor="#8A918A"
                        value={title}
                        onChangeText={setTitle}
                        style={styles.titleInput}
                    />
                    <Text style={styles.charCount}>{title.length}/100</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.labelRow}>
                        <Icon name="eco" size={16} color="#4E8C4A" />
                        <Text style={styles.label}>What's on your mind?</Text>
                    </View>
                    <TextInput
                        multiline
                        maxLength={2000}
                        placeholder="Share your thoughts, feelings or experiences..."
                        placeholderTextColor="#8A918A"
                        value={description}
                        onChangeText={setDescription}
                        style={styles.input}
                        textAlignVertical="top"
                    />
                    <Text style={styles.charCount}>{description.length}/2000</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.labelRow}>
                        <Icon name="eco" size={16} color="#4E8C4A" />
                        <Text style={styles.label}>Add an image (optional)</Text>
                    </View>
                    {image ? (
                        <>
                            <Image source={{uri: image.uri}} style={styles.preview} />
                            <TouchableOpacity onPress={chooseImage} style={styles.imageButton}>
                                <Text style={styles.imageButtonText}>Change image</Text>
                            </TouchableOpacity>
                        </>
                    ) : (
                        <TouchableOpacity onPress={chooseImage} style={styles.dropzone}>
                            <Icon name="image" size={32} color="#4E8C4A" />
                            <Text style={styles.dropzoneTitle}>Tap to upload or drag and drop</Text>
                            <Text style={styles.dropzoneSubtitle}>JPG, PNG up to 10MB</Text>
                            <View style={styles.chooseButton}>
                                <Text style={styles.chooseButtonText}>Choose from Gallery</Text>
                            </View>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.card}>
                    <View style={styles.moodHeaderRow}>
                        <View style={styles.labelRow}>
                            <Icon name="eco" size={16} color="#4E8C4A" />
                            <Text style={styles.label}>How are you feeling?</Text>
                        </View>
                        <Text style={styles.moodOptional}>Choose a mood (optional)</Text>
                    </View>
                    <View style={styles.moodRow}>
                        {MOODS.map(item => {
                            const selected = mood === item.value
                            return (
                                <TouchableOpacity
                                    key={item.value}
                                    onPress={() => setMood(selected ? null : item.value)}
                                    style={[styles.moodChip, selected && styles.moodChipSelected]}>
                                    <Text style={styles.moodEmoji}>{item.emoji}</Text>
                                    <Text style={[styles.moodLabel, selected && styles.moodLabelSelected]}>{item.label}</Text>
                                </TouchableOpacity>
                            )
                        })}
                    </View>
                </View>

                <View style={styles.safeCard}>
                    <View style={styles.safeIcon}>
                        <Icon name="shield" size={20} color="#4E8C4A" />
                    </View>
                    <View style={styles.safeTextWrap}>
                        <Text style={styles.safeTitle}>A safe space for everyone</Text>
                        <Text style={styles.safeSubtitle}>Be kind, respectful, and supportive. Let's build a community where everyone feels heard and valued.</Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 8,
        paddingBottom: 16,
    },

    headerTitleWrap: {
        flex: 1,
        alignItems: 'center',
    },

    headerTitle: {
        fontSize: 19,
        fontWeight: '700',
        color: '#17231A',
    },

    headerSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#687068',
    },

    postButton: {
        backgroundColor: '#4E8C4A',
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 10,
    },

    postButtonText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 14,
    },

    disabledButton: {
        opacity: 0.6,
    },

    container: {
        flex: 1,
    },

    scrollContent: {
        paddingHorizontal: 16,
        paddingBottom: 40,
    },

    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 14,
        borderWidth: 1,
        borderColor: '#E0E8DC',
        padding: 16,
        marginBottom: 14,
    },

    anonymousRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    anonymousIcon: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#EAF3E7',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    anonymousTextWrap: {
        flex: 1,
    },

    anonymousTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: '#17231A',
    },

    anonymousSubtitle: {
        marginTop: 2,
        fontSize: 12,
        color: '#687068',
    },

    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },

    label: {
        fontSize: 14,
        fontWeight: '700',
        color: '#17231A',
    },

    titleInput: {
        marginTop: 12,
        fontSize: 15,
        color: '#243024',
    },

    input: {
        marginTop: 12,
        minHeight: 120,
        fontSize: 15,
        color: '#243024',
    },

    charCount: {
        marginTop: 8,
        textAlign: 'right',
        fontSize: 11,
        color: '#8A918A',
    },

    dropzone: {
        marginTop: 12,
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: '#C8D8C3',
        borderRadius: 12,
        paddingVertical: 30,
        alignItems: 'center',
        backgroundColor: '#FAFCF8',
    },

    dropzoneTitle: {
        marginTop: 10,
        fontSize: 14,
        fontWeight: '700',
        color: '#17231A',
    },

    dropzoneSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#8A918A',
    },

    chooseButton: {
        marginTop: 14,
        borderWidth: 1,
        borderColor: '#4E8C4A',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },

    chooseButtonText: {
        color: '#4E8C4A',
        fontWeight: '700',
        fontSize: 13,
    },

    preview: {
        width: '100%',
        height: 190,
        marginTop: 12,
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

    moodHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },

    moodOptional: {
        fontSize: 12,
        color: '#8A918A',
    },

    moodRow: {
        marginTop: 14,
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    moodChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#F4F7EF',
        borderWidth: 1,
        borderColor: '#E0E8DC',
    },

    moodChipSelected: {
        backgroundColor: '#EAF3E7',
        borderColor: '#4E8C4A',
    },

    moodEmoji: {
        fontSize: 15,
    },

    moodLabel: {
        fontSize: 13,
        color: '#243024',
        fontWeight: '600',
    },

    moodLabelSelected: {
        color: '#4E8C4A',
    },

    safeCard: {
        flexDirection: 'row',
        backgroundColor: '#EAF3E7',
        borderRadius: 14,
        padding: 16,
        alignItems: 'flex-start',
    },

    safeIcon: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#DDEBD8',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },

    safeTextWrap: {
        flex: 1,
    },

    safeTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#17231A',
    },

    safeSubtitle: {
        marginTop: 4,
        fontSize: 12,
        color: '#4F5A51',
        lineHeight: 18,
    },
})

export default CreatePostScreen