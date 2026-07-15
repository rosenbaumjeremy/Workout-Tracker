import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWorkouts } from '@/context/WorkoutContext';
import { AchievementBadge } from '@/components/AchievementBadge';
import { ACHIEVEMENTS } from '@/lib/gamification';
import { Feather } from '@expo/vector-icons';

export default function AchievementsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { stats } = useWorkouts();

  const unlocked = ACHIEVEMENTS.filter((a) =>
    stats.unlockedAchievementIds.includes(a.id),
  );
  const locked = ACHIEVEMENTS.filter(
    (a) => !stats.unlockedAchievementIds.includes(a.id),
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === 'web' ? 24 : insets.top + 8,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} testID="achievements-back">
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Achievements
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 32 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryValue, { color: colors.foreground }]}>
            {unlocked.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>
            of {ACHIEVEMENTS.length} unlocked
          </Text>
        </View>

        {unlocked.length > 0 && (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
              UNLOCKED
            </Text>
            <View style={styles.list}>
              {unlocked.map((a) => (
                <AchievementBadge key={a.id} achievement={a} unlocked />
              ))}
            </View>
          </View>
        )}

        {locked.length > 0 && (
          <View style={styles.group}>
            <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
              LOCKED
            </Text>
            <View style={styles.list}>
              {locked.map((a) => (
                <AchievementBadge key={a.id} achievement={a} unlocked={false} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  summaryValue: {
    fontSize: 34,
    fontFamily: 'Inter_700Bold',
  },
  summaryLabel: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  list: {
    gap: 10,
  },
});
