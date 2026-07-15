import React, { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import { computeWorkoutStats, useWorkouts, type Workout } from '@/context/WorkoutContext';
import {
  ExercisePickerModal,
  type ExerciseSelectOptions,
} from '@/components/ExercisePickerModal';
import {
  WorkoutExerciseEditor,
  type ExerciseDraft,
} from '@/components/WorkoutExerciseEditor';
import { Feather } from '@expo/vector-icons';
import { defaultWorkoutName, formatDuration } from '@/lib/dateUtils';
import { ACHIEVEMENTS, type Achievement } from '@/lib/gamification';

const GOLD_GRADIENT = ['#FFD166', '#FF8A3D'] as const;

interface CelebrationData {
  earnedXp: number;
  leveledUp: boolean;
  newLevel: number;
  newAchievements: Achievement[];
}

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export default function NewWorkoutScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addWorkout, workouts } = useWorkouts();

  const [startTime] = useState(() => Date.now());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [name, setName] = useState(defaultWorkoutName());
  const [exercises, setExercises] = useState<ExerciseDraft[]>([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [celebration, setCelebration] = useState<CelebrationData | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSeconds(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const handleAddExercise = (
    exerciseName: string,
    isCardio: boolean,
    options?: ExerciseSelectOptions,
  ) => {
    const sets =
      options?.runType === 'Interval'
        ? Array.from({ length: options.repeatCount ?? 1 }, () => ({
            id: generateId(),
            reps: 0,
            weight: 0,
            distance: options.repeatDistance ?? 0,
          }))
        : [{ id: generateId(), reps: 0, weight: 0, distance: 0 }];

    setExercises((prev) => [
      ...prev,
      {
        id: generateId(),
        name: exerciseName,
        isCardio,
        runType: options?.runType,
        sets,
      },
    ]);
    setPickerVisible(false);
  };

  const handleAddSet = (exerciseId: string) => {
    setExercises((prev) =>
      prev.map((ex) => {
        if (ex.id !== exerciseId) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return {
          ...ex,
          sets: [
            ...ex.sets,
            {
              id: generateId(),
              reps: last?.reps ?? 0,
              weight: last?.weight ?? 0,
              distance: last?.distance ?? 0,
            },
          ],
        };
      }),
    );
  };

  const handleRemoveSet = (exerciseId: string, setId: string) => {
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter((s) => s.id !== setId) }
          : ex,
      ),
    );
  };

  const handleUpdateSet = (
    exerciseId: string,
    setId: string,
    field: 'reps' | 'weight' | 'distance',
    value: string,
  ) => {
    const numeric = value.replace(/[^0-9.]/g, '');
    const parsed = numeric === '' ? 0 : Number(numeric);
    setExercises((prev) =>
      prev.map((ex) =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map((s) =>
                s.id === setId
                  ? { ...s, [field]: Number.isNaN(parsed) ? 0 : parsed }
                  : s,
              ),
            }
          : ex,
      ),
    );
  };

  const handleRemoveExercise = (exerciseId: string) => {
    setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));
  };

  const hasContent = exercises.some((ex) => ex.sets.length > 0);

  const handleDiscard = () => {
    if (!hasContent) {
      router.back();
      return;
    }
    Alert.alert(
      'Discard workout?',
      'This workout has not been saved yet.',
      [
        { text: 'Keep Going', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ],
    );
  };

  const handleFinish = async () => {
    if (!hasContent) {
      Alert.alert(
        'Add a set first',
        'Log at least one set before finishing your workout.',
      );
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const newWorkout: Omit<Workout, 'id'> = {
      name: name.trim() || defaultWorkoutName(),
      date: new Date(startTime).toISOString(),
      durationSeconds: elapsedSeconds,
      exercises: exercises
        .filter((ex) => ex.sets.length > 0)
        .map((ex) => ({
          id: ex.id,
          name: ex.name,
          isCardio: ex.isCardio,
          runType: ex.runType,
          sets: ex.sets,
        })),
    };

    // Diff gamification stats before/after this workout so we can celebrate
    // XP gained, level-ups, and newly unlocked achievements. Computed
    // directly (not via the hook's `stats`) since context state hasn't
    // re-rendered yet at this point in the flow.
    const prevStats = computeWorkoutStats(workouts);
    const nextStats = computeWorkoutStats([
      { ...newWorkout, id: 'preview' },
      ...workouts,
    ]);
    const earnedXp = nextStats.totalXp - prevStats.totalXp;
    const leveledUp = nextStats.level > prevStats.level;
    const newAchievements = ACHIEVEMENTS.filter(
      (a) =>
        nextStats.unlockedAchievementIds.includes(a.id) &&
        !prevStats.unlockedAchievementIds.includes(a.id),
    );

    await addWorkout(newWorkout);

    if (Platform.OS !== 'web' && (leveledUp || newAchievements.length > 0)) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCelebration({
      earnedXp,
      leveledUp,
      newLevel: nextStats.level,
      newAchievements,
    });
  };

  const handleCelebrationDone = () => {
    setCelebration(null);
    router.replace('/(tabs)');
  };

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
        <Pressable onPress={handleDiscard} hitSlop={10} testID="discard-workout">
          <Feather name="x" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.timerWrap}>
          <View style={[styles.recordingDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.timer, { color: colors.foreground }]}>
            {formatDuration(elapsedSeconds)}
          </Text>
        </View>
        <Pressable
          onPress={handleFinish}
          style={[styles.finishButton, { backgroundColor: colors.primary }]}
          testID="finish-workout"
        >
          <Text style={[styles.finishText, { color: colors.primaryForeground }]}>
            Finish
          </Text>
        </Pressable>
      </View>

      <KeyboardAwareScrollViewCompat
        bottomOffset={40}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Workout name"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.nameInput, { color: colors.foreground }]}
          testID="workout-name-input"
        />

        <View style={styles.exerciseList}>
          {exercises.map((exercise) => (
            <WorkoutExerciseEditor
              key={exercise.id}
              exercise={exercise}
              onAddSet={() => handleAddSet(exercise.id)}
              onRemoveSet={(setId) => handleRemoveSet(exercise.id, setId)}
              onUpdateSet={(setId, field, value) =>
                handleUpdateSet(exercise.id, setId, field, value)
              }
              onRemoveExercise={() => handleRemoveExercise(exercise.id)}
            />
          ))}
        </View>

        <Pressable
          onPress={() => setPickerVisible(true)}
          style={({ pressed }) => [
            styles.addExerciseButton,
            {
              borderColor: colors.primary,
              borderRadius: colors.radius,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          testID="add-exercise-button"
        >
          <Feather name="plus" size={18} color={colors.primary} />
          <Text style={[styles.addExerciseText, { color: colors.primary }]}>
            Add Exercise
          </Text>
        </Pressable>
      </KeyboardAwareScrollViewCompat>

      <ExercisePickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSelect={handleAddExercise}
      />

      <Modal visible={!!celebration} transparent animationType="fade">
        <View style={styles.celebrationBackdrop}>
          <View
            style={[
              styles.celebrationCard,
              { backgroundColor: colors.card, borderRadius: colors.radius },
            ]}
          >
            <LinearGradient
              colors={GOLD_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.celebrationBadge}
            >
              <Feather name="award" size={32} color="#5A3200" />
            </LinearGradient>

            <Text style={[styles.celebrationTitle, { color: colors.foreground }]}>
              {celebration?.leveledUp ? `Level Up! Lv.${celebration.newLevel}` : 'Workout Complete'}
            </Text>
            <Text style={[styles.celebrationXp, { color: colors.mutedForeground }]}>
              +{celebration?.earnedXp ?? 0} XP earned
            </Text>

            {celebration && celebration.newAchievements.length > 0 && (
              <View style={styles.celebrationAchievements}>
                {celebration.newAchievements.map((a) => (
                  <View key={a.id} style={styles.celebrationAchievementRow}>
                    <View style={[styles.celebrationAchievementIcon, { backgroundColor: colors.secondary }]}>
                      <Feather
                        name={a.icon as keyof typeof Feather.glyphMap}
                        size={16}
                        color={colors.primary}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.celebrationAchievementTitle, { color: colors.foreground }]}>
                        {a.title}
                      </Text>
                      <Text style={[styles.celebrationAchievementDesc, { color: colors.mutedForeground }]}>
                        {a.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            <Pressable
              onPress={handleCelebrationDone}
              style={[
                styles.celebrationButton,
                { backgroundColor: colors.primary, borderRadius: colors.radius },
              ]}
              testID="celebration-continue"
            >
              <Text style={[styles.celebrationButtonText, { color: colors.primaryForeground }]}>
                Nice!
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
  timerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timer: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    fontVariant: ['tabular-nums'],
  },
  finishButton: {
    paddingHorizontal: 16,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    fontSize: 14,
    fontFamily: 'Inter_700Bold',
  },
  content: {
    padding: 20,
    gap: 16,
  },
  nameInput: {
    fontSize: 22,
    fontFamily: 'Inter_700Bold',
  },
  exerciseList: {
    gap: 12,
  },
  addExerciseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 52,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  addExerciseText: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },
  celebrationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 360,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  celebrationBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  celebrationTitle: {
    fontSize: 20,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  celebrationXp: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 8,
  },
  celebrationAchievements: {
    width: '100%',
    gap: 10,
    marginBottom: 12,
  },
  celebrationAchievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  celebrationAchievementIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  celebrationAchievementTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  celebrationAchievementDesc: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  celebrationButton: {
    width: '100%',
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  celebrationButtonText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
});
