/**
 * Auth Hooks
 */

import { useCallback, useState } from "react";
import { authService } from "@/services/authService";
import { LoginRequest, SignupRequest, User } from "@/types/api";
import { useMutation } from "./useApi";

/**
 * Hook for login
 */
export const useLogin = () => {
  return useMutation((credentials: LoginRequest) =>
    authService.login(credentials)
  );
};

/**
 * Hook for signup
 */
export const useSignup = () => {
  return useMutation((data: SignupRequest) =>
    authService.signup(data)
  );
};

/**
 * Hook for forgot password
 */
export const useForgotPassword = () => {
  return useMutation((email: string) =>
    authService.forgotPassword({ email })
  );
};

/**
 * Hook for verify reset code
 */
export const useVerifyResetCode = () => {
  return useMutation((data: { email: string; code: string }) =>
    authService.verifyResetCode(data)
  );
};

/**
 * Hook for reset password
 */
export const useResetPassword = () => {
  return useMutation((data: { email: string; code: string; newPassword: string }) =>
    authService.resetPassword(data)
  );
};

/**
 * Hook for get current user
 */
export const useGetCurrentUser = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true);
      const response = await authService.getCurrentUser();
      setUser(response.data || null);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, fetchUser };
};

/**
 * Hook for update profile
 */
export const useUpdateProfile = () => {
  return useMutation((data: Partial<User>) =>
    authService.updateProfile(data)
  );
};

/**
 * Hook for logout
 */
export const useLogout = () => {
  return useMutation(() => authService.logout());
};
