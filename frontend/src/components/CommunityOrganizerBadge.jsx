import React from 'react';
import { Image, StyleSheet } from 'react-native';

import organizerBadgeAsset from '../assets/images/community-organizer-badge.png';

const SIZE_MAP = {
  small: { width: 14, height: 14 },
  normal: { width: 16, height: 16 },
  profile: { width: 20, height: 20 },
};

const CommunityOrganizerBadge = ({
  role,
  isOrganizer,
  size = 'small',
  style,
  accessibilityLabel = 'Community Organizer',
  ...props
}) => {
  const shouldRender =
    typeof isOrganizer === 'boolean'
      ? isOrganizer
      : role === 'communityOrganizer';

  if (!shouldRender) {
    return null;
  }

  return (
    <Image
      source={organizerBadgeAsset}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={accessibilityLabel}
      style={[styles.badge, SIZE_MAP[size] || SIZE_MAP.small, style]}
      {...props}
    />
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
  },
});

export default CommunityOrganizerBadge;
