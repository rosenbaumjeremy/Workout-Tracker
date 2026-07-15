import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import type { Achievement } from '@/lib/gamification';

const GOLD_GRADIENT = ['#FFD166', '#FF8A3D'] as const;

interface AchievementBadgeProps {
  achievement: Achievement;
  unlocked: boolean;
  /** Compact renders just the circle + short label, for horizontal teasers. */
  compact?: boolean;
}

export function AchievementBadge({
  achievement,
  unlocked,
  compact,
}: AchievementBadgeProps) {
  const colors = useColors();
  const iconName = achievement.icon as keyof typeof Feather.glyphMap;

  const circle = unlocked ? (
    <LinearGradient
      colors={GOLD_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.circle, compact && styles.circleCompact]}
    >
      <Feather name={iconName} size={compact ? 18 : 22} color="#5A3200" />
    </LinearGradient>
  ) : (
    <View
      style={[
        styles.circle,
        compact && styles.circleCompact,
        { backgroundColor: colors.secondary },
      ]}
    >
      <Feather
        name={iconName}
        size={compact ? 18 : 22}
        color={colors.mutedForeground}
        style={{ opacity: 0.5 }}
      />
      <View style={[styles.lockBadge, { backgroundColor: colors.muted, borderColor: colors.card }]}>
        <Feather name="lock" size={9} color={colors.mutedForeground} />
      </View>
    </View>
  );

  if (compact) {
    return (
      <View style={styles.compactWrap}>
        {circle}
        <Text
          numberOfLines={1}
          style={[
            styles.compactLabel,
            { color: unlocked ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {achievement.title}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.fullCard,
        { backgroundColor: colors.card, borderRadius: colors.radius },
      ]}
    >
      {circle}
      <View style={{ flex: 1 }}>
        <Text
          style={[
            styles.fullTitle,
            { color: unlocked ? colors.foreground : colors.mutedForeground },
          ]}
        >
          {achievement.title}
        </Text>
        <Text style={[styles.fullDesc, { color: colors.mutedForeground }]}>
          {achievement.description}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompact: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactWrap: {
    width: 72,
    alignItems: 'center',
    gap: 6,
  },
  compactLabel: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  fullCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  fullTitle: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  fullDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});
