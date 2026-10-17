import React from 'react'
import {SafeAreaProvider} from 'react-native-safe-area-context'
import {AuthProvider} from './src/context/AuthContext'
import {LanguageProvider} from './src/context/LanguageContext'
import RootNavigator from './src/navigation/RootNavigator'

const App = () => {
    return (
        <SafeAreaProvider style={{flex: 1}}>
            <AuthProvider>
                <LanguageProvider>
                <RootNavigator />
                </LanguageProvider>
            </AuthProvider>
        </SafeAreaProvider>
    )
}

export default App