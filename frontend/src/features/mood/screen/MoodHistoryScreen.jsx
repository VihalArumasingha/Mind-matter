import React, {useEffect, useMemo, useState} from 'react'
import {ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native'
import {SafeAreaView} from 'react-native-safe-area-context'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {useAuth} from '../../../context/AuthContext'
import {getMoods} from '../services/moodService'

const MOOD_META = {
    1: {label: 'Very Bad', icon: 'emoticon-dead-outline', color: '#D96A5D', background: '#F7D8D2'},
    2: {label: 'Bad', icon: 'emoticon-sad-outline', color: '#E98C32', background: '#FBE3B0'},
    3: {label: 'Okay', icon: 'emoticon-neutral-outline', color: '#D8A92D', background: '#FFF0B9'},
    4: {label: 'Good', icon: 'emoticon-happy-outline', color: '#4D9B5D', background: '#D6EBC0'},
    5: {label: 'Great', icon: 'emoticon-excited-outline', color: '#5A8061', background: '#DDEBDD'}
}

const PERIODS = {Week: 7, Month: 30, Year: 365}

const formatDate = date => new Date(date).toLocaleDateString('en-GB', {day: 'numeric', month: 'short', year: 'numeric'})

const MoodHistoryScreen = ({navigation}) => {
    const {token} = useAuth()
    const [period, setPeriod] = useState('Week')
    const [moods, setMoods] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const loadHistory = async () => {
            try {
                if (token) setMoods((await getMoods(token)).moods || [])
            } catch (error) {
                Alert.alert('Unable to load history', error.message)
            } finally {
                setIsLoading(false)
            }
        }
        loadHistory()
    }, [token])

    const visibleMoods = useMemo(() => {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - PERIODS[period])
        return moods.filter(entry => new Date(entry.entryDate) >= cutoff)
    }, [moods, period])

    const chartMoods = [...visibleMoods].reverse().slice(-7)
    const chartPoints = chartMoods.map((entry, index) => ({
        entry,
        left: chartMoods.length < 2 ? 50 : (index / (chartMoods.length - 1)) * 92 + 4,
        top: 82 - ((entry.mood - 1) / 4) * 64
    }))

    if (isLoading) return <SafeAreaView style={styles.safeArea}><ActivityIndicator color="#3D8650" style={styles.loader} /></SafeAreaView>

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <Pressable onPress={() => navigation.goBack()} hitSlop={10}><MaterialCommunityIcons name="arrow-left" size={25} color="#1C281F" /></Pressable>
                <Text style={styles.headerTitle}>Mood History</Text>
                <MaterialCommunityIcons name="calendar-month-outline" size={25} color="#1C281F" />
            </View>
            <View style={styles.periodRow}>
                {Object.keys(PERIODS).map(item => <Pressable key={item} style={[styles.period, period === item && styles.periodActive]} onPress={() => setPeriod(item)}><Text style={[styles.periodText, period === item && styles.periodTextActive]}>{item}</Text></Pressable>)}
            </View>
            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                <Text style={styles.rangeTitle}>{period === 'Week' ? 'This Week' : `${period} overview`}</Text>
                <Text style={styles.rangeDate}>{period === 'Week' ? 'Last 7 days' : `${visibleMoods.length} check-ins`}</Text>
                <View style={styles.chart}>
                    {[1, 2, 3, 4, 5].map(level => <View key={level} style={[styles.gridLine, {top: 20 + (5 - level) * 16}]} />)}
                    {chartPoints.slice(1).map((point, index) => {
                        const previous = chartPoints[index]
                        const width = Math.sqrt((point.left - previous.left) ** 2 + (point.top - previous.top) ** 2)
                        const angle = Math.atan2(point.top - previous.top, point.left - previous.left) * 180 / Math.PI
                        return <View key={`${point.entry._id}-line`} style={[styles.chartLine, {width, left: `${previous.left}%`, top: previous.top, transform: [{rotate: `${angle}deg`}]}]} />
                    })}
                    {chartPoints.map(point => <View key={point.entry._id} style={[styles.chartPoint, {left: `${point.left}%`, top: point.top - 5, backgroundColor: MOOD_META[point.entry.mood].color}]} />)}
                    <View style={styles.chartLabels}>{chartPoints.map((point, index) => <Text key={`${point.entry._id}-label`} style={styles.chartLabel}>{new Date(point.entry.entryDate).toLocaleDateString('en-US', {weekday: 'short'})}</Text>)}</View>
                </View>

                {visibleMoods.length === 0 ? <View style={styles.empty}><MaterialCommunityIcons name="chart-line" size={38} color="#9AAD9A" /><Text style={styles.emptyTitle}>No check-ins yet</Text><Text style={styles.emptyText}>Save your first mood today to start seeing your patterns.</Text></View> : visibleMoods.map(entry => {
                    const meta = MOOD_META[entry.mood] || MOOD_META[3]
                    return <View key={entry._id} style={styles.entry}>
                        <View style={[styles.entryFace, {backgroundColor: meta.background}]}><MaterialCommunityIcons name={meta.icon} size={24} color={meta.color} /></View>
                        <View style={styles.entryBody}><Text style={styles.entryDate}>{formatDate(entry.entryDate)}</Text><Text style={styles.entryMood}>{meta.label}</Text><Text style={styles.entryDetail}>Intensity {entry.intensity}</Text><Text style={styles.entryNote} numberOfLines={1}>{entry.note || 'No note added.'}</Text></View>
                        <MaterialCommunityIcons name="chevron-right" size={20} color="#667168" />
                    </View>
                })}
            </ScrollView>
            <View style={styles.bottomNav}>
                {[['home-outline', 'Feed', 'Home'], ['account-group-outline', 'Communities', 'Communities'], ['calendar-outline', 'Events', 'Home'], ['emoticon', 'Mood', 'Mood'], ['account-outline', 'Profile', 'Profile']].map(([icon, label, route]) => <Pressable key={label} style={styles.navItem} onPress={() => route === 'Mood' ? navigation.goBack() : navigation.navigate('UserTabs', {screen: route})}><MaterialCommunityIcons name={icon} size={20} color={label === 'Mood' ? '#438F51' : '#647066'} /><Text style={[styles.navLabel, label === 'Mood' && styles.navLabelActive]}>{label}</Text></Pressable>)}
            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    safeArea: {flex: 1, backgroundColor: '#F4F7EF'}, loader: {flex: 1}, header: {height: 58, paddingHorizontal: 17, flexDirection: 'row', alignItems: 'center'}, headerTitle: {flex: 1, marginLeft: 15, fontSize: 18, fontWeight: '600', color: '#17231A'}, periodRow: {flexDirection: 'row', paddingHorizontal: 15, gap: 8}, period: {flex: 1, height: 30, borderRadius: 17, backgroundColor: '#F0F2EE', alignItems: 'center', justifyContent: 'center'}, periodActive: {backgroundColor: '#438F51'}, periodText: {fontSize: 11, color: '#26342A'}, periodTextActive: {color: '#FFF', fontWeight: '700'}, content: {padding: 16, paddingBottom: 20}, rangeTitle: {textAlign: 'center', marginTop: 12, fontSize: 13, fontWeight: '700', color: '#17231A'}, rangeDate: {textAlign: 'center', marginTop: 3, fontSize: 10, color: '#687068'}, chart: {height: 150, marginTop: 10, position: 'relative', overflow: 'hidden'}, gridLine: {position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: '#E2E9DF'}, chartLine: {position: 'absolute', height: 1.5, backgroundColor: '#57A15E', transformOrigin: 'left center'}, chartPoint: {position: 'absolute', width: 8, height: 8, borderRadius: 4, borderWidth: 1, borderColor: '#FFF'}, chartLabels: {position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around'}, chartLabel: {fontSize: 9, color: '#566159'}, entry: {minHeight: 76, marginBottom: 7, padding: 11, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.86)', flexDirection: 'row', alignItems: 'center'}, entryFace: {width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'}, entryBody: {flex: 1, marginLeft: 11}, entryDate: {fontSize: 10, color: '#687068'}, entryMood: {marginTop: 2, fontSize: 13, color: '#17231A', fontWeight: '600'}, entryDetail: {marginTop: 2, fontSize: 10, color: '#536057'}, entryNote: {marginTop: 2, fontSize: 10, color: '#536057'}, empty: {alignItems: 'center', paddingVertical: 38}, emptyTitle: {marginTop: 10, color: '#344437', fontWeight: '700'}, emptyText: {marginTop: 5, textAlign: 'center', color: '#687068', fontSize: 12}, bottomNav: {height: 62, borderTopWidth: 1, borderTopColor: '#E0E7DE', backgroundColor: '#FFF', flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8}, navItem: {alignItems: 'center', width: '20%'}, navLabel: {marginTop: 3, fontSize: 9, color: '#647066'}, navLabelActive: {color: '#438F51', fontWeight: '700'}
})

export default MoodHistoryScreen
