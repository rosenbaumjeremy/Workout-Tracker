import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

interface ProfileContextValue {
  /** Empty string means the user cleared their name — render an unowned title. */
  name: string;
  isLoaded: boolean;
  setName: (name: string) => Promise<void>;
}

const STORAGE_KEY = 'volt-log/profile-name';

/**
 * Preserves the original hardcoded owner so existing installs see no change
 * on upgrade. Anyone can rename it from the home screen.
 */
const DEFAULT_NAME = 'Shai';

export const MAX_NAME_LENGTH = 24;

/** `"Dana"` -> `"Dana's Workout Log"`; blank -> `"Workout Log"`. */
export function workoutLogTitle(name: string): string {
  const trimmed = name.trim();
  return trimmed ? `${trimmed}'s Workout Log` : 'Workout Log';
}

const ProfileContext = createContext<ProfileContextValue | undefined>(
  undefined,
);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [name, setNameState] = useState(DEFAULT_NAME);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let isMounted = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (!isMounted) return;
        // A stored empty string is a deliberate choice, so only fall back to
        // the default when nothing has ever been saved.
        if (raw !== null) setNameState(raw);
      })
      .finally(() => {
        if (isMounted) setIsLoaded(true);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const setName: ProfileContextValue['setName'] = async (next) => {
    const trimmed = next.trim().slice(0, MAX_NAME_LENGTH);
    setNameState(trimmed);
    await AsyncStorage.setItem(STORAGE_KEY, trimmed);
  };

  const value: ProfileContextValue = { name, isLoaded, setName };

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return ctx;
}
