import React from 'react'
import {StyleSheet, View} from 'react-native'
import {useAuth} from '../../../context/AuthContext'
import TherapistApplicationForm from '../../admin/therapist/TherapistApplicationForm'

const OrganizerApplicationScreen = ({navigation}) => {
    const {user} = useAuth()

    return (
        <View style={styles.container}>
            <TherapistApplicationForm
                userId={user?.id}
                applicationType="organizer"
                onSubmitted={() => navigation.goBack()}
                onClose={() => navigation.goBack()}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F0FDFA',
    },
})

export default OrganizerApplicationScreen
