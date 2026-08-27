import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles, { COLORS } from '../styles/volunteerDashboardStyles';

export default function VolunteerSessionCard({ session, onPress }) {
  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.dateBox}>
        <Text style={styles.dateMonth}>{session.month}</Text>
        <Text style={styles.dateDay}>{session.day}</Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{session.name}</Text>
        <Text style={styles.requestMeta}>
          {session.category} · {session.time}
        </Text>
      </View>
      <View style={styles.chatIconBox}>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color={COLORS.green} />
      </View>
    </TouchableOpacity>
  );
}
