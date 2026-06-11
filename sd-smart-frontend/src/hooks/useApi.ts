/**
 * Custom Hooks for API calls
 * Provides a convenient way to use services with loading and error states
 */

import { useState, useCallback, useEffect } from "react";
import { ApiError } from "@/utils/api";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
}

/**
 * Generic hook for async operations
 */
export const useAsync = <T, Args extends any[]>(
  asyncFunction: (...args: Args) => Promise<T>,
  immediate = true
) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(
    async (...args: Args) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await asyncFunction(...args);
        setState({ data: response, loading: false, error: null });
        return response;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        throw error;
      }
    },
    [asyncFunction]
  );

  return { ...state, execute };
};

/**
 * Hook for fetching data
 */
export const useFetch = <T>(
  fetchFunction: () => Promise<any>,
  dependencies: any[] = []
) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const refetch = useCallback(async () => {
    setState({ data: null, loading: true, error: null });
    try {
      const response = await fetchFunction();
      setState({ data: response.data, loading: false, error: null });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setState({ data: null, loading: false, error: err });
    }
  }, [fetchFunction]);

  // Fetch on mount and when dependencies change
  useEffect(() => {
    refetch();
  }, dependencies);

  return { ...state, refetch };
};

/**
 * Hook for mutation (POST, PUT, DELETE)
 */
export const useMutation = <T, Variables>(
  mutationFunction: (variables: Variables) => Promise<any>
) => {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const mutate = useCallback(
    async (variables: Variables) => {
      setState({ data: null, loading: true, error: null });
      try {
        const response = await mutationFunction(variables);
        setState({ data: response.data, loading: false, error: null });
        return response.data;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setState({ data: null, loading: false, error: err });
        throw error;
      }
    },
    [mutationFunction]
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, mutate, reset };
};
