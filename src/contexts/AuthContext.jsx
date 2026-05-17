import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAuthErrorMessage } from '../lib/authErrors';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initializing, setInitializing] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setInitializing(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const runAuthAction = useCallback(async (action) => {
    setActionLoading(true);
    try {
      return await action();
    } finally {
      setActionLoading(false);
    }
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      return runAuthAction(async () => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          return { success: false, message: getAuthErrorMessage(error), data: null };
        }
        return { success: true, message: null, data };
      });
    },
    [runAuthAction],
  );

  const signUp = useCallback(
    async (email, password) => {
      return runAuthAction(async () => {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
          },
        });
        if (error) {
          return { success: false, message: getAuthErrorMessage(error), needsEmailConfirmation: false };
        }

        const needsEmailConfirmation = Boolean(data.user && !data.session);
        return {
          success: true,
          message: needsEmailConfirmation
            ? 'Check your email to confirm your account, then sign in.'
            : null,
          needsEmailConfirmation,
          data,
        };
      });
    },
    [runAuthAction],
  );

  const signOut = useCallback(async () => {
    return runAuthAction(async () => {
      const { error } = await supabase.auth.signOut();
      if (error) {
        return { success: false, message: getAuthErrorMessage(error) };
      }
      return { success: true, message: null };
    });
  }, [runAuthAction]);

  const signInWithMicrosoft = useCallback(async () => {
    return runAuthAction(async () => {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'email openid profile',
        },
      });
      if (error) {
        return { success: false, message: getAuthErrorMessage(error) };
      }
      return { success: true, message: null };
    });
  }, [runAuthAction]);

  const resetPassword = useCallback(
    async (email) => {
      return runAuthAction(async () => {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/login`,
        });
        if (error) {
          return { success: false, message: getAuthErrorMessage(error) };
        }
        return {
          success: true,
          message: 'Password reset link sent. Check your email.',
        };
      });
    },
    [runAuthAction],
  );

  const value = useMemo(
    () => ({
      user,
      session,
      initializing,
      actionLoading,
      isAuthenticated: Boolean(session?.user),
      signIn,
      signUp,
      signOut,
      signInWithMicrosoft,
      resetPassword,
    }),
    [
      user,
      session,
      initializing,
      actionLoading,
      signIn,
      signUp,
      signOut,
      signInWithMicrosoft,
      resetPassword,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
