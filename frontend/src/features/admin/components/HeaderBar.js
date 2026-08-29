import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { COLORS } from '../styles/adminStyles';

const HeaderBar = ({ toggleSidebar, title }) => {
  const statusBarHeight = Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 10;

  return (
    <View style={{ 
      backgroundColor: COLORS.primary, 
      paddingTop: statusBarHeight + 8,
      paddingBottom: 16,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    }}>
      <TouchableOpacity
        onPress={toggleSidebar}
        activeOpacity={0.7}
        hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
      >
        <Text style={{ fontSize: 28, color: '#FFFFFF' }}>☰</Text>
      </TouchableOpacity>
      <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', marginLeft: 12 }} numberOfLines={1}>
        {title || 'MindMatter Mental Health Admin Portal'}
      </Text>
      
    </View>
  );
};

export default HeaderBar;