import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';

interface LevelCardProps {
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  levelProgress: number;
  onPress: () => void;
}

// A distinct "reward" palette (gold/ember) — deliberately separate from the
// app's calm Volt Log surfaces so XP and levels read as a celebratory layer.
const GOLD_GRADIENT = ['#FFD166', '#FF8A3D'] as const;

export function LevelCard({
  level,
  xpIntoLevel,
  xpForNextLevel,
  levelProgress,
  onPress,
}: LevelCardProps) {
  const colors = useColors();
  const progress = Math.max(0, Math.min(1, levelProgress));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderRadius: colors.radius,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
      testID="level-card"
    >
      <LinearGradient
        colors={GOLD_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.badge}
      >
        <Feather name="zap" size={13} color="#5A3200" style={styles.badgeIcon} />
        <Text style={styles.badgeText}>{level}</Text>
      </LinearGradient>

      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>
            Level {level}
          </Text>
          <Text style={[styles.xpText, { color: colors.mutedForeground }]}>
            {xpIntoLevel}/{xpForNextLevel} XP
          </Text>
        </View>
        <View style={[styles.track, { backgroundColor: colors.secondary }]}>
          <LinearGradient
            colors={GOLD_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.fill, { width: `${progress * 100}%` }]}
          />
        </View>
      </View>

      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeIcon: {
    position: 'absolute',
    top: 4,
    right: 6,
  },
  badgeText: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    color: '#5A3200',
  },
  middle: {
    flex: 1,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  xpText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  track: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 4,
  },
});
