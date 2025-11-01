"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export default function IdleTimeout() {
  const router = useRouter();

  // CONFIG — adjust freely
  const TOTAL_IDLE_MINUTES = 20;  // total idle time
  const WARNING_DURATION = 15;    // mins countdown

  const TIMEOUT_MS = TOTAL_IDLE_MINUTES * 60 * 1000;
  const WARNING_MS = (TOTAL_IDLE_MINUTES - WARNING_DURATION) * 60 * 1000;

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION * 60);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const warningRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const logout = useCallback(() => {
    clearTimers();
    router.push("/landing"); // redirect to login
  }, [router]);

  const clearTimers = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (warningRef.current) clearTimeout(warningRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetTimers = useCallback(() => {
    clearTimers();

    setShowWarning(false);
    setCountdown(WARNING_DURATION * 60);

    warningRef.current = setTimeout(() => {
      setShowWarning(true);

      intervalRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            logout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, WARNING_MS);

    timeoutRef.current = setTimeout(() => {
      logout();
    }, TIMEOUT_MS);
  }, [logout, WARNING_MS, TIMEOUT_MS]);

  useEffect(() => {
    resetTimers();

    const events = ["mousemove", "keydown", "click", "scroll", "touchstart"];

    const handleActivity = () => resetTimers();

    events.forEach((e) => window.addEventListener(e, handleActivity));

    return () => {
      events.forEach((e) => window.removeEventListener(e, handleActivity));
      clearTimers();
    };
  }, [resetTimers]);

  const stayLoggedIn = () => {
    resetTimers();
    setShowWarning(false);
  };

  return (
    <>
      {showWarning && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md text-center animate-fadeIn">
            <h1 className="text-xl font-semibold text-gray-800 mb-2">
              Are you still there?
            </h1>
            <p className="text-gray-600 mb-6">
              You will be logged out automatically in{" "}
              <span className="font-bold text-emerald-600">{countdown}</span> seconds.
            </p>

            <div className="flex gap-3 justify-center">
              <button
                onClick={stayLoggedIn}
                className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-5 rounded-lg font-medium transition-all"
              >
                Stay Logged In
              </button>
              <button
                onClick={logout}
                className="border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 py-2 px-5 rounded-lg font-medium transition-all"
              >
                Logout Now
              </button>
            </div>
          </div>

          <style jsx>{`
            .animate-fadeIn {
              animation: fadeIn 0.2s ease-out;
            }
            @keyframes fadeIn {
              from { opacity: 0; transform: scale(0.95); }
              to { opacity: 1; transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}
