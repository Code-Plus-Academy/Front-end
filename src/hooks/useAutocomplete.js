import { useState, useEffect, useRef } from 'react';
import api from '../api/axios';

export function useAutocomplete(endpoint, query, delay = 350) {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  const controllerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    if (controllerRef.current) controllerRef.current.abort();

    setLoading(true);

    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      controllerRef.current = controller;

      try {
        const { data } = await api.get(endpoint, {
          params: { query },
          signal: controller.signal,
        });
        setSuggestions(data || []);
      } catch (err) {
        if (err.name !== 'CanceledError') {
          console.error('Autocomplete fetch error:', err);
        }
      } finally {
        setLoading(false);
      }
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [query, endpoint, delay]);

  return { suggestions, loading };
}
