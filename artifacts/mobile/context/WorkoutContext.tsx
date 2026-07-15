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
}

export interface WorkoutExercise {
  id: string;
  name: string;
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

  return { totalWorkouts, thisWeekWorkouts, currentStreakDays };
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

export function totalVolume(workout: Workout): number {
  return workout.exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + set.reps * set.weight, 0),
    0,
  );
}

export function totalSets(workout: Workout): number {
  return workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
}
