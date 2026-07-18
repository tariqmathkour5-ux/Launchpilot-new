import { useState, useEffect, useCallback } from "react";

interface UseExitIntentOptions {
  enabled?: boolean;
  delayMs?: number;
  sessionStorageKey?: string;
}

interface ExitIntentState {
  showModal: boolean;
  triggerType: "mouse_leave" | "timer" | "immediate" | null;
}

/**
 * Hook for detecting exit intent (mouse leaving viewport to top)
 * Useful for triggering limited-time offer popups
 */
export function useExitIntent({
  enabled = true,
  delayMs = 10000,
  sessionStorageKey = "exitIntentSeen",
}: UseExitIntentOptions = {}): ExitIntentState & {
  setShowModal: (show: boolean) => void;
  resetStorage: () => void;
} {
  const [showModal, setShowModal] = useState(false);
  const [triggerType, setTriggerType] = useState<"mouse_leave" | "timer" | "immediate" | null>(null);
  const [exitIntentTriggered, setExitIntentTriggered] = useState(false);

  useEffect(() => {
    if (!enabled || exitIntentTriggered) return;

    // Check if user has already seen the offer
    const hasSeenOffer = sessionStorage.getItem(sessionStorageKey);
    if (hasSeenOffer) {
      setExitIntentTriggered(true);
      return;
    }

    // Timer-based trigger
    const timer = setTimeout(() => {
      if (!exitIntentTriggered) {
        setShowModal(true);
        setTriggerType("timer");
        sessionStorage.setItem(sessionStorageKey, "true");
        setExitIntentTriggered(true);
      }
    }, delayMs);

    // Mouse leave trigger (exit intent)
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !exitIntentTriggered) {
        setShowModal(true);
        setTriggerType("mouse_leave");
        sessionStorage.setItem(sessionStorageKey, "true");
        setExitIntentTriggered(true);
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave as unknown as EventListener);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mouseleave", handleMouseLeave as unknown as EventListener);
    };
  }, [enabled, delayMs, sessionStorageKey, exitIntentTriggered]);

  const setOpen = useCallback((open: boolean) => {
    setShowModal(open);
  }, []);

  const resetStorage = useCallback(() => {
    sessionStorage.removeItem(sessionStorageKey);
    setExitIntentTriggered(false);
    setShowModal(false);
    setTriggerType(null);
  }, [sessionStorageKey]);

  return {
    showModal,
    triggerType,
    setShowModal: setOpen,
    resetStorage,
  };
}