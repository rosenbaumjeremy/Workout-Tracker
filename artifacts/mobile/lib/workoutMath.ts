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
