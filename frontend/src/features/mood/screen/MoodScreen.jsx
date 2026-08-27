import React, {useEffect, useState} from 'react'
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {useAuth} from '../../../context/AuthContext'
import {getMoods, saveMood} from '../services/moodService'

const MOODS = [
    ['Very Bad', 'emoticon-dead-outline', '#D96A5D'],
    ['Bad', 'emoticon-sad-outline', '#F2B83F'],
    ['Okay', 'emoticon-neutral-outline', '#E7B945'],
    ['Good', 'emoticon-happy-outline', '#4D9B5D'],
    ['Great', 'emoticon-excited-outline', '#6B8F6F']
]

const MoodScreen = ({navigation}) => {
    const {token} = useAuth()
    const [mood, setMood] = useState(4)
    const [intensity, setIntensity] = useState(7)
    const [note, setNote] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        const loadToday = async () => {
            try {
                if (token) {
                    const data = await getMoods(token)
                    const today = data.moods?.find(entry => new Date(entry.entryDate).toDateString() === new Date().toDateString())
                    if (today) {
                        setMood(today.mood)
                        setIntensity(today.intensity)
                        setNote(today.note || '')
                    }
                }
            } catch (error) {
                Alert.alert('Unable to load mood', error.message)
            } finally {
                setIsLoading(false)
            }
        }
        loadToday()
    }, [token])

    const handleSave = async () => {
        if (!token) return Alert.alert('Sign in required', 'Please sign in to save your mood.')
        try {
            setIsSaving(true)
            await saveMood(token, mood, intensity, note)
            Alert.alert('Mood saved', 'Your check-in has been added to your history.')
        } catch (error) {
            Alert.alert('Unable to save mood', error.message)
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator color="#3D8650" style={styles.loader} /></SafeAreaView>

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.title}>Mood</Text>
                    <Pressable onPress={() => navigation.navigate('MoodHistory')} hitSlop={12}>
                        <MaterialCommunityIcons name="calendar-month-outline" size={25} color="#26342A" />
                    </Pressable>
                </View>
                <View style={styles.formCard}>
                    <Text style={styles.question}>How are you feeling today?</Text>
                    <Text style={styles.helper}>Your feelings matter</Text>
                    <View style={styles.moodRow}>
                        {MOODS.map(([label, icon, color], index) => {
                            const selected = index + 1 === mood
                            return <Pressable key={label} style={styles.moodOption} onPress={() => setMood(index + 1)}>
                                <View style={[styles.face, {borderColor: color}, selected && {backgroundColor: color}]}>
                                    <MaterialCommunityIcons name={icon} size={24} color={selected ? '#FFF' : color} />
                                </View>
                                <Text style={[styles.moodLabel, selected && styles.selectedLabel]}>{label}</Text>
                            </Pressable>
                        })}
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.sectionLabel}>How intense is it?</Text>
                    <View style={styles.sliderRow}>
                        <Pressable style={styles.sliderTrack} onPress={event => setIntensity(Math.max(1, Math.min(10, Math.round(event.nativeEvent.locationX / 18) + 1)))}>
                            <View style={[styles.sliderFill, {width: `${intensity * 10}%`}]} />
                            <View style={[styles.sliderThumb, {left: `${intensity * 10 - 3}%`}]} />
                        </Pressable>
                        <Text style={styles.intensityValue}>{intensity}</Text>
                    </View>
                    <Text style={[styles.sectionLabel, styles.noteLabel]}>Add a note (optional)</Text>
                    <TextInput value={note} onChangeText={setNote} placeholder="Write your thoughts..." placeholderTextColor="#8B958C" multiline maxLength={200} textAlignVertical="top" style={styles.noteInput} />
                    <Text style={styles.counter}>{note.length}/200</Text>
                    <Pressable style={styles.saveButton} onPress={handleSave} disabled={isSaving}>
                        {isSaving ? <ActivityIndicator color="#FFF" /> : <Text style={styles.saveText}>Save Mood</Text>}
                    </Pressable>
                </View>
            </ScrollView>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {flex: 1, backgroundColor: '#F4F7EF'}, loader: {flex: 1}, content: {padding: 16, paddingBottom: 24},
    header: {height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'}, title: {fontSize: 18, fontWeight: '700', color: '#17231A'},
    formCard: {backgroundColor: 'rgba(255,255,255,0.88)', borderRadius: 12, padding: 16, shadowColor: '#58715B', shadowOpacity: 0.08, shadowRadius: 12, elevation: 2}, question: {textAlign: 'center', fontSize: 14, fontWeight: '600', color: '#18241B'}, helper: {textAlign: 'center', marginTop: 7, color: '#606A62', fontSize: 12},
    moodRow: {flexDirection: 'row', justifyContent: 'space-between', marginTop: 20}, moodOption: {alignItems: 'center', width: '19%'}, face: {width: 34, height: 34, borderWidth: 1, borderRadius: 17, alignItems: 'center', justifyContent: 'center'}, moodLabel: {fontSize: 9, color: '#4D574F', marginTop: 8, textAlign: 'center'}, selectedLabel: {color: '#2E7040', fontWeight: '700'}, divider: {height: 1, backgroundColor: '#E4E9E2', marginVertical: 18}, sectionLabel: {fontSize: 12, color: '#1C281F', fontWeight: '500'},
    sliderRow: {flexDirection: 'row', alignItems: 'center', marginTop: 20}, sliderTrack: {height: 6, flex: 1, backgroundColor: '#E1E9E0', borderRadius: 4, justifyContent: 'center'}, sliderFill: {height: 6, backgroundColor: '#438C50', borderRadius: 4}, sliderThumb: {position: 'absolute', width: 15, height: 15, borderRadius: 8, backgroundColor: '#438C50'}, intensityValue: {width: 24, textAlign: 'right', fontSize: 13, fontWeight: '600', color: '#17231A'}, noteLabel: {marginTop: 28}, noteInput: {height: 92, marginTop: 10, padding: 11, borderRadius: 9, backgroundColor: '#F3F6F1', color: '#26342A', fontSize: 12}, counter: {alignSelf: 'flex-end', marginTop: -22, marginRight: 10, color: '#59635B', fontSize: 9}, saveButton: {height: 39, marginTop: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#438F51'}, saveText: {color: '#FFF', fontSize: 12, fontWeight: '700'}
})

export default MoodScreen