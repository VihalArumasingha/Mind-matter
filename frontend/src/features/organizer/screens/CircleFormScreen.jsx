import React, {useEffect, useState} from 'react'
import {
    ActivityIndicator,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import {useAuth} from '../../../context/AuthContext'
import {
    createCircle,
    getCircleById,
    updateCircle,
} from '../services/supportCircleService'

const MEETING_TYPES = ['online', 'in-person', 'hybrid']

const CircleFormScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const circleId = route.params?.circleId
    const isEditMode = Boolean(circleId)

    const [topic, setTopic] = useState('')
    const [description, setDescription] = useState('')
    const [meetingType, setMeetingType] = useState('online')
    const [maxCapacity, setMaxCapacity] = useState('')
    const [category, setCategory] = useState('')

    const [isLoading, setIsLoading] = useState(isEditMode)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!isEditMode) {
            return
        }

        const loadCircle = async () => {
            try {
                const {circle} = await getCircleById(token, circleId)
                setTopic(circle.topic)
                setDescription(circle.description)
                setMeetingType(circle.meetingType)
                setMaxCapacity(String(circle.maxCapacity))
                setCategory(circle.category || '')
            } catch (err) {
                setError(err.message || 'Failed to load circle')
            } finally {
                setIsLoading(false)
            }
        }

        loadCircle()
    }, [circleId, isEditMode, token])

    const handleSubmit = async () => {
        if (!topic.trim() || !description.trim() || !maxCapacity.trim()) {
            setError('Topic, description, and max capacity are required')
            return
        }

        const capacityNumber = Number(maxCapacity)

        if (Number.isNaN(capacityNumber) || capacityNumber < 1) {
            setError('Max capacity must be a positive number')
            return
        }

        setIsSaving(true)
        setError('')

        try {
            const payload = {
                topic: topic.trim(),
                description: description.trim(),
                meetingType,
                maxCapacity: capacityNumber,
                category: category.trim(),
            }

            if (isEditMode) {
                await updateCircle(token, circleId, payload)
            } else {
                await createCircle(token, payload)
            }

            navigation.goBack()
        } catch (err) {
            setError(err.message || 'Failed to save circle')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4E8C4A" />
            </View>
        )
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>{isEditMode ? 'Edit circle' : 'Create a circle'}</Text>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>Topic</Text>
            <TextInput
                style={styles.input}
                value={topic}
                onChangeText={setTopic}
                placeholder="e.g. Grief support circle"
                placeholderTextColor="#A1A8A1"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="What is this circle for?"
                placeholderTextColor="#A1A8A1"
                multiline
                numberOfLines={4}
            />

            <Text style={styles.label}>Meeting type</Text>
            <View style={styles.optionRow}>
                {MEETING_TYPES.map(type => (
                    <Pressable
                        key={type}
                        style={[
                            styles.optionChip,
                            meetingType === type && styles.optionChipActive,
                        ]}
                        onPress={() => setMeetingType(type)}>
                        <Text
                            style={[
                                styles.optionChipText,
                                meetingType === type && styles.optionChipTextActive,
                            ]}>
                            {type}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Text style={styles.label}>Max capacity</Text>
            <TextInput
                style={styles.input}
                value={maxCapacity}
                onChangeText={setMaxCapacity}
                placeholder="e.g. 12"
                placeholderTextColor="#A1A8A1"
                keyboardType="number-pad"
            />

            <Text style={styles.label}>Category (optional)</Text>
            <TextInput
                style={styles.input}
                value={category}
                onChangeText={setCategory}
                placeholder="e.g. grief, anxiety, students"
                placeholderTextColor="#A1A8A1"
            />

            <Pressable
                style={[styles.submitButton, isSaving && styles.submitButtonDisabled]}
                onPress={handleSubmit}
                disabled={isSaving}>
                {isSaving ? (
                    <ActivityIndicator color="#FFFFFF" />
                ) : (
                    <Text style={styles.submitButtonText}>
                        {isEditMode ? 'Save changes' : 'Create circle'}
                    </Text>
                )}
            </Pressable>
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F4F7EF',
    },

    content: {
        padding: 16,
        paddingBottom: 32,
    },

    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F4F7EF',
    },

    title: {
        fontSize: 22,
        fontWeight: '600',
        color: '#252A25',
        marginBottom: 16,
    },

    errorText: {
        fontSize: 13,
        color: '#B94A48',
        marginBottom: 12,
    },

    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#252A25',
        marginBottom: 6,
        marginTop: 14,
    },

    input: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        borderWidth: 0.5,
        borderColor: '#DCE1DB',
        paddingHorizontal: 14,
        paddingVertical: 12,
        fontSize: 14,
        color: '#252A25',
    },

    textArea: {
        minHeight: 90,
        textAlignVertical: 'top',
    },

    optionRow: {
        flexDirection: 'row',
        gap: 8,
    },

    optionChip: {
        paddingHorizontal: 14,
        paddingVertical: 9,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#DCE1DB',
        backgroundColor: '#FFFFFF',
    },

    optionChipActive: {
        backgroundColor: '#4E8C4A',
        borderColor: '#4E8C4A',
    },

    optionChipText: {
        fontSize: 13,
        color: '#666C66',
    },

    optionChipTextActive: {
        color: '#FFFFFF',
        fontWeight: '500',
    },

    submitButton: {
        backgroundColor: '#4E8C4A',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
    },

    submitButtonDisabled: {
        opacity: 0.6,
    },

    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
})

export default CircleFormScreen