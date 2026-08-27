import React, { createContext, useContext, useEffect, useState } from 'react'
import * as Keychain from 'react-native-keychain'
import {
    getCurrentUser,
    loginUser as loginRequest,
    logoutUser as logoutRequest,
} from '../features/authentication/services/authService'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        console.log('[AuthContext] Component mounted, starting session restore...')
        restoreSession()
    }, [])

    const restoreSession = async () => {
        try {
            console.log('[AuthContext] Starting session restore...')
            const credentials = await Keychain.getGenericPassword()

            if (!credentials) {
                console.log('[AuthContext] No credentials found, user not logged in')
                setIsLoading(false)
                return
            }

            const storedToken = credentials.password
            console.log('[AuthContext] Found credentials, fetching current user...')

            const data = await getCurrentUser(storedToken)

            setToken(storedToken)
            setUser(data.user)
            console.log('[AuthContext] Session restored successfully')
        } catch (error) {
            console.log('[AuthContext] Session restore error:', error)
            setError(error.message)
            await Keychain.resetGenericPassword()
            setToken(null)
            setUser(null)
        } finally {
            setIsLoading(false)
        }
    }

    const login = async ({ email, password }) => {
        const data = await loginRequest({
            email,
            password,
        })

        await Keychain.setGenericPassword('mindmatter', data.token)

        setToken(data.token)
        setUser(data.user)

        return data
    }

    const logout = async () => {
        try {
            if (token) {
                await logoutRequest(token)
            }
        } catch (error) {
            console.log('[Logout Error]', error.message)
        } finally {
            await Keychain.resetGenericPassword()
            setToken(null)
            setUser(null)
        }
    }

    const updateUser = updatedUser => {
        setUser(updatedUser)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                token,
                isLoading,
                error,
                isAuthenticated: !!user,
                login,
                logout,
                updateUser,
            }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)

    if (!context) {
        throw new Error('useAuth must be used inside AuthProvider')
    }

    return context
}

export default AuthContext