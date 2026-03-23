import { useState, useEffect, useRef, useCallback } from "react";

/**
 * A custom hook that debounces a value or function.
 * Automatically detects if the provided value is a function.
 *
 * @param {any} value - The value or function to debounce
 * @param {number} delay - Delay in milliseconds (default: 500ms)
 * @returns {any} - The debounced value or function
 */
const useDebounce = (value, delay = 500) => {
  const isFunction = typeof value === "function";
  const [debouncedValue, setDebouncedValue] = useState(
    isFunction ? null : value,
  );
  const timerRef = useRef(null);

  // For debouncing functions
  const debouncedFn = useCallback(
    (...args) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        value(...args);
      }, delay);
    },
    [value, delay],
  );

  // For debouncing values
  useEffect(() => {
    if (isFunction) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay, isFunction]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return isFunction ? debouncedFn : debouncedValue;
};

export default useDebounce;
