import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to manage state in localStorage
 * @param key The key to store the value under
 * @param initialValue The initial value if no value exists in storage
 * @returns [value, setValue, removeValue]
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((val: T) => T)) => void, () => void] {
    // Get from local storage then parse stored json or return initialValue
    const readValue = useCallback((): T => {
        if (typeof window === 'undefined') {
            return initialValue;
        }

        try {
            const item = window.localStorage.getItem(key);
            return item ? (JSON.parse(item) as T) : initialValue;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
            return initialValue;
        }
    }, [initialValue, key]);

    const [storedValue, setStoredValue] = useState<T>(readValue);

    // Return a wrapped version of useState's setter function that ...
    // ... persists the new value to localStorage.
    const setValue = useCallback((value: T | ((val: T) => T)) => {
        try {
            // Allow value to be a function so we have same API as useState
            const valueToStore = value instanceof Function ? value(storedValue) : value;

            setStoredValue(valueToStore);

            if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, JSON.stringify(valueToStore));

                // Dispatch a custom event so other useLocalStorage hooks in the same tab update
                window.dispatchEvent(new Event('local-storage'));
            }
        } catch (error) {
            console.warn(`Error setting localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    const removeValue = useCallback(() => {
        try {
            setStoredValue(initialValue);
            if (typeof window !== 'undefined') {
                window.localStorage.removeItem(key);
                window.dispatchEvent(new Event('local-storage'));
            }
        } catch (error) {
            console.warn(`Error removing localStorage key "${key}":`, error);
        }
    }, [key, initialValue]);

    useEffect(() => {
        setStoredValue(readValue());
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Sync across tabs and within the same tab
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent | Event) => {
            // Handle cross-tab updates (StorageEvent)
            if (e instanceof StorageEvent && e.key === key) {
                setStoredValue(readValue());
            }
            // Handle same-tab updates (Custom Event)
            else if (e.type === 'local-storage') {
                setStoredValue(readValue());
            }
        };

        if (typeof window !== 'undefined') {
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('local-storage', handleStorageChange);

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('local-storage', handleStorageChange);
            };
        }
    }, [key, readValue]);

    return [storedValue, setValue, removeValue];
}
