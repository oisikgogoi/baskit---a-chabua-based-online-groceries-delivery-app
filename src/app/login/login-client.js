
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../components/auth-provider";

export default function LoginClient() {
  const router = useRouter();
  const { user, loading, loginWithGoogle } = useAuth();

  const [signingIn, setSigningIn] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  async function handleGoogleSignIn() {
    try {
      setError("");
      setSigningIn(true);

      await loginWithGoogle();
      router.replace("/");
    } catch (err) {
      console.error("Google login error:", err);

      if (err.code === "auth/popup-closed-by-user") {
        setError("Sign-in was cancelled. Please try again.");
      } else if (err.code === "auth/unauthorized-domain") {
        setError("This domain is not authorized in Firebase.");
      } else {
        setError(err.message || "Unable to sign in. Please try again.");
      }
    } finally {
      setSigningIn(false);
    }
  }

  if (loading || user) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f7faf7]">
        <div className="text-center">
          <div className="h-9 w-9 mx-auto rounded-full border-4 border-green-200 border-t-green-600 animate-spin" />
          <p className="mt-4 text-sm text-gray-500">
            {user ? "Taking you to QuickBite..." : "Loading..."}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <div className="h-11 w-11 rounded-2xl bg-green-600 text-white flex items-center justify-center text-2xl">
            🛍️
          </div>
          <span className="text-2xl font-extrabold tracking-tight text-gray-900">
            Quick<span className="text-green-600">Bite</span>
          </span>
        </Link>

        <section className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-green-900/5 p-7 sm:p-9">

          <div className="text-center mb-8">
            <div className="mx-auto mb-5 h-16 w-16 rounded-2xl bg-green-50 flex items-center justify-center text-3xl">
              🥑
            </div>

            <h1 className="text-2xl font-bold text-gray-900">
              Welcome to QuickBite
            </h1>

            <p className="text-sm text-gray-500 mt-2 leading-6">
              Fresh groceries, everyday essentials, and more.
              Sign in to get started.
            </p>
          </div>

          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="w-full flex items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3.5 text-sm font-semibold text-gray-800 transition hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {signingIn ? (
              <span className="h-5 w-5 rounded-full border-2 border-gray-300 border-t-green-600 animate-spin" />
            ) : (
              <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.76 7.18l7.73 6C44.42 37.96 46.98 31.89 46.98 24.55z" />
                <path fill="#FBBC05" d="M10.53 28.59A14.4 14.4 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 2.56 10.78l7.97-6.19z" />
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-5.8l-7.73-6c-2.15 1.45-4.9 2.3-8.18 2.3-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
              </svg>
            )}

            {signingIn ? "Signing you in..." : "Continue with Google"}
          </button>

          <div className="flex items-center gap-3 my-7">
            <div className="h-px flex-1 bg-gray-100" />
            <span className="text-xs text-gray-400">QUICK AND SECURE</span>
            <div className="h-px flex-1 bg-gray-100" />
          </div>

          <p className="text-center text-xs text-gray-500 leading-5">
            By continuing, you agree to use QuickBite responsibly.
            Your Google account is used for authentication.
          </p>

          <div className="mt-7 text-center text-green-700 hover:text-green-800">
            <b>Chabua Only!</b>
          </div>
        </section>

        <p className="text-center text-xs text-gray-400 mt-7">
          Freshness delivered to your doorstep.
        </p>
      </div>
    </main>
  );
}
