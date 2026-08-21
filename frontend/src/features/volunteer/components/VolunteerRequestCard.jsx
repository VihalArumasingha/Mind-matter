import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import styles, { COLORS } from '../styles/volunteerDashboardStyles';

export default function VolunteerRequestCard({ request, onPress }) {
  return (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.avatarSmall, { backgroundColor: request.avatarBg }]}>
        <Text style={[styles.avatarSmallText, { color: request.avatarColor }]}>
          {request.initials}
        </Text>
      </View>
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{request.name}</Text>
        <Text style={styles.requestMeta}>
          {request.category} · {request.time}
        </Text>
      </View>
      <View style={styles.chevronBox}>
        <Ionicons name="chevron-forward" size={16} color={COLORS.green} />
      </View>
    </TouchableOpacity>
  );
}
