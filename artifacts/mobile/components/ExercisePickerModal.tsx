import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import {
  isRunningExercise,
  looksLikeCardio,
  RUN_TYPES,
  searchExercises,
  type RunType,
} from '@/constants/exercises';
import { useWorkouts } from '@/context/WorkoutContext';
import * as Haptics from 'expo-haptics';

export interface ExerciseSelectOptions {
  runType?: RunType;
  repeatCount?: number;
  repeatDistance?: number;
}

interface ExercisePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (name: string, isCardio: boolean, options?: ExerciseSelectOptions) => void;
}

type ViewState =
  | { mode: 'list' }
  | { mode: 'runOptions'; name: string }
  | { mode: 'runInterval'; name: string };

export function ExercisePickerModal({
  visible,
  onClose,
  onSelect,
}: ExercisePickerModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { workouts } = useWorkouts();
  const [query, setQuery] = useState('');
  const [view, setView] = useState<ViewState>({ mode: 'list' });
  const [repeatCount, setRepeatCount] = useState('6');
  const [repeatDistance, setRepeatDistance] = useState('0.25');

  const groups = searchExercises(query);

  const frequentExercises = useMemo(() => {
    const counts = new Map<string, { count: number; isCardio: boolean }>();
    for (const workout of workouts) {
      for (const exercise of workout.exercises) {
        const entry = counts.get(exercise.name) ?? {
          count: 0,
          isCardio: !!exercise.isCardio,
        };
        entry.count += 1;
        counts.set(exercise.name, entry);
      }
    }
    return Array.from(counts.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [workouts]);

  const reset = () => {
    setQuery('');
    setView({ mode: 'list' });
    setRepeatCount('6');
    setRepeatDistance('0.25');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const finishSelect = (
    name: string,
    isCardio: boolean,
    options?: ExerciseSelectOptions,
  ) => {
    if (Platform.OS !== 'web') Haptics.selectionAsync();
    onSelect(name, isCardio, options);
    reset();
  };

  const handlePickExercise = (name: string, isCardio: boolean) => {
    if (isRunningExercise(name)) {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setView({ mode: 'runOptions', name });
      return;
    }
    finishSelect(name, isCardio);
  };

  const handleAddCustom = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    handlePickExercise(trimmed, looksLikeCardio(trimmed));
  };

  const handleRunTypeSelect = (name: string, runType: RunType) => {
    if (runType === 'Interval') {
      if (Platform.OS !== 'web') Haptics.selectionAsync();
      setView({ mode: 'runInterval', name });
      return;
    }
    finishSelect(name, true, { runType });
  };

  const handleConfirmIntervals = (name: string) => {
    const count = Math.max(1, Math.round(Number(repeatCount) || 1));
    const distance = Math.max(0, Number(repeatDistance) || 0);
    finishSelect(name, true, {
      runType: 'Interval',
      repeatCount: count,
      repeatDistance: distance,
    });
  };

  const isRunOptions = view.mode === 'runOptions';
  const isRunInterval = view.mode === 'runInterval';
  const showingRunFlow = isRunOptions || isRunInterval;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === 'web' ? 24 : insets.top + 8,
              borderBottomColor: colors.border,
            },
          ]}
        >
          {showingRunFlow ? (
            <Pressable
              onPress={() =>
                isRunInterval
                  ? setView({ mode: 'runOptions', name: view.name })
                  : setView({ mode: 'list' })
              }
              hitSlop={12}
              testID="run-flow-back"
            >
              <Feather name="chevron-left" size={22} color={colors.foreground} />
            </Pressable>
          ) : (
            <Text style={[styles.title, { color: colors.foreground }]}>
              Add Exercise
            </Text>
          )}
          {showingRunFlow && (
            <Text style={[styles.title, { color: colors.foreground }]}>
              {view.name}
            </Text>
          )}
          <Pressable
            onPress={handleClose}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: colors.secondary }]}
            testID="exercise-picker-close"
          >
            <Feather name="x" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        {isRunOptions ? (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          >
            <Text style={[styles.runPrompt, { color: colors.mutedForeground }]}>
              What kind of run is this?
            </Text>
            {RUN_TYPES.map((option) => (
              <Pressable
                key={option.type}
                onPress={() => handleRunTypeSelect(view.name, option.type)}
                style={({ pressed }) => [
                  styles.runOptionRow,
                  {
                    backgroundColor: colors.card,
                    borderRadius: colors.radius,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
                testID={`run-type-${option.type}`}
              >
                <View style={[styles.runOptionIcon, { backgroundColor: colors.secondary }]}>
                  <Feather
                    name={option.icon as keyof typeof Feather.glyphMap}
                    size={18}
                    color={colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.runOptionLabel, { color: colors.foreground }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.runOptionDesc, { color: colors.mutedForeground }]}>
                    {option.description}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </ScrollView>
        ) : isRunInterval ? (
          <ScrollView
            contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 24 }]}
          >
            <Text style={[styles.runPrompt, { color: colors.mutedForeground }]}>
              Set up your interval repeats
            </Text>
            <View
              style={[
                styles.intervalCard,
                { backgroundColor: colors.card, borderRadius: colors.radius },
              ]}
            >
              <View style={styles.intervalField}>
                <Text style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
                  REPEATS
                </Text>
                <TextInput
                  value={repeatCount}
                  onChangeText={(v) => setRepeatCount(v.replace(/[^0-9]/g, ''))}
                  keyboardType="number-pad"
                  style={[
                    styles.intervalInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.secondary,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                  testID="interval-count-input"
                />
              </View>
              <View style={styles.intervalField}>
                <Text style={[styles.intervalLabel, { color: colors.mutedForeground }]}>
                  DISTANCE PER REPEAT (MI)
                </Text>
                <TextInput
                  value={repeatDistance}
                  onChangeText={(v) => setRepeatDistance(v.replace(/[^0-9.]/g, ''))}
                  keyboardType="decimal-pad"
                  style={[
                    styles.intervalInput,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.secondary,
                      borderRadius: colors.radius / 2,
                    },
                  ]}
                  testID="interval-distance-input"
                />
              </View>
              <Text style={[styles.intervalPreview, { color: colors.mutedForeground }]}>
                {Math.max(1, Math.round(Number(repeatCount) || 1))} × {(Number(repeatDistance) || 0).toFixed(2)} mi
                {'  ·  '}
                {(
                  Math.max(1, Math.round(Number(repeatCount) || 1)) *
                  (Number(repeatDistance) || 0)
                ).toFixed(2)}{' '}
                mi total
              </Text>
            </View>

            <Pressable
              onPress={() => handleConfirmIntervals(view.name)}
              style={({ pressed }) => [
                styles.confirmButton,
                {
                  backgroundColor: colors.primary,
                  borderRadius: colors.radius,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
              testID="confirm-intervals"
            >
              <Text style={[styles.confirmButtonText, { color: colors.primaryForeground }]}>
                Add Intervals
              </Text>
            </Pressable>
          </ScrollView>
        ) : (
          <>
            <View
              style={[
                styles.searchRow,
                { backgroundColor: colors.secondary, borderRadius: colors.radius },
              ]}
            >
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search or add custom exercise"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                autoCapitalize="words"
                returnKeyType="done"
                onSubmitEditing={handleAddCustom}
                testID="exercise-search-input"
              />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={[
                styles.list,
                { paddingBottom: insets.bottom + 24 },
              ]}
            >
              {query.trim() === '' && frequentExercises.length > 0 && (
                <View style={styles.group}>
                  <Text style={[styles.groupTitle, { color: colors.mutedForeground }]}>
                    FREQUENT
                  </Text>
                  <View style={styles.frequentWrap}>
                    {frequentExercises.map((item) => (
                      <Pressable
                        key={item.name}
                        onPress={() => handlePickExercise(item.name, item.isCardio)}
                        style={({ pressed }) => [
                          styles.frequentChip,
                          {
                            backgroundColor: colors.card,
                            borderRadius: colors.radius,
                            opacity: pressed ? 0.7 : 1,
                          },
                        ]}
                        testID={`frequent-exercise-${item.name}`}
                      >
                        <Feather
                          name={item.isCardio ? 'wind' : 'trending-up'}
                          size={13}
                          color={colors.primary}
                        />
                        <Text style={[styles.frequentText, { color: colors.foreground }]}>
                          {item.name}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}

              {groups.length === 0 ? (
                <Pressable
                  onPress={handleAddCustom}
                  style={[
                    styles.customRow,
                    { backgroundColor: colors.card, borderRadius: colors.radius },
                  ]}
                >
                  <Feather name="plus-circle" size={18} color={colors.primary} />
                  <Text style={[styles.customText, { color: colors.foreground }]}>
                    Add &ldquo;{query.trim()}&rdquo; as custom exercise
                  </Text>
                </Pressable>
              ) : (
                groups.map((group) => (
                  <View key={group.category} style={styles.group}>
                    <Text
                      style={[styles.groupTitle, { color: colors.mutedForeground }]}
                    >
                      {group.category.toUpperCase()}
                    </Text>
                    <View
                      style={[
                        styles.groupCard,
                        { backgroundColor: colors.card, borderRadius: colors.radius },
                      ]}
                    >
                      {group.exercises.map((name, index) => (
                        <Pressable
                          key={name}
                          onPress={() =>
                            handlePickExercise(name, group.category === 'Cardio')
                          }
                          style={({ pressed }) => [
                            styles.exerciseRow,
                            index < group.exercises.length - 1 && {
                              borderBottomWidth: StyleSheet.hairlineWidth,
                              borderBottomColor: colors.border,
                            },
                            pressed && { opacity: 0.6 },
                          ]}
                          testID={`exercise-option-${name}`}
                        >
                          <Text
                            style={[styles.exerciseName, { color: colors.foreground }]}
                          >
                            {name}
                          </Text>
                          {isRunningExercise(name) ? (
                            <Feather name="chevron-right" size={16} color={colors.primary} />
                          ) : (
                            <Feather name="plus" size={16} color={colors.primary} />
                          )}
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 14,
    height: 46,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    height: '100%',
  },
  list: {
    padding: 20,
    gap: 20,
  },
  group: {
    gap: 8,
  },
  groupTitle: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.6,
    marginLeft: 4,
  },
  groupCard: {
    overflow: 'hidden',
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  exerciseName: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  customRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
  },
  customText: {
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
    flex: 1,
  },
  frequentWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  frequentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  frequentText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  runPrompt: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
    marginBottom: -8,
  },
  runOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  runOptionIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runOptionLabel: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  runOptionDesc: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  intervalCard: {
    padding: 16,
    gap: 14,
  },
  intervalField: {
    gap: 8,
  },
  intervalLabel: {
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
  },
  intervalInput: {
    height: 44,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  intervalPreview: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  confirmButton: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
