import { useCallback, useRef, useState } from 'react';
import { hasErrors, validateForm } from '../utils/validation';

function emptyFieldState(fieldNames) {
  return Object.fromEntries(fieldNames.map((name) => [name, null]));
}

function falseTouchedState(fieldNames) {
  return Object.fromEntries(fieldNames.map((name) => [name, false]));
}

/**
 * Shared touched/fieldErrors state with blur, change, and submit validation.
 *
 * @param {string[]} fieldNames
 * @param {() => Record<string, Function | Function[]>} getRules
 * @param {{ onAfterFieldChange?: (field: string, values: object, ctx: { setFieldErrors: Function, getTouched: () => object }) => void }} [options]
 */
export function useFormValidation(fieldNames, getRules, options = {}) {
  const { onAfterFieldChange } = options;
  const [fieldErrors, setFieldErrors] = useState(() =>
    emptyFieldState(fieldNames)
  );
  const [touched, setTouched] = useState(() => falseTouchedState(fieldNames));
  const touchedRef = useRef(touched);
  touchedRef.current = touched;
  const fieldNamesRef = useRef(fieldNames);
  fieldNamesRef.current = fieldNames;

  const validateSingle = useCallback(
    (field, values) => {
      const rules = getRules(values);
      const rule = rules[field];
      if (!rule) return null;
      if (typeof rule === 'function') {
        return rule(values[field], values);
      }
      if (Array.isArray(rule)) {
        const [validator, ...args] = rule;
        return validator(values[field], ...args);
      }
      return null;
    },
    [getRules]
  );

  const handleBlur = useCallback(
    (field, values) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
      setFieldErrors((prev) => ({
        ...prev,
        [field]: validateSingle(field, values)
      }));
    },
    [validateSingle]
  );

  const onFieldChange = useCallback(
    (field, values, { clearError } = {}) => {
      clearError?.();

      if (touchedRef.current[field]) {
        setFieldErrors((prev) => ({
          ...prev,
          [field]: validateSingle(field, values)
        }));
      }

      onAfterFieldChange?.(field, values, {
        setFieldErrors,
        getTouched: () => touchedRef.current
      });
    },
    [validateSingle, onAfterFieldChange]
  );

  const validateAll = useCallback(
    (values, { touchFields } = {}) => {
      const rules = getRules(values);
      const errors = validateForm(values, rules);
      setFieldErrors(errors);
      const fieldsToTouch = touchFields ?? fieldNamesRef.current;
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(fieldsToTouch.map((name) => [name, true]))
      }));
      return { valid: !hasErrors(errors), errors };
    },
    [getRules]
  );

  const mergeFieldErrors = useCallback((partial) => {
    setFieldErrors((prev) => ({ ...prev, ...partial }));
  }, []);

  const resetValidation = useCallback(
    (names = fieldNamesRef.current) => {
      setFieldErrors((prev) => ({
        ...prev,
        ...Object.fromEntries(names.map((name) => [name, null]))
      }));
      setTouched((prev) => ({
        ...prev,
        ...Object.fromEntries(names.map((name) => [name, false]))
      }));
    },
    []
  );

  return {
    fieldErrors,
    touched,
    setFieldErrors,
    setTouched,
    handleBlur,
    onFieldChange,
    validateAll,
    mergeFieldErrors,
    resetValidation
  };
}
