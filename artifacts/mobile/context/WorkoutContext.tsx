import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { todayKey } from '@/lib/dateUtils';

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  distance?: number; // miles, used by cardio-type exercises
}

export type RunType = 'Easy' | 'Tempo' | 'Long' | 'Interval';

export interface WorkoutExercise {
  id: string;
  name: string;
  isCardio?: boolean;
  runType?: RunType;
  sets: WorkoutSet[];
}

export interface Workout {
  id: string;
  name: string;
  date: string; // ISO string
  durationSeconds: number;
  exercises: WorkoutExercise[];
}

export interface WorkoutStats {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  currentStreakDays: number;
  lifetimeVolume: number;
  lifetimeDistance: number;
}

interface WorkoutContextValue {
  workouts: Workout[];
  isLoaded: boolean;
  addWorkout: (workout: Omit<Workout, 'id'>) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  getWorkoutById: (id: string) => Workout | undefined;
  stats: WorkoutStats;
}

const STORAGE_KEY = 'volt-log/workouts';

function generateId(): string {
  return Date.now().toString() + Math.random().toString(36).substring(2, 9);
}

export function totalVolume(workout: Workout): number {
  return workout.exercises
    .filter((ex) => !ex.isCardio)
    .reduce(
      (sum, ex) =>
        sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
      0,
    );
}

export function totalDistance(workout: Workout): number {
  return workout.exercises
    .filter((ex) => ex.isCardio)
    .reduce(
      (sum, ex) => sum + ex.sets.reduce((s, set) => s + (set.distance ?? 0), 0),
      0,
    );
}

export function totalSets(workout: Workout): number {
  return workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}

export interface ExerciseTotal {
  name: string;
  sets: number;
  volume: number;
}

export interface CardioTotal {
  name: string;
  sets: number;
  distance: number;
}

export function aggregateExerciseTotals(workouts: Workout[]): {
  strength: ExerciseTotal[];
  cardio: CardioTotal[];
} {
  const strengthMap = new Map<string, ExerciseTotal>();
  const cardioMap = new Map<string, CardioTotal>();

  for (const workout of workouts) {
    for (const exercise of workout.exercises) {
      if (exercise.isCardio) {
        const entry = cardioMap.get(exercise.name) ?? {
          name: exercise.name,
          sets: 0,
          distance: 0,
        };
        entry.sets += exercise.sets.length;
        entry.distance += exercise.sets.reduce(
          (s, set) => s + (set.distance ?? 0),
          0,
        );
        cardioMap.set(exercise.name, entry);
      } else {
        const entry = strengthMap.get(exercise.name) ?? {
          name: exercise.name,
          sets: 0,
          volume: 0,
        };
        entry.sets += exercise.sets.length;
        entry.volume += exercise.sets.reduce(
          (s, set) => s + set.reps * set.weight,
          0,
        );
        strengthMap.set(exercise.name, entry);
      }
    }
  }

  return {
    strength: Array.from(strengthMap.values()).sort(
      (a, b) => b.volume - a.volume,
    ),
    cardio: Array.from(cardioMap.values()).sort(
      (a, b) => b.distance - a.distance,
    ),
  };
}

function computeStats(workouts: Workout[]): WorkoutStats {
  const totalWorkouts = workouts.length;

  const now = Date.now();
  const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
  const thisWeekWorkouts = workouts.filter(
    (w) => new Date(w.date).getTime() >= sevenDaysAgo,
  ).length;

  const uniqueDays = new Set(workouts.map((w) => todayKey(new Date(w.date))));
  let currentStreakDays = 0;
  const cursor = new Date();
  // Allow the streak to still count if today has no workout yet, as long as
  // yesterday was covered.
  if (!uniqueDays.has(todayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  while (uniqueDays.has(todayKey(cursor))) {
    currentStreakDays += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  const lifetimeVolume = workouts.reduce((sum, w) => sum + totalVolume(w), 0);
  const lifetimeDistance = workouts.reduce(
    (sum, w) => sum + totalDistance(w),
    0,
  );

  return {
    totalWorkouts,
    thisWeekWorkouts,
    currentStreakDays,
    lifetimeVolume,
    lifetimeDistance,
  };
}

const WorkoutContext = createContext<WorkoutContextValue | undefined>(
  undefined,
);

export function WorkoutProvider({ children }: { children: React.ReactNode }) {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!isMounted) return;
        if (raw) {
          try {
            const parsed = JSON.parse(raw) as Workout[];
            setWorkouts(parsed);
          } catch {
            setWorkouts([]);
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const persist = async (next: Workout[]) => {
    setWorkouts(next);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const addWorkout: WorkoutContextValue['addWorkout'] = async (workout) => {
    const next = [{ ...workout, id: generateId() }, ...workouts].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    await persist(next);
  };

  const deleteWorkout: WorkoutContextValue['deleteWorkout'] = async (id) => {
    await persist(workouts.filter((w) => w.id !== id));
  };

  const getWorkoutById = (id: string) => workouts.find((w) => w.id === id);

  const stats = useMemo(() => computeStats(workouts), [workouts]);

  const value: WorkoutContextValue = {
    workouts,
    isLoaded,
    addWorkout,
    deleteWorkout,
    getWorkoutById,
    stats,
  };

  return (
    <WorkoutContext.Provider value={value}>
      {children}
    </WorkoutContext.Provider>
  );
}

export function useWorkouts(): WorkoutContextValue {
  const ctx = useContext(WorkoutContext);
  if (!ctx) {
    throw new Error('useWorkouts must be used within a WorkoutProvider');
  }
  return ctx;
}
