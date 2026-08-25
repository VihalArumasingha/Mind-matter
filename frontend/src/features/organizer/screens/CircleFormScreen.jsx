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

const MEETING_TYPES = [
    {key: 'online', label: 'Online sessions'},
    {key: 'physical', label: 'Physical sessions'},
]

const CircleFormScreen = ({navigation, route}) => {
    const {token} = useAuth()
    const circleId = route.params?.circleId
    const isEditMode = Boolean(circleId)

    const [step, setStep] = useState(1)
    const [topic, setTopic] = useState('')
    const [description, setDescription] = useState('')
    const [meetingTypes, setMeetingTypes] = useState(['online'])
    const [maxCapacity, setMaxCapacity] = useState('')
    const [category, setCategory] = useState('')
    const [rules, setRules] = useState('')

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
                setTopic(circle.topic || '')
                setDescription(circle.description || '')
                setMeetingTypes(circle.meetingTypes?.length ? circle.meetingTypes : ['online'])
                setMaxCapacity(String(circle.maxCapacity || ''))
                setCategory(circle.category || '')
                setRules(circle.rules || '')
            } catch (err) {
                setError(err.message || 'Failed to load circle')
            } finally {
                setIsLoading(false)
            }
        }

        loadCircle()
    }, [circleId, isEditMode, token])

    const toggleMeetingType = type => {
        setMeetingTypes(current =>
            current.includes(type)
                ? current.filter(value => value !== type)
                : [...current, type],
        )
    }

    const goToNextStep = () => {
        setError('')

        if (step === 1 && (!topic.trim() || !description.trim())) {
            setError('Topic and description are required')
            return
        }

        if (step === 2) {
            const capacityNumber = Number(maxCapacity)
            if (!maxCapacity.trim() || Number.isNaN(capacityNumber) || capacityNumber < 1) {
                setError('Max capacity must be a positive number')
                return
            }
            if (meetingTypes.length === 0) {
                setError('Select at least one meeting type')
                return
            }
        }

        setStep(current => Math.min(current + 1, 3))
    }

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
                meetingTypes,
                maxCapacity: capacityNumber,
                category: category.trim(),
                rules: rules.trim(),
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
        <View style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => (step === 1 ? navigation.goBack() : setStep(current => current - 1))}>
                    <Text style={styles.menuIcon}>☰</Text>
                </Pressable>
                <Text style={styles.title}>Create Support Circle</Text>
                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.progressRow}>
                {[1, 2, 3].map(value => (
                    <View key={value} style={[styles.progressDot, step === value && styles.progressDotActive]} />
                ))}
            </View>

            <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {step === 1 && <View style={styles.panel}>
                <Text style={styles.label}>TOPIC</Text>
                <TextInput
                    style={styles.input}
                    value={topic}
                    onChangeText={setTopic}
                    placeholder="Grief Support Circle"
                    placeholderTextColor="#A1A8A1"
                />

                <Text style={styles.label}>DESCRIPTION</Text>
                <TextInput
                    style={[styles.input, styles.descriptionInput]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="What is this circle for?"
                    placeholderTextColor="#A1A8A1"
                    multiline
                    textAlignVertical="top"
                />
            </View>}

            {step === 2 && <View style={styles.panel}>
            <Text style={styles.label}>MAX CAPACITY</Text>
            <TextInput style={styles.input} value={maxCapacity} onChangeText={setMaxCapacity} placeholder="12" placeholderTextColor="#A1A8A1" keyboardType="number-pad" />
            <Text style={styles.label}>CATEGORY (OPTIONAL)</Text>
            <TextInput style={styles.input} value={category} onChangeText={setCategory} placeholder="Grief" placeholderTextColor="#A1A8A1" />
            <Text style={styles.label}>MEETING TYPES</Text>
            <View style={styles.checkList}>
                {MEETING_TYPES.map(type => (
                    <Pressable
                        key={type.key}
                        style={styles.checkRow}
                        onPress={() => toggleMeetingType(type.key)}>
                        <View style={[styles.checkbox, meetingTypes.includes(type.key) && styles.checkboxActive]}>
                            {meetingTypes.includes(type.key) ? <Text style={styles.checkmark}>✓</Text> : null}
                        </View>
                        <Text style={styles.checkLabel}>{type.label}</Text>
                    </Pressable>
                ))}
            </View>
            <Text style={styles.label}>RULES &amp; GUIDELINES</Text>
            <TextInput style={[styles.input, styles.rulesInput]} value={rules} onChangeText={setRules} placeholder="Be respectful. No judgment." placeholderTextColor="#A1A8A1" multiline textAlignVertical="top" />
            </View>}

            {step === 3 && <View style={styles.reviewPanel}>
                <Text style={styles.reviewHeading}>REVIEW &amp; CONFIRM</Text>
                {[
                    ['TOPIC', topic],
                    ['DESCRIPTION', description],
                    ['MEETING TYPES', meetingTypes.join(' & ')],
                    ['MAX CAPACITY', `${maxCapacity} members`],
                    ['CATEGORY', category || 'Not specified'],
                    ['RULES & GUIDELINES', rules || 'No additional rules'],
                ].map(([label, value]) => <View key={label} style={styles.reviewField}>
                    <Text style={styles.reviewLabel}>{label}</Text>
                    <Text style={styles.reviewValue}>{value}</Text>
                </View>)}
            </View>}

            {step < 3 ? <Pressable style={styles.submitButton} onPress={goToNextStep}>
                <Text style={styles.submitButtonText}>NEXT &gt;</Text>
            </Pressable> : <Pressable style={[styles.submitButton, isSaving && styles.submitButtonDisabled]} onPress={handleSubmit} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitButtonText}>{isEditMode ? 'SAVE CHANGES' : 'CREATE YOUR SUPPORT CIRCLE'}</Text>}
            </Pressable>}
            </ScrollView>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },

    header: {
        height: 86,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 18,
    },

    menuIcon: {
        fontSize: 25,
        color: '#0AA35C',
    },

    headerSpacer: {
        width: 25,
    },

    progressRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 10,
        marginTop: 8,
        marginBottom: 20,
    },

    progressDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#626A66',
        backgroundColor: '#FFFFFF',
    },

    progressDotActive: {
        borderColor: '#0AA35C',
        backgroundColor: '#0AA35C',
    },

    panel: {
        backgroundColor: '#E6F5EF',
        borderRadius: 16,
        padding: 18,
        paddingBottom: 24,
    },

    reviewPanel: {
        backgroundColor: '#E6F5EF',
        borderRadius: 16,
        padding: 14,
    },

    reviewHeading: {
        fontSize: 13,
        fontWeight: '900',
        color: '#111513',
        marginBottom: 8,
    },

    reviewField: {
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#69726D',
        borderRadius: 12,
        padding: 9,
        marginTop: 8,
    },

    reviewLabel: {
        fontSize: 10,
        fontWeight: '800',
        color: '#747D78',
    },

    reviewValue: {
        fontSize: 14,
        fontWeight: '700',
        color: '#4C5650',
        marginTop: 3,
    },

    descriptionInput: {
        minHeight: 140,
    },

    rulesInput: {
        minHeight: 100,
    },

    checkList: {
        marginTop: 2,
    },

    checkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },

    checkbox: {
        width: 18,
        height: 18,
        borderWidth: 2,
        borderColor: '#5D6862',
        borderRadius: 3,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },

    checkboxActive: {
        backgroundColor: '#0AA35C',
        borderColor: '#0AA35C',
    },

    checkmark: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },

    checkLabel: {
        fontSize: 14,
        color: '#39423D',
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
        fontWeight: '800',
        color: '#111513',
        flex: 1,
        marginLeft: 18,
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
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#252A27',
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