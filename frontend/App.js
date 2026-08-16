import React from 'react'
import {SafeAreaView, Text} from 'react-native'
import Config from 'react-native-config'

const App = () => {
    return (
        <SafeAreaView>
            <Text>{Config.API_BASE_URL}</Text>
        </SafeAreaView>
    )
}

export default App