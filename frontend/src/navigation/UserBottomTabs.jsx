import React from 'react'
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs'
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons'
import {useLanguage} from '../context/LanguageContext'

import UserHomeScreen from '../features/userHome/screens/UserHomeScreen'
import CommunitiesScreen from '../features/userCommunities/screens/CommunitiesScreen'
import CreatePostScreen from '../features/posts/screens/CreatePostScreen'
import MoodScreen from '../features/mood/screen/MoodScreen'
import ProfileScreen from '../features/profile/screens/ProfileScreen'

const Tab = createBottomTabNavigator()

const UserBottomTabs = () => {
    const {t} = useLanguage()
    console.log('[UserBottomTabs] Component rendering')
    return (
        <Tab.Navigator
            screenOptions={({route}) => ({
                headerShown: false,

                tabBarActiveTintColor: '#4E8C4A',
                tabBarInactiveTintColor: '#8A918A',

                tabBarLabelStyle: {
                    fontSize: 11,
                    fontWeight: '600',
                },

                tabBarIcon: ({focused, color, size}) => {
                    let iconName

                    switch (route.name) {
                        case 'Home':
                            iconName = focused
                                ? 'home'
                                : 'home-outline'
                            break

                        case 'Communities':
                            iconName = focused
                                ? 'account-group'
                                : 'account-group-outline'
                            break

                        case 'Create':
                            iconName = focused
                                ? 'plus-circle'
                                : 'plus-circle-outline'
                            break

                        case 'Mood':
                            iconName = focused
                                ? 'emoticon'
                                : 'emoticon-outline'
                            break

                        case 'Profile':
                            iconName = focused
                                ? 'account'
                                : 'account-outline'
                            break
                    }

                    return (
                        <MaterialCommunityIcons
                            name={iconName}
                            size={size}
                            color={color}
                        />
                    )
                },
            })}>
            <Tab.Screen
                name="Home"
                component={UserHomeScreen}
                options={{tabBarLabel: t('home')}}
            />

            <Tab.Screen
                name="Communities"
                component={CommunitiesScreen}
                options={{tabBarLabel: t('communities')}}
            />

            <Tab.Screen
                name="Create"
                component={CreatePostScreen}
                options={{tabBarLabel: t('create')}}
            />

            <Tab.Screen
                name="Mood"
                component={MoodScreen}
                options={{tabBarLabel: t('mood')}}
            />

            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
                options={{tabBarLabel: t('profile')}}
            />
        </Tab.Navigator>
    )
}

export default UserBottomTabs