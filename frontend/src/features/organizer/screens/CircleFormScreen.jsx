import React, {useEffect, useState} from 'react'
import {
    ActivityIndicator,
    Image,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native'
import {launchImageLibrary} from 'react-native-image-picker'
import {useAuth} from '../../../context/AuthContext'
import {
    createCircle,
    getCircleById,
    updateCircle,
    updateCircleImages,
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

    // Existing image URLs
    const [coverImage, setCoverImage] = useState('')
    const [profileImage, setProfileImage] = useState('')

    // Newly selected image assets
    const [coverImageAsset, setCoverImageAsset] = useState(null)
    const [profileImageAsset, setProfileImageAsset] = useState(null)

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
                setMeetingTypes(
                    circle.meetingTypes?.length
                        ? circle.meetingTypes
                        : ['online'],
                )
                setMaxCapacity(String(circle.maxCapacity || ''))
                setCategory(circle.category || '')
                setRules(circle.rules || '')

                // Load existing images
                setCoverImage(circle.coverImage || '')
                setProfileImage(circle.profileImage || '')
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

    const pickImage = async type => {
        setError('')

        try {
            const result = await launchImageLibrary({
                mediaType: 'photo',
                selectionLimit: 1,
                quality: 0.85,
            })

            if (result.didCancel) {
                return
            }

            if (result.errorCode) {
                setError(
                    result.errorMessage ||
                        'Could not open the image library',
                )
                return
            }

            const asset = result.assets?.[0]

            if (!asset?.uri) {
                setError('No image was selected')
                return
            }

            if (type === 'cover') {
                setCoverImageAsset(asset)
                setCoverImage(asset.uri)
            } else {
                setProfileImageAsset(asset)
                setProfileImage(asset.uri)
            }
        } catch (err) {
            setError(err.message || 'Failed to select image')
        }
    }

    const goToNextStep = () => {
        setError('')

        if (step === 1 && (!topic.trim() || !description.trim())) {
            setError('Topic and description are required')
            return
        }

        if (step === 2) {
            const capacityNumber = Number(maxCapacity)

            if (
                !maxCapacity.trim() ||
                Number.isNaN(capacityNumber) ||
                capacityNumber < 1
            ) {
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

            let savedCircleId = circleId

            if (isEditMode) {
                await updateCircle(token, circleId, payload)
            } else {
                const data = await createCircle(token, payload)
                savedCircleId = data.circle?._id
            }

            // Upload images AFTER the circle has been created/updated.
            if (
                savedCircleId &&
                (coverImageAsset || profileImageAsset)
            ) {
                await updateCircleImages(
                    token,
                    savedCircleId,
                    {
                        coverImage: coverImageAsset,
                        profileImage: profileImageAsset,
                    },
                )
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
                <Pressable
                    onPress={() =>
                        step === 1
                            ? navigation.goBack()
                            : setStep(current => current - 1)
                    }>
                    <Text style={styles.menuIcon}>☰</Text>
                </Pressable>

                <Text style={styles.title}>
                    {isEditMode
                        ? 'Edit Support Circle'
                        : 'Create Support Circle'}
                </Text>

                <View style={styles.headerSpacer} />
            </View>

            <View style={styles.progressRow}>
                {[1, 2, 3].map(value => (
                    <View
                        key={value}
                        style={[
                            styles.progressDot,
                            step === value && styles.progressDotActive,
                        ]}
                    />
                ))}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                keyboardShouldPersistTaps="handled">

                {error ? (
                    <Text style={styles.errorText}>{error}</Text>
                ) : null}

                {/* STEP 1 */}
                {step === 1 && (
                    <View style={styles.panel}>

                        <Text style={styles.imageSectionTitle}>
                            GROUP IMAGES
                        </Text>

                        {/* COVER IMAGE */}
                        <Text style={styles.imageLabel}>
                            COVER IMAGE
                        </Text>

                        <Pressable
                            style={styles.coverPicker}
                            onPress={() => pickImage('cover')}>

                            {coverImage ? (
                                <Image
                                    source={{uri: coverImage}}
                                    style={styles.coverImage}
                                />
                            ) : (
                                <View style={styles.coverPlaceholder}>
                                    <Text style={styles.coverPlus}>
                                        +
                                    </Text>

                                    <Text style={styles.coverPlaceholderText}>
                                        Add a cover image
                                    </Text>
                                </View>
                            )}

                            <View style={styles.imageChangeBadge}>
                                <Text style={styles.imageChangeText}>
                                    {coverImage
                                        ? 'Change cover'
                                        : 'Choose image'}
                                </Text>
                            </View>
                        </Pressable>

                        {/* PROFILE IMAGE */}
                        <Text style={styles.imageLabel}>
                            GROUP PROFILE IMAGE
                        </Text>

                        <View style={styles.profileImageRow}>
                            <Pressable
                                style={styles.profilePicker}
                                onPress={() =>
                                    pickImage('profile')
                                }>

                                {profileImage ? (
                                    <Image
                                        source={{uri: profileImage}}
                                        style={styles.profileImage}
                                    />
                                ) : (
                                    <View
                                        style={
                                            styles.profilePlaceholder
                                        }>
                                        <Text
                                            style={
                                                styles.profilePlaceholderText
                                            }>
                                            {topic
                                                ? topic
                                                      .split(' ')
                                                      .slice(0, 2)
                                                      .map(
                                                          value =>
                                                              value[0],
                                                      )
                                                      .join('')
                                                      .toUpperCase()
                                                : '+'}
                                        </Text>
                                    </View>
                                )}
                            </Pressable>

                            <View style={styles.profileImageInfo}>
                                <Text style={styles.profileImageTitle}>
                                    Group picture
                                </Text>

                                <Text style={styles.profileImageBody}>
                                    This image appears as the circle
                                    avatar on the group page.
                                </Text>

                                <Pressable
                                    style={styles.secondaryButton}
                                    onPress={() =>
                                        pickImage('profile')
                                    }>
                                    <Text
                                        style={
                                            styles.secondaryButtonText
                                        }>
                                        {profileImage
                                            ? 'Change picture'
                                            : 'Choose picture'}
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* TOPIC */}
                        <Text style={styles.label}>
                            TOPIC
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={topic}
                            onChangeText={setTopic}
                            placeholder="Grief Support Circle"
                            placeholderTextColor="#A1A8A1"
                        />

                        {/* DESCRIPTION */}
                        <Text style={styles.label}>
                            DESCRIPTION
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                styles.descriptionInput,
                            ]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="What is this circle for?"
                            placeholderTextColor="#A1A8A1"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* STEP 2 */}
                {step === 2 && (
                    <View style={styles.panel}>
                        <Text style={styles.label}>
                            MAX CAPACITY
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={maxCapacity}
                            onChangeText={setMaxCapacity}
                            placeholder="12"
                            placeholderTextColor="#A1A8A1"
                            keyboardType="number-pad"
                        />

                        <Text style={styles.label}>
                            CATEGORY (OPTIONAL)
                        </Text>

                        <TextInput
                            style={styles.input}
                            value={category}
                            onChangeText={setCategory}
                            placeholder="Grief"
                            placeholderTextColor="#A1A8A1"
                        />

                        <Text style={styles.label}>
                            MEETING TYPES
                        </Text>

                        <View style={styles.checkList}>
                            {MEETING_TYPES.map(type => (
                                <Pressable
                                    key={type.key}
                                    style={styles.checkRow}
                                    onPress={() =>
                                        toggleMeetingType(type.key)
                                    }>

                                    <View
                                        style={[
                                            styles.checkbox,
                                            meetingTypes.includes(
                                                type.key,
                                            ) &&
                                                styles.checkboxActive,
                                        ]}>
                                        {meetingTypes.includes(
                                            type.key,
                                        ) ? (
                                            <Text
                                                style={
                                                    styles.checkmark
                                                }>
                                                ✓
                                            </Text>
                                        ) : null}
                                    </View>

                                    <Text
                                        style={styles.checkLabel}>
                                        {type.label}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        <Text style={styles.label}>
                            RULES &amp; GUIDELINES
                        </Text>

                        <TextInput
                            style={[
                                styles.input,
                                styles.rulesInput,
                            ]}
                            value={rules}
                            onChangeText={setRules}
                            placeholder="Be respectful. No judgment."
                            placeholderTextColor="#A1A8A1"
                            multiline
                            textAlignVertical="top"
                        />
                    </View>
                )}

                {/* STEP 3 */}
                {step === 3 && (
                    <View style={styles.reviewPanel}>
                        <Text style={styles.reviewHeading}>
                            REVIEW &amp; CONFIRM
                        </Text>

                        {[
                            ['TOPIC', topic],
                            ['DESCRIPTION', description],
                            [
                                'MEETING TYPES',
                                meetingTypes.join(' & '),
                            ],
                            [
                                'MAX CAPACITY',
                                `${maxCapacity} members`,
                            ],
                            [
                                'CATEGORY',
                                category || 'Not specified',
                            ],
                            [
                                'RULES & GUIDELINES',
                                rules || 'No additional rules',
                            ],
                        ].map(([label, value]) => (
                            <View
                                key={label}
                                style={styles.reviewField}>

                                <Text style={styles.reviewLabel}>
                                    {label}
                                </Text>

                                <Text style={styles.reviewValue}>
                                    {value}
                                </Text>
                            </View>
                        ))}

                        <View style={styles.reviewField}>
                            <Text style={styles.reviewLabel}>
                                GROUP IMAGES
                            </Text>

                            <Text style={styles.reviewValue}>
                                {coverImageAsset ||
                                profileImageAsset
                                    ? 'New image selected'
                                    : isEditMode
                                      ? 'Current images will be kept'
                                      : 'No images selected'}
                            </Text>
                        </View>
                    </View>
                )}

                {step < 3 ? (
                    <Pressable
                        style={styles.submitButton}
                        onPress={goToNextStep}>
                        <Text style={styles.submitButtonText}>
                            NEXT &gt;
                        </Text>
                    </Pressable>
                ) : (
                    <Pressable
                        style={[
                            styles.submitButton,
                            isSaving &&
                                styles.submitButtonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={isSaving}>

                        {isSaving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {isEditMode
                                    ? 'SAVE CHANGES'
                                    : 'CREATE YOUR SUPPORT CIRCLE'}
                            </Text>
                        )}
                    </Pressable>
                )}
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

    imageSectionTitle: {
        fontSize: 13,
        fontWeight: '900',
        color: '#111513',
        marginBottom: 12,
    },

    imageLabel: {
        fontSize: 12,
        fontWeight: '800',
        color: '#252A25',
        marginBottom: 7,
        marginTop: 5,
    },

    coverPicker: {
        height: 150,
        borderRadius: 14,
        overflow: 'hidden',
        backgroundColor: '#DDEBDD',
        position: 'relative',
        marginBottom: 16,
    },

    coverImage: {
        width: '100%',
        height: '100%',
    },

    coverPlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },

    coverPlus: {
        fontSize: 28,
        color: '#4E8C4A',
    },

    coverPlaceholderText: {
        color: '#5A7657',
        fontSize: 12,
        marginTop: 4,
    },

    imageChangeBadge: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        backgroundColor: 'rgba(0,0,0,0.65)',
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 7,
    },

    imageChangeText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '700',
    },

    profileImageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    profilePicker: {
        width: 82,
        height: 82,
        borderRadius: 41,
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#FFFFFF',
    },

    profileImage: {
        width: '100%',
        height: '100%',
    },

    profilePlaceholder: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4E8C4A',
    },

    profilePlaceholderText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '800',
    },

    profileImageInfo: {
        flex: 1,
        marginLeft: 14,
    },

    profileImageTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: '#252A25',
    },

    profileImageBody: {
        fontSize: 12,
        lineHeight: 17,
        color: '#707770',
        marginTop: 3,
        marginBottom: 8,
    },

    secondaryButton: {
        alignSelf: 'flex-start',
        borderWidth: 1,
        borderColor: '#4E8C4A',
        borderRadius: 9,
        paddingHorizontal: 11,
        paddingVertical: 7,
    },

    secondaryButtonText: {
        color: '#4E8C4A',
        fontSize: 11,
        fontWeight: '700',
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