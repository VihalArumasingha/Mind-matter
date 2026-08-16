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

    useEffect(() => {
        restoreSession()
    }, [])

    const restoreSession = async () => {
        try {
            const credentials = await Keychain.getGenericPassword()

            if (!credentials) {
                setIsLoading(false)
                return
            }

            const storedToken = credentials.password

            const data = await getCurrentUser(storedToken)

            setToken(storedToken)
            setUser(data.user)
        } catch (error) {
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