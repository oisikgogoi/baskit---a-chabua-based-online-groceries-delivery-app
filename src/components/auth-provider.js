
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";

import { auth, googleProvider } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [claims, setClaims] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let authRequest = 0;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        const requestId = ++authRequest;

        setLoading(true);
        setUser(currentUser);
        setClaims({});

        if (!currentUser) {
          if (active && requestId === authRequest) {
            setLoading(false);
          }
          return;
        }

        try {
          // Force-refresh the token to get the latest custom claims.
          const tokenResult =
            await currentUser.getIdTokenResult(true);

          if (!active || requestId !== authRequest) return;

          setClaims(tokenResult.claims || {});
        } catch (error) {
          console.error(
            "Unable to load Firebase custom claims:",
            error
          );

          if (!active || requestId !== authRequest) return;

          setClaims({});
        } finally {
          if (active && requestId === authRequest) {
            setLoading(false);
          }
        }
      }
    );

    return () => {
      active = false;
      authRequest++;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const result = await signInWithPopup(auth, googleProvider);

    const tokenResult =
      await result.user.getIdTokenResult(true);

    setUser(result.user);
    setClaims(tokenResult.claims || {});

    return result.user;
  }, []);

  const loginWithEmail = useCallback(
    async (email, password) => {
      const result = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const tokenResult =
        await result.user.getIdTokenResult(true);

      setUser(result.user);
      setClaims(tokenResult.claims || {});

      return result.user;
    },
    []
  );

  const refreshClaims = useCallback(async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setClaims({});
      return {};
    }

    const tokenResult =
      await currentUser.getIdTokenResult(true);

    const latestClaims = tokenResult.claims || {};

    setUser(currentUser);
    setClaims(latestClaims);

    return latestClaims;
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setClaims({});
  }, []);

  const isAdmin = claims.admin === true;
  const isDeliveryBoy = claims.deliveryBoy === true;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        claims,
        isAdmin,
        isDeliveryBoy,
        loginWithGoogle,
        loginWithEmail,
        refreshClaims,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}
