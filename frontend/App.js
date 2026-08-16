import React from 'react'
import {AuthProvider} from './src/context/AuthContext'
import RootNavigator from './src/navigation/RootNavigator'

const App = () => {
    return (
        <AuthProvider>
            <RootNavigator />
        </AuthProvider>
    )
}

export default App