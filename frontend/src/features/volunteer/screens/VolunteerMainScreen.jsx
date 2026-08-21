import React, { useState, useEffect, useContext, createContext } from 'react';
import VolunteerDashboardScreen from './VolunteerDashboardScreen';
import VolunteerAvailabilityScreen from './VolunteerAvailabilityScreen';
import VolunteerRequestsScreen from './VolunteerRequestsScreen';
import VolunteerMessagesScreen from './VolunteerMessagesScreen';
import VolunteerProfileScreen from './VolunteerProfileScreen';

export const VolunteerTabContext = createContext({ setTab: () => {} });

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

  const [activeTab, setActiveTab] = useState(() => parseTabFromRoute(route?.name));

  useEffect(() => {
    if (route?.name) {
      const tab = parseTabFromRoute(route.name);
      setActiveTab(tab);
    }
  }, [route?.name]);

  const setTab = (tabName) => {
    const tab = parseTabFromRoute(tabName);
    setActiveTab(tab);
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'availability':
        return (
          <VolunteerAvailabilityScreen
            navigation={navigation}
            onTabChange={setTab}
          />
        );
      case 'requests':
        return (
          <VolunteerRequestsScreen
            navigation={navigation}
            onTabChange={setTab}
          />
        );
      case 'messages':
        return (
          <VolunteerMessagesScreen
            navigation={navigation}
            onTabChange={setTab}
          />
        );
      case 'profile':
        return (
          <VolunteerProfileScreen
            navigation={navigation}
            onTabChange={setTab}
          />
        );
      case 'dashboard':
      default:
        return (
          <VolunteerDashboardScreen
            navigation={navigation}
            onTabChange={setTab}
          />
        );
    }
  };

  return (
    <VolunteerTabContext.Provider value={{ setTab, activeTab }}>
      {renderScreen()}
    </VolunteerTabContext.Provider>
  );
}
