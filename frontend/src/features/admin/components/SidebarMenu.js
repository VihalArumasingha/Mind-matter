import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { adminStyles, COLORS } from '../styles/adminStyles';

const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '•' },
  { id: 'users', label: 'Users', icon: '•' },
  { id: 'professionals', label: 'Professionals', icon: '•', badgeKey: 'pendingPros' },
  { id: 'communities', label: 'Communities / Groups', icon: '•' },
  { id: 'posts', label: 'Posts', icon: '•' },
  { id: 'reports', label: 'Reports', icon: '•', badgeKey: 'openReports' },
  { id: 'analytics', label: 'Analytics', icon: '•' },
  { id: 'broadcasts', label: 'Broadcasts', icon: '•' },
  { id: 'settings', label: 'Settings', icon: '•' },
  { id: 'audit-logs', label: 'Audit Logs', icon: '•' }
];

const SidebarMenu = ({ activeTab, onSelectTab, onClose, badges = {} }) => {
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 10;
  
  const sidebarBg = COLORS.primary || '#006B3F'; 

  return (
    <View 
      style={[
        adminStyles.sidebarDrawer, 
        { 
          backgroundColor: sidebarBg, 
          paddingTop: statusBarHeight + 12,
          paddingHorizontal: 16,
          flex: 1
        }
      ]}
    >
      {/* Brand Header */}
      <View 
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 16,
          marginBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: 'rgba(255, 255, 255, 0.15)',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View 
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: '#FFFFFF',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
              shadowColor: 'transparent',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 4,
              elevation: 3,
            }}
          >
            <Text style={{ color: sidebarBg, fontSize: 20, fontWeight: '800' }}>M</Text>
          </View>
          <View>
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.3 }}>
              MindMatter
            </Text>
            <Text style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: 10, fontWeight: '600', letterSpacing: 1.2 }}>
              ADMIN PANEL
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: 'rgba(255, 255, 255, 0.15)',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={onClose}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '600' }}>✕</Text>
        </TouchableOpacity>
      </View>

      {/* Menu List */}
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        {MENU_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          const badgeCount = item.badgeKey ? badges[item.badgeKey] : 0;

          return (
            <TouchableOpacity
              key={item.id}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderRadius: 10,
                marginVertical: 3,
                backgroundColor: isActive ? 'rgba(255, 255, 255, 0.22)' : 'transparent',
              }}
              onPress={() => onSelectTab(item.id)}
              activeOpacity={0.7}
            >
              <Text 
                style={{
                  color: isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.7)',
                  fontSize: 16,
                  marginRight: 12,
                }}
              >
                {item.icon}
              </Text>

              <Text 
                style={{
                  flex: 1,
                  color: '#FFFFFF',
                  fontSize: 14,
                  fontWeight: isActive ? '700' : '500',
                  letterSpacing: 0.2,
                }}
              >
                {item.label}
              </Text>

              {badgeCount > 0 && (
                <View 
                  style={{
                    backgroundColor: '#FFFFFF',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 12,
                    minWidth: 22,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: sidebarBg, fontSize: 11, fontWeight: '700' }}>
                    {badgeCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User Profile Footer */}
      <View 
        style={{
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.15)',
          paddingTop: 14,
          paddingBottom: 20,
          marginTop: 8,
        }}
      >
        <Text style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: 11 }}>Logged in as Admin</Text>
        <Text style={{ color: '#FFFFFF', fontSize: 13, fontWeight: '700', marginTop: 2 }}>
          System Administrator
        </Text>
      </View>
    </View>
  );
};

export default SidebarMenu;