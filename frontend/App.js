import React from 'react'
import {AuthProvider} from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

const App = () => {
    console.log('[App] Component rendering')
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    )
}

export default App
