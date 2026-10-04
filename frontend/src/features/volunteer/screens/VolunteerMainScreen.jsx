import React, { useState, useEffect, useContext, createContext, useCallback } from 'react';
import { BackHandler } from 'react-native';
import VolunteerDashboardScreen from './VolunteerDashboardScreen';
import VolunteerAvailabilityScreen from './VolunteerAvailabilityScreen';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerMessagesScreen from './VolunteerMessagesScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

export const VolunteerTabContext = createContext({
  setTab: () => {},
  goBack: () => {},
  activeTab: 'dashboard',
});

export function useVolunteerTab() {
  return useContext(VolunteerTabContext);
}

export default function VolunteerMainScreen({ navigation, route }) {
  const parseTabFromRoute = (routeName) => {
    if (!routeName) return 'dashboard';
    const normalized = routeName.toLowerCase().replace('volunteer', '');
    if (normalized.includes('availability')) return 'availability';
    if (normalized.includes('request') || normalized.includes('session')) return 'requests';
    if (normalized.includes('message')) return 'messages';
    if (normalized.includes('profile')) return 'profile';
    return 'dashboard';
  };

  const initialTab = parseTabFromRoute(route?.name);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [tabHistory, setTabHistory] = useState([initialTab]);

  useEffect(() => {
    if (route?.name) {
      const tab = parseTabFromRoute(route.name);
      setActiveTab(tab);
      setTabHistory((prev) => {
        if (prev[prev.length - 1] === tab) return prev;
        return [...prev, tab];
      });
    }
  }, [route?.name]);

  const goBack = useCallback(() => {
    if (tabHistory.length > 1) {
      const nextHistory = [...tabHistory];
      nextHistory.pop(); // remove current active tab
      const previousTab = nextHistory[nextHistory.length - 1];
      setTabHistory(nextHistory);
      setActiveTab(previousTab);
      return true;
    } else if (activeTab !== 'dashboard') {
      setActiveTab('dashboard');
      setTabHistory(['dashboard']);
      return true;
    } else if (navigation?.canGoBack && navigation.canGoBack()) {
      navigation.goBack();
      return true;
    }
    return false;
  }, [tabHistory, activeTab, navigation]);

  useEffect(() => {
    const onBackPress = () => {
      return goBack();
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [goBack]);

  const setTab = useCallback((tabName) => {
    const tab = parseTabFromRoute(tabName);
    if (tab === activeTab) return;
    setActiveTab(tab);
    setTabHistory((prev) => {
      // If user explicitly clicks the main 'dashboard' tab, reset history to dashboard root
      if (tab === 'dashboard') {
        return ['dashboard'];
      }
      if (prev[prev.length - 1] === tab) return prev;
      return [...prev, tab];
    });
  }, [activeTab]);

  const renderScreen = () => {
    switch (activeTab) {
      case 'availability':
        return (
          <VolunteerAvailabilityScreen
            navigation={navigation}
            onTabChange={setTab}
            onGoBack={goBack}
          />
        );
      case 'requests':
        return (
          <VolunteerRequestsScreen
            navigation={navigation}
            onTabChange={setTab}
            onGoBack={goBack}
          />
        );
      case 'messages':
        return (
          <VolunteerMessagesScreen
            navigation={navigation}
            onTabChange={setTab}
            onGoBack={goBack}
          />
        );
      case 'profile':
        return (
          <VolunteerProfileScreen
            navigation={navigation}
            onTabChange={setTab}
            onGoBack={goBack}
          />
        );
      case 'dashboard':
      default:
        return (
          <VolunteerDashboardScreen
            navigation={navigation}
            route={route}
            onTabChange={setTab}
            onGoBack={goBack}
          />
        );
    }
  };

  return (
    <VolunteerTabContext.Provider value={{ setTab, goBack, activeTab }}>
      {renderScreen()}
    </VolunteerTabContext.Provider>
  );
}
