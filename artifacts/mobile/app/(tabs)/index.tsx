import React from 'react';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useWorkouts } from '@/context/WorkoutContext';
import { StatCard } from '@/components/StatCard';
import { TotalsCard } from '@/components/TotalsCard';
import { WorkoutCard } from '@/components/WorkoutCard';
import { EmptyState } from '@/components/EmptyState';
import { LevelCard } from '@/components/LevelCard';
import { AchievementBadge } from '@/components/AchievementBadge';
import { Feather } from '@expo/vector-icons';
import { greetingForNow } from '@/lib/dateUtils';
import { formatHebrewDate } from '@/lib/hebrewDate';
import { ACHIEVEMENTS } from '@/lib/gamification';

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workouts, stats, isLoaded, deleteWorkout } = useWorkouts();
  const recent = workouts.slice(0, 3);
  const today = new Date();
  const englishDate = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(today);
  const hebrewDate = formatHebrewDate(today);
  const achievementTeaser = [
    ...ACHIEVEMENTS.filter((a) => stats.unlockedAchievementIds.includes(a.id)),
    ...ACHIEVEMENTS.filter((a) => !stats.unlockedAchievementIds.includes(a.id)),
  ].slice(0, 6);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete workout?',
      `"${name}" will be permanently removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWorkout(id),
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Platform.OS === 'web' ? 67 + 16 : insets.top + 16,
            paddingBottom: Platform.OS === 'web' ? 84 + 24 : 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              {greetingForNow()}
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Shai&apos;s Workout Log
            </Text>
            <View style={styles.dateRow}>
              <Text style={[styles.dateText, { color: colors.mutedForeground }]}>
                {englishDate}
              </Text>
              <Text style={[styles.dateDot, { color: colors.mutedForeground }]}>
                ·
              </Text>
              <Text style={[styles.hebrewDateText, { color: colors.mutedForeground }]}>
                {hebrewDate}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={() => router.push('/timer')}
            style={[styles.timerButton, { backgroundColor: colors.card, borderRadius: colors.radius }]}
            testID="open-timer"
          >
            <Feather name="clock" size={20} color={colors.primary} />
          </Pressable>
        </View>

        <LevelCard
          level={stats.level}
          xpIntoLevel={stats.xpIntoLevel}
          xpForNextLevel={stats.xpForNextLevel}
          levelProgress={stats.levelProgress}
          onPress={() => router.push('/achievements')}
        />

        <View style={styles.statsRow}>
          <StatCard
            icon="zap"
            label="Day Streak"
            value={String(stats.currentStreakDays)}
            accent
          />
          <StatCard
            icon="calendar"
            label="This Week"
            value={String(stats.thisWeekWorkouts)}
            tint="#4C8BF5"
          />
          <StatCard
            icon="award"
            label="Total"
            value={String(stats.totalWorkouts)}
            tint="#B084F5"
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Achievements
          </Text>
          <Pressable onPress={() => router.push('/achievements')} hitSlop={8}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>
              See All
            </Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.achievementRow}
        >
          {achievementTeaser.map((a) => (
            <AchievementBadge
              key={a.id}
              achievement={a}
              unlocked={stats.unlockedAchievementIds.includes(a.id)}
              compact
            />
          ))}
        </ScrollView>

        <TotalsCard
          volume={stats.lifetimeVolume}
          distance={stats.lifetimeDistance}
          onPress={() => router.push('/totals')}
        />

        <Pressable
          onPress={() => router.push('/workout/new')}
          style={({ pressed }) => [
            styles.startButton,
            {
              backgroundColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
          testID="start-workout-button"
        >
          <Feather name="play" size={18} color={colors.primaryForeground} />
          <Text
            style={[styles.startButtonText, { color: colors.primaryForeground }]}
          >
            Start Workout
          </Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Workouts
          </Text>
          {workouts.length > 0 && (
            <Pressable
              onPress={() => router.push('/(tabs)/history')}
              hitSlop={8}
            >
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                See All
              </Text>
            </Pressable>
          )}
        </View>

        {!isLoaded ? null : recent.length === 0 ? (
          <EmptyState
            icon="activity"
            title="No workouts yet"
            subtitle="Start your first session and it will show up here."
          />
        ) : (
          <View style={styles.list}>
            {recent.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onPress={() => router.push(`/workout/${workout.id}`)}
                onDelete={() => handleDelete(workout.id, workout.name)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  greeting: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  dateText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  dateDot: {
    fontSize: 13,
  },
  hebrewDateText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  timerButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  achievementRow: {
    gap: 12,
    paddingRight: 8,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 56,
  },
  startButtonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  seeAll: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  list: {
    gap: 12,
  },
});
