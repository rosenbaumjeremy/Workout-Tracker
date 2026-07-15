import React from 'react';
import { Platform, ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { aggregateExerciseTotals, useWorkouts } from '@/context/WorkoutContext';
import { EmptyState } from '@/components/EmptyState';
import { Feather } from '@expo/vector-icons';

export default function TotalsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workouts, stats } = useWorkouts();
  const { strength, cardio } = aggregateExerciseTotals(workouts);

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
        <Pressable onPress={() => router.back()} hitSlop={10} testID="back-button">
          <Feather name="chevron-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Lifetime Totals
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroRow}>
          <View
            style={[styles.hero, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <Feather name="trending-up" size={20} color={colors.primary} />
            <Text style={[styles.heroValue, { color: colors.foreground }]}>
              {Math.round(stats.lifetimeVolume).toLocaleString()}
            </Text>
            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              lb lifted
            </Text>
          </View>
          <View
            style={[styles.hero, { backgroundColor: colors.card, borderRadius: colors.radius }]}
          >
            <Feather name="wind" size={20} color={colors.primary} />
            <Text style={[styles.heroValue, { color: colors.foreground }]}>
              {stats.lifetimeDistance.toFixed(1)}
            </Text>
            <Text style={[styles.heroLabel, { color: colors.mutedForeground }]}>
              mi run
            </Text>
          </View>
        </View>

        {strength.length === 0 && cardio.length === 0 ? (
          <EmptyState
            icon="bar-chart-2"
            title="No totals yet"
            subtitle="Finish a workout and your lifetime totals will show up here."
          />
        ) : (
          <>
            {strength.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Lifted
                </Text>
                <View
                  style={[
                    styles.list,
                    { backgroundColor: colors.card, borderRadius: colors.radius },
                  ]}
                >
                  {strength.map((item, index) => (
                    <View
                      key={item.name}
                      style={[
                        styles.row,
                        index > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowName, { color: colors.foreground }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                          {item.sets} {item.sets === 1 ? 'set' : 'sets'}
                        </Text>
                      </View>
                      <Text style={[styles.rowValue, { color: colors.foreground }]}>
                        {Math.round(item.volume).toLocaleString()} lb
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {cardio.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  Ran
                </Text>
                <View
                  style={[
                    styles.list,
                    { backgroundColor: colors.card, borderRadius: colors.radius },
                  ]}
                >
                  {cardio.map((item, index) => (
                    <View
                      key={item.name}
                      style={[
                        styles.row,
                        index > 0 && {
                          borderTopWidth: StyleSheet.hairlineWidth,
                          borderTopColor: colors.border,
                        },
                      ]}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowName, { color: colors.foreground }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.rowSub, { color: colors.mutedForeground }]}>
                          {item.sets} {item.sets === 1 ? 'session' : 'sessions'}
                        </Text>
                      </View>
                      <Text style={[styles.rowValue, { color: colors.foreground }]}>
                        {item.distance.toFixed(2)} mi
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </>
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
  headerTitle: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  content: {
    padding: 20,
    gap: 24,
  },
  heroRow: {
    flexDirection: 'row',
    gap: 10,
  },
  hero: {
    flex: 1,
    padding: 18,
    gap: 6,
    alignItems: 'flex-start',
  },
  heroValue: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  heroLabel: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  list: {
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  rowName: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  rowSub: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
});
